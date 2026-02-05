import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

export const useFabricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      // Shift または Ctrl で複数選択可能にする
      selectionKey: ['shiftKey', 'ctrlKey'],
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
    const updateSelection = () => {
      const activeObject = fabricCanvas.getActiveObject();
      setSelectedObject(activeObject || null);

      if (activeObject && activeObject.type === 'activeSelection') {
        setSelectedCount((activeObject as fabric.ActiveSelection).getObjects().length);
      } else if (activeObject) {
        setSelectedCount(1);
      } else {
        setSelectedCount(0);
      }
    };

    fabricCanvas.on('selection:created', updateSelection);
    fabricCanvas.on('selection:updated', updateSelection);
    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
      setSelectedCount(0);
    });

    // オブジェクト変更時の再レンダリング
    fabricCanvas.on('object:modified', () => {
      updateSelection();
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
        deleteSelectedObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, selectedObject]);

  const deleteSelectedObject = useCallback(() => {
    if (canvas && selectedObject) {
      // 複数選択の場合
      if (selectedObject.type === 'activeSelection') {
        const activeSelection = selectedObject as fabric.ActiveSelection;
        activeSelection.getObjects().forEach((obj) => {
          canvas.remove(obj);
        });
      } else {
        canvas.remove(selectedObject);
      }
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObject(null);
      setSelectedCount(0);
    }
  }, [canvas, selectedObject]);

  const bringToFront = useCallback(() => {
    if (canvas && selectedObject) {
      if (selectedObject.type === 'activeSelection') {
        const activeSelection = selectedObject as fabric.ActiveSelection;
        activeSelection.getObjects().forEach((obj) => {
          obj.bringToFront();
        });
      } else {
        selectedObject.bringToFront();
      }
      canvas.renderAll();
    }
  }, [canvas, selectedObject]);

  const sendToBack = useCallback(() => {
    if (canvas && selectedObject) {
      if (selectedObject.type === 'activeSelection') {
        const activeSelection = selectedObject as fabric.ActiveSelection;
        activeSelection.getObjects().forEach((obj) => {
          obj.sendToBack();
        });
      } else {
        selectedObject.sendToBack();
      }
      canvas.renderAll();
    }
  }, [canvas, selectedObject]);

  // ヘルパー関数：選択されたオブジェクトの配列を取得
  const getSelectedObjects = useCallback((): fabric.Object[] => {
    if (!selectedObject) return [];
    if (selectedObject.type === 'activeSelection') {
      return (selectedObject as fabric.ActiveSelection).getObjects();
    }
    return [selectedObject];
  }, [selectedObject]);

  // 整列機能（単一選択：キャンバスに対して整列、複数選択：オブジェクト同士で整列）
  const alignLeft = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const objects = getSelectedObjects();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      // 単一選択：キャンバス左端に整列
      const bound = objects[0].getBoundingRect();
      objects[0].set('left', objects[0].left! - bound.left);
      objects[0].setCoords();
    } else {
      // 複数選択：最も左のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const minLeft = Math.min(...bounds.map(b => b.left));

      objects.forEach((obj, i) => {
        const diff = bounds[i].left - minLeft;
        obj.set('left', obj.left! - diff);
        obj.setCoords();
      });
    }
    canvas.renderAll();
  }, [canvas, selectedObject, getSelectedObjects]);

  const alignCenterH = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const objects = getSelectedObjects();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      // 単一選択：キャンバス中央に整列
      const bound = objects[0].getBoundingRect();
      const centerX = CANVAS_WIDTH / 2;
      objects[0].set('left', objects[0].left! + (centerX - (bound.left + bound.width / 2)));
      objects[0].setCoords();
    } else {
      // 複数選択：選択範囲の中央に揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const minLeft = Math.min(...bounds.map(b => b.left));
      const maxRight = Math.max(...bounds.map(b => b.left + b.width));
      const center = (minLeft + maxRight) / 2;

      objects.forEach((obj, i) => {
        const objCenter = bounds[i].left + bounds[i].width / 2;
        const diff = objCenter - center;
        obj.set('left', obj.left! - diff);
        obj.setCoords();
      });
    }
    canvas.renderAll();
  }, [canvas, selectedObject, getSelectedObjects]);

  const alignRight = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const objects = getSelectedObjects();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      // 単一選択：キャンバス右端に整列
      const bound = objects[0].getBoundingRect();
      objects[0].set('left', objects[0].left! + (CANVAS_WIDTH - (bound.left + bound.width)));
      objects[0].setCoords();
    } else {
      // 複数選択：最も右のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const maxRight = Math.max(...bounds.map(b => b.left + b.width));

      objects.forEach((obj, i) => {
        const objRight = bounds[i].left + bounds[i].width;
        const diff = maxRight - objRight;
        obj.set('left', obj.left! + diff);
        obj.setCoords();
      });
    }
    canvas.renderAll();
  }, [canvas, selectedObject, getSelectedObjects]);

  const alignTop = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const objects = getSelectedObjects();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      // 単一選択：キャンバス上端に整列
      const bound = objects[0].getBoundingRect();
      objects[0].set('top', objects[0].top! - bound.top);
      objects[0].setCoords();
    } else {
      // 複数選択：最も上のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const minTop = Math.min(...bounds.map(b => b.top));

      objects.forEach((obj, i) => {
        const diff = bounds[i].top - minTop;
        obj.set('top', obj.top! - diff);
        obj.setCoords();
      });
    }
    canvas.renderAll();
  }, [canvas, selectedObject, getSelectedObjects]);

  const alignCenterV = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const objects = getSelectedObjects();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      // 単一選択：キャンバス中央に整列
      const bound = objects[0].getBoundingRect();
      const centerY = CANVAS_HEIGHT / 2;
      objects[0].set('top', objects[0].top! + (centerY - (bound.top + bound.height / 2)));
      objects[0].setCoords();
    } else {
      // 複数選択：選択範囲の中央に揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const minTop = Math.min(...bounds.map(b => b.top));
      const maxBottom = Math.max(...bounds.map(b => b.top + b.height));
      const center = (minTop + maxBottom) / 2;

      objects.forEach((obj, i) => {
        const objCenter = bounds[i].top + bounds[i].height / 2;
        const diff = objCenter - center;
        obj.set('top', obj.top! - diff);
        obj.setCoords();
      });
    }
    canvas.renderAll();
  }, [canvas, selectedObject, getSelectedObjects]);

  const alignBottom = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const objects = getSelectedObjects();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      // 単一選択：キャンバス下端に整列
      const bound = objects[0].getBoundingRect();
      objects[0].set('top', objects[0].top! + (CANVAS_HEIGHT - (bound.top + bound.height)));
      objects[0].setCoords();
    } else {
      // 複数選択：最も下のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const maxBottom = Math.max(...bounds.map(b => b.top + b.height));

      objects.forEach((obj, i) => {
        const objBottom = bounds[i].top + bounds[i].height;
        const diff = maxBottom - objBottom;
        obj.set('top', obj.top! + diff);
        obj.setCoords();
      });
    }
    canvas.renderAll();
  }, [canvas, selectedObject, getSelectedObjects]);

  return {
    canvas,
    canvasRef,
    selectedObject,
    selectedCount,
    setSelectedObject,
    deleteSelectedObject,
    bringToFront,
    sendToBack,
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    updateKey,
  };
};
