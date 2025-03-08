import React, { useState } from 'react';
import UploadComponent from './UploadComponent';
import RackComponent from './RackComponent';
import './App.css';

const App = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);

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
        const initialPositions = cabinetNames.reduce((acc, cabinet, i) => {
          const xPosition =  i * -5 ; //  0 piksel artı boşluk
          acc[cabinet] = { x: xPosition, y: 0 };
          console.log(`Position for ${cabinet}: x=${xPosition}`); // Debug log
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

  return (
    <div className="app">
      <h1>Rack Diagram Web</h1>
      <UploadComponent setFile={setFile} uploadFile={uploadFile} errors={errors} />
      <div className="system-room">
        {Object.entries(cabinets).map(([cabinet, data]) => (
          <RackComponent
            key={cabinet}
            cabinet={cabinet}
            data={data}
            position={positions[cabinet]}
            handleDrag={handleDrag}
          />
        ))}
      </div>
    </div>
  );
};

export default App;