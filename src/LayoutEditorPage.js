// src/LayoutEditorPage.js
import React, { useState, useEffect, useRef } from 'react';
// Rect import'u eklendi:
import { Stage, Layer, Rect } from 'react-konva'; 
import FloorGrid from './FloorGrid'; 
import Cabinet2DView from './Cabinet2DView'; 
import './App.css'; 

// Kabinlerin gerçek dünya boyutları (metre cinsinden)
const ACTUAL_CABINET_WIDTH_METERS = 1.1652; 
const ACTUAL_CABINET_DEPTH_METERS = 1.8;    

// Zemin karosu boyutu (metre cinsinden)
const REAL_WORLD_TILE_SIZE_METERS = 0.6; 

// Konva canvas üzerindeki bir karonun piksel boyutu
const TILE_SIZE_PIXELS = 50; 

// Izgara boyutu (karo sayısı)
const GRID_COLS = 20;
const GRID_ROWS = 20;

const STAGE_WIDTH = GRID_COLS * TILE_SIZE_PIXELS;
const STAGE_HEIGHT = GRID_ROWS * TILE_SIZE_PIXELS;

// Koridor tipleri
const CORRIDOR_TYPES = {
  NONE: 'none',
  HOT: 'hot',
  COLD: 'cold',
};

const LayoutEditorPage = () => {
  const [cabinetsData, setCabinetsData] = useState({
    "Kabin A (2D)": [{ Rack: 1, U: 2, BrandModel: "Sunucu X" }],
    "Kabin B (2D)": [{ Rack: 1, U: 4, BrandModel: "Depolama Y" }],
    "Kabin C (2D)": [{ Rack: 1, U: 1, BrandModel: "Switch Z" }],
  });

  const [cabinetPositions2D, setCabinetPositions2D] = useState({});
  const [selectedCorridorType, setSelectedCorridorType] = useState(CORRIDOR_TYPES.NONE);
  const [corridors, setCorridors] = useState([]); 
  const [isDrawingCorridor, setIsDrawingCorridor] = useState(false);
  const [newCorridorStartPos, setNewCorridorStartPos] = useState(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const initialPositions = {};
    Object.keys(cabinetsData).forEach((name, index) => {
      initialPositions[name] = {
        x: (index % GRID_COLS) * (ACTUAL_CABINET_WIDTH_METERS / REAL_WORLD_TILE_SIZE_METERS) * TILE_SIZE_PIXELS,
        y: Math.floor(index / GRID_COLS) * (ACTUAL_CABINET_DEPTH_METERS / REAL_WORLD_TILE_SIZE_METERS) * TILE_SIZE_PIXELS,
      };
    });
    setCabinetPositions2D(initialPositions);
  }, [cabinetsData]);

  const handleDragEnd = (cabinetName, newPos) => {
    setCabinetPositions2D(prev => ({
      ...prev,
      [cabinetName]: {
        x: Math.round(newPos.x / TILE_SIZE_PIXELS) * TILE_SIZE_PIXELS,
        y: Math.round(newPos.y / TILE_SIZE_PIXELS) * TILE_SIZE_PIXELS,
      },
    }));
  };

  const handleStageMouseDown = (e) => {
    if (selectedCorridorType === CORRIDOR_TYPES.NONE || !stageRef.current) return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    
    setNewCorridorStartPos({ x: pos.x, y: pos.y });
    setIsDrawingCorridor(true);
  };

  const handleStageMouseMove = (e) => {
    // Bu kısım koridorun canlı önizlemesi için kullanılabilir
  };
  
  const handleStageMouseUp = (e) => {
    if (!isDrawingCorridor || !newCorridorStartPos || !stageRef.current) return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    const newCorridor = {
      x: Math.min(newCorridorStartPos.x, pos.x),
      y: Math.min(newCorridorStartPos.y, pos.y),
      width: Math.abs(pos.x - newCorridorStartPos.x),
      height: Math.abs(pos.y - newCorridorStartPos.y),
      type: selectedCorridorType,
      id: `corridor-${Date.now()}`
    };

    if (newCorridor.width > TILE_SIZE_PIXELS / 2 && newCorridor.height > TILE_SIZE_PIXELS / 2) {
        setCorridors(prev => [...prev, newCorridor]);
    }
    setIsDrawingCorridor(false);
    setNewCorridorStartPos(null);
  };

  return (
    <div className="app-content">
      <h2>2D Yerleşim Düzenleyici</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>Koridor Tipi Seç:</label>
        <select 
          value={selectedCorridorType} 
          onChange={(e) => setSelectedCorridorType(e.target.value)}
          style={{padding: '8px', borderRadius: '4px'}}
        >
          <option value={CORRIDOR_TYPES.NONE}>Koridor Çizme</option>
          <option value={CORRIDOR_TYPES.HOT}>Sıcak Koridor</option>
          <option value={CORRIDOR_TYPES.COLD}>Soğuk Koridor</option>
        </select>
        <button onClick={() => setCorridors([])} style={{backgroundColor: '#dc3545'}}>Tüm Koridorları Temizle</button>
      </div>

      <div 
        className="stage-container" 
        style={{ 
            width: STAGE_WIDTH + 2, 
            height: STAGE_HEIGHT + 2,
            cursor: selectedCorridorType !== CORRIDOR_TYPES.NONE ? 'crosshair' : 'default'
        }}
      >
        <Stage 
            width={STAGE_WIDTH} 
            height={STAGE_HEIGHT} 
            ref={stageRef}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
        >
          <Layer>
            <FloorGrid 
              width={STAGE_WIDTH} 
              height={STAGE_HEIGHT} 
              tileSize={TILE_SIZE_PIXELS} 
            />
            {/* Koridorların çizildiği yer - Rect burada kullanılıyor */}
            {corridors.map(corridor => (
              <Rect // BU SATIR 152. SATIR CİVARI OLABİLİR
                key={corridor.id}
                x={corridor.x}
                y={corridor.y}
                width={corridor.width}
                height={corridor.height}
                fill={corridor.type === CORRIDOR_TYPES.HOT ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)'}
                stroke={corridor.type === CORRIDOR_TYPES.HOT ? 'red' : 'blue'}
                strokeWidth={1}
              />
            ))}
            {Object.entries(cabinetPositions2D).map(([name, pos]) => (
              <Cabinet2DView
                key={name}
                cabinetName={name}
                x={pos.x}
                y={pos.y}
                cabinetWidthMeters={ACTUAL_CABINET_WIDTH_METERS}
                cabinetDepthMeters={ACTUAL_CABINET_DEPTH_METERS}
                realWorldTileSizeMeters={REAL_WORLD_TILE_SIZE_METERS}
                tileSizePixels={TILE_SIZE_PIXELS}
                onDragEnd={(newPos) => handleDragEnd(name, newPos)}
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <div style={{marginTop: '20px', textAlign: 'left', maxWidth: STAGE_WIDTH}}>
        <h4>Kullanım Notları:</h4>
        <ul>
          <li>Kabinleri sürükleyerek yerlerini değiştirebilirsiniz. Kabinler ızgaraya yapışacaktır.</li>
          <li>Koridor çizmek için listeden "Sıcak Koridor" veya "Soğuk Koridor" seçin, ardından zemine tıklayıp sürükleyerek dikdörtgen çizin.</li>
          <li>"Tüm Koridorları Temizle" butonu ile çizilmiş koridorları silebilirsiniz.</li>
        </ul>
      </div>
    </div>
  );
};

export default LayoutEditorPage;
