import { useRef, useState } from 'react';
import { addImageToCanvas, addTextToCanvas } from '../utils/canvas';
import { ErrorModal } from './ErrorModal';
import { ExportModal } from './ExportModal';
import { SlideData } from '../hooks/useSlides';

interface ToolbarProps {
  canvas: fabric.Canvas | null;
  onDeleteSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onAlignLeft: () => void;
  onAlignCenterH: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignCenterV: () => void;
  onAlignBottom: () => void;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  selectedCount: number;
  currentSlideIndex: number;
  totalSlides: number;
  slides: SlideData[];
  saveCurrentSlide: () => { json: string; thumbnail: string };
  loadSlide: (json: string) => void;
}

export const Toolbar = ({
  canvas,
  onDeleteSelected,
  onBringToFront,
  onSendToBack,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onUndo,
  onRedo,
  hasSelection,
  selectedCount,
  currentSlideIndex,
  totalSlides,
  slides,
  saveCurrentSlide,
  loadSlide,
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    try {
      setError(null);
      setIsLoading(true);
      await addImageToCanvas(canvas, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像の追加に失敗しました');
    } finally {
      setIsLoading(false);
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

  return (
    <>
      <div className="bg-white shadow-md px-4 py-3 flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-bold text-gray-800 mr-2">
          スライドエディター
        </h1>
        <span className="text-sm text-gray-500 mr-4">
          ({currentSlideIndex + 1}/{totalSlides})
        </span>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="image-upload"
            className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isLoading ? '読込中...' : '画像追加'}
          </label>

          <button
            onClick={handleAddText}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            テキスト追加
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            エクスポート
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pl-4 border-l border-gray-300">
          <button
            onClick={onUndo}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="元に戻す (Ctrl+Z)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="やり直し (Ctrl+Y)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {hasSelection && (
          <>
            {/* 選択数表示 */}
            <div className="pl-4 border-l border-gray-300">
              <span className="text-sm text-gray-600">
                {selectedCount}個選択中
              </span>
            </div>

            {/* レイヤー操作 */}
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              <span className="text-xs text-gray-500">レイヤー:</span>
              <button
                onClick={onBringToFront}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                title="前面へ"
              >
                前面
              </button>
              <button
                onClick={onSendToBack}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                title="背面へ"
              >
                背面
              </button>
            </div>

            {/* 水平整列 */}
            <div className="flex items-center gap-1 pl-4 border-l border-gray-300">
              <span className="text-xs text-gray-500">水平:</span>
              <button
                onClick={onAlignLeft}
                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="左揃え"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h2v16H4V4zm4 2h12v4H8V6zm0 8h8v4H8v-4z" />
                </svg>
              </button>
              <button
                onClick={onAlignCenterH}
                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="水平中央揃え"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 4h2v4h6v4h-6v4h4v4h-4v4h-2v-4H7v-4h4v-4H5V8h6V4z" />
                </svg>
              </button>
              <button
                onClick={onAlignRight}
                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="右揃え"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 4h2v16h-2V4zM4 6h12v4H4V6zm4 8h8v4H8v-4z" />
                </svg>
              </button>
            </div>

            {/* 垂直整列 */}
            <div className="flex items-center gap-1 pl-4 border-l border-gray-300">
              <span className="text-xs text-gray-500">垂直:</span>
              <button
                onClick={onAlignTop}
                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="上揃え"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16v2H4V4zm2 4h4v12H6V8zm8 0h4v8h-4V8z" />
                </svg>
              </button>
              <button
                onClick={onAlignCenterV}
                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="垂直中央揃え"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 11h4V5h4v6h4V7h4v4h4v2h-4v4h-4v-4h-4v6H8v-6H4v-2z" />
                </svg>
              </button>
              <button
                onClick={onAlignBottom}
                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="下揃え"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 18h16v2H4v-2zm2-2V4h4v12H6zm8-4V4h4v8h-4z" />
                </svg>
              </button>
            </div>

            {/* 削除 */}
            <div className="pl-4 border-l border-gray-300">
              <button
                onClick={onDeleteSelected}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                削除
              </button>
            </div>
          </>
        )}
      </div>

      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      {showExportModal && (
        <ExportModal
          canvas={canvas}
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onClose={() => setShowExportModal(false)}
          saveCurrentSlide={saveCurrentSlide}
          loadSlide={loadSlide}
        />
      )}
    </>
  );
};
