// src/RackComponent.js
import React, { useState } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';

const RackComponent = ({
  cabinet,
  name,
  data,
  position,
  handleDragMove,
  handleDragEnd,
  gridSize,
  labelMargin,
  labelAlignment
}) => {
  const [tooltip, setTooltip] = useState(null);

  if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined') {
    console.error(`[RackComponent 2D] '${cabinet || name}' için pozisyon bilgisi (x, y) eksik veya geçersiz. Alınan pozisyon:`, position);
    return null;
  }

  const rackUnits = 42;
  const frameWidth = 180; // Kabin çerçevesinin toplam dış genişliği

  // U etiketleri için solda bırakılacak boşluk
  const uLabelAreaWidth = 14; 
  // Kabin çerçevesinin iç kenar boşlukları (sağ ve sol toplamı)
  const frameInternalPaddingX = 16; // Örnek: her iki taraftan 5px

  // Cihazların çizileceği net alanın genişliği
  // frameWidth - sol U etiket alanı - sağ ve sol iç boşluklar
  const drawableDeviceAreaWidth = frameWidth - uLabelAreaWidth - frameInternalPaddingX; 
  
  // Cihazların ve U çizgilerinin başlayacağı X koordinatı (U etiket alanından sonra)
  const deviceAreaStartX = uLabelAreaWidth + (frameInternalPaddingX / 2); 

  const headerHeight = 30;
  const uAreaTopMargin = 5;
  const totalDrawingHeight = 600; 
  const usableDrawHeight = totalDrawingHeight - headerHeight - uAreaTopMargin;
  const uHeight = usableDrawHeight / rackUnits;

  let adjustedData = Array.isArray(data) && data.length > 0
    ? data.map(item => {
        const rackValue = String(item.Rack || '1');
        let startU = parseInt(rackValue.match(/\d+/)?.[0] || 1, 10);
        const u = parseFloat(item.U) || 1;
        if (startU <= 0) startU = 1;
        return { ...item, Rack: startU, U: u };
      }).filter(item => item && item.BrandModel && item.BrandModel.trim() !== "" && item.Rack > 0 && item.U > 0)
    : [];

  const maxUoccupied = adjustedData.length > 0
    ? Math.max(0, ...adjustedData.map(item => item.Rack + item.U - 1))
    : 0;
  const isOverflownRack = maxUoccupied > rackUnits;

  const handleMouseEnter = (e, item) => {
    if (!position || !item) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const rawOwner = item.Owner || 'Bilinmiyor';
    const formattedOwner = rawOwner.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    const owner = formattedOwner.length > 25 ? formattedOwner.slice(0, 25) + '..' : formattedOwner;
    const serial = item.Serial || 'Bilinmiyor';
    const formattedSerial = serial.length > 25 ? serial.slice(0, 25) + '..' : serial;

    setTooltip({
      x: pointerPosition.x + 10,
      y: pointerPosition.y + 10,
      owner: owner,
      serial: formattedSerial,
      brandModel: item.BrandModel || 'Bilinmeyen Model'
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const formatProductName = (name, uValue) => {
    const formattedName = (name || 'Bilinmeyen Model').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    // drawableDeviceAreaWidth'e göre karakter sınırı daha dinamik olabilir, şimdilik sabit
    const maxLength = uValue === 1 ? 18 : (drawableDeviceAreaWidth < 130 ? 15 : (uValue === 2 ? 22 : 25));
    if (formattedName.length > maxLength) {
      return formattedName.slice(0, maxLength - 2) + '..';
    }
    return formattedName;
  };

  let labelActualX;
  if (labelAlignment === 'center') {
    labelActualX = frameWidth / 2;
  } else if (labelAlignment === 'right') {
    labelActualX = frameWidth;
  } else {
    labelActualX = 0;
  }

  const displayCabinetName = (cabinet && cabinet.trim() !== "") ? cabinet : "Kabin";

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable
      onDragMove={(e) => { if(handleDragMove) handleDragMove(e, gridSize); }}
      onDragEnd={(e) => { if(handleDragEnd) handleDragEnd(name, e); }}
      name={name}
    >
      {displayCabinetName && (
        <Text
          text={displayCabinetName}
          fontSize={14}
          fontStyle="bold"
          fill="#333"
          width={frameWidth}
          align={labelAlignment}
          x={labelActualX}
          offsetX={labelAlignment === 'center' ? frameWidth / 2 : (labelAlignment === 'right' ? frameWidth : 0)}
          y={headerHeight - (labelMargin || 0) - 18}
        />
      )}

      {/* Kabin Dış Çerçevesi */}
      <Rect x={0} y={headerHeight} width={frameWidth} height={usableDrawHeight + uAreaTopMargin} stroke="black" strokeWidth={1.5} fill="#F0F0F0" />
      
      {/* Kabin İç Alanı (cihazların ve U çizgilerinin olacağı yer) */}
      <Rect 
        x={deviceAreaStartX - (frameInternalPaddingX/2)} // U etiket alanından sonra başla
        y={headerHeight + uAreaTopMargin} 
        width={drawableDeviceAreaWidth + frameInternalPaddingX} // U etiketleri ve sağ boşluk hariç genişlik
        height={usableDrawHeight} 
        fill="#FFFFFF" // İç alan için farklı bir renk
        stroke="#E0E0E0"
        strokeWidth={0.5}
      />


      {/* U Numaralandırması ve Çizgileri */}
      {Array.from({ length: rackUnits }, (_, i) => {
        const uNumber = rackUnits - i; 
        const yPosition = headerHeight + uAreaTopMargin + i * uHeight;
        return (
          <React.Fragment key={`u-label-${uNumber}`}>
            <Text // U Etiketi
              x={uLabelAreaWidth - 18 > 0 ? uLabelAreaWidth - 18 : 2} // U etiket alanının solunda
              y={yPosition + (uHeight / 2) - 5}
              text={String(uNumber)}
              fontSize={8}
              fill="#444"
              align="right"
              width={15}
            />
            {/* U Ayırıcı Çizgi (Cihaz alanında) */}
            {(uNumber !== 1) && (
                 <Line
                    points={[deviceAreaStartX, yPosition, deviceAreaStartX + drawableDeviceAreaWidth, yPosition]}
                    stroke="#D0D0D0"
                    strokeWidth={0.5}
                 />
            )}
          </React.Fragment>
        );
      })}
       <Line // En alt U için çizgi (Cihaz alanında)
          points={[deviceAreaStartX, headerHeight + uAreaTopMargin + rackUnits * uHeight, deviceAreaStartX + drawableDeviceAreaWidth, headerHeight + uAreaTopMargin + rackUnits * uHeight]}
          stroke="#D0D0D0"
          strokeWidth={0.5}
       />

      {/* Cihazların Çizimi */}
      {adjustedData.length === 0 && !isOverflownRack ? (
        <Text
          x={deviceAreaStartX}
          y={headerHeight + uAreaTopMargin + usableDrawHeight / 2 - 10}
          text="Veri Yok"
          fontSize={14}
          fill="grey"
          width={drawableDeviceAreaWidth}
          align="center"
        />
      ) : isOverflownRack && adjustedData.length > 0 ? (
        <>
          <Rect // Taşan cihaz için kutu
            x={deviceAreaStartX}
            y={headerHeight + uAreaTopMargin}
            width={drawableDeviceAreaWidth}
            height={usableDrawHeight}
            fill="lightcoral"
            stroke="black"
            strokeWidth={1}
            onMouseEnter={(e) => handleMouseEnter(e, adjustedData[0])}
            onMouseLeave={handleMouseLeave}
          />
          <Text // Taşan cihaz için metin
            x={deviceAreaStartX}
            y={headerHeight + uAreaTopMargin + usableDrawHeight / 2 - 20}
            text={formatProductName(adjustedData[0]?.BrandModel, rackUnits)}
            fontSize={10}
            fill="black"
            width={drawableDeviceAreaWidth}
            align="center"
            verticalAlign="middle"
            padding={2}
            listening={false}
          />
          <Text // Taşan cihaz için uyarı
            x={deviceAreaStartX}
            y={headerHeight + uAreaTopMargin + usableDrawHeight / 2}
            text={`${rackUnits}U’dan Yüksek (${maxUoccupied}U)`}
            fontSize={9}
            fill="black"
            width={drawableDeviceAreaWidth}
            align="center"
            verticalAlign="middle"
            padding={2}
            listening={false}
          />
        </>
      ) : (
        adjustedData.map((item, index) => {
          const originalUSize = parseFloat(item.U) || 1;
          const startUNumber = parseInt(item.Rack, 10) || 1;
          let drawableUSize = originalUSize;
          let drawableStartUNumber = startUNumber;

          if (drawableStartUNumber + drawableUSize - 1 > rackUnits) {
            if (drawableStartUNumber > rackUnits) return null;
            drawableUSize = rackUnits - drawableStartUNumber + 1;
          }
          drawableUSize = Math.max(1, drawableUSize);

          const rectY = headerHeight + uAreaTopMargin + (drawableStartUNumber - 1) * uHeight;
          const rectHeight = drawableUSize * uHeight;
          const color = (item.Face && item.Face.toLowerCase() === 'arka') ? '#FFCDD2' : '#BBDEFB';

          return (
            <React.Fragment key={`${name}-device-${index}`}>
              <Rect // Cihaz kutusu
                x={deviceAreaStartX} // Cihazlar deviceAreaStartX'te başlar
                y={rectY}
                width={drawableDeviceAreaWidth} // Cihazlar drawableDeviceAreaWidth genişliğinde
                height={rectHeight - 0.5}
                fill={color}
                stroke="#78909C"
                strokeWidth={0.5}
                cornerRadius={1}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
              />
              <Text // Cihaz metni
                x={deviceAreaStartX} // Metin de deviceAreaStartX'te başlar
                y={rectY + rectHeight / 2 - (drawableUSize > 1 ? 6 : 5)}
                text={formatProductName(item.BrandModel, drawableUSize)}
                fontSize={drawableUSize > 2 ? 9 : (drawableUSize > 1 ? 8 : 7)}
                fill="#263238"
                width={drawableDeviceAreaWidth} // Metin de drawableDeviceAreaWidth genişliğinde
                align="center"
                verticalAlign="middle"
                padding={2} // Metin için iç boşluk
                listening={false}
              />
            </React.Fragment>
          );
        })
      )}

      {tooltip && (
        <Group x={tooltip.x} y={tooltip.y} listening={false}>
          <Rect
            width={Math.max(170, (tooltip.brandModel || "").length * 6 + 20)}
            height={65}
            fill="rgba(0, 0, 0, 0.88)"
            stroke="#B0BEC5"
            strokeWidth={0.5}
            cornerRadius={4}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.25}
            shadowOffsetX={1}
            shadowOffsetY={1}
          />
          <Text
            text={`${tooltip.brandModel || 'N/A'}`}
            fontSize={10}
            fontStyle="bold"
            fill="#FAFAFA"
            padding={7}
            width={Math.max(160, (tooltip.brandModel || "").length * 6 + 10)}
          />
          <Text
            text={`Owner: ${tooltip.owner || 'N/A'}`}
            fontSize={9}
            fill="#E0E0E0"
            padding={7}
            y={20}
            width={160}
            lineHeight={1.2}
          />
          <Text
            text={`Serial: ${tooltip.serial || 'N/A'}`}
            fontSize={9}
            fill="#E0E0E0"
            padding={7}
            y={35}
            width={160}
            lineHeight={1.2}
          />
        </Group>
      )}
    </Group>
  );
};

export default RackComponent;
