import { RefObject } from 'react';

interface CanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  canvasHeight: number;
}

export const Canvas = ({ canvasRef, canvasWidth, canvasHeight }: CanvasProps) => {
  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-4">
      <div
        className="mx-auto shadow-lg"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
