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
  labelAlignment,
  onDeviceColorUpdate
}) => {
  const [tooltip, setTooltip] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [colorPalettePosition, setColorPalettePosition] = useState({ x: 0, y: 0 });

  // 32 renk paleti
  const colorPalette = [
    '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2',
    '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC',
    '#D7CCC8', '#F5F5F5', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A',
    '#455A64', '#37474F', '#263238', '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'
  ];

  if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined') {
    console.error(`[RackComponent 2D] '${cabinet || name}' için pozisyon bilgisi (x, y) eksik veya geçersiz. Alınan pozisyon:`, position);
    return null;
  }

  const rackUnits = 42;
  const frameWidth = 180;
  const uLabelAreaWidth = 20; 
  const frameInternalPaddingX = 10;
  const drawableDeviceAreaWidth = frameWidth - uLabelAreaWidth - frameInternalPaddingX; 
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
    
    // Tooltip'i fare imlecinin yanında göster, 200px sola kaydır
    setTooltip({
      x: pointerPosition.x - 200,
      y: pointerPosition.y,
      owner: owner,
      serial: formattedSerial,
      brandModel: item.BrandModel || 'Bilinmeyen Model'
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleDeviceClick = (e, item) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    setSelectedDevice(item);
    setColorPalettePosition({
      x: pointerPosition.x - 200, // 200px sola kaydır
      y: pointerPosition.y
    });
    setShowColorPalette(true);
  };

  const handleColorSelect = (color) => {
    if (selectedDevice) {
      // Seçilen cihazın rengini güncelle
      const updatedData = data.map(item => {
        if (item.Serial === selectedDevice.Serial) {
          return { ...item, customColor: color };
        }
        return item;
      });
      // Callback ile üst bileşene bildir
      if (onDeviceColorUpdate) {
        onDeviceColorUpdate(updatedData);
      }
      setShowColorPalette(false);
      setSelectedDevice(null);
    }
  };

  const formatProductName = (name, uValue) => {
    const formattedName = (name || 'Bilinmeyen Model').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
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
          name="cabinetTitle"
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
      <Rect 
        name="cabinetFrameOuter" 
        x={0} y={headerHeight} width={frameWidth} height={usableDrawHeight + uAreaTopMargin} 
        stroke="black" strokeWidth={1.5} fill="#F0F0F0" 
      />
      <Rect 
        name="cabinetFrameInner"
        x={deviceAreaStartX - (frameInternalPaddingX/2)}
        y={headerHeight + uAreaTopMargin} 
        width={drawableDeviceAreaWidth + frameInternalPaddingX}
        height={usableDrawHeight} 
        fill="#FFFFFF"
        stroke="#E0E0E0"
        strokeWidth={0.5}
      />
      {Array.from({ length: rackUnits }, (_, i) => {
        const uNumber = rackUnits - i; 
        const yPosition = headerHeight + uAreaTopMargin + i * uHeight;
        return (
          <React.Fragment key={`u-label-frag-${uNumber}`}>
            <Text 
              name={`uLabel_${uNumber}`}
              x={uLabelAreaWidth - 18 > 0 ? uLabelAreaWidth - 18 : 2}
              y={yPosition + (uHeight / 2) - 5}
              text={String(uNumber)}
              fontSize={8} fill="#444" align="right" width={15}
            />
            {(uNumber !== 1) && (
                 <Line
                    name={`uLine_${uNumber}`}
                    points={[deviceAreaStartX, yPosition, deviceAreaStartX + drawableDeviceAreaWidth, yPosition]}
                    stroke="#D0D0D0" strokeWidth={0.5}
                 />
            )}
          </React.Fragment>
        );
      })}
       <Line
          name="uLine_bottom"
          points={[deviceAreaStartX, headerHeight + uAreaTopMargin + rackUnits * uHeight, deviceAreaStartX + drawableDeviceAreaWidth, headerHeight + uAreaTopMargin + rackUnits * uHeight]}
          stroke="#D0D0D0" strokeWidth={0.5}
       />
      {adjustedData.length === 0 && !isOverflownRack ? (
        <Text
          name="noDataText"
          x={deviceAreaStartX} y={headerHeight + uAreaTopMargin + usableDrawHeight / 2 - 10}
          text="Veri Yok" fontSize={14} fill="grey" width={drawableDeviceAreaWidth} align="center"
        />
      ) : isOverflownRack && adjustedData.length > 0 ? (
        <Group name="overflownDeviceGroup">
          <Rect
            name="overflownDeviceRect"
            x={deviceAreaStartX} y={headerHeight + uAreaTopMargin}
            width={drawableDeviceAreaWidth} height={usableDrawHeight}
            fill="lightcoral" stroke="black" strokeWidth={1}
            onMouseEnter={(e) => handleMouseEnter(e, adjustedData[0])}
            onMouseLeave={handleMouseLeave}
          />
          <Text
            name="overflownDeviceBrandModel"
            x={deviceAreaStartX} y={headerHeight + uAreaTopMargin + usableDrawHeight / 2 - 20}
            text={formatProductName(adjustedData[0]?.BrandModel, rackUnits)}
            fontSize={10} fill="black" width={drawableDeviceAreaWidth}
            align="center" verticalAlign="middle" padding={2} listening={false}
          />
          <Text
            name="overflownDeviceWarning"
            x={deviceAreaStartX} y={headerHeight + uAreaTopMargin + usableDrawHeight / 2}
            text={`${rackUnits}U'dan Yüksek (${maxUoccupied}U)`}
            fontSize={9} fill="black" width={drawableDeviceAreaWidth}
            align="center" verticalAlign="middle" padding={2} listening={false}
          />
        </Group>
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
          const defaultColor = (item.Face && item.Face.toLowerCase() === 'arka') ? '#FFCDD2' : '#BBDEFB';
          const color = item.customColor || defaultColor;
          const deviceKey = item.Serial || `device-${index}`;

          return (
            <Group key={`deviceGroup_${deviceKey}`} name={`deviceGroup_${deviceKey}`}>
              <Rect
                name={`deviceRect_${deviceKey}`}
                x={deviceAreaStartX} y={rectY}
                width={drawableDeviceAreaWidth} height={rectHeight - 0.5}
                fill={color} stroke="#78909C" strokeWidth={0.5} cornerRadius={1}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => handleDeviceClick(e, item)}
              />
              <Text
                name={`deviceText_${deviceKey}`}
                x={deviceAreaStartX} y={rectY + rectHeight / 2 - (drawableUSize > 1 ? 6 : 5)}
                text={formatProductName(item.BrandModel, drawableUSize)}
                fontSize={drawableUSize > 2 ? 9 : (drawableUSize > 1 ? 8 : 7)}
                fill="#263238" width={drawableDeviceAreaWidth}
                align="center" verticalAlign="middle" padding={2} listening={false}
              />
            </Group>
          );
        })
      )}

      {/* Tooltip - En üstte gösterilecek */}
      {tooltip && (
        <Group x={tooltip.x} y={tooltip.y} listening={false} globalCompositeOperation="source-over" zIndex={1000}>
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
          />
          <Text
            text={`Sahip: ${tooltip.owner}`}
            fontSize={9}
            fill="#E0E0E0"
            padding={7}
            y={20}
          />
          <Text
            text={`Seri No: ${tooltip.serial}`}
            fontSize={9}
            fill="#E0E0E0"
            padding={7}
            y={35}
          />
        </Group>
      )}

      {/* Renk Paleti - En üstte gösterilecek */}
      {showColorPalette && (
        <Group x={colorPalettePosition.x} y={colorPalettePosition.y} globalCompositeOperation="source-over" zIndex={1000}>
          <Rect
            width={200}
            height={160}
            fill="white"
            stroke="#B0BEC5"
            strokeWidth={1}
            cornerRadius={4}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.25}
            shadowOffsetX={1}
            shadowOffsetY={1}
          />
          {colorPalette.map((color, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            return (
              <Rect
                key={`color-${index}`}
                x={10 + col * 22}
                y={10 + row * 22}
                width={20}
                height={20}
                fill={color}
                stroke="#B0BEC5"
                strokeWidth={0.5}
                cornerRadius={2}
                onClick={() => handleColorSelect(color)}
                onMouseEnter={(e) => {
                  e.target.getStage().container().style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  e.target.getStage().container().style.cursor = 'default';
                }}
              />
            );
          })}
        </Group>
      )}
    </Group>
  );
};

export default RackComponent;