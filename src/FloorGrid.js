// src/FloorGrid.js
import React from 'react';
import { Line } from 'react-konva';

const FloorGrid = ({ width, height, tileWidth, tileHeight }) => { // tileSize yerine tileWidth ve tileHeight
  const lines = [];

  // Dikey çizgiler (Kabin genişliğine göre)
  if (tileWidth > 0) {
    for (let i = 0; i <= width / tileWidth; i++) {
      lines.push(
        <Line
          key={`v_line_slot_${i}`}
          points={[Math.round(i * tileWidth) + 0.5, 0, Math.round(i * tileWidth) + 0.5, height]}
          stroke="#cccccc" // Biraz daha koyu gri
          strokeWidth={0.5} // Daha ince çizgiler
        />
      );
    }
  }

  // Yatay çizgiler (Kabin derinliğine göre)
  if (tileHeight > 0) {
    for (let j = 0; j <= height / tileHeight; j++) {
      lines.push(
        <Line
          key={`h_line_slot_${j}`}
          points={[0, Math.round(j * tileHeight) + 0.5, width, Math.round(j * tileHeight) + 0.5]}
          stroke="#cccccc"
          strokeWidth={0.5}
        />
      );
    }
  }

  return <>{lines}</>;
};

export default FloorGrid;
