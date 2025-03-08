import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import Draggable from 'react-draggable';
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

      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      console.log('Uploaded data:', data);

      if (data.errors) {
        setErrors(data.errors);
      } else {
        setCabinets(data);
        setErrors(null);
        const cabinetNames = Object.keys(data);
        const initialPositions = cabinetNames.reduce((acc, cabinet, i) => {
          acc[cabinet] = { x: i * (200 + 5), y: 0 };
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
    setPositions(prev => ({
      ...prev,
      [cabinet]: { x: data.x, y: data.y }
    }));
  };

  const RackComponent = ({ cabinet, data, position }) => {
    const rackHeight = 42;
    const frameTop = 24; // Üstte 1U boşluk
    const frameBottom = 576; // Altta 1U boşluk
    const innerHeight = frameBottom - frameTop; // İç yükseklik: 552
    const uHeight = innerHeight / rackHeight; // uHeight: ~13.14

    // Hata kontrolü ve veri düzeltme
    let adjustedData = [];
    let hasError = false;

    if (!Array.isArray(data) || data.length === 0) {
      adjustedData = [];
    } else {
      adjustedData = data.map(item => {
        const rackValue = String(item.Rack || '1');
        console.log(`Rack value for ${cabinet}: ${rackValue}`); // Rack sütununu kontrol et
        let startU = parseInt(rackValue.match(/\d+/)?.[0] || 1);
        const u = parseFloat(item.U) || 1;

        if (startU === 0) {
          startU = 1; // 0 ise +1 yap
          console.log(`U düzeltildi: ${cabinet}, Rack: 0 -> 1`);
        } else if (startU < 0 || startU > 50) {
          hasError = true;
          return null;
        }

        return { ...item, Rack: startU };
      });

      if (hasError) {
        adjustedData = [];
      }
    }

    // Maksimum U kontrolü
    const maxU = adjustedData.length > 0
      ? Math.max(...adjustedData.map(item => {
          const startU = parseInt(item.Rack);
          const u = parseFloat(item.U) || 1;
          return startU + u - 1;
        }))
      : rackHeight;

    const isFullRack = maxU > rackHeight;

    const draggableRef = React.createRef();

    return (
      <Draggable
        position={position}
        onDrag={(e, data) => handleDrag(cabinet, e, data)}
        nodeRef={draggableRef}
      >
        <div className="rack" ref={draggableRef}>
          <h3>{cabinet}</h3>
          <Stage width={200} height={600}>
            <Layer>
              {/* Dış çerçeve */}
              <Rect
                x={10}
                y={frameTop}
                width={180}
                height={innerHeight}
                stroke="black"
                strokeWidth={2}
                fill="transparent"
              />

              {/* U yüksekliği için yatay çizgiler */}
              {Array.from({ length: rackHeight + 1 }, (_, i) => (
                <Line
                  key={`line-${i}`}
                  points={[30, frameTop + i * uHeight, 170, frameTop + i * uHeight]}
                  stroke="#ccc"
                  strokeWidth={1}
                />
              ))}

              {/* Tüm kabinler için numaralandırma */}
              {Array.from({ length: rackHeight }, (_, i) => (
                <Text
                  key={`label-${i}`}
                  x={15}
                  y={frameTop + i * uHeight + uHeight / 2 - 6}
                  text={String(rackHeight - i)}
                  fontSize={10}
                  fill="black"
                  align="right"
                  width={15}
                />
              ))}

              {/* Veri çizimi */}
              {adjustedData.length === 0 ? (
                hasError ? (
                  <>
                    <Rect
                      x={30}
                      y={frameTop}
                      width={140}
                      height={innerHeight}
                      fill="red"
                      stroke="black"
                      strokeWidth={1}
                    />
                    <Text
                      x={100}
                      y={frameTop + innerHeight / 2 - 8}
                      text="Hatalı Veri"
                      fontSize={16}
                      fill="white"
                      align="center"
                      width={140}
                    />
                  </>
                ) : (
                  <Text
                    x={100}
                    y={100}
                    text="Veri Yok"
                    fontSize={16}
                    fill="black"
                    align="center"
                  />
                )
              ) : isFullRack ? (
                <>
                  <Rect
                    x={30}
                    y={frameTop}
                    width={140}
                    height={innerHeight}
                    fill="yellow"
                    stroke="black"
                    strokeWidth={1}
                  />
                  <Text
                    x={30}
                    y={frameTop + innerHeight / 2 - 16}
                    text={adjustedData[0]?.BrandModel || 'Bilinmeyen Model'}
                    fontSize={10}
                    fill="black"
                    align="center"
                    width={140}
                  />
                  <Text
                    x={30}
                    y={frameTop + innerHeight / 2}
                    text={`42U’dan yüksek ${maxU}U`}
                    fontSize={10}
                    fill="black"
                    align="center"
                    width={140}
                  />
                </>
              ) : (
                adjustedData.map((item, index) => {
                  const rackValue = String(item.Rack);
                  const startU = parseInt(rackValue);
                  const u = parseFloat(item.U) || 1;
                  const color = rackValue.includes('(ARKA)') ? 'orange' : 'lightblue';

                  const rectY = frameBottom - (startU - 1 + u) * uHeight;
                  const rectHeight = u * uHeight;

                  if (rectY < frameTop) {
                    console.log(`Üstten taşma: ${cabinet}, Rack: ${rackValue}, y: ${rectY}, height: ${rectHeight}`);
                    return null;
                  }

                  return (
                    <React.Fragment key={index}>
                      <Rect
                        x={30}
                        y={rectY}
                        width={140}
                        height={rectHeight}
                        fill={color}
                        stroke="black"
                        strokeWidth={1}
                      />
                      <Text
                        x={30}
                        y={rectY + rectHeight / 2 - 6}
                        text={item.BrandModel || 'Bilinmeyen Model'}
                        fontSize={10}
                        fill="black"
                        align="center"
                        width={140}
                      />
                    </React.Fragment>
                  );
                })
              )}
            </Layer>
          </Stage>
        </div>
      </Draggable>
    );
  };

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
        {Object.entries(cabinets).map(([cabinet, data], index) => (
          <RackComponent
            key={cabinet}
            cabinet={cabinet}
            data={data}
            position={positions[cabinet]}
          />
        ))}
      </div>
    </div>
  );
};

export default App;