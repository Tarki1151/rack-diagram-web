// src/LayoutEditorPage.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer } from 'react-konva';
import FloorGrid from './FloorGrid';
import Cabinet2DView from './Cabinet2DView';
import LayoutContext, { 
    PIXELS_PER_METER_LAYOUT,
    STAGE_WIDTH_PIXELS,
    STAGE_HEIGHT_PIXELS,
    CABINET_FOOTPRINT_WIDTH_METERS,
    CABINET_FOOTPRINT_DEPTH_METERS,
    CABINET_SLOT_WIDTH_PX, // Bu sabit context'ten geliyordu, doğrudan hesaplayabiliriz veya context'ten alırız
    CABINET_SLOT_DEPTH_PX  // Bu sabit context'ten geliyordu
} from './context/LayoutContext';
import './App.css';

const LayoutEditorPage = () => {
  const { 
    cabinets,
    positions2D,
    update2DPosition,
    apply2DLayoutTo3D
  } = useContext(LayoutContext);

  const navigate = useNavigate();
  const stageRef = useRef(null);
  const [stageScale, setStageScale] = useState(0.5);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // 2D'de bir kabin slotunun piksel boyutu (Context'teki sabitlere göre)
  const currentCabinetSlotWidthPx = CABINET_FOOTPRINT_WIDTH_METERS * PIXELS_PER_METER_LAYOUT;
  const currentCabinetSlotDepthPx = CABINET_FOOTPRINT_DEPTH_METERS * PIXELS_PER_METER_LAYOUT;


  useEffect(() => {
    console.log("[LayoutEditorPage] 2D Pozisyonlar:", positions2D);
  }, [positions2D]);


  const handleCabinetDragEnd = (cabinetName, konvaEvent) => {
    const node = konvaEvent.target;
    if (!node || typeof node.x !== 'function' || typeof node.y !== 'function') {
        console.error("[LayoutEditorPage] handleCabinetDragEnd: konvaEvent.target veya x/y fonksiyonları tanımsız!", konvaEvent.target);
        return;
    }

    const nodeX = node.x();
    const nodeY = node.y();

    if (typeof nodeX !== 'number' || isNaN(nodeX) || typeof nodeY !== 'number' || isNaN(nodeY)) {
        console.error(`[LayoutEditorPage] handleCabinetDragEnd: Kabin '${cabinetName}' için geçersiz node pozisyonu: x=${nodeX}, y=${nodeY}`);
        // İsteğe bağlı: Node'u eski pozisyonuna geri alabilirsiniz
        // if (positions2D[cabinetName]) {
        //    node.position({ x: positions2D[cabinetName].xPx, y: positions2D[cabinetName].yPx });
        // }
        return;
    }

    // En yakın kabin slotuna yapıştır (sol üst köşe)
    const snappedX = Math.round(nodeX / currentCabinetSlotWidthPx) * currentCabinetSlotWidthPx;
    const snappedY = Math.round(nodeY / currentCabinetSlotDepthPx) * currentCabinetSlotDepthPx;
    
    console.log(`[LayoutEditorPage] Kabin '${cabinetName}' sürüklendi. Eski: (${nodeX.toFixed(1)},${nodeY.toFixed(1)}), Yeni Snap: (${snappedX},${snappedY})`);

    node.position({ x: snappedX, y: snappedY }); // Görsel geri bildirim
    
    // Layer'ı yeniden çizmeye zorla (görüntü kaybolmasını engellemek için)
    // Bu, state güncellenmeden önce Konva'nın çizim yapmasını tetikler.
    const layer = node.getLayer();
    if (layer) {
        layer.batchDraw();
    } else {
        console.warn("[LayoutEditorPage] handleCabinetDragEnd: Node için layer bulunamadı.");
    }

    update2DPosition(cabinetName, { x: snappedX, y: snappedY }); // xPx, yPx yerine x, y olarak gönderelim (context'teki update düzeltildi)
  };

  const handleApplyLayout = () => {
    apply2DLayoutTo3D(navigate); 
  };

  const handleZoom = (zoomIn) => {
    const scaleBy = 1.2;
    let newScale = zoomIn ? stageScale * scaleBy : stageScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 3)); 
    
    const stage = stageRef.current;
    if (stage) {
        const oldScale = stageScale;
        const center = {
            x: STAGE_WIDTH_PIXELS / 2, 
            y: STAGE_HEIGHT_PIXELS / 2,
        };
        const mousePointTo = {
            x: (center.x - stagePosition.x) / oldScale,
            y: (center.y - stagePosition.y) / oldScale,
        };
        const newPos = {
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
        };
        setStagePosition(newPos);
        setStageScale(newScale);
    } else {
        setStageScale(newScale);
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 3)); 
    
    if (Math.abs(oldScale - newScale) < 0.001) return;

    setStageScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePosition(newPos);
  };

  return (
    <div className="app-content">
      <h2>2D Yerleşim Düzenleyici (Tepeden Görünüm)</h2>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => handleZoom(true)}>Yakınlaştır</button>
        <button onClick={() => handleZoom(false)}>Uzaklaştır</button>
        <span>Zoom: {stageScale.toFixed(2)}x</span>
        <button onClick={handleApplyLayout} style={{backgroundColor: '#5cb85c', borderColor: '#4cae4c', marginLeft: '20px'}}>Uygula ve 3D Görünüme Geç</button>
      </div>

      <div 
        className="stage-container" 
        style={{ 
            width: '90vw', 
            maxWidth: `${STAGE_WIDTH_PIXELS + 2}px`,
            height: '70vh', 
            maxHeight: `${STAGE_HEIGHT_PIXELS + 2}px`,
            backgroundColor: '#E8E8E8', 
            overflow: 'hidden',
            border: '1px solid #ccc',
            margin: '0 auto'
        }}
      >
        <Stage 
            width={STAGE_WIDTH_PIXELS} 
            height={STAGE_HEIGHT_PIXELS} 
            ref={stageRef}
            onWheel={handleWheel}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            draggable={true}
            onDragEnd={(e) => {
                setStagePosition({
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
        >
          <Layer /*onDraw={() => console.log("Layer redraw")}*/>
            <FloorGrid 
              width={STAGE_WIDTH_PIXELS} 
              height={STAGE_HEIGHT_PIXELS} 
              tileWidth={currentCabinetSlotWidthPx}
              tileHeight={currentCabinetSlotDepthPx}
            />
            {Object.entries(cabinets).map(([name]) => {
              const pos2D = positions2D[name];
              // Pozisyonun ve içindeki xPx, yPx değerlerinin geçerli olduğundan emin ol
              if (!pos2D || typeof pos2D.xPx !== 'number' || isNaN(pos2D.xPx) || 
                  typeof pos2D.yPx !== 'number' || isNaN(pos2D.yPx)) {
                console.warn(`[LayoutEditorPage] Kabin '${name}' için geçersiz 2D pozisyon, render edilmeyecek. Pozisyon:`, pos2D);
                return null;
              }
              return (
                <Cabinet2DView
                  key={name}
                  cabinetName={name}
                  x={pos2D.xPx}
                  y={pos2D.yPx}
                  cabinetWidthMeters={CABINET_FOOTPRINT_WIDTH_METERS} 
                  cabinetDepthMeters={CABINET_FOOTPRINT_DEPTH_METERS} 
                  pixelsPerMeter={PIXELS_PER_METER_LAYOUT}
                  currentStageScale={stageScale}
                  onDragEnd={(konvaEvent) => handleCabinetDragEnd(name, konvaEvent)}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
       <div style={{marginTop: '20px', textAlign: 'left', maxWidth: STAGE_WIDTH_PIXELS, padding: '0 10px', margin: '20px auto'}}>
        <h4>Kullanım Notları:</h4>
        {/* ... */}
      </div>
    </div>
  );
};

export default LayoutEditorPage;
