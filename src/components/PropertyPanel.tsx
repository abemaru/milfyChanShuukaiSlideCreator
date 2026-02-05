import { fabric } from 'fabric';
import { updateTextProperty, updateImageProperty, AVAILABLE_FONTS } from '../utils/canvas';

interface PropertyPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
}

// カラーコードのバリデーション
const isValidColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

// カラー入力コンポーネント
const ColorInput = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    // #がなければ追加
    if (!input.startsWith('#')) {
      input = '#' + input;
    }
    // 有効なカラーコードの場合のみ適用
    if (isValidColor(input)) {
      onChange(input);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 rounded cursor-pointer border"
        disabled={disabled}
      />
      <input
        type="text"
        value={value}
        onChange={handleTextChange}
        placeholder="#000000"
        className="flex-1 p-2 border rounded font-mono text-sm"
        disabled={disabled}
        maxLength={7}
      />
    </div>
  );
};

export const PropertyPanel = ({ canvas, selectedObject }: PropertyPanelProps) => {
  if (!selectedObject || !canvas) {
    return (
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">プロパティ</h2>
        <p className="text-gray-500 text-sm">
          オブジェクトを選択すると、ここでプロパティを編集できます
        </p>
      </div>
    );
  }

  const isText = selectedObject instanceof fabric.IText;
  const isImage = selectedObject instanceof fabric.Image;

  return (
    <div className="w-64 bg-white shadow-md p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">プロパティ</h2>

      {isText && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フォント
            </label>
            <select
              value={(selectedObject as fabric.IText).fontFamily || 'Arial, sans-serif'}
              onChange={(e) =>
                updateTextProperty(canvas, selectedObject, 'fontFamily', e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フォントサイズ: {(selectedObject as fabric.IText).fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="200"
              value={(selectedObject as fabric.IText).fontSize || 48}
              onChange={(e) =>
                updateTextProperty(canvas, selectedObject, 'fontSize', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フォントカラー
            </label>
            <ColorInput
              value={(selectedObject as fabric.IText).fill?.toString() || '#000000'}
              onChange={(color) => updateTextProperty(canvas, selectedObject, 'fill', color)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フォントウェイト
            </label>
            <select
              value={(selectedObject as fabric.IText).fontWeight?.toString() || 'normal'}
              onChange={(e) =>
                updateTextProperty(canvas, selectedObject, 'fontWeight', e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="normal">通常</option>
              <option value="bold">太字</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              テキスト整列
            </label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateTextProperty(canvas, selectedObject, 'textAlign', align)}
                  className={`flex-1 py-2 px-3 rounded ${
                    (selectedObject as fabric.IText).textAlign === align
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isImage && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              不透明度: {Math.round(((selectedObject as fabric.Image).opacity || 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(((selectedObject as fabric.Image).opacity || 1) * 100)}
              onChange={(e) =>
                updateImageProperty(canvas, selectedObject, 'opacity', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              回転角度: {Math.round((selectedObject as fabric.Image).angle || 0)}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={Math.round((selectedObject as fabric.Image).angle || 0)}
              onChange={(e) =>
                updateImageProperty(canvas, selectedObject, 'angle', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">フチ（枠線）</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フチの太さ: {(selectedObject as fabric.Image).strokeWidth || 0}px
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={(selectedObject as fabric.Image).strokeWidth || 0}
                onChange={(e) =>
                  updateImageProperty(canvas, selectedObject, 'strokeWidth', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フチの色
              </label>
              <ColorInput
                value={(selectedObject as fabric.Image).stroke?.toString() || '#000000'}
                onChange={(color) => updateImageProperty(canvas, selectedObject, 'stroke', color)}
                disabled={!((selectedObject as fabric.Image).strokeWidth)}
              />
              {!((selectedObject as fabric.Image).strokeWidth) && (
                <p className="text-xs text-gray-400 mt-1">
                  フチの太さを設定すると色を変更できます
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
