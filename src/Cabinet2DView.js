// src/Cabinet2DView.js
import React from 'react';
import { Rect, Text, Group } from 'react-konva';

const Cabinet2DView = ({ 
    cabinetName, 
    x,  // Piksel cinsinden pozisyon
    y,  // Piksel cinsinden pozisyon
    cabinetWidthMeters, 
    cabinetDepthMeters, 
    realWorldTileSizeMeters, 
    tileSizePixels, 
    onDragEnd 
}) => {

  // Kabinin piksel cinsinden boyutlarını hesapla
  const cabinetWidthPx = (cabinetWidthMeters / realWorldTileSizeMeters) * tileSizePixels;
  const cabinetDepthPx = (cabinetDepthMeters / realWorldTileSizeMeters) * tileSizePixels;

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={handleDragEnd}
      width={cabinetWidthPx}
      height={cabinetDepthPx}
    >
      <Rect
        width={cabinetWidthPx}
        height={cabinetDepthPx}
        fill="#A5D6A7" // Açık yeşil renk
        stroke="#388E3C" // Koyu yeşil kenarlık
        strokeWidth={2}
        cornerRadius={4}
      />
      <Text
        text={cabinetName}
        fontSize={Math.min(12, cabinetWidthPx / (cabinetName.length * 0.6 || 1) )} // Dinamik font boyutu
        fill="#1B5E20"
        width={cabinetWidthPx}
        height={cabinetDepthPx}
        align="center"
        verticalAlign="middle"
        padding={5}
        listening={false} // Metin sürüklemeyi engelle
      />
    </Group>
  );
};

export default Cabinet2DView;
