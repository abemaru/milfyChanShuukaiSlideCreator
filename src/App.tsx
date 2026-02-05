import { useFabricCanvas } from './hooks/useFabricCanvas';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';

function App() {
  const {
    canvas,
    canvasRef,
    selectedObject,
    deleteSelectedObject,
    bringToFront,
    sendToBack,
    canvasWidth,
    canvasHeight,
    updateKey,
  } = useFabricCanvas();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Toolbar
        canvas={canvas}
        onDeleteSelected={deleteSelectedObject}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        hasSelection={!!selectedObject}
      />
      <div className="flex flex-1 overflow-hidden">
        <PropertyPanel key={updateKey} canvas={canvas} selectedObject={selectedObject} />
        <Canvas
          canvasRef={canvasRef}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      </div>
    </div>
  );
}

export default App;
