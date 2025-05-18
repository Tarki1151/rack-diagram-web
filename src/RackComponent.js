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
  if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined') {
    console.error(`[RackComponent] '${cabinet || name}' için pozisyon bilgisi eksik.`);
    return null;
  }

  // ... (önceki sabitleriniz: rackUnits, frameWidth, vb.) ...
  const rackUnits = 42;
  const frameWidth = 180;
  const deviceAreaWidth = 140;
  const deviceAreaPaddingX = (frameWidth - deviceAreaWidth) / 2;
  const uLabelAreaWidth = 25;
  const deviceDrawX = uLabelAreaWidth;
  const actualDeviceAreaWidth = frameWidth - uLabelAreaWidth - deviceAreaPaddingX;
  const headerHeight = 30;
  const footerHeight = 10;
  const uAreaTopMargin = 5;
  const totalFrameHeight = 600;
  const usableDrawHeight = totalFrameHeight - headerHeight - footerHeight - uAreaTopMargin;
  const uHeight = usableDrawHeight / rackUnits;

  const [tooltip, setTooltip] = useState(null);

  let adjustedData = Array.isArray(data) && data.length > 0
    ? data.map(item => {
        const rackValue = String(item.Rack || '1');
        let startU = parseInt(rackValue.match(/\d+/)?.[0] || 1, 10);
        const u = parseFloat(item.U) || 1;
        if (startU <= 0) startU = 1;
        if (startU > rackUnits) startU = rackUnits;
        return { ...item, Rack: startU, U: u };
      }).filter(item => item && item.Rack > 0 && item.U > 0)
    : [];

  const maxUoccupied = adjustedData.length > 0
    ? Math.max(...adjustedData.map(item => item.Rack + item.U - 1))
    : 0;
  const isOverflownRack = maxUoccupied > rackUnits;

  const handleMouseEnter = (e, item) => {
    // ... (önceki handleMouseEnter kodunuz) ...
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
      x: pointerPosition.x - position.x + 15,
      y: pointerPosition.y - position.y + 15,
      owner: owner,
      serial: formattedSerial,
      brandModel: item.BrandModel || 'Bilinmeyen Model'
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const formatProductName = (name, uValue) => {
    // ... (önceki formatProductName kodunuz) ...
    const formattedName = (name || 'Bilinmeyen Model').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    const maxLength = uValue === 1 ? 20 : (uValue === 2 ? 24 : 28);
    if (formattedName.length > maxLength) {
      return formattedName.slice(0, maxLength) + '..';
    }
    return formattedName;
  };

  let labelX;
  if (labelAlignment === 'center') {
    labelX = frameWidth / 2;
  } else if (labelAlignment === 'right') {
    labelX = frameWidth;
  } else {
    labelX = 0;
  }

  // Kabin adı boş veya sadece boşluk ise varsayılan bir değer ata veya null yap
  const displayCabinetName = (cabinet && cabinet.trim() !== "") ? cabinet : "Kabin"; // VEYA null

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable
      onDragMove={(e) => handleDragMove(e, gridSize)}
      onDragEnd={(e) => handleDragEnd(name, e)}
      name={name}
    >
      {/* Kabin Adı Etiketi - 78. satır civarı burası olabilir */}
      {displayCabinetName && ( // Sadece displayCabinetName geçerliyse Text'i render et
        <Text
          text={displayCabinetName} // Düzeltilmiş kabin adı
          fontSize={16}
          fontStyle="bold"
          fill="#333"
          width={frameWidth}
          align={labelAlignment}
          x={labelX}
          offsetX={labelAlignment === 'center' ? frameWidth / 2 : (labelAlignment === 'right' ? frameWidth : 0)}
          y={headerHeight - labelMargin - 20}
        />
      )}

      {/* Kabin Çerçevesi */}
      <Rect x={0} y={headerHeight} width={frameWidth} height={usableDrawHeight + uAreaTopMargin} stroke="black" strokeWidth={2} fill="#ECEFF1" />

      {/* U Numaralandırması Çizgileri ve Etiketleri */}
      {Array.from({ length: rackUnits }, (_, i) => {
        const uNumber = rackUnits - i;
        const yPosition = headerHeight + uAreaTopMargin + i * uHeight;
        // Metin içeriğinin boş olmadığından emin ol (String(uNumber) her zaman dolu olacaktır)
        return (
          <React.Fragment key={`u-label-${uNumber}`}>
            <Text
              x={uLabelAreaWidth - 18}
              y={yPosition + (uHeight / 2) - 6}
              text={String(uNumber)} // Bu her zaman dolu olacak
              fontSize={9}
              fill="#555"
              align="right"
              width={15}
            />
            {(uNumber !== 1) && (
                 <Line
                    points={[deviceDrawX, yPosition, deviceDrawX + actualDeviceAreaWidth, yPosition]}
                    stroke="#B0BEC5"
                    strokeWidth={0.5}
                 />
            )}
          </React.Fragment>
        );
      })}
       <Line
          points={[deviceDrawX, headerHeight + uAreaTopMargin + rackUnits * uHeight, deviceDrawX + actualDeviceAreaWidth, headerHeight + uAreaTopMargin + rackUnits * uHeight]}
          stroke="#B0BEC5"
          strokeWidth={0.5}
       />

      {/* Cihazların Çizimi */}
      {adjustedData.length === 0 && !isOverflownRack ? (
        <Text
          x={frameWidth / 2}
          y={headerHeight + uAreaTopMargin + usableDrawHeight / 2 - 10}
          text="Veri Yok" // Bu dolu
          fontSize={14}
          fill="grey"
          offsetX={frameWidth / 2 - deviceDrawX / 2 - actualDeviceAreaWidth / 2}
          width={actualDeviceAreaWidth}
          align="center"
        />
      ) : isOverflownRack && adjustedData.length > 0 ? (
        <>
          {/* ... (isOverflownRack Text bileşenleri, metinlerin dolu olduğundan emin olun) ... */}
           <Rect
            x={deviceDrawX}
            y={headerHeight + uAreaTopMargin}
            width={actualDeviceAreaWidth}
            height={usableDrawHeight}
            fill="lightcoral"
            stroke="black"
            strokeWidth={1}
            onMouseEnter={(e) => handleMouseEnter(e, adjustedData[0])}
            onMouseLeave={handleMouseLeave}
          />
          <Text
            x={deviceDrawX + 5}
            y={headerHeight + uAreaTopMargin + usableDrawHeight / 2 - 20}
            text={formatProductName(adjustedData[0]?.BrandModel, rackUnits)}
            fontSize={10}
            fill="black"
            width={actualDeviceAreaWidth - 10}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
          <Text
            x={deviceDrawX + 5}
            y={headerHeight + uAreaTopMargin + usableDrawHeight / 2}
            text={`${rackUnits}U’dan Yüksek (${maxUoccupied}U)`}
            fontSize={9}
            fill="black"
            width={actualDeviceAreaWidth - 10}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      ) : (
        adjustedData.map((item, index) => {
          // ... (cihaz Rect ve Text bileşenleri, metinlerin dolu olduğundan emin olun) ...
          const startU = item.Rack;
          const uSize = item.U;
          const rectY = headerHeight + uAreaTopMargin + (rackUnits - (startU + uSize -1)) * uHeight;
          const rectHeight = uSize * uHeight;

          if (rectY < headerHeight + uAreaTopMargin || (rectY + rectHeight) > (headerHeight + uAreaTopMargin + usableDrawHeight + 1) ) {
             console.warn(`[RackComponent] Cihaz '${item.BrandModel}' kabin sınırları dışında kalıyor. U:${startU}-${startU+uSize-1}`);
          }

          const color = (item.Face && item.Face.toLowerCase() === 'arka') ? '#FFAB91' : '#90CAF9';

          return (
            <React.Fragment key={`${name}-device-${index}`}>
              <Rect
                x={deviceDrawX}
                y={rectY}
                width={actualDeviceAreaWidth}
                height={rectHeight -1}
                fill={color}
                stroke="#546E7A"
                strokeWidth={0.5}
                cornerRadius={2}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
              />
              <Text
                x={deviceDrawX + 5}
                y={rectY + rectHeight / 2 - (uSize > 1 ? 7 : 6)}
                text={formatProductName(item.BrandModel, uSize)} // formatProductName zaten "Bilinmeyen Model" döndürüyor
                fontSize={uSize > 2 ? 10 : (uSize > 1 ? 9 : 8)}
                fill="#263238"
                width={actualDeviceAreaWidth - 10}
                align="center"
                verticalAlign="middle"
                padding={2}
                listening={false}
              />
            </React.Fragment>
          );
        })
      )}

      {/* Tooltip */}
      {tooltip && (
        <Group x={tooltip.x} y={tooltip.y} listening={false}>
          {/* ... (Tooltip Rect ve Text bileşenleri, metinlerin dolu olduğundan emin olun) ... */}
          <Rect
            width={Math.max(170, (tooltip.brandModel || "").length * 6 + 20)}
            height={65}
            fill="rgba(0, 0, 0, 0.88)"
            stroke="#78909C"
            strokeWidth={0.5}
            cornerRadius={6}
            shadowColor="black"
            shadowBlur={6}
            shadowOpacity={0.3}
            shadowOffsetX={2}
            shadowOffsetY={2}
          />
          <Text
            text={`${tooltip.brandModel || 'N/A'}`}
            fontSize={11}
            fontStyle="bold"
            fill="#E3F2FD"
            padding={8}
            width={Math.max(160, (tooltip.brandModel || "").length * 6 + 10)}
          />
          <Text
            text={`Owner: ${tooltip.owner || 'N/A'}`}
            fontSize={10}
            fill="#CFD8DC"
            padding={8}
            y={22}
            width={160}
            lineHeight={1.3}
          />
          <Text
            text={`Serial: ${tooltip.serial || 'N/A'}`}
            fontSize={10}
            fill="#CFD8DC"
            padding={8}
            y={38}
            width={160}
            lineHeight={1.3}
          />
        </Group>
      )}
    </Group>
  );
};

export default RackComponent;