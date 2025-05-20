// src/MainApp.js
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import UploadComponent from './UploadComponent';
import RackComponent from './RackComponent';
import RackComponent3D from './RackComponent3D';
import './App.css';
import { Stage, Layer } from 'react-konva';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import { jsPDF } from 'jspdf';
import * as PptxGenJS from 'pptxgenjs';

// GCP Cloud Function URL
const CLOUD_FUNCTION_URL = 'https://europe-north1-rackcizimweb.cloudfunctions.net/rack-diagram-processor'; // Remove the markdown link format

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
  const [viewMode, setViewMode] = useState('3D'); // Varsayılan 3D

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
      
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        body: formData,
        // CORS headers are handled by the Cloud Function
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Sunucudan geçersiz yanıt alındı');
      }

      if (!response.ok) {
        const errorDetail = responseData?.error || 
                         responseData?.errors || 
                         `Sunucu hatası: ${response.status} ${response.statusText}`;
        throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
      }

      // Check if we have valid data in the response
      if (responseData && typeof responseData === 'object') {
        if (Object.keys(responseData).length > 0) {
          // Check if there are errors in the response
          if (responseData.errors && Object.keys(responseData.errors).length > 0) {
            setErrors(responseData.errors);
            // Still try to process valid cabinets if any
            const validCabinets = { ...responseData };
            delete validCabinets.errors;
            if (Object.keys(validCabinets).length > 0) {
              setCabinets(validCabinets);
              initializePositions(validCabinets);
            }
          } else {
            // No errors, process the data
            setCabinets(responseData);
            initializePositions(responseData);
          }
        } else {
          throw new Error('Boş veri yanıtı alındı');
        }
      } else {
        throw new Error('Geçersiz yanıt formatı');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ 
        upload: `Dosya işlenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}` 
      });
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

  const handleZoom2D = (zoomIn) => {
    const scaleBy = 1.2;
    let newScale = zoomIn ? stage2DScale * scaleBy : stage2DScale / scaleBy;
    newScale = Math.max(0.2, Math.min(newScale, 3));
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
    newScale = Math.max(0.1, Math.min(newScale, 5));
    if (Math.abs(oldScale - newScale) < 0.001) return;
    setStage2DScale(newScale);
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStage2DPosition(newPos);
  };

  const exportToPNG = () => {
    let dataURL;
    let filename = 'rack-diagram.png';
    if (viewMode === '3D' && canvas3DRef.current?.gl) {
      const gl = canvas3DRef.current.gl;
      gl.preserveDrawingBuffer = true; 
      dataURL = gl.domElement.toDataURL('image/png');
      gl.preserveDrawingBuffer = false;
      filename = 'rack-diagram-3d.png';
    } else if (viewMode === '2D' && stage2DRef.current) {
      dataURL = stage2DRef.current.toDataURL({ pixelRatio: 3 }); 
      filename = 'rack-diagram-2d.png';
    } else {
      alert('Çizim alanı henüz hazır değil.');
      return;
    }
    if (!dataURL) {
        alert('Görüntü verisi oluşturulamadı.');
        return;
    }
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.click();
  };
  
  const exportToSVG_HighRes = () => {
    if (viewMode !== '2D' || !stage2DRef.current) {
      alert('SVG dışa aktarma yalnızca 2D görünüm için geçerlidir ve çizim alanı hazır olmalıdır.');
      return;
    }
    try {
      const svgData = stage2DRef.current.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'rack-diagram-2d.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("SVG dışa aktarma hatası:", error);
      alert("SVG dışa aktarılırken bir hata oluştu. Konsolu kontrol edin.");
    }
  };

  const exportToPPTX = () => {
    if (viewMode !== '2D' || !stage2DRef.current) {
      alert('PPTX dışa aktarma yalnızca 2D görünüm için geçerlidir.');
      return;
    }
    
    try {
      // Yeni bir PPTX sunusu oluştur
      const pptx = new PptxGenJS.default();
      const slide = pptx.addSlide();
      
      // Sunu başlığı ekle
      slide.addText('Rack Diyagramı', {
        x: 0.5,
        y: 0.25,
        w: '90%',
        h: 0.5,
        fontSize: 18,
        bold: true,
        align: 'center',
      });
      
      // Canvas'ı resim olarak al
      const dataURL = stage2DRef.current.toDataURL({ pixelRatio: 2 });
      
      // Resmi PPTX'e ekle
      slide.addImage({
        data: dataURL,
        x: 0.5,
        y: 1,
        w: 9,
        h: 5,
      });
      
      // Sunuyu indir
      pptx.writeFile({ fileName: 'rack-diagram.pptx' });
      
    } catch (error) {
      console.error('PPTX oluşturma hatası:', error);
      alert('PPTX oluşturulurken bir hata oluştu: ' + error.message);
    }
  };

  const exportToPDF = () => {
    let dataURL;
    if (viewMode === '3D' && canvas3DRef.current?.gl) {
      const gl = canvas3DRef.current.gl;
      gl.preserveDrawingBuffer = true;
      dataURL = gl.domElement.toDataURL('image/png');
      gl.preserveDrawingBuffer = false;
    } else if (viewMode === '2D' && stage2DRef.current) {
      dataURL = stage2DRef.current.toDataURL({ pixelRatio: 2 });
    } else {
      alert('Çizim alanı henüz hazır değil.');
      return;
    }
    if (!dataURL) {
        alert('Görüntü verisi oluşturulamadı.');
        return;
    }
    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const imgProps = pdf.getImageProperties(dataURL);
    const margin = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let pageHeight = pdf.internal.pageSize.getHeight() - 2 * margin;
    if (pdfHeight > pageHeight) {
      const newPdfWidth = (imgProps.width * pageHeight) / imgProps.height;
      pdf.addImage(dataURL, 'PNG', margin, margin, newPdfWidth, pageHeight);
    } else {
      pdf.addImage(dataURL, 'PNG', margin, margin, pdfWidth, pdfHeight);
    }
    pdf.save(`rack-diagram-${viewMode.toLowerCase()}.pdf`);
  };
  
  const renderErrors = (errorsData) => {
    if (!errorsData) return null;
    let errorMessages = [];
    if (typeof errorsData === 'string') {
      errorMessages.push(<p key="single-error">{errorsData}</p>);
    } else if (typeof errorsData === 'object') {
      Object.entries(errorsData).forEach(([key, value]) => {
        if (key === 'upload' && typeof value === 'string') {
          errorMessages.push(<p key={key}><strong>Genel Yükleme Hatası:</strong> {value}</p>);
        } else if (Array.isArray(value)) {
          errorMessages.push(
            <div key={key}>
              <strong>Sayfa '{key}' için hatalar:</strong>
              <ul>
                {value.map((err, index) => (
                  <li key={index}>{typeof err === 'object' ? JSON.stringify(err) : err}</li>
                ))}
              </ul>
            </div>
          );
        } else if (typeof value === 'string') {
           errorMessages.push(<p key={key}><strong>{key}:</strong> {value}</p>);
        }
      });
    }
    if (errorMessages.length === 0) return null;
    return (
      <div className="error-container">
        <h4>Hata Oluştu:</h4>
        {errorMessages}
      </div>
    );
  };

  const stage2DWidth = Math.max(window.innerWidth * 0.95, (Object.keys(cabinets).length * (R2D_FRAME_WIDTH + R2D_SPACING)) + R2D_SPACING);
  const stage2DHeight = Math.max(window.innerHeight * 0.7, 700);


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
          <button onClick={exportToSVG_HighRes} disabled={isLoading || Object.keys(cabinets).length === 0 || viewMode !== '2D'}>SVG İndir (2D)</button>
          {/* PPTX butonu kaldırıldı */}
          <button onClick={exportToPPTX} disabled={isLoading || Object.keys(cabinets).length === 0 || viewMode !== '2D'}>PPTX İndir</button>
          <button onClick={exportToPDF} disabled={isLoading || Object.keys(cabinets).length === 0}>PDF İndir</button>
        </div>

        {viewMode === '2D' && (
          <div 
            className="stage-container" 
            style={{ 
                height: `${stage2DHeight}px`, 
                backgroundColor: '#FFF', 
                overflow: 'auto',
                width: '95vw', 
                maxWidth: `${stage2DWidth + 20}px`,
                margin: '0 auto'
            }}
          >
            <Stage 
                width={stage2DWidth} 
                height={stage2DHeight} 
                ref={stage2DRef}
                draggable={true}
                onWheel={handleWheel2D}
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
