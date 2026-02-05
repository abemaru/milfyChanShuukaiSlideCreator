import { fabric } from 'fabric';

export type ExportFormat = 'png' | 'jpeg';

export const exportCanvas = (
  canvas: fabric.Canvas,
  format: ExportFormat = 'png'
): void => {
  // 選択状態を解除してからエクスポート
  canvas.discardActiveObject();
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format,
    quality: 1,
    multiplier: 1,
  });

  const link = document.createElement('a');
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  link.download = `slide_${Date.now()}.${extension}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
