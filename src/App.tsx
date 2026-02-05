import { useEffect, useRef, useCallback } from 'react';
import { useFabricCanvas } from './hooks/useFabricCanvas';
import { useSlides } from './hooks/useSlides';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { SlideList } from './components/SlideList';

function App() {
  const {
    canvas,
    canvasRef,
    selectedObject,
    selectedCount,
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
    canvasWidth,
    canvasHeight,
    updateKey,
  } = useFabricCanvas();

  const {
    slides,
    currentSlideIndex,
    addSlide,
    deleteSlide,
    switchSlide,
    updateSlideData,
    duplicateSlide,
  } = useSlides();

  const prevSlideIndexRef = useRef(currentSlideIndex);
  const isInitializedRef = useRef(false);

  // スライド切り替え時の処理
  const handleSwitchSlide = useCallback(
    (newIndex: number) => {
      if (newIndex === currentSlideIndex) return;
      if (!canvas) return;

      // 現在のスライドを保存
      const { json, thumbnail } = saveSlide();
      updateSlideData(currentSlideIndex, json, thumbnail);

      // 新しいスライドに切り替え
      switchSlide(newIndex);
    },
    [canvas, currentSlideIndex, saveSlide, switchSlide, updateSlideData]
  );

  // スライドインデックスが変わったら読み込み
  useEffect(() => {
    if (!canvas) return;

    // 初回はスキップ（キャンバス初期化を待つ）
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    if (prevSlideIndexRef.current !== currentSlideIndex) {
      const slide = slides[currentSlideIndex];
      loadSlide(slide.json);
      prevSlideIndexRef.current = currentSlideIndex;
    }
  }, [canvas, currentSlideIndex, slides, loadSlide]);

  // 新規スライド追加
  const handleAddSlide = useCallback(() => {
    if (!canvas) return;

    // 現在のスライドを保存
    const { json, thumbnail } = saveSlide();
    updateSlideData(currentSlideIndex, json, thumbnail);

    // 新規スライドを追加（空のスライドが作成される）
    addSlide();
  }, [canvas, saveSlide, updateSlideData, currentSlideIndex, addSlide]);

  // スライド削除
  const handleDeleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return;

      // 削除するスライドが現在のスライドの場合、先に保存しない
      if (index !== currentSlideIndex) {
        // 現在のスライドを保存
        const { json, thumbnail } = saveSlide();
        updateSlideData(currentSlideIndex, json, thumbnail);
      }

      deleteSlide(index);
    },
    [slides.length, currentSlideIndex, saveSlide, updateSlideData, deleteSlide]
  );

  // スライド複製
  const handleDuplicateSlide = useCallback(
    (index: number) => {
      if (!canvas) return;

      // 現在のスライドを保存
      const { json, thumbnail } = saveSlide();
      updateSlideData(currentSlideIndex, json, thumbnail);

      duplicateSlide(index);
    },
    [canvas, saveSlide, updateSlideData, currentSlideIndex, duplicateSlide]
  );

  // 定期的に現在のスライドを自動保存（サムネイル更新用）
  useEffect(() => {
    if (!canvas) return;

    const interval = setInterval(() => {
      const { json, thumbnail } = saveSlide();
      updateSlideData(currentSlideIndex, json, thumbnail);
    }, 2000);

    return () => clearInterval(interval);
  }, [canvas, saveSlide, updateSlideData, currentSlideIndex]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Toolbar
        canvas={canvas}
        onDeleteSelected={deleteSelectedObject}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onAlignLeft={alignLeft}
        onAlignCenterH={alignCenterH}
        onAlignRight={alignRight}
        onAlignTop={alignTop}
        onAlignCenterV={alignCenterV}
        onAlignBottom={alignBottom}
        hasSelection={!!selectedObject}
        selectedCount={selectedCount}
        currentSlideIndex={currentSlideIndex}
        totalSlides={slides.length}
      />
      <div className="flex flex-1 overflow-hidden">
        <PropertyPanel key={updateKey} canvas={canvas} selectedObject={selectedObject} />
        <Canvas
          canvasRef={canvasRef}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      </div>
      <SlideList
        slides={slides}
        currentSlideIndex={currentSlideIndex}
        onSwitchSlide={handleSwitchSlide}
        onAddSlide={handleAddSlide}
        onDeleteSlide={handleDeleteSlide}
        onDuplicateSlide={handleDuplicateSlide}
      />
    </div>
  );
}

export default App;
