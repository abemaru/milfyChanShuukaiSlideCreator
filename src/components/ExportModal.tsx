import { useState } from 'react';
import { fabric } from 'fabric';
import JSZip from 'jszip';
import { SlideData } from '../hooks/useSlides';

interface ExportModalProps {
  canvas: fabric.Canvas | null;
  slides: SlideData[];
  currentSlideIndex: number;
  onClose: () => void;
  saveCurrentSlide: () => { json: string; thumbnail: string };
  loadSlide: (json: string) => void;
}

type ExportFormat = 'png' | 'jpeg';
type ExportMode = 'current' | 'all';

const formatDate = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
};

export const ExportModal = ({
  canvas,
  slides,
  currentSlideIndex,
  onClose,
  saveCurrentSlide,
  loadSlide,
}: ExportModalProps) => {
  const [exportMode, setExportMode] = useState<ExportMode>('current');
  const [format, setFormat] = useState<ExportFormat>('png');
  const [fileName, setFileName] = useState(() => {
    return `MilfySlide_${formatDate()}_${slides.length}`;
  });
  const [isExporting, setIsExporting] = useState(false);

  const exportCurrentSlide = () => {
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({
      format,
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement('a');
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    link.download = `${fileName}.${extension}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllSlides = async () => {
    if (!canvas) return;

    setIsExporting(true);

    try {
      // 現在のスライドを保存
      const currentData = saveCurrentSlide();
      const updatedSlides = slides.map((slide, i) =>
        i === currentSlideIndex ? { ...slide, json: currentData.json } : slide
      );

      const zip = new JSZip();
      const extension = format === 'jpeg' ? 'jpg' : 'png';

      // 各スライドをエクスポート
      for (let i = 0; i < updatedSlides.length; i++) {
        const slide = updatedSlides[i];

        // スライドを読み込み
        await new Promise<void>((resolve) => {
          if (slide.json) {
            canvas.loadFromJSON(JSON.parse(slide.json), () => {
              canvas.renderAll();
              // 少し待ってからキャプチャ
              setTimeout(resolve, 100);
            });
          } else {
            // 空のスライドの場合はクリア
            canvas.clear();
            canvas.renderAll();
            setTimeout(resolve, 100);
          }
        });

        // DataURLを取得
        const dataUrl = canvas.toDataURL({
          format,
          quality: 1,
          multiplier: 1,
        });

        // Base64データを抽出
        const base64Data = dataUrl.split(',')[1];
        const slideNumber = String(i + 1).padStart(3, '0');
        zip.file(`${fileName}_${slideNumber}.${extension}`, base64Data, { base64: true });
      }

      // 元のスライドに戻す
      loadSlide(currentData.json);

      // ZIPファイルを生成してダウンロード
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `${fileName}.zip`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポート中にエラーが発生しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportMode === 'current') {
      exportCurrentSlide();
      onClose();
    } else {
      exportAllSlides();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">エクスポート</h2>

        {/* エクスポートモード選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            エクスポート対象
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportMode"
                value="current"
                checked={exportMode === 'current'}
                onChange={() => setExportMode('current')}
                className="mr-2"
              />
              現在のスライド
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportMode"
                value="all"
                checked={exportMode === 'all'}
                onChange={() => setExportMode('all')}
                className="mr-2"
              />
              全スライド ({slides.length}枚)
            </label>
          </div>
        </div>

        {/* フォーマット選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ファイル形式
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="png"
                checked={format === 'png'}
                onChange={() => setFormat('png')}
                className="mr-2"
              />
              PNG
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="jpeg"
                checked={format === 'jpeg'}
                onChange={() => setFormat('jpeg')}
                className="mr-2"
              />
              JPG
            </label>
          </div>
        </div>

        {/* ファイル名入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ファイル名
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ファイル名を入力"
          />
          <p className="text-xs text-gray-500 mt-1">
            {exportMode === 'current'
              ? `出力: ${fileName}.${format === 'jpeg' ? 'jpg' : 'png'}`
              : `出力: ${fileName}.zip (${fileName}_001.${format === 'jpeg' ? 'jpg' : 'png'} など)`}
          </p>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isExporting}
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !fileName.trim()}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </button>
        </div>
      </div>
    </div>
  );
};
