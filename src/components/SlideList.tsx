import { SlideData } from '../hooks/useSlides';

interface SlideListProps {
  slides: SlideData[];
  currentSlideIndex: number;
  onSwitchSlide: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onDuplicateSlide: (index: number) => void;
}

export const SlideList = ({
  slides,
  currentSlideIndex,
  onSwitchSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
}: SlideListProps) => {
  return (
    <div className="bg-gray-200 border-t border-gray-300 p-3">
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative flex-shrink-0 cursor-pointer group ${
              index === currentSlideIndex
                ? 'ring-2 ring-blue-500'
                : 'ring-1 ring-gray-300 hover:ring-gray-400'
            }`}
            onClick={() => onSwitchSlide(index)}
          >
            {/* サムネイル */}
            <div
              className="w-40 h-[90px] bg-white flex items-center justify-center overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {slide.thumbnail ? (
                <img
                  src={slide.thumbnail}
                  alt={`スライド ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">スライド {index + 1}</span>
              )}
            </div>

            {/* スライド番号 */}
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>

            {/* ホバー時のアクションボタン */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSlide(index);
                }}
                className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                title="複製"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSlide(index);
                  }}
                  className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  title="削除"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 新規スライド追加ボタン */}
        <button
          onClick={onAddSlide}
          className="flex-shrink-0 w-40 h-[90px] border-2 border-dashed border-gray-400 rounded flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs mt-1">追加</span>
          </div>
        </button>
      </div>
    </div>
  );
};
