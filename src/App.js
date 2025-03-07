import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Draggable from 'react-draggable';
import { Amplify, API, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';
import './App.css';

Amplify.configure(awsconfig);

const App = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const rackRefs = useRef({});

  const uploadFile = async () => {
    if (!file) return;
    await Storage.put(file.name, file, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const response = await API.get('RackAPI', '/racks', { queryStringParameters: { file_key: file.name } });
    if (response.errors) {
      setErrors(response.errors);
    } else {
      setCabinets(response);
      setErrors(null);
      const initialPositions = Object.keys(response).reduce((acc, cabinet, i) => {
        acc[cabinet] = { x: i * 250, y: 0 };
        return acc;
      }, {});
      setPositions(initialPositions);
    }
  };

  const drawRack = (cabinetName, data, ref) => {
    const svg = d3.select(ref).select('svg');
    if (!svg.empty()) svg.remove(); // Önceki SVG’yi temizle

    const newSvg = d3.select(ref).append('svg')
      .attr('width', 200)
      .attr('height', 600);

    const rackHeight = 42;
    const uHeight = 600 / rackHeight;

    data.forEach(item => {
      const startU = parseInt(item.Rack.match(/\d+/)?.[0] || 1) - 1;
      const u = parseFloat(item.U) || 1;
      const color = item.Rack.includes('(ARKA)') ? 'orange' : 'lightblue';

      newSvg.append('rect')
        .attr('x', 10)
        .attr('y', startU * uHeight)
        .attr('width', 180)
        .attr('height', u * uHeight)
        .attr('fill', color)
        .attr('stroke', 'black');

      newSvg.append('text')
        .attr('x', 100)
        .attr('y', (startU + u / 2) * uHeight)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(item.MarkaModel);
    });

    newSvg.selectAll('.u-label')
      .data(d3.range(0, rackHeight))
      .enter()
      .append('text')
      .attr('x', 5)
      .attr('y', d => d * uHeight + uHeight / 2)
      .attr('text-anchor', 'end')
      .text(d => rackHeight - d);
  };

  const handleDrag = (cabinet, e, data) => {
    setPositions(prev => ({
      ...prev,
      [cabinet]: { x: data.x, y: data.y }
    }));
  };

  useEffect(() => {
    Object.entries(cabinets).forEach(([cabinet, data]) => {
      if (rackRefs.current[cabinet]) {
        drawRack(cabinet, data, rackRefs.current[cabinet]);
      }
    });
  }, [cabinets, positions]);

  return (
    <div className="app">
      <h1>Rack Diagram Web</h1>
      <a href="/templates/input_template.xlsx" download>Şablonu İndir</a>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Yükle ve İşle</button>
      
      {errors && (
        <div className="errors">
          <h2>Hatalar Tespit Edildi</h2>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
          <p>Lütfen dosyayı düzeltip tekrar yükleyin.</p>
        </div>
      )}
      
      <div className="system-room">
        {Object.entries(cabinets).map(([cabinet, data]) => (
          <Draggable
            key={cabinet}
            position={positions[cabinet]}
            onDrag={(e, data) => handleDrag(cabinet, e, data)}
          >
            <div
              className="rack"
              ref={node => rackRefs.current[cabinet] = node}
            >
              <h3>{cabinet}</h3>
            </div>
          </Draggable>
        ))}
      </div>
    </div>
  );
};

export default App;

// App.css
.app { padding: 20px; }
.system-room { display: flex; flex-wrap: wrap; gap: 20px; }
.rack { width: 220px; height: 620px; border: 1px solid #ccc; position: relative; }
.errors { color: red; margin-top: 20px; }