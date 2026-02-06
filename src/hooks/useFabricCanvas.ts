import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
const MAX_HISTORY_LENGTH = 50;

export const useFabricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [updateKey, setUpdateKey] = useState(0);

  // Undo/Redo用の履歴管理
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

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

    // 初期状態を履歴に保存
    setTimeout(() => {
      const initialState = JSON.stringify(fabricCanvas.toJSON());
      historyRef.current = [initialState];
      historyIndexRef.current = 0;
    }, 100);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // 履歴に状態を保存
  const saveHistory = useCallback(() => {
    if (!canvas || isUndoRedoRef.current) return;

    const json = JSON.stringify(canvas.toJSON());

    // 現在位置より後の履歴を削除
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);

    // 新しい状態を追加
    historyRef.current.push(json);

    // 最大履歴数を超えた場合、古いものを削除
    if (historyRef.current.length > MAX_HISTORY_LENGTH) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, [canvas]);

  // キャンバス変更時に履歴保存
  useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      saveHistory();
    };

    const handleObjectAdded = () => {
      if (!isUndoRedoRef.current) {
        saveHistory();
      }
    };

    const handleObjectRemoved = () => {
      if (!isUndoRedoRef.current) {
        saveHistory();
      }
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [canvas, saveHistory]);

  // Undo
  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current--;

    const json = historyRef.current[historyIndexRef.current];
    const bgImage = canvas.backgroundImage;

    canvas.loadFromJSON(JSON.parse(json), () => {
      if (bgImage) {
        canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
      }
      canvas.renderAll();
      isUndoRedoRef.current = false;
      setSelectedObject(null);
      setSelectedCount(0);
    });
  }, [canvas]);

  // Redo
  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current++;

    const json = historyRef.current[historyIndexRef.current];
    const bgImage = canvas.backgroundImage;

    canvas.loadFromJSON(JSON.parse(json), () => {
      if (bgImage) {
        canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
      }
      canvas.renderAll();
      isUndoRedoRef.current = false;
      setSelectedObject(null);
      setSelectedCount(0);
    });
  }, [canvas]);

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

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // テキスト編集中は一部ショートカットを無効化
      const isTextEditing = selectedObject instanceof fabric.IText && selectedObject.isEditing;

      // Delete: オブジェクト削除
      if (e.key === 'Delete' && canvas && selectedObject && !isTextEditing) {
        deleteSelectedObject();
        return;
      }

      // Ctrl+Z: Undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !isTextEditing) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (((e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
           (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) && !isTextEditing) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, selectedObject, deleteSelectedObject, undo, redo]);

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

  // ヘルパー関数：複数選択のオブジェクトを取得し、ActiveSelectionを解除（座標を絶対座標に変換）
  const getObjectsAndDiscardSelection = useCallback((): fabric.Object[] => {
    if (!canvas || !selectedObject) return [];

    if (selectedObject.type === 'activeSelection') {
      const activeSelection = selectedObject as fabric.ActiveSelection;
      const objects = activeSelection.getObjects();

      // ActiveSelectionを解除して各オブジェクトの座標を絶対座標に変換
      canvas.discardActiveObject();
      canvas.renderAll();

      return objects;
    }
    return [selectedObject];
  }, [canvas, selectedObject]);

  // ヘルパー関数：複数選択を再作成
  const recreateActiveSelection = useCallback((objects: fabric.Object[]) => {
    if (!canvas || objects.length <= 1) {
      canvas?.renderAll();
      return;
    }

    // 新しいActiveSelectionを作成
    const newSelection = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(newSelection);
    canvas.requestRenderAll();

    // 状態を更新
    setSelectedObject(newSelection);
    setSelectedCount(objects.length);
  }, [canvas]);

  // 整列機能（単一選択：キャンバスに対して整列、複数選択：オブジェクト同士で整列）
  const alignLeft = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const isMultiple = selectedObject.type === 'activeSelection';

    if (!isMultiple) {
      // 単一選択：キャンバス左端に整列
      const bound = selectedObject.getBoundingRect();
      selectedObject.set('left', selectedObject.left! - bound.left);
      selectedObject.setCoords();
      canvas.renderAll();
    } else {
      // 複数選択：先にActiveSelectionを解除して絶対座標に変換
      const objects = getObjectsAndDiscardSelection();
      if (objects.length === 0) return;

      // 最も左のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const minLeft = Math.min(...bounds.map(b => b.left));

      objects.forEach((obj, i) => {
        const diff = bounds[i].left - minLeft;
        obj.set('left', obj.left! - diff);
        obj.setCoords();
      });

      // ActiveSelectionを再作成
      recreateActiveSelection(objects);
    }
    saveHistory();
  }, [canvas, selectedObject, getObjectsAndDiscardSelection, recreateActiveSelection, saveHistory]);

  const alignCenterH = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const isMultiple = selectedObject.type === 'activeSelection';

    if (!isMultiple) {
      // 単一選択：キャンバス中央に整列
      const bound = selectedObject.getBoundingRect();
      const centerX = CANVAS_WIDTH / 2;
      selectedObject.set('left', selectedObject.left! + (centerX - (bound.left + bound.width / 2)));
      selectedObject.setCoords();
      canvas.renderAll();
    } else {
      // 複数選択：先にActiveSelectionを解除して絶対座標に変換
      const objects = getObjectsAndDiscardSelection();
      if (objects.length === 0) return;

      // 選択範囲の中央に揃える
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

      // ActiveSelectionを再作成
      recreateActiveSelection(objects);
    }
    saveHistory();
  }, [canvas, selectedObject, getObjectsAndDiscardSelection, recreateActiveSelection, saveHistory]);

  const alignRight = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const isMultiple = selectedObject.type === 'activeSelection';

    if (!isMultiple) {
      // 単一選択：キャンバス右端に整列
      const bound = selectedObject.getBoundingRect();
      selectedObject.set('left', selectedObject.left! + (CANVAS_WIDTH - (bound.left + bound.width)));
      selectedObject.setCoords();
      canvas.renderAll();
    } else {
      // 複数選択：先にActiveSelectionを解除して絶対座標に変換
      const objects = getObjectsAndDiscardSelection();
      if (objects.length === 0) return;

      // 最も右のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const maxRight = Math.max(...bounds.map(b => b.left + b.width));

      objects.forEach((obj, i) => {
        const objRight = bounds[i].left + bounds[i].width;
        const diff = maxRight - objRight;
        obj.set('left', obj.left! + diff);
        obj.setCoords();
      });

      // ActiveSelectionを再作成
      recreateActiveSelection(objects);
    }
    saveHistory();
  }, [canvas, selectedObject, getObjectsAndDiscardSelection, recreateActiveSelection, saveHistory]);

  const alignTop = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const isMultiple = selectedObject.type === 'activeSelection';

    if (!isMultiple) {
      // 単一選択：キャンバス上端に整列
      const bound = selectedObject.getBoundingRect();
      selectedObject.set('top', selectedObject.top! - bound.top);
      selectedObject.setCoords();
      canvas.renderAll();
    } else {
      // 複数選択：先にActiveSelectionを解除して絶対座標に変換
      const objects = getObjectsAndDiscardSelection();
      if (objects.length === 0) return;

      // 最も上のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const minTop = Math.min(...bounds.map(b => b.top));

      objects.forEach((obj, i) => {
        const diff = bounds[i].top - minTop;
        obj.set('top', obj.top! - diff);
        obj.setCoords();
      });

      // ActiveSelectionを再作成
      recreateActiveSelection(objects);
    }
    saveHistory();
  }, [canvas, selectedObject, getObjectsAndDiscardSelection, recreateActiveSelection, saveHistory]);

  const alignCenterV = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const isMultiple = selectedObject.type === 'activeSelection';

    if (!isMultiple) {
      // 単一選択：キャンバス中央に整列
      const bound = selectedObject.getBoundingRect();
      const centerY = CANVAS_HEIGHT / 2;
      selectedObject.set('top', selectedObject.top! + (centerY - (bound.top + bound.height / 2)));
      selectedObject.setCoords();
      canvas.renderAll();
    } else {
      // 複数選択：先にActiveSelectionを解除して絶対座標に変換
      const objects = getObjectsAndDiscardSelection();
      if (objects.length === 0) return;

      // 選択範囲の中央に揃える
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

      // ActiveSelectionを再作成
      recreateActiveSelection(objects);
    }
    saveHistory();
  }, [canvas, selectedObject, getObjectsAndDiscardSelection, recreateActiveSelection, saveHistory]);

  const alignBottom = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const isMultiple = selectedObject.type === 'activeSelection';

    if (!isMultiple) {
      // 単一選択：キャンバス下端に整列
      const bound = selectedObject.getBoundingRect();
      selectedObject.set('top', selectedObject.top! + (CANVAS_HEIGHT - (bound.top + bound.height)));
      selectedObject.setCoords();
      canvas.renderAll();
    } else {
      // 複数選択：先にActiveSelectionを解除して絶対座標に変換
      const objects = getObjectsAndDiscardSelection();
      if (objects.length === 0) return;

      // 最も下のオブジェクトに揃える
      const bounds = objects.map(obj => obj.getBoundingRect());
      const maxBottom = Math.max(...bounds.map(b => b.top + b.height));

      objects.forEach((obj, i) => {
        const objBottom = bounds[i].top + bounds[i].height;
        const diff = maxBottom - objBottom;
        obj.set('top', obj.top! + diff);
        obj.setCoords();
      });

      // ActiveSelectionを再作成
      recreateActiveSelection(objects);
    }
    saveHistory();
  }, [canvas, selectedObject, getObjectsAndDiscardSelection, recreateActiveSelection, saveHistory]);

  // スライドの保存（JSONとサムネイルを返す）
  const saveSlide = useCallback((): { json: string; thumbnail: string } => {
    if (!canvas) return { json: '', thumbnail: '' };

    // 現在の選択状態を保存
    const activeObject = canvas.getActiveObject();

    // テキスト編集中は選択解除しない（編集が中断されるため）
    const isTextEditing = activeObject instanceof fabric.IText && activeObject.isEditing;

    if (isTextEditing) {
      // テキスト編集中はそのままJSONとサムネイルを取得
      const json = JSON.stringify(canvas.toJSON());
      const thumbnail = canvas.toDataURL({
        format: 'png',
        multiplier: 0.1,
      });
      return { json, thumbnail };
    }

    let selectedObjects: fabric.Object[] = [];

    // ActiveSelectionの場合はオブジェクトを保存
    if (activeObject && activeObject.type === 'activeSelection') {
      selectedObjects = (activeObject as fabric.ActiveSelection).getObjects();
    }

    // 選択を解除してからエクスポート（サムネイルに選択枠が入らないように）
    canvas.discardActiveObject();
    canvas.renderAll();

    const json = JSON.stringify(canvas.toJSON());
    const thumbnail = canvas.toDataURL({
      format: 'png',
      multiplier: 0.1, // サムネイル用に10%サイズ
    });

    // 選択状態を復元
    if (activeObject) {
      if (selectedObjects.length > 1) {
        // 複数選択の場合は新しいActiveSelectionを作成
        const newSelection = new fabric.ActiveSelection(selectedObjects, { canvas });
        canvas.setActiveObject(newSelection);
      } else {
        // 単一選択の場合はそのまま復元
        canvas.setActiveObject(activeObject);
      }
      canvas.renderAll();
    }

    return { json, thumbnail };
  }, [canvas]);

  // スライドの読み込み
  const loadSlide = useCallback(
    (json: string) => {
      if (!canvas) return;

      isUndoRedoRef.current = true;

      // キャンバスをクリア（背景画像は保持）
      const bgImage = canvas.backgroundImage;

      canvas.clear();

      if (json) {
        canvas.loadFromJSON(JSON.parse(json), () => {
          // 背景画像を再設定
          if (bgImage) {
            canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
          } else {
            // 背景画像を再読み込み
            const backgroundUrl = `${import.meta.env.BASE_URL}background.png`;
            fabric.Image.fromURL(backgroundUrl, (img) => {
              if (!img.width || !img.height) {
                canvas.setBackgroundColor('#e5e5e5', () => {
                  canvas.renderAll();
                });
              } else {
                img.scaleToWidth(CANVAS_WIDTH);
                img.scaleToHeight(CANVAS_HEIGHT);
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                  originX: 'left',
                  originY: 'top',
                });
              }
            });
          }
          canvas.renderAll();

          // 履歴をリセット
          historyRef.current = [JSON.stringify(canvas.toJSON())];
          historyIndexRef.current = 0;
          isUndoRedoRef.current = false;
        });
      } else {
        // 空のスライド：背景画像のみ再設定
        const backgroundUrl = `${import.meta.env.BASE_URL}background.png`;
        fabric.Image.fromURL(backgroundUrl, (img) => {
          if (!img.width || !img.height) {
            canvas.setBackgroundColor('#e5e5e5', () => {
              canvas.renderAll();
              // 履歴をリセット
              historyRef.current = [JSON.stringify(canvas.toJSON())];
              historyIndexRef.current = 0;
              isUndoRedoRef.current = false;
            });
            return;
          }
          img.scaleToWidth(CANVAS_WIDTH);
          img.scaleToHeight(CANVAS_HEIGHT);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            originX: 'left',
            originY: 'top',
          });

          // 履歴をリセット
          historyRef.current = [JSON.stringify(canvas.toJSON())];
          historyIndexRef.current = 0;
          isUndoRedoRef.current = false;
        });
      }

      setSelectedObject(null);
      setSelectedCount(0);
    },
    [canvas]
  );

  // キャンバスをクリア（新規スライド用）
  const clearCanvas = useCallback(() => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    objects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
    setSelectedCount(0);
  }, [canvas]);

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
    saveSlide,
    loadSlide,
    clearCanvas,
    undo,
    redo,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    updateKey,
  };
};
