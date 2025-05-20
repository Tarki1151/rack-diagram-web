// src/context/LayoutContext.js
import React, { createContext, useState, useCallback } from 'react';

// --- Ortak Dünya ve Kabin Boyutları (Metre Cinsinden) ---
const R3D_BASE_U_HEIGHT = 0.0889; 
const R3D_BASE_RACK_TOP_BOTTOM_THICKNESS = 0.1;
export const CABINET_SCALE_FACTOR_CTX = 2.3;
const R3D_RACK_TOTAL_U = 42;

const R3D_U_HEIGHT = R3D_BASE_U_HEIGHT * CABINET_SCALE_FACTOR_CTX;
const R3D_RACK_VERTICAL_POST_HEIGHT = R3D_RACK_TOTAL_U * R3D_U_HEIGHT;
const R3D_RACK_TOP_BOTTOM_THICKNESS = R3D_BASE_RACK_TOP_BOTTOM_THICKNESS * CABINET_SCALE_FACTOR_CTX;
export const RACK_TOTAL_FRAME_HEIGHT_3D = R3D_RACK_VERTICAL_POST_HEIGHT + 2 * R3D_RACK_TOP_BOTTOM_THICKNESS;

export const CABINET_FOOTPRINT_WIDTH_METERS = (0.9652 + 2 * 0.1) * CABINET_SCALE_FACTOR_CTX;
export const CABINET_FOOTPRINT_DEPTH_METERS = 1.8 * CABINET_SCALE_FACTOR_CTX;    

// --- 2D Yerleşim Düzenleyici Sabitleri ---
export const PIXELS_PER_METER_LAYOUT = 40; 

export const GRID_COLS_SLOTS = 10; 
export const GRID_ROWS_SLOTS = 10; 

export const CABINET_SLOT_WIDTH_PX = CABINET_FOOTPRINT_WIDTH_METERS * PIXELS_PER_METER_LAYOUT;
export const CABINET_SLOT_DEPTH_PX = CABINET_FOOTPRINT_DEPTH_METERS * PIXELS_PER_METER_LAYOUT;

export const STAGE_WIDTH_PIXELS = GRID_COLS_SLOTS * CABINET_SLOT_WIDTH_PX;
export const STAGE_HEIGHT_PIXELS = GRID_ROWS_SLOTS * CABINET_SLOT_DEPTH_PX;

export const WORLD_WIDTH_METERS_FOR_2D_GRID = GRID_COLS_SLOTS * CABINET_FOOTPRINT_WIDTH_METERS;
export const WORLD_DEPTH_METERS_FOR_2D_GRID = GRID_ROWS_SLOTS * CABINET_FOOTPRINT_DEPTH_METERS;


const LayoutContext = createContext();

const naturalSort = (a, b) => {
    const re = /(\d+)/g;
    const aParts = String(a).split(re);
    const bParts = String(b).split(re);
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        const aPart = aParts[i]; const bPart = bParts[i];
        if (i % 2 === 1) {
            const aNum = parseInt(aPart, 10); const bNum = parseInt(bPart, 10);
            if (aNum !== bNum) return aNum - bNum;
        } else {
            if (aPart !== bPart) return aPart.localeCompare(bPart);
        }
    }
    return aParts.length - bParts.length;
};

export const LayoutProvider = ({ children }) => {
  const [cabinets, setCabinets] = useState({}); 
  const [positions3D, setPositions3D] = useState({}); 
  const [positions2D, setPositions2D] = useState({}); 

  const loadCabinetsData = useCallback((dataFromExcel) => {
    const validData = dataFromExcel || {};
    setCabinets(validData);
    
    const cabinetNames = Object.keys(validData).sort(naturalSort);
    console.log('[LayoutContext] Sıralanmış Kabin İsimleri:', cabinetNames);

    const initialYPosition3D = RACK_TOTAL_FRAME_HEIGHT_3D / 2;
    const cabinetWidthFor3DLayout = CABINET_FOOTPRINT_WIDTH_METERS;
    const spacingFor3DLayout = 0; 

    const new3DPositions = {};
    const new2DPositions = {};

    const totalLayoutWidth3D = (cabinetNames.length * cabinetWidthFor3DLayout);
    const firstCabinetX3D = -totalLayoutWidth3D / 2 + cabinetWidthFor3DLayout / 2;

    cabinetNames.forEach((name, i) => {
      const x3D = firstCabinetX3D + i * cabinetWidthFor3DLayout;
      const z3D = 0; 
      new3DPositions[name] = { x: x3D, y: initialYPosition3D, z: z3D };

      const cabinetTopLeftX_Meters_from_3D_center = x3D - (CABINET_FOOTPRINT_WIDTH_METERS / 2);
      const cabinetTopLeftZ_Meters_from_3D_center = z3D - (CABINET_FOOTPRINT_DEPTH_METERS / 2);

      const xPx = (cabinetTopLeftX_Meters_from_3D_center + WORLD_WIDTH_METERS_FOR_2D_GRID / 2) * PIXELS_PER_METER_LAYOUT;
      const yPx = (cabinetTopLeftZ_Meters_from_3D_center + WORLD_DEPTH_METERS_FOR_2D_GRID / 2) * PIXELS_PER_METER_LAYOUT;
      
      // Başlangıç pozisyonlarının geçerli olduğundan emin ol
      new2DPositions[name] = { 
        xPx: (typeof xPx === 'number' && !isNaN(xPx)) ? xPx : 0,
        yPx: (typeof yPx === 'number' && !isNaN(yPx)) ? yPx : 0
      };
    });

    setPositions3D(new3DPositions);
    setPositions2D(new2DPositions);
    console.log('[LayoutContext] Kabin verisi yüklendi. 2D Poz:', new2DPositions, '3D Poz:', new3DPositions);
  }, []);

  const update2DPosition = useCallback((cabinetName, newPikselPos) => {
    // Gelen pozisyon değerlerinin geçerli sayılar olduğundan emin ol
    if (newPikselPos && typeof newPikselPos.x === 'number' && !isNaN(newPikselPos.x) &&
        typeof newPikselPos.y === 'number' && !isNaN(newPikselPos.y)) {
      setPositions2D(prev => ({
        ...prev,
        [cabinetName]: { xPx: newPikselPos.x, yPx: newPikselPos.y },
      }));
    } else {
      console.error(`[LayoutContext] update2DPosition: Kabin '${cabinetName}' için geçersiz pozisyon değerleri alındı:`, newPikselPos);
    }
  }, []);

  const apply2DLayoutTo3D = useCallback((navigateFunction) => {
    const new3DPositions = {};
        
    const sortedCabinetNames = Object.keys(cabinets).sort(naturalSort);

    sortedCabinetNames.forEach(name => {
      const pos2D = positions2D[name];
      // Pozisyonun ve içindeki xPx, yPx değerlerinin geçerli olduğundan emin ol
      if (!pos2D || typeof pos2D.xPx !== 'number' || isNaN(pos2D.xPx) || 
          typeof pos2D.yPx !== 'number' || isNaN(pos2D.yPx)) {
        console.warn(`[LayoutContext] apply2DLayoutTo3D: Kabin '${name}' için geçersiz veya eksik 2D pozisyon, 3D'ye aktarılmayacak. Pozisyon:`, pos2D);
        // Hata durumunda bu kabin için eski 3D pozisyonunu koruyabilir veya varsayılan bir değere atayabilirsiniz.
        // Şimdilik, bu kabini yeni 3D pozisyonlarına dahil etmeyelim.
        // Veya, eğer eski 3D pozisyonu varsa onu koru:
        // if (positions3D[name]) {
        //   new3DPositions[name] = positions3D[name];
        // }
        return; 
      }

      const cabinetTopLeftXPx = pos2D.xPx;
      const cabinetTopLeftYPx = pos2D.yPx;
      const cabinetTopLeftX_Meters = (cabinetTopLeftXPx / PIXELS_PER_METER_LAYOUT);
      const cabinetTopLeftZ_Meters = (cabinetTopLeftYPx / PIXELS_PER_METER_LAYOUT);
      
      const worldX = cabinetTopLeftX_Meters + (CABINET_FOOTPRINT_WIDTH_METERS / 2) - (WORLD_WIDTH_METERS_FOR_2D_GRID / 2);
      const worldZ = cabinetTopLeftZ_Meters + (CABINET_FOOTPRINT_DEPTH_METERS / 2) - (WORLD_DEPTH_METERS_FOR_2D_GRID / 2);
      
      new3DPositions[name] = {
        x: worldX,
        y: RACK_TOTAL_FRAME_HEIGHT_3D / 2,
        z: worldZ,
      };
    });
    setPositions3D(new3DPositions);
    console.log('[LayoutContext] 2D yerleşim 3D pozisyonlara uygulandı:', new3DPositions);
    if (navigateFunction && typeof navigateFunction === 'function') {
      navigateFunction('/app');
    }
  }, [positions2D, cabinets, positions3D]); // positions3D eklendi, eski pozisyonu koruma senaryosu için


  const value = {
    cabinets,
    positions3D,
    positions2D,
    loadCabinetsData,
    update2DPosition,
    apply2DLayoutTo3D,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutContext;
