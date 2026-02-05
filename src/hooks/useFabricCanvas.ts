import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

export const useFabricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    // 背景画像の設定（Viteのベースパスを考慮）
    const backgroundUrl = `${import.meta.env.BASE_URL}background.png`;
    fabric.Image.fromURL(backgroundUrl, (img) => {
      if (!img.width || !img.height) {
        // 背景画像がない場合はグレー背景を設定
        fabricCanvas.setBackgroundColor('#e5e5e5', () => {
          fabricCanvas.renderAll();
        });
        return;
      }
      img.scaleToWidth(CANVAS_WIDTH);
      img.scaleToHeight(CANVAS_HEIGHT);
      fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
        originX: 'left',
        originY: 'top',
      });
    });

    // 選択イベントのハンドリング
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // オブジェクト変更時の再レンダリング
    fabricCanvas.on('object:modified', () => {
      setSelectedObject(fabricCanvas.getActiveObject());
      setUpdateKey((k) => k + 1);
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Deleteキーでオブジェクト削除（テキスト編集中は除く）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && canvas && selectedObject) {
        // テキスト編集中はオブジェクト削除しない
        if (selectedObject instanceof fabric.IText && selectedObject.isEditing) {
          return;
        }
        canvas.remove(selectedObject);
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, selectedObject]);

  const deleteSelectedObject = useCallback(() => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObject(null);
    }
  }, [canvas, selectedObject]);

  const bringToFront = useCallback(() => {
    if (canvas && selectedObject) {
      selectedObject.bringToFront();
      canvas.renderAll();
    }
  }, [canvas, selectedObject]);

  const sendToBack = useCallback(() => {
    if (canvas && selectedObject) {
      selectedObject.sendToBack();
      canvas.renderAll();
    }
  }, [canvas, selectedObject]);

  return {
    canvas,
    canvasRef,
    selectedObject,
    setSelectedObject,
    deleteSelectedObject,
    bringToFront,
    sendToBack,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    updateKey,
  };
};
