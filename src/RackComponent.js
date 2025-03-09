import React from 'react';
import { Group, Rect, Text, Line } from 'react-konva';

const RackComponent = ({ 
  cabinet, 
  data, 
  position, 
  handleDragMove, 
  handleDragEnd, 
  gridSize, 
  labelMargin, 
  labelAlignment 
}) => {
  const rackHeight = 42;
  const frameTop = 24;
  const frameBottom = 576;
  const innerHeight = frameBottom - frameTop;
  const uHeight = innerHeight / rackHeight;

  let adjustedData = Array.isArray(data) && data.length > 0
    ? data.map(item => {
        const rackValue = String(item.Rack || '1');
        let startU = parseInt(rackValue.match(/\d+/)?.[0] || 1);
        const u = parseFloat(item.U) || 1;

        if (startU === 0) startU = 1;
        return { ...item, Rack: startU };
      }).filter(item => item && item.Rack > 0 && item.Rack <= 50)
    : [];

  const maxU = adjustedData.length > 0
    ? Math.max(...adjustedData.map(item => item.Rack + (parseFloat(item.U) || 1) - 1))
    : rackHeight;

  const isFullRack = maxU > rackHeight;

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable
      onDragMove={handleDragMove}
      onDragEnd={(e) => handleDragEnd(cabinet, e)}
    >
      <Text
        text={cabinet}
        width={180}
        fontSize={16}
        align={labelAlignment}
        y={6 - labelMargin}
      />
      <Rect x={0} y={frameTop} width={180} height={innerHeight} stroke="black" strokeWidth={2} fill="transparent" />
      {Array.from({ length: rackHeight + 1 }, (_, i) => (
        <Line key={`line-${i}`} points={[20, frameTop + i * uHeight, 160, frameTop + i * uHeight]} stroke="#ccc" strokeWidth={1} />
      ))}
      {Array.from({ length: rackHeight }, (_, i) => (
        <Text key={`label-${i}`} x={5} y={frameTop + i * uHeight + uHeight / 2 - 6} text={String(rackHeight - i)} fontSize={10} fill="black" align="right" width={15} />
      ))}
      {adjustedData.length === 0 ? (
        <Text x={90} y={100} text="Veri Yok" fontSize={16} fill="black" align="center" />
      ) : isFullRack ? (
        <>
          <Rect x={20} y={frameTop} width={140} height={innerHeight} fill="yellow" stroke="black" strokeWidth={1} />
          <Text x={25} y={frameTop + innerHeight / 2 - 20} text={adjustedData[0]?.BrandModel || 'Bilinmeyen Model'} fontSize={9} fill="black" align="center" width={130} />
          <Text x={25} y={frameTop + innerHeight / 2} text={`42U’dan yüksek ${maxU}U`} fontSize={9} fill="black" align="center" width={130} />
        </>
      ) : (
        adjustedData.map((item, index) => {
          const rackValue = String(item.Rack);
          const startU = parseInt(rackValue);
          const u = parseFloat(item.U) || 1;
          const color = (item.Face && item.Face.toLowerCase() === 'arka') ? 'orange' : 'lightblue';

          const rectY = frameBottom - (startU - 1 + u) * uHeight;
          const rectHeight = u * uHeight;

          return (
            <React.Fragment key={index}>
              <Rect x={20} y={rectY} width={140} height={rectHeight} fill={color} stroke="black" strokeWidth={1} />
              <Text x={20} y={rectY + rectHeight / 2 - 6} text={item.BrandModel || 'Bilinmeyen Model'} fontSize={10} fill="black" align="center" width={140} />
            </React.Fragment>
          );
        })
      )}
    </Group>
  );
};

export default RackComponent;