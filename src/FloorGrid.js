// src/FloorGrid.js
import React from 'react';
import { Line } from 'react-konva';

const FloorGrid = ({ width, height, tileSize }) => {
  const lines = [];

  // Dikey çizgiler
  for (let i = 0; i <= width / tileSize; i++) {
    lines.push(
      <Line
        key={`v_line_${i}`}
        points={[Math.round(i * tileSize) + 0.5, 0, Math.round(i * tileSize) + 0.5, height]}
        stroke="#e0e0e0" // Açık gri çizgi rengi
        strokeWidth={1}
      />
    );
  }

  // Yatay çizgiler
  for (let j = 0; j <= height / tileSize; j++) {
    lines.push(
      <Line
        key={`h_line_${j}`}
        points={[0, Math.round(j * tileSize) + 0.5, width, Math.round(j * tileSize) + 0.5]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  return <>{lines}</>;
};

export default FloorGrid;
