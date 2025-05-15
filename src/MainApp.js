import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UploadComponent from './UploadComponent';
import RackComponent from './RackComponent';
import './App.css';
import { Stage, Layer } from 'react-konva';
import { jsPDF } from 'jspdf';

const CLOUD_FUNCTION_URL = 'https://europe-north1-rackcizimweb.cloudfunctions.net/rack-diagram-processor';

const MainApp = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [gridSize, setGridSize] = useState(10);
  const [labelMargin, setLabelMargin] = useState(0);
  const [labelAlignment, setLabelAlignment] = useState('center');
  const [zoomLevel, setZoomLevel] = useState(1); // zoomLevel state'i burada tanımlı
  const stageRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // EKSİK OLAN FONKSİYONLAR:
  const handleZoomIn = () => {
    console.log('[MainApp] handleZoomIn çağrıldı.'); // Kontrol için log
    setZoomLevel(prev => {
      const newZoom = Math.min(prev * 1.1, 3); // Maksimum 3x zoom
      console.log('[MainApp] Yeni zoom seviyesi (yakınlaştır):', newZoom);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    console.log('[MainApp] handleZoomOut çağrıldı.'); // Kontrol için log
    setZoomLevel(prev => {
      const newZoom = Math.max(prev / 1.1, 0.2); // Minimum 0.2x zoom
      console.log('[MainApp] Yeni zoom seviyesi (uzaklaştır):', newZoom);
      return newZoom;
    });
  };
  // EKSİK OLAN FONKSİYONLARIN SONU

  const initializePositions = (cabinetsData) => {
    // ... (önceki initializePositions kodu) ...
    console.log('[MainApp] initializePositions - Gelen cabinetsData:', cabinetsData);
    if (!cabinetsData || typeof cabinetsData !== 'object' || Object.keys(cabinetsData).length === 0) {
      console.warn('[MainApp] initializePositions: cabinetsData boş veya geçersiz. Pozisyonlar boşaltılıyor.');
      setPositions({});
      return;
    }
    const cabinetNames = Object.keys(cabinetsData);
    const cabinetWidth = 180;
    const cabinetSpacing = 20;
    const newPositions = cabinetNames.reduce((acc, cabinet, i) => {
      const xPosition = i * (cabinetWidth + cabinetSpacing);
      acc[cabinet] = { x: xPosition, y: 20 };
      return acc;
    }, {});
    console.log('[MainApp] initializePositions - Ayarlanan yeni pozisyonlar:', newPositions);
    setPositions(newPositions);
  };

  const uploadFile = async () => {
    // ... (önceki uploadFile kodu) ...
    if (!file) {
      setErrors({ upload: 'Lütfen bir dosya seçin.' });
      return;
    }
    setErrors(null);
    setCabinets({});
    setPositions({});

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[MainApp] uploadFile - Dosya gönderiliyor:', CLOUD_FUNCTION_URL);
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('[MainApp] uploadFile - Sunucu yanıt durumu:', response.status);
      const responseData = await response.json();
      console.log('[MainApp] uploadFile - Sunucudan gelen veri:', responseData);

      if (!response.ok) {
        const errorDetail = responseData.error || responseData.errors || `Sunucu hatası: ${response.status}`;
        console.error('[MainApp] uploadFile - Sunucudan gelen hata:', errorDetail);
        setErrors(typeof errorDetail === 'string' ? { upload: errorDetail } : errorDetail);
        return;
      }

      if (responseData.errors && Object.keys(responseData.errors).length > 0) {
        console.warn('[MainApp] uploadFile - Sunucudan doğrulama hataları alındı:', responseData.errors);
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
      console.error('[MainApp] uploadFile - İstemci tarafı hata:', error);
      setErrors({ upload: 'Dosya gönderilirken/işlenirken bir hata: ' + error.message });
      setCabinets({});
      setPositions({});
    }
  };

  const handleDragMove = (e, currentGridSize) => {
    // ... (önceki handleDragMove kodu) ...
    const target = e.target;
    if (!target || typeof target.x !== 'function' || typeof target.y !== 'function') {
        console.warn('[MainApp] handleDragMove: e.target veya x/y fonksiyonları tanımsız.', target);
        return;
    }
    const newX = currentGridSize > 0 ? Math.round(target.x() / currentGridSize) * currentGridSize : target.x();
    const newY = currentGridSize > 0 ? Math.round(target.y() / currentGridSize) * currentGridSize : target.y();
    target.x(newX);
    target.y(newY);
  };

  const handleDragEnd = (cabinetName, e) => {
    // ... (önceki handleDragEnd kodu) ...
    console.log('[MainApp] handleDragEnd tetiklendi. Kabin:', cabinetName, 'Event objesi:', e);
    
    if (!e || !e.target) {
      console.error('[MainApp] handleDragEnd: Event (e) veya e.target tanımsız! Sürükleme işlemi iptal edildi.', 'e:', e);
      return;
    }

    if (typeof e.target.x !== 'function' || typeof e.target.y !== 'function') {
      console.error('[MainApp] handleDragEnd: e.target üzerinde x() veya y() fonksiyonları bulunamadı!', 'e.target:', e.target);
      return;
    }

    const newX = e.target.x();
    const newY = e.target.y();
    console.log(`[MainApp] handleDragEnd: Kabin '${cabinetName}' için yeni pozisyon: x=${newX}, y=${newY}`);

    setPositions(prevPositions => {
      console.log('[MainApp] handleDragEnd - setPositions içi. Önceki pozisyonlar:', prevPositions);
      const updatedPositions = {
        ...prevPositions,
        [cabinetName]: { x: newX, y: newY }
      };
      console.log('[MainApp] handleDragEnd - setPositions içi. Güncellenmiş pozisyonlar:', updatedPositions);
      return updatedPositions;
    });
  };

  const handleGridChange = (e) => setGridSize(parseInt(e.target.value, 10));
  const handleMarginChange = (e) => setLabelMargin(parseInt(e.target.value, 10));
  const handleAlignmentChange = (e) => setLabelAlignment(e.target.value);

  // handleZoomIn ve handleZoomOut yukarıda tanımlandı.

  const exportToPNG = () => {
    // ... (önceki exportToPNG kodu) ...
    if (!stageRef.current) return;
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'rack-diagram.png';
    link.click();
  };

  const exportToSVG = () => {
    // ... (önceki exportToSVG kodu) ...
    if (!stageRef.current) return;
    alert('SVG dışa aktarma şu anda doğrudan desteklenmiyor. PNG veya PDF olarak dışa aktarabilirsiniz.');
  };

  const exportToPDF = () => {
    // ... (önceki exportToPDF kodu) ...
    if (!stageRef.current) return;
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const pdf = new jsPDF({
      orientation: Object.keys(cabinets).length > 3 ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });
    const imgProps = pdf.getImageProperties(dataURL);
    const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let pageHeight = pdf.internal.pageSize.getHeight() - 20;

    if (pdfHeight > pageHeight) {
        const newPdfWidth = (imgProps.width * pageHeight) / imgProps.height;
        pdf.addImage(dataURL, 'PNG', 10, 10, newPdfWidth, pageHeight);
    } else {
        pdf.addImage(dataURL, 'PNG', 10, 10, pdfWidth, pdfHeight);
    }
    pdf.save('rack-diagram.pdf');
  };

  const renderErrors = (errorsObject) => {
    // ... (önceki renderErrors kodu) ...
    if (!errorsObject) return null;
    if (typeof errorsObject === 'string') {
      return <div style={{ color: 'red', marginTop: '10px' }}>{errorsObject}</div>;
    }
    return (
      <div style={{ color: 'red', marginTop: '10px', textAlign: 'left' }}>
        <h4>Hatalar:</h4>
        {Object.entries(errorsObject).map(([key, value]) => {
          if (key === 'upload' && typeof value === 'string') {
            return <p key={key}>{value}</p>;
          }
          if (Array.isArray(value)) {
            return (
              <div key={key}>
                <strong>Sayfa '{key}':</strong>
                <ul>
                  {value.map((err, index) => (
                    <li key={index}>{typeof err === 'object' ? JSON.stringify(err) : err}</li>
                  ))}
                </ul>
              </div>
            );
          }
          if (typeof value === 'object' && value !== null) {
            return <p key={key}>{key}: {JSON.stringify(value)}</p>;
          }
          return <p key={key}>{key}: {String(value)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <h1>Rack Diagram Web</h1>
        <UploadComponent setFile={setFile} uploadFile={uploadFile} />
        {renderErrors(errors)}
        <div className="options-container">
          {/* ... (options selectları) ... */}
          <div className="option">
            <label htmlFor="gridSize">Snap-to-Grid: </label>
            <select id="gridSize" value={gridSize} onChange={handleGridChange}>
              <option value={0}>Izgara Yok</option>
              <option value={10}>10x10</option>
              <option value={20}>20x20</option>
              <option value={50}>50x50</option>
            </select>
          </div>
          <div className="option">
            <label htmlFor="labelMargin">Etiket Boşluğu: </label>
            <select id="labelMargin" value={labelMargin} onChange={handleMarginChange}>
              <option value={0}>0px (Bitişik)</option>
              <option value={5}>5px</option>
              <option value={10}>10px</option>
              <option value={15}>15px</option>
              <option value={20}>20px</option>
            </select>
          </div>
          <div className="option">
            <label htmlFor="labelAlignment">Etiket Hizalama: </label>
            <select id="labelAlignment" value={labelAlignment} onChange={handleAlignmentChange}>
              <option value="left">Sol</option>
              <option value="center">Orta</option>
              <option value="right">Sağ</option>
            </select>
          </div>
        </div>
        <div className="button-container">
          <Link to="/">
            <button className="help-button">Nasıl Kullanılır?</button>
          </Link>
          {/* Butonların onClick olayları doğru fonksiyonlara bağlanmalı */}
          <button onClick={handleZoomIn}>Yakınlaştır</button>
          <button onClick={handleZoomOut}>Uzaklaştır</button>
          <button onClick={exportToPNG}>PNG İndir</button>
          <button onClick={exportToSVG} title="Gerçek vektörel SVG için ek geliştirme gereklidir.">SVG İndir (Beta)</button>
          <button onClick={exportToPDF}>PDF İndir</button>
        </div>
        <div style={{ border: '1px solid #ccc', width: '100%', height: '70vh', overflow: 'auto', marginTop: '20px' }}>
          <Stage
            width={window.innerWidth * 2}
            height={window.innerHeight * 1.5}
            scaleX={zoomLevel}
            scaleY={zoomLevel}
            ref={stageRef}
            style={{ backgroundColor: '#f0f0f0' }}
          >
            <Layer>
              {Object.entries(cabinets).map(([cabinetName, data]) => {
                const currentPosition = positions[cabinetName];
                // console.log(`[MainApp] Render RackComponent: Kabin='${cabinetName}', Pozisyon=`, currentPosition, 'Veri var mı=', !!data);
                if (currentPosition && typeof currentPosition.x === 'number' && typeof currentPosition.y === 'number') {
                  return (
                    <RackComponent
                      key={cabinetName}
                      cabinet={cabinetName}
                      name={cabinetName}
                      data={data}
                      position={currentPosition}
                      handleDragMove={(evt) => handleDragMove(evt, gridSize)}
                      handleDragEnd={(evt) => handleDragEnd(cabinetName, evt)}
                      gridSize={gridSize}
                      labelMargin={labelMargin}
                      labelAlignment={labelAlignment}
                    />
                  );
                } else {
                  // console.warn(`[MainApp] RackComponent render edilemiyor: Kabin='${cabinetName}' için pozisyon bulunamadı veya geçersiz.`, currentPosition);
                  return null;
                }
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default MainApp;