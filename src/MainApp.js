// src/MainApp.js

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import UploadComponent from './UploadComponent';
import RackComponent3D from './RackComponent3D';
import './App.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import { jsPDF } from 'jspdf';

const CLOUD_FUNCTION_URL = 'https://europe-north1-rackcizimweb.cloudfunctions.net/rack-diagram-processor';

// --- RackComponent3D'den alınan ve MainApp'te de kullanılacak sabitler ---
// --- Temel Ölçüler (Ölçekleme Öncesi) ---
const BASE_U_HEIGHT_FOR_MAIN = 0.0889; 
const BASE_RACK_TOP_BOTTOM_THICKNESS_FOR_MAIN = 0.1;
const CABINET_SCALE_FACTOR_FOR_MAIN = 2.3; 
const RACK_TOTAL_U_FOR_MAIN = 42;

// --- Ölçeklenmiş Sabitler (MainApp içinde kabin yüksekliğini hesaplamak için) ---
const U_HEIGHT_FOR_MAIN = BASE_U_HEIGHT_FOR_MAIN * CABINET_SCALE_FACTOR_FOR_MAIN;
const RACK_VERTICAL_POST_HEIGHT_FOR_MAIN = RACK_TOTAL_U_FOR_MAIN * U_HEIGHT_FOR_MAIN;
const RACK_TOP_BOTTOM_THICKNESS_FOR_MAIN = BASE_RACK_TOP_BOTTOM_THICKNESS_FOR_MAIN * CABINET_SCALE_FACTOR_FOR_MAIN;
const RACK_TOTAL_FRAME_HEIGHT_FOR_MAIN = RACK_VERTICAL_POST_HEIGHT_FOR_MAIN + 2 * RACK_TOP_BOTTOM_THICKNESS_FOR_MAIN;
// --- Bitiş: RackComponent3D'den alınan sabitler ---


const BASE_CABINET_WIDTH_3D = 2; // 3D dünyasında bir kabinin temel genişliği (yerleşim için)
const BASE_CABINET_SPACING_3D = 1; // Kabinler arası temel boşluk (yerleşim için)

const MainApp = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const canvasRef = useRef();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const initializePositions = (cabinetsData) => {
    if (!cabinetsData || typeof cabinetsData !== 'object' || Object.keys(cabinetsData).length === 0) {
      setPositions({});
      return;
    }
    const cabinetNames = Object.keys(cabinetsData);
    
    // Kabinlerin yerleşimi için ölçekleme ve boşluk ayarları
    const cabinetLayoutScaleFactor = 1.5; // Bu, MainApp'teki yerleşim genişliğini etkiler, RackComponent3D'deki CABINET_SCALE_FACTOR ile aynı olmak zorunda değil.
                                        // Ancak tutarlılık için RackComponent3D'deki CABINET_SCALE_FACTOR'ı kullanalım.
    const currentCabinetScaleFactor = CABINET_SCALE_FACTOR_FOR_MAIN; // RackComponent3D'deki ile aynı
    const spacingReductionFactor = 0; // Kabinler arası boşluk sıfır

    const scaledCabinetWidthForLayout = BASE_CABINET_WIDTH_3D * currentCabinetScaleFactor; // Yerleşimde kaplayacağı genişlik
    const reducedCabinetSpacing3D = BASE_CABINET_SPACING_3D * spacingReductionFactor; 
    
    // Kabinlerin tabanının Y=0 (grid düzlemi) üzerinde olması için
    // kabinin Y pozisyonu, toplam yüksekliğinin yarısı olmalı.
    const initialYPosition = RACK_TOTAL_FRAME_HEIGHT_FOR_MAIN / 2; 

    const newPositions = cabinetNames.reduce((acc, cabinetName, i) => {
      const totalWidthForLayout = (cabinetNames.length * scaledCabinetWidthForLayout) + Math.max(0, (cabinetNames.length - 1) * reducedCabinetSpacing3D);
      const firstCabinetX = -totalWidthForLayout / 2 + scaledCabinetWidthForLayout / 2;
      const xPosition = firstCabinetX + i * (scaledCabinetWidthForLayout + reducedCabinetSpacing3D);
      acc[cabinetName] = { x: xPosition, y: initialYPosition, z: 0 };
      return acc;
    }, {});
    setPositions(newPositions);
  };

  const uploadFile = async () => {
    if (!file) {
      setErrors({ upload: 'Lütfen işlemek için bir Excel dosyası seçin.' });
      return;
    }
    setErrors(null);
    setCabinets({});
    setPositions({});
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(CLOUD_FUNCTION_URL, { method: 'POST', body: formData });
      const responseData = await response.json();

      if (!response.ok) {
        const errorDetail = responseData.error || responseData.errors || `Sunucu hatası: ${response.status}`;
        setErrors(typeof errorDetail === 'string' ? { upload: errorDetail } : errorDetail);
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
      setPositions({});
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPNG = () => {
    const gl = canvasRef.current?.gl;
    if (gl) {
      gl.preserveDrawingBuffer = true; 
      const dataURL = gl.domElement.toDataURL('image/png');
      gl.preserveDrawingBuffer = false;
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'rack-diagram-3d.png';
      link.click();
    } else {
      alert('3D sahne henüz hazır değil veya bulunamadı.');
    }
  };

  const exportToSVG = () => {
    alert('3D modellerin SVG olarak dışa aktarılması karmaşıktır ve şu anda desteklenmemektedir.');
  };

  const exportToPDF = () => {
    const gl = canvasRef.current?.gl;
    if (gl) {
      gl.preserveDrawingBuffer = true;
      const dataURL = gl.domElement.toDataURL('image/png');
      gl.preserveDrawingBuffer = false;
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
      pdf.save('rack-diagram-3d.pdf');
    } else {
      alert('3D sahne henüz hazır değil veya bulunamadı.');
    }
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
  
  return (
    <div className="app-container">
      <div className="app-content">
        <h1>Rack Diagram Web (3D Versiyon)</h1>
        <UploadComponent setFile={setFile} uploadFile={uploadFile} disabled={isLoading} />
        {isLoading && <div className="loading-indicator">Dosya işleniyor, lütfen bekleyin...</div>}
        {renderErrors(errors)}
        {!isLoading && Object.keys(cabinets).length === 0 && !errors && (
          <div className="empty-state-info">
            <p>3D kabinleri görmek için bir Excel dosyası yükleyin.</p>
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

        <div className="stage-container" style={{ height: '80vh' }}>
          <Canvas ref={canvasRef} camera={{ position: [0, RACK_TOTAL_FRAME_HEIGHT_FOR_MAIN * 0.6, 20], fov: 50 }}> {/* Kamera Y pozisyonu ayarlandı */}
            <ambientLight intensity={Math.PI / 1.5} />
            <directionalLight position={[15, 20, 15]} intensity={Math.PI} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <pointLight position={[-15, -15, -15]} decay={0} intensity={Math.PI * 0.5} />
            
            <Grid 
                position={[0, 0, 0]} // Izgarayı Y=0 düzlemine yerleştir
                args={[40, 40]} // Izgara boyutu artırıldı
                cellSize={1 * CABINET_SCALE_FACTOR_FOR_MAIN} // Hücre boyutu kabin ölçeğiyle orantılı
                cellThickness={1}
                cellColor={"#cccccc"} // Daha açık gri
                sectionSize={5 * CABINET_SCALE_FACTOR_FOR_MAIN} 
                sectionThickness={1.5}
                sectionColor={"#bbbbbb"} // Daha açık gri
                fadeDistance={100} 
                fadeStrength={1}
                infiniteGrid
                followCamera={false}
            />

            <Suspense fallback={<Html center><div className="loading-indicator">3D Sahne Yükleniyor...</div></Html>}>
              {Object.entries(cabinets).map(([cabinetName, data]) => {
                const currentPosition = positions[cabinetName];
                if (currentPosition && typeof currentPosition.x === 'number' && typeof currentPosition.y === 'number' && typeof currentPosition.z === 'number') {
                  return (
                    <RackComponent3D
                      key={cabinetName}
                      cabinetName={cabinetName}
                      devicesData={data}
                      position={[currentPosition.x, currentPosition.y, currentPosition.z]} // Bu Y pozisyonu kabinin merkezini hedefler
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
              target={[0, RACK_TOTAL_FRAME_HEIGHT_FOR_MAIN / 3, 0]} // Kameranın odak noktasını biraz yukarı al
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default MainApp;
