import { fabric } from 'fabric';

// 画像の最大サイズ（これを超える場合は縮小）
const MAX_IMAGE_DIMENSION = 4096;

// 大きな画像をリサイズする
const resizeImageIfNeeded = (
  dataUrl: string,
  maxDimension: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      // 最大サイズ以内ならそのまま返す
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      // 縮小率を計算
      const scale = Math.min(maxDimension / width, maxDimension / height);
      const newWidth = Math.floor(width * scale);
      const newHeight = Math.floor(height * scale);

      // canvasでリサイズ
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context の取得に失敗しました'));
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // 元の形式を維持（透過が必要な場合はPNG）
      const resizedDataUrl = canvas.toDataURL('image/png');
      resolve(resizedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました。ファイルが破損している可能性があります。'));
    };

    img.src = dataUrl;
  });
};

export const addImageToCanvas = (
  canvas: fabric.Canvas,
  imageFile: File
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // ファイル形式チェック
    if (!imageFile.type.startsWith('image/')) {
      reject(new Error('画像ファイルを選択してください'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const originalDataUrl = e.target?.result as string;

        if (!originalDataUrl) {
          reject(new Error('ファイルの読み込みに失敗しました'));
          return;
        }

        // 大きな画像は縮小
        const dataUrl = await resizeImageIfNeeded(originalDataUrl, MAX_IMAGE_DIMENSION);

        fabric.Image.fromURL(
          dataUrl,
          (img) => {
            if (!img.width || !img.height) {
              reject(new Error('画像の読み込みに失敗しました。対応していない形式の可能性があります。'));
              return;
            }

            // キャンバスに収まるようにスケール調整
            const canvasWidth = canvas.width!;
            const canvasHeight = canvas.height!;
            const imgWidth = img.width!;
            const imgHeight = img.height!;

            // 初期スケールを計算（キャンバスの50%に収まるように）
            const maxWidth = canvasWidth * 0.5;
            const maxHeight = canvasHeight * 0.5;
            const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 0.5);

            img.scale(scale);

            // 初期配置: キャンバス中央
            img.set({
              left: canvasWidth / 2 - (imgWidth * scale) / 2,
              top: canvasHeight / 2 - (imgHeight * scale) / 2,
              // フチの初期設定（なし）
              stroke: undefined,
              strokeWidth: 0,
              // スケーリングに関係なくストローク幅を一定に
              strokeUniform: true,
              // ストロークを塗りの上に描画
              paintFirst: 'fill',
            });

            // コントロールの表示設定
            img.setControlsVisibility({
              mt: true,
              mb: true,
              ml: true,
              mr: true,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            resolve();
          },
          {
            crossOrigin: 'anonymous',
          }
        );
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(imageFile);
  });
};

export const addTextToCanvas = (canvas: fabric.Canvas): void => {
  const text = new fabric.IText('テキストを入力', {
    left: canvas.width! / 2 - 100,
    top: canvas.height! / 2 - 25,
    fontSize: 48,
    fill: '#000000',
    fontFamily: 'LightNovelPOP, sans-serif',
    fontWeight: 'normal',
    textAlign: 'left',
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
};

export const updateTextProperty = (
  canvas: fabric.Canvas,
  object: fabric.Object,
  property: string,
  value: string | number
): void => {
  if (object instanceof fabric.IText) {
    object.set(property as keyof fabric.IText, value);
    canvas.renderAll();
    canvas.fire('object:modified', { target: object });
  }
};

export const updateImageProperty = (
  canvas: fabric.Canvas,
  object: fabric.Object,
  property: string,
  value: number | string
): void => {
  if (object instanceof fabric.Image) {
    if (property === 'opacity') {
      object.set('opacity', (value as number) / 100);
    } else if (property === 'angle') {
      object.set('angle', value as number);
    } else if (property === 'strokeWidth') {
      object.set('strokeWidth', value as number);
      // スケーリングに関係なくストローク幅を一定に
      object.set('strokeUniform', true);
      // ストローク幅が0より大きい場合、デフォルトの色を設定
      if ((value as number) > 0 && !object.stroke) {
        object.set('stroke', '#000000');
      }
      // 境界の再計算
      object.setCoords();
    } else if (property === 'stroke') {
      object.set('stroke', value as string | undefined);
    }
    canvas.renderAll();
    canvas.fire('object:modified', { target: object });
  }
};

// 利用可能なフォントリスト
export const AVAILABLE_FONTS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'LightNovelPOP, sans-serif', label: 'ラノベPOP' },
  { value: '"Hiragino Sans", sans-serif', label: 'ヒラギノ角ゴ' },
  { value: '"Yu Gothic", sans-serif', label: '游ゴシック' },
  { value: '"MS Gothic", sans-serif', label: 'MSゴシック' },
  { value: 'serif', label: '明朝体' },
];
