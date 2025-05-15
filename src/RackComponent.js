import React, { useState } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';

const RackComponent = ({
  cabinet, // Kabin adı (etiket için)
  name,    // Konva tarafından e.target.name() için kullanılacak (MainApp'ten cabinetName olarak geliyor)
  data,
  position, // { x: number, y: number } formatında beklenen pozisyon
  handleDragMove,
  handleDragEnd,
  gridSize, // MainApp'ten gelen gridSize prop'u
  labelMargin,
  labelAlignment
}) => {
  // 1. Position prop'u için kontrol
  if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined') {
    // Pozisyon bilgisi yoksa veya geçersizse, bu bileşeni render etme veya bir uyarı göster
    console.error(`RackComponent: '${cabinet}' için pozisyon bilgisi (x, y) eksik veya geçersiz. Alınan pozisyon:`, position);
    return null; // Veya <Text text="Pozisyon hatası" x={0} y={0} />;
  }

  const rackHeight = 42; // Standart U yüksekliği
  const frameWidth = 180;
  const deviceAreaWidth = 140; // Cihazların çizileceği alanın genişliği
  const deviceAreaX = (frameWidth - deviceAreaWidth) / 2; // Cihaz alanının x başlangıcı (ortalamak için)

  const frameTop = 24;    // Kabin çerçevesinin üst boşluğu (U etiketleri için)
  const frameBottom = 576; // Kabin çerçevesinin alt sınırı (frameTop + innerHeight)
  const innerHeight = frameBottom - frameTop; // Kabinin iç yüksekliği (U'ların yerleşeceği alan)
  const uHeight = innerHeight / rackHeight; // Bir U'nun piksel yüksekliği

  const [tooltip, setTooltip] = useState(null);

  // Veri gelmemişse veya boşsa, "Veri Yok" göster
  let adjustedData = Array.isArray(data) && data.length > 0
    ? data.map(item => {
        const rackValue = String(item.Rack || '1'); // item.Rack null/undefined ise '1' kabul et
        let startU = parseInt(rackValue.match(/\d+/)?.[0] || 1, 10); // Sayıyı al, bulamazsa 1
        const u = parseFloat(item.U) || 1; // item.U null/undefined veya geçersizse 1 kabul et

        if (startU === 0) startU = 1; // 0 U diye bir şey olmaz, 1'den başlasın
        return { ...item, Rack: startU, U: u }; // U değerini de sayısal yap
      }).filter(item => item && item.Rack > 0 && item.Rack <= 50) // Geçerli U aralığı
    : [];

  const maxU = adjustedData.length > 0
    ? Math.max(...adjustedData.map(item => item.Rack + item.U - 1))
    : rackHeight;

  const isFullRack = maxU > rackHeight;

  const handleMouseEnter = (e, item) => {
    if (!position) return; // position yoksa tooltip gösterme
    const stage = e.target.getStage();
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const rawOwner = item.Owner || 'Bilinmiyor';
    // Her kelimenin baş harfini büyük yap
    const formattedOwner = rawOwner.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    const owner = formattedOwner.length > 20 ? formattedOwner.slice(0, 20) + '..' : formattedOwner; // Uzunsa kısalt

    const serial = item.Serial || 'Bilinmiyor';
    const formattedSerial = serial.length > 20 ? serial.slice(0, 20) + '..' : serial;


    setTooltip({
      x: pointerPosition.x - position.x + 10, // Tooltip'i imlecin biraz sağına al
      y: pointerPosition.y - position.y + 10, // Tooltip'i imlecin biraz altına al
      owner: owner,
      serial: formattedSerial
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const formatProductName = (name, uValue) => {
    const formattedName = (name || 'Bilinmeyen Model').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    // Karakter sınırı, cihazın U yüksekliğine ve genel okunabilirliğe göre ayarlanabilir.
    const maxLength = uValue === 1 ? 22 : (uValue === 2 ? 25 : 30); // Örnek karakter sınırları
    if (formattedName.length > maxLength) {
      return formattedName.slice(0, maxLength) + '..';
    }
    return formattedName;
  };

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable
      onDragMove={(e) => handleDragMove(e, gridSize)} // gridSize prop'unu doğrudan kullan
      onDragEnd={(e) => handleDragEnd(name, e)} // 'name' prop'u (yani cabinetName) ile çağır
      name={name} // Konva'nın e.target.name() için kullanacağı
    >
      {/* Kabin Adı Etiketi */}
      <Text
        text={cabinet}
        fontSize={16}
        fontStyle="bold"
        fill="black"
        width={frameWidth}
        align={labelAlignment} // 'left', 'center', 'right'
        y={frameTop - labelMargin - 18} // labelMargin'e göre ayarla, 18 yaklaşık font boyutu
        offsetX={labelAlignment === 'center' ? frameWidth / 2 : (labelAlignment === 'right' ? frameWidth : 0)}
        x={labelAlignment === 'center' ? frameWidth / 2 : (labelAlignment === 'right' ? frameWidth : 0)}
      />

      {/* Kabin Çerçevesi */}
      <Rect x={0} y={frameTop} width={frameWidth} height={innerHeight} stroke="black" strokeWidth={2} fill="#f9f9f9" />

      {/* U Numaralandırması Çizgileri ve Etiketleri */}
      {Array.from({ length: rackHeight }, (_, i) => {
        const currentU = rackHeight - i;
        const yPos = frameTop + i * uHeight;
        return (
          <React.Fragment key={`u-line-label-${currentU}`}>
            <Line
              points={[deviceAreaX, yPos, deviceAreaX + deviceAreaWidth, yPos]}
              stroke="#ccc"
              strokeWidth={0.5}
            />
            <Text
              x={deviceAreaX - 15 > 0 ? deviceAreaX - 15 : 2} // Sol kenara çok yakın olmasın
              y={yPos + uHeight / 2 - 6}
              text={String(currentU)}
              fontSize={10}
              fill="black"
              align="right"
              width={12}
            />
          </React.Fragment>
        );
      })}
      {/* Son U çizgisi (en alt) */}
      <Line
        points={[deviceAreaX, frameTop + rackHeight * uHeight, deviceAreaX + deviceAreaWidth, frameTop + rackHeight * uHeight]}
        stroke="#ccc"
        strokeWidth={0.5}
      />


      {/* Cihazların Çizimi */}
      {adjustedData.length === 0 && !isFullRack ? (
        <Text x={frameWidth / 2 - 30} y={frameTop + innerHeight / 2 - 10} text="Veri Yok" fontSize={14} fill="grey" />
      ) : isFullRack ? (
        <>
          <Rect
            x={deviceAreaX}
            y={frameTop}
            width={deviceAreaWidth}
            height={innerHeight}
            fill="lightcoral" // Dolu rack için farklı renk
            stroke="black"
            strokeWidth={1}
            onMouseEnter={(e) => handleMouseEnter(e, adjustedData[0])} // İlk item'ı temsilci olarak kullan
            onMouseLeave={handleMouseLeave}
          />
          <Text
            x={deviceAreaX + 5}
            y={frameTop + innerHeight / 2 - 20}
            text={formatProductName(adjustedData[0]?.BrandModel, rackHeight)} // rackHeight'i U değeri gibi kullan
            fontSize={9}
            fill="black"
            width={deviceAreaWidth - 10}
            align="center"
            verticalAlign="middle"
          />
          <Text
            x={deviceAreaX + 5}
            y={frameTop + innerHeight / 2}
            text={`42U’dan yüksek (${maxU}U)`}
            fontSize={9}
            fill="black"
            width={deviceAreaWidth - 10}
            align="center"
            verticalAlign="middle"
          />
        </>
      ) : (
        adjustedData.map((item, index) => {
          const startU = item.Rack; // Zaten sayısal ve ayarlanmış
          const u = item.U;         // Zaten sayısal ve ayarlanmış

          const color = (item.Face && item.Face.toLowerCase() === 'arka') ? 'orange' : 'lightblue';

          // Y pozisyonu hesaplaması: U numaraları yukarıdan aşağıya artar (1 en üstte),
          // ancak çizim koordinatları yukarıdan aşağıya artar.
          // Bu nedenle (rackHeight - (startU + u - 1)) U'nun tepesini verir.
          const rectY = frameTop + (rackHeight - (startU + u - 1)) * uHeight;
          const rectHeight = u * uHeight;

          return (
            <React.Fragment key={index}>
              <Rect
                x={deviceAreaX}
                y={rectY}
                width={deviceAreaWidth}
                height={rectHeight}
                fill={color}
                stroke="black"
                strokeWidth={1}
                cornerRadius={2}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
              />
              <Text
                x={deviceAreaX + 5} // İçeriden biraz boşluk
                y={rectY + rectHeight / 2 - 6} // Metni dikeyde ortala
                text={formatProductName(item.BrandModel, u)}
                fontSize={u > 1 ? 10 : 9} // 1U için daha küçük font
                fill="black"
                width={deviceAreaWidth - 10} // İçeriden biraz boşluk
                align="center"
                verticalAlign="middle"
                padding={2}
                listening={false} // Metinlerin mouse event'lerini almasını engelle (Rect alsın)
              />
            </React.Fragment>
          );
        })
      )}

      {/* Tooltip */}
      {tooltip && (
        <Group x={tooltip.x} y={tooltip.y}>
          <Rect
            width={160} // Biraz daha geniş
            height={50} // Biraz daha yüksek
            fill="rgba(0, 0, 0, 0.85)"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={0.5}
            cornerRadius={5}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.3}
          />
          <Text
            text={`Owner: ${tooltip.owner}`}
            fontSize={11}
            fill="white"
            padding={8}
            width={150} // İçerik için genişlik
            lineHeight={1.4}
          />
          <Text
            text={`Serial: ${tooltip.serial}`}
            fontSize={11}
            fill="white"
            padding={8}
            y={22} // İkinci satır için y pozisyonu
            width={150}
            lineHeight={1.4}
          />
        </Group>
      )}
    </Group>
  );
};

export default RackComponent;