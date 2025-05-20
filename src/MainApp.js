// src/MainApp.js
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import UploadComponent from './UploadComponent';
import RackComponent from './RackComponent'; // Orijinal 2D Bileşen
import RackComponent3D from './RackComponent3D'; // 3D Bileşen
import './App.css';
import { Stage, Layer } from 'react-konva';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import { jsPDF } from 'jspdf';

const CLOUD_FUNCTION_URL = 'https://europe-north1-rackcizimweb.cloudfunctions.net/rack-diagram-processor';

// --- 3D Kabin Boyutları ---
const R3D_BASE_U_HEIGHT = 0.0889; 
const R3D_BASE_RACK_TOP_BOTTOM_THICKNESS = 0.1;
const R3D_CABINET_SCALE_FACTOR = 2.3; 
const R3D_RACK_TOTAL_U = 42;
const R3D_U_HEIGHT = R3D_BASE_U_HEIGHT * R3D_CABINET_SCALE_FACTOR;
const R3D_RACK_VERTICAL_POST_HEIGHT = R3D_RACK_TOTAL_U * R3D_U_HEIGHT;
const R3D_RACK_TOP_BOTTOM_THICKNESS = R3D_BASE_RACK_TOP_BOTTOM_THICKNESS * R3D_CABINET_SCALE_FACTOR;
const RACK_TOTAL_FRAME_HEIGHT_3D = R3D_RACK_VERTICAL_POST_HEIGHT + 2 * R3D_RACK_TOP_BOTTOM_THICKNESS;
const ACTUAL_CABINET_WIDTH_METERS_3D = (0.9652 + 2 * 0.1) * R3D_CABINET_SCALE_FACTOR;

// --- 2D Kabin Boyutları ve Yerleşimi ---
const R2D_FRAME_WIDTH = 180;
const R2D_SPACING = 20;
const R2D_INITIAL_Y = 50;
const R2D_GRID_SIZE = 10;

const MainApp = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions2D, setPositions2D] = useState({});
  const [positions3D, setPositions3D] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('3D');

  // 2D Stage için state'ler
  const [stage2DScale, setStage2DScale] = useState(1);
  const [stage2DPosition, setStage2DPosition] = useState({ x: 0, y: 0 });

  const stage2DRef = useRef(null);
  const canvas3DRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const naturalSort = (a, b) => {
    const re = /(\d+)/g;
    const aParts = String(a).split(re);
    const bParts = String(b).split(re);
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        const aPart = aParts[i]; const bPart = bParts[i];
        if (i % 2 === 1) {
            const aNum = parseInt(aPart, 10); const bNum = parseInt(bPart, 10);
            if (aNum !== bNum) return aNum - bNum;
        } else {
            if (aPart !== bPart) return aPart.localeCompare(bPart);
        }
    }
    return aParts.length - bParts.length;
  };

  const initializePositions = (dataFromExcel) => {
    const cabinetNames = Object.keys(dataFromExcel || {}).sort(naturalSort);
    
    const initialYPosition3D = RACK_TOTAL_FRAME_HEIGHT_3D / 2;
    const cabinetWidthFor3DLayout = ACTUAL_CABINET_WIDTH_METERS_3D;
    const totalLayoutWidth3D = (cabinetNames.length * cabinetWidthFor3DLayout);
    const firstCabinetX3D = -totalLayoutWidth3D / 2 + cabinetWidthFor3DLayout / 2;
    const new3DPos = {};
    cabinetNames.forEach((name, i) => {
      new3DPos[name] = { 
        x: firstCabinetX3D + i * cabinetWidthFor3DLayout, 
        y: initialYPosition3D, 
        z: 0 
      };
    });
    setPositions3D(new3DPos);

    const new2DPos = {};
    cabinetNames.forEach((name, i) => {
      new2DPos[name] = {
        x: i * (R2D_FRAME_WIDTH + R2D_SPACING) + R2D_SPACING,
        y: R2D_INITIAL_Y,
      };
    });
    setPositions2D(new2DPos);
  };

  const uploadFile = async () => {
    // ... (uploadFile kodu aynı kalır)
    if (!file) {
      setErrors({ upload: 'Lütfen işlemek için bir Excel dosyası seçin.' });
      return;
    }
    setErrors(null);
    setCabinets({});
    setPositions2D({});
    setPositions3D({});
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(CLOUD_FUNCTION_URL, { method: 'POST', body: formData });
      const responseData = await response.json();

      if (!response.ok) {
        const errorDetail = responseData.error || responseData.errors || `Sunucu hatası: ${response.status}`;
        setErrors(typeof errorDetail === 'string' ? { upload: errorDetail } : errorDetail);
        setCabinets({}); 
        return;
      }
      if (responseData.errors && Object.keys(responseData.errors).length > 0) {
        setErrors(responseData.errors);
        const validCabinets = { ...responseData };
        delete validCabinets.errors;
        if (Object.keys(validCabinets).length > 0) {
          setCabinets(validCabinets);
          initializePositions(validCabinets);
        } else {
          setCabinets({});
        }
      } else {
        setCabinets(responseData);
        setErrors(null);
        initializePositions(responseData);
      }
    } catch (error) {
      setErrors({ upload: 'Dosya gönderilirken/işlenirken bir ağ hatası: ' + error.message });
      setCabinets({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleCabinetDragEnd2D = (cabinetName, e) => {
    const node = e.target;
    const newX = R2D_GRID_SIZE > 0 ? Math.round(node.x() / R2D_GRID_SIZE) * R2D_GRID_SIZE : node.x();
    const newY = R2D_GRID_SIZE > 0 ? Math.round(node.y() / R2D_GRID_SIZE) * R2D_GRID_SIZE : node.y();
    node.position({ x: newX, y: newY });
    setPositions2D(prev => ({
      ...prev,
      [cabinetName]: { x: newX, y: newY }
    }));
  };
   const handleCabinetDragMove2D = (e, currentGridSize) => {
    const target = e.target;
    if (!target || typeof target.x !== 'function' || typeof target.y !== 'function') return;
    const newX = currentGridSize > 0 ? Math.round(target.x() / currentGridSize) * currentGridSize : target.x();
    const newY = currentGridSize > 0 ? Math.round(target.y() / currentGridSize) * currentGridSize : target.y();
    target.x(newX);
    target.y(newY);
  };

  // --- 2D Stage Zoom ve Pan Fonksiyonları ---
  const handleZoom2D = (zoomIn) => {
    const scaleBy = 1.2;
    let newScale = zoomIn ? stage2DScale * scaleBy : stage2DScale / scaleBy;
    newScale = Math.max(0.2, Math.min(newScale, 3)); // Zoom limitleri
    setStage2DScale(newScale);
  };

  const handleWheel2D = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stage2DRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 5)); // Zoom limitleri
    
    if (Math.abs(oldScale - newScale) < 0.001) return;

    setStage2DScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStage2DPosition(newPos);
  };
  // --- Bitiş: 2D Stage Zoom ve Pan ---


  const exportToPNG = () => { /* ... (önceki gibi) ... */ };
  const exportToPDF = () => { /* ... (önceki gibi) ... */ };
  const exportToSVG = () => { /* ... (önceki gibi) ... */ };
  const renderErrors = (errorsData) => { /* ... (önceki gibi) ... */ };

  const stage2DWidth = Math.max(window.innerWidth * 0.95, (Object.keys(cabinets).length * (R2D_FRAME_WIDTH + R2D_SPACING)) + R2D_SPACING);
  const stage2DHeight = Math.max(window.innerHeight * 0.7, 700); // Minimum yükseklik


  return (
    <div className="app-container">
      <div className="app-content">
        <h1>Rack Diagram Web ({viewMode} Görünüm)</h1>
        <UploadComponent setFile={setFile} uploadFile={uploadFile} disabled={isLoading} />
        
        <div className="view-toggle-container" style={{ margin: '15px 0', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => setViewMode('2D')} disabled={viewMode === '2D'} style={viewMode === '2D' ? {backgroundColor: '#6c757d'} : {}}>2D Görünüm</button>
          <button onClick={() => setViewMode('3D')} disabled={viewMode === '3D'} style={viewMode === '3D' ? {backgroundColor: '#6c757d'} : {}}>3D Görünüm</button>
        </div>

        {isLoading && <div className="loading-indicator">Dosya işleniyor, lütfen bekleyin...</div>}
        {renderErrors(errors)}
        {!isLoading && Object.keys(cabinets).length === 0 && !errors && (
          <div className="empty-state-info">
            <p>Kabinleri görmek için bir Excel dosyası yükleyin.</p>
          </div>
        )}

        {/* 2D Görünüm için Zoom Butonları */}
        {viewMode === '2D' && Object.keys(cabinets).length > 0 && (
            <div className="button-container" style={{ justifyContent: 'flex-start', maxWidth: stage2DWidth, margin: '10px auto' }}>
                <button onClick={() => handleZoom2D(true)}>Yakınlaştır (2D)</button>
                <button onClick={() => handleZoom2D(false)}>Uzaklaştır (2D)</button>
                <span style={{marginLeft: '10px'}}>Zoom: {stage2DScale.toFixed(2)}x</span>
            </div>
        )}

        <div className="button-container">
          <Link to="/">
            <button className="help-button">Nasıl Kullanılır?</button>
          </Link>
          <button onClick={exportToPNG} disabled={isLoading || Object.keys(cabinets).length === 0}>PNG İndir</button>
          <button onClick={exportToSVG} disabled={isLoading || Object.keys(cabinets).length === 0}>SVG İndir (Beta)</button>
          <button onClick={exportToPDF} disabled={isLoading || Object.keys(cabinets).length === 0}>PDF İndir</button>
        </div>

        {viewMode === '2D' && (
          <div 
            className="stage-container" 
            style={{ 
                height: `${stage2DHeight}px`, 
                backgroundColor: '#FFF', 
                overflow: 'auto', // Stage içeriği taşarsa scrollbar çıksın
                width: '95vw', // Genişliği viewport'a göre ayarla
                maxWidth: `${stage2DWidth + 20}px`, // İçeriğe göre maksimum genişlik
                margin: '0 auto'
            }}
          >
            <Stage 
                width={stage2DWidth} 
                height={stage2DHeight} 
                ref={stage2DRef}
                draggable={true}
                onWheel={handleWheel2D} // Tekerlek ile zoom
                scaleX={stage2DScale}
                scaleY={stage2DScale}
                x={stage2DPosition.x}
                y={stage2DPosition.y}
                onDragEnd={(e) => {
                    setStage2DPosition({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
            >
              <Layer>
                {Object.entries(cabinets).map(([cabinetName, data]) => {
                  const currentPosition2D = positions2D[cabinetName];
                  if (currentPosition2D && typeof currentPosition2D.x === 'number' && typeof currentPosition2D.y === 'number') {
                    return (
                      <RackComponent
                        key={cabinetName}
                        cabinet={cabinetName}
                        name={cabinetName}
                        data={data}
                        position={currentPosition2D}
                        handleDragMove={handleCabinetDragMove2D}
                        handleDragEnd={handleCabinetDragEnd2D}
                        gridSize={R2D_GRID_SIZE}
                        labelMargin={5}
                        labelAlignment="center"
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
          </div>
        )}

        {viewMode === '3D' && (
          // ... (Mevcut 3D Canvas ve içeriği aynı kalır) ...
          <div className="stage-container" style={{ height: '75vh' }}>
            <Canvas ref={canvas3DRef} camera={{ position: [0, RACK_TOTAL_FRAME_HEIGHT_3D * 0.7, 25], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
              <ambientLight intensity={Math.PI / 1.5} />
              <directionalLight position={[15, 20, 15]} intensity={Math.PI} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
              <pointLight position={[-15, -15, -15]} decay={0} intensity={Math.PI * 0.5} />
              <Grid 
                  position={[0, 0, 0]}
                  args={[40, 40]} 
                  cellSize={1 * R3D_CABINET_SCALE_FACTOR} 
                  cellThickness={1}
                  cellColor={"#cccccc"}
                  sectionSize={5 * R3D_CABINET_SCALE_FACTOR} 
                  sectionThickness={1.5}
                  sectionColor={"#bbbbbb"}
                  fadeDistance={100} 
                  fadeStrength={1}
                  infiniteGrid
                  followCamera={false}
              />
              <Suspense fallback={<Html center><div className="loading-indicator">3D Sahne Yükleniyor...</div></Html>}>
                {Object.entries(cabinets).map(([cabinetName, data]) => {
                  const currentPosition3D = positions3D[cabinetName];
                  if (currentPosition3D && typeof currentPosition3D.x === 'number' && typeof currentPosition3D.y === 'number' && typeof currentPosition3D.z === 'number') {
                    return (
                      <RackComponent3D
                        key={cabinetName}
                        cabinetName={cabinetName}
                        devicesData={data}
                        position={[currentPosition3D.x, currentPosition3D.y, currentPosition3D.z]}
                      />
                    );
                  }
                  return null;
                })}
              </Suspense>
              <OrbitControls 
                makeDefault
                minDistance={1} 
                maxDistance={150}
                enablePan={true}
                target={[0, RACK_TOTAL_FRAME_HEIGHT_3D / 3, 0]}
              />
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainApp;
