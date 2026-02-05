import { useRef, useState } from 'react';
import { fabric } from 'fabric';
import { addImageToCanvas, addTextToCanvas } from '../utils/canvas';
import { exportCanvas, ExportFormat } from '../utils/export';

interface ToolbarProps {
  canvas: fabric.Canvas | null;
  onDeleteSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  hasSelection: boolean;
}

export const Toolbar = ({
  canvas,
  onDeleteSelected,
  onBringToFront,
  onSendToBack,
  hasSelection,
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    try {
      setError(null);
      await addImageToCanvas(canvas, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像の追加に失敗しました');
    }

    // inputをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddText = () => {
    if (!canvas) return;
    addTextToCanvas(canvas);
  };

  const handleExport = (format: ExportFormat) => {
    if (!canvas) return;
    exportCanvas(canvas, format);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white shadow-md px-4 py-3 flex items-center gap-4">
      <h1 className="text-lg font-bold text-gray-800 mr-4">
        スライドエディター
      </h1>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
        >
          画像追加
        </label>

        <button
          onClick={handleAddText}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          テキスト追加
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
          >
            エクスポート
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showExportMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg overflow-hidden z-10">
              <button
                onClick={() => handleExport('png')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                PNG形式
              </button>
              <button
                onClick={() => handleExport('jpeg')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                JPG形式
              </button>
            </div>
          )}
        </div>
      </div>

      {hasSelection && (
        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
          <button
            onClick={onBringToFront}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            前面へ
          </button>
          <button
            onClick={onSendToBack}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            背面へ
          </button>
          <button
            onClick={onDeleteSelected}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
          >
            削除
          </button>
        </div>
      )}

      {error && (
        <div className="ml-auto text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
};
