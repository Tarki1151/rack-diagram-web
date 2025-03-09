import React, { useState } from 'react';
import UploadComponent from './UploadComponent';
import RackComponent from './RackComponent';
import './App.css';

const App = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [gridSize, setGridSize] = useState(10);
  const [labelMargin, setLabelMargin] = useState(-15); // Varsayılan 10px boşluk
  const [labelAlignment, setLabelAlignment] = useState('center');

  const uploadFile = async () => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.errors) {
        setErrors(data.errors);
      } else {
        setCabinets(data);
        setErrors(null);
        const cabinetNames = Object.keys(data);
        const extraSpace = -18;
        const initialPositions = cabinetNames.reduce((acc, cabinet, i) => {
          const xPosition = i * extraSpace;
          acc[cabinet] = { x: xPosition, y: 0 };
          return acc;
        }, {});
        setPositions(initialPositions);
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      setErrors({ upload: 'Dosya yüklenirken bir hata oluştu: ' + error.message });
    }
  };

  const handleDrag = (cabinet, e, data) => {
    setPositions(prev => ({ ...prev, [cabinet]: { x: data.x, y: data.y } }));
  };

  const handleGridChange = (e) => {
    setGridSize(parseInt(e.target.value));
  };

  const handleMarginChange = (e) => {
    setLabelMargin(parseInt(e.target.value));
  };

  const handleAlignmentChange = (e) => {
    setLabelAlignment(e.target.value);
  };

  return (
    <div className="app">
      <h1>Rack Diagram Web</h1>
      <UploadComponent setFile={setFile} uploadFile={uploadFile} errors={errors} />
      <div className="options-container">
        <div className="option">
          <label htmlFor="gridSize">Snap-to-Grid: </label>
          <select id="gridSize" value={gridSize} onChange={handleGridChange}>
            <option value={0}>Izgara Yok</option>
            <option value={5}>5x5</option>
            <option value={10}>10x10</option>
            <option value={15}>15x15</option>
          </select>
        </div>
        <div className="option">
          <label htmlFor="labelMargin">Etiket Boşluğu: </label>
          <select id="labelMargin" value={labelMargin} onChange={handleMarginChange}>
            <option value={-25}>0px (Bitişik)</option>
            <option value={-20}>5px</option>
            <option value={-15}>10px</option>
            <option value={-10}>15px</option>
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
      <div className="system-room">
        {Object.entries(cabinets).map(([cabinet, data]) => (
          <RackComponent
            key={cabinet}
            cabinet={cabinet}
            data={data}
            position={positions[cabinet]}
            handleDrag={handleDrag}
            gridSize={gridSize}
            labelMargin={labelMargin}
            labelAlignment={labelAlignment}
          />
        ))}
      </div>
    </div>
  );
};

export default App;