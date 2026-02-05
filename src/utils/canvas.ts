import { fabric } from 'fabric';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

    // ファイルサイズチェック
    if (imageFile.size > MAX_FILE_SIZE) {
      reject(new Error('ファイルサイズは5MB以下にしてください'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      fabric.Image.fromURL(
        dataUrl,
        (img) => {
          if (!img.width || !img.height) {
            reject(new Error('画像の読み込みに失敗しました'));
            return;
          }

          // 初期サイズ: 元画像の50%スケール
          img.scale(0.5);

          // 初期配置: キャンバス中央
          img.set({
            left: canvas.width! / 2 - (img.width! * 0.5) / 2,
            top: canvas.height! / 2 - (img.height! * 0.5) / 2,
            // フチの初期設定（なし）
            stroke: undefined,
            strokeWidth: 0,
          });

          // 最小サイズの設定
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
    fontFamily: 'Arial, sans-serif',
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
      // ストローク幅が0より大きい場合、デフォルトの色を設定
      if ((value as number) > 0 && !object.stroke) {
        object.set('stroke', '#000000');
      }
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
