// src/Cabinet2DView.js
import React from 'react';
import { Rect, Text, Group } from 'react-konva';

const Cabinet2DView = React.memo(({ 
    cabinetName, 
    x,
    y,
    cabinetWidthMeters,  // Kabinin gerçek dünya genişliği
    cabinetDepthMeters,  // Kabinin gerçek dünya derinliği
    pixelsPerMeter,      // 1 metrenin kaç piksel olduğu
    currentStageScale,
    onDragEnd 
}) => {

  // Kabinin 2D canvas üzerindeki piksel boyutları (artık ızgara slotu boyutunda)
  const cabinetWidthPx = cabinetWidthMeters * pixelsPerMeter;
  const cabinetDepthPx = cabinetDepthMeters * pixelsPerMeter;

  const strokeWidth = Math.max(0.5, 1.5 / (currentStageScale || 1)); 
  const cornerRadius = Math.max(1, 3 / (currentStageScale || 1));
  const padding = Math.max(1, 4 / (currentStageScale || 1));
  const displayName = (typeof cabinetName === 'string' && cabinetName.trim() !== "") ? cabinetName : "İsimsiz";
  const baseFontSize = Math.max(8, Math.min(12, cabinetWidthPx / ((displayName).length * 0.5 + 6), cabinetDepthPx * 0.2));
  const fontSize = Math.max(6 / (currentStageScale || 1), baseFontSize / (currentStageScale || 1) * 0.8 );

  return (
    <Group
      x={x}
      y={y}
      width={cabinetWidthPx}
      height={cabinetDepthPx}
      draggable
      onDragEnd={onDragEnd}
      name="cabinet-group" 
    >
      <Rect
        width={cabinetWidthPx} // Kabin slotu kadar çiz
        height={cabinetDepthPx} // Kabin slotu kadar çiz
        fill="#C8E6C9" // Daha açık bir yeşil
        stroke="#66BB6A"
        strokeWidth={strokeWidth}
        cornerRadius={cornerRadius}
      />
      <Text
        text={displayName}
        fontSize={fontSize}
        fill="#2E7D32"
        width={cabinetWidthPx}
        height={cabinetDepthPx}
        align="center"
        verticalAlign="middle"
        padding={padding}
        listening={false}
        wrap="none"
        ellipsis={true}
      />
    </Group>
  );
});

export default Cabinet2DView;
