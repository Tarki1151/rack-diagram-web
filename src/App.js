import React, { useState } from 'react';
import UploadComponent from './UploadComponent';
import RackComponent from './RackComponent';
import './App.css';

const App = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [gridSize, setGridSize] = useState(10); // Varsayılan 10x10 grid

  const uploadFile = async () => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
      const data = await response.json();

      console.log('Uploaded data:', data);

      if (data.errors) {
        setErrors(data.errors);
      } else {
        setCabinets(data);
        setErrors(null);
        const cabinetNames = Object.keys(data);
        const extraSpace = -18; // Varsayılan 18 piksel boşluğu sıfırlayıp bitişik çizim
        const initialPositions = cabinetNames.reduce((acc, cabinet, i) => {
          const xPosition = i * extraSpace;
          acc[cabinet] = { x: xPosition, y: 0 };
          console.log(`Position for ${cabinet}: x=${xPosition}`);
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

  return (
    <div className="app">
      <h1>Rack Diagram Web</h1>
      <UploadComponent setFile={setFile} uploadFile={uploadFile} errors={errors} />
      <div>
        <label htmlFor="gridSize">Snap-to-Grid Boyutu: </label>
        <select id="gridSize" value={gridSize} onChange={handleGridChange}>
          <option value={0}>Izgara Yok</option>
          <option value={5}>5x5</option>
          <option value={10}>10x10</option>
          <option value={15}>15x15</option>
        </select>
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
          />
        ))}
      </div>
    </div>
  );
};

export default App;