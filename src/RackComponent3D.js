// src/RackComponent3D.js
import React, { useRef, useMemo } from 'react';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- Kullanıcının sağladığı yeni temel ölçüler ve ölçekleme faktörü ---
const BASE_U_HEIGHT = 0.0889; 
const BASE_RACK_INNER_WIDTH = 0.9652; 
const BASE_RACK_FRAME_SIDE_THICKNESS = 0.1;
const BASE_RACK_FRAME_DEPTH = 1.8;
const BASE_RACK_TOP_BOTTOM_THICKNESS = 0.1;
const BASE_DEVICE_DEFAULT_DEPTH = 1.4;
const BASE_U_NUMBER_FONT_SIZE = 0.06;
const BASE_CABINET_NAME_FONT_SIZE = 0.36;
const BASE_DEVICE_NAME_FONT_SIZE = 0.070; // Cihaz adı için temel font boyutu
const BASE_DEVICE_WARNING_FONT_SIZE = 0.045; // Cihaz uyarı metni için temel font boyutu

const CABINET_SCALE_FACTOR = 2.3; 
// --- Bitiş: Kullanıcının sağladığı yeni temel ölçüler ---

// --- Ölçeklenmiş Sabitler ---
const U_HEIGHT = BASE_U_HEIGHT * CABINET_SCALE_FACTOR;
const RACK_TOTAL_U = 42; 
const RACK_INNER_WIDTH = BASE_RACK_INNER_WIDTH * CABINET_SCALE_FACTOR;
const RACK_FRAME_SIDE_THICKNESS = BASE_RACK_FRAME_SIDE_THICKNESS * CABINET_SCALE_FACTOR;
const RACK_FRAME_DEPTH = BASE_RACK_FRAME_DEPTH * CABINET_SCALE_FACTOR;
const RACK_EFFECTIVE_WIDTH = RACK_INNER_WIDTH + 2 * RACK_FRAME_SIDE_THICKNESS;
const RACK_VERTICAL_POST_HEIGHT = RACK_TOTAL_U * U_HEIGHT;
const RACK_TOP_BOTTOM_THICKNESS = BASE_RACK_TOP_BOTTOM_THICKNESS * CABINET_SCALE_FACTOR;
const RACK_TOTAL_FRAME_HEIGHT = RACK_VERTICAL_POST_HEIGHT + 2 * RACK_TOP_BOTTOM_THICKNESS;

const DEVICE_DEFAULT_DEPTH = BASE_DEVICE_DEFAULT_DEPTH * CABINET_SCALE_FACTOR;
const DEVICE_FRONT_OFFSET = (RACK_FRAME_DEPTH / 2) - (DEVICE_DEFAULT_DEPTH / 2) - (0.02 * CABINET_SCALE_FACTOR);
const DEVICE_REAR_OFFSET = -(RACK_FRAME_DEPTH / 2) + (DEVICE_DEFAULT_DEPTH / 2) + (0.02 * CABINET_SCALE_FACTOR);

const U_NUMBER_OFFSET_X = -RACK_EFFECTIVE_WIDTH / 2 - (0.03 * CABINET_SCALE_FACTOR);
const U_NUMBER_FONT_SIZE = BASE_U_NUMBER_FONT_SIZE * Math.sqrt(CABINET_SCALE_FACTOR); 
const CABINET_NAME_FONT_SIZE = BASE_CABINET_NAME_FONT_SIZE * Math.sqrt(CABINET_SCALE_FACTOR);
const DEVICE_NAME_FONT_SIZE = BASE_DEVICE_NAME_FONT_SIZE * Math.sqrt(CABINET_SCALE_FACTOR);
const DEVICE_WARNING_FONT_SIZE = BASE_DEVICE_WARNING_FONT_SIZE * Math.sqrt(CABINET_SCALE_FACTOR);


const RackComponent3D = ({ cabinetName, devicesData, position }) => {
  const groupRef = useRef();
  const cabinetBaseY = -RACK_TOTAL_FRAME_HEIGHT / 2;

  // console.log(`[RackComponent3D - ${cabinetName}] Gelen devicesData:`, JSON.parse(JSON.stringify(devicesData || [])));

  const maxUoccupiedByData = Array.isArray(devicesData) 
    ? Math.max(0, ...devicesData.map(d => (parseFloat(d.U) || 0) + (parseInt(d.Rack, 10) || 1) - 1)) 
    : 0;
  const isOverflownGlobally = maxUoccupiedByData > RACK_TOTAL_U;

  // Materyaller
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#5D6D7E', 
    metalness: 0.1, // Metalikliği azalt
    roughness: 0.8  // Pürüzlülüğü artır (daha mat)
  }), []);
  const sidePostMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#34495E', 
    metalness: 0.2, // Metalikliği azalt
    roughness: 0.7  // Pürüzlülüğü artır
  }), []);
  const deviceFrontMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#81D4FA', metalness: 0.3, roughness: 0.6 }), []);
  const deviceRearMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFAB91', metalness: 0.3, roughness: 0.6 }), []);
  const textMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#212121', roughness: 0.8 }), []);
  const overflowDeviceMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'lightcoral', metalness: 0.3, roughness: 0.6 }), []);
  const warningTextMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red', roughness: 0.8 }), []);


  return (
    <group ref={groupRef} position={position}>
      <Text
        position={[0, RACK_TOTAL_FRAME_HEIGHT / 2 + (0.2 * CABINET_SCALE_FACTOR), 0]}
        fontSize={CABINET_NAME_FONT_SIZE}
        color="black" // Text için 'color' prop'u genellikle materyalden bağımsız çalışır
        anchorX="center"
        anchorY="middle"
        material={textMaterial} // Metin için ayrı bir mat materyal (isteğe bağlı)
      >
        {cabinetName}
      </Text>
      {isOverflownGlobally && (
        <Text
          position={[0, RACK_TOTAL_FRAME_HEIGHT / 2 + (0.1 * CABINET_SCALE_FACTOR), RACK_FRAME_DEPTH / 2 + 0.01]}
          fontSize={0.07 * Math.sqrt(CABINET_SCALE_FACTOR)}
          color="red"
          rotation={[-Math.PI / 6, 0, 0]}
          anchorX="center"
          material={warningTextMaterial}
        >
          {`Veri: ${maxUoccupiedByData}U (Kabin: ${RACK_TOTAL_U}U)`}
        </Text>
      )}

      {/* Kabin Çerçevesi */}
      <Box args={[RACK_FRAME_SIDE_THICKNESS, RACK_TOTAL_FRAME_HEIGHT, RACK_FRAME_DEPTH]} position={[-RACK_INNER_WIDTH / 2 - RACK_FRAME_SIDE_THICKNESS / 2, 0, 0]}>
        <primitive object={sidePostMaterial} attach="material" />
      </Box>
      <Box args={[RACK_FRAME_SIDE_THICKNESS, RACK_TOTAL_FRAME_HEIGHT, RACK_FRAME_DEPTH]} position={[RACK_INNER_WIDTH / 2 + RACK_FRAME_SIDE_THICKNESS / 2, 0, 0]}>
        <primitive object={sidePostMaterial} attach="material" />
      </Box>
      <Box args={[RACK_EFFECTIVE_WIDTH, RACK_TOP_BOTTOM_THICKNESS, RACK_FRAME_DEPTH]} position={[0, RACK_VERTICAL_POST_HEIGHT / 2 + RACK_TOP_BOTTOM_THICKNESS / 2, 0]}>
        <primitive object={frameMaterial} attach="material" />
      </Box>
      <Box args={[RACK_EFFECTIVE_WIDTH, RACK_TOP_BOTTOM_THICKNESS, RACK_FRAME_DEPTH]} position={[0, -RACK_VERTICAL_POST_HEIGHT / 2 - RACK_TOP_BOTTOM_THICKNESS / 2, 0]}>
        <primitive object={frameMaterial} attach="material" />
      </Box>

      {/* U Numaralandırması */}
      {Array.from({ length: RACK_TOTAL_U }, (_, i) => {
        const uNumber = i + 1;
        const uLabelY = cabinetBaseY + RACK_TOP_BOTTOM_THICKNESS + (uNumber -1) * U_HEIGHT + U_HEIGHT / 2;
        return (
          <Text
            key={`u-label-${uNumber}`}
            position={[U_NUMBER_OFFSET_X, uLabelY, RACK_FRAME_DEPTH / 2 + (0.01 * CABINET_SCALE_FACTOR)]}
            fontSize={U_NUMBER_FONT_SIZE}
            color="#333333"
            anchorX="right"
            anchorY="middle"
            material={textMaterial}
          >
            {String(uNumber)}
          </Text>
        );
      })}

      {/* Cihazların Render Edilmesi */}
      {Array.isArray(devicesData) && devicesData.map((device, index) => {
        const originalUSize = parseFloat(device.U);
        const originalStartUNumber = parseInt(device.Rack, 10);

        if (isNaN(originalUSize) || originalUSize <= 0 || isNaN(originalStartUNumber) || originalStartUNumber <= 0) {
          return null; 
        }
        
        let drawableStartUNumber = Math.max(1, originalStartUNumber);
        let drawableUSize = originalUSize;
        let deviceActuallyOverflown = false;

        if (drawableStartUNumber + drawableUSize - 1 > RACK_TOTAL_U) {
          if (drawableStartUNumber > RACK_TOTAL_U) {
            return null;
          }
          drawableUSize = RACK_TOTAL_U - drawableStartUNumber + 1;
          deviceActuallyOverflown = true;
        }
        drawableUSize = Math.max(1, drawableUSize);

        if (originalStartUNumber === 1 && originalUSize > RACK_TOTAL_U) {
            drawableStartUNumber = 1;
            drawableUSize = RACK_TOTAL_U;
            deviceActuallyOverflown = true;
        }

        const deviceCenterY = cabinetBaseY + RACK_TOP_BOTTOM_THICKNESS + (drawableStartUNumber - 1) * U_HEIGHT + (drawableUSize * U_HEIGHT / 2);
        const deviceZPosition = device.Face && device.Face.toLowerCase() === 'arka' 
          ? DEVICE_REAR_OFFSET 
          : DEVICE_FRONT_OFFSET;
        
        const currentDeviceMaterial = deviceActuallyOverflown
            ? overflowDeviceMaterial 
            : (device.Face && device.Face.toLowerCase() === 'arka' ? deviceRearMaterial : deviceFrontMaterial);

        const brandModelTextYOffset = 0; 
        const warningTextYOffset = -DEVICE_NAME_FONT_SIZE * 0.7; // Uyarıyı biraz daha aşağı al

        return (
          <group key={device.Serial || `device-${cabinetName}-${index}`} position={[0, deviceCenterY, deviceZPosition]}>
            <Box
              args={[RACK_INNER_WIDTH * 0.95, drawableUSize * U_HEIGHT, DEVICE_DEFAULT_DEPTH * 0.95]}
            >
              <primitive object={currentDeviceMaterial} attach="material" />
            </Box>
            <Text
              position={[0, brandModelTextYOffset, (DEVICE_DEFAULT_DEPTH * 0.95 / 2) + (0.011 * CABINET_SCALE_FACTOR) ]}
              fontSize={Math.min(DEVICE_NAME_FONT_SIZE, drawableUSize * U_HEIGHT * 0.3)}
              color="#1C2833"
              anchorX="center"
              anchorY="middle"
              maxWidth={RACK_INNER_WIDTH * 0.85}
              overflowWrap="break-word"
              whiteSpace="overflowWrap"
              material={textMaterial}
              lineHeight={0.8}
            >
              {device.BrandModel || "İsimsiz Cihaz"}
            </Text>
            {deviceActuallyOverflown && (
              <Text
                position={[0, warningTextYOffset, (DEVICE_DEFAULT_DEPTH * 0.95 / 2) + (0.012 * CABINET_SCALE_FACTOR) ]}
                fontSize={DEVICE_WARNING_FONT_SIZE}
                color="red"
                anchorX="center"
                anchorY="middle"
                material={warningTextMaterial}
              >
                {`(Veri: ${originalUSize}U)`}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default RackComponent3D;
