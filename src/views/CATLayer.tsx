// CATLayer.tsx - 晴空颠簸区图层
import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ---- 配置 ----
const DATA_URL = 'https://arvis.oss-cn-chengdu.aliyuncs.com/current-CAT-surface-level-gfs-1.0.json';

// ---- 类型 ----
type GribHeader = {
  nx?: number; ny?: number;
  lo1?: number; lo2?: number; la1?: number; la2?: number;
  dx?: number; dy?: number;
  numberPoints?: number;
  parameterNumber?: number;
};

type GribData = {
  header: GribHeader;
  data: number[];
};

// 颠簸场
type CATField = {
  interpolate: (lon: number, lat: number) => number | null; // 返回颠簸指数 0-1
  minTurbulence: number;
  maxTurbulence: number;
};

// ---- 参数编号 ----
const PARAM = {
  TMP: 0,  // Temperature
  UGRD: 2, // U-component_of_wind
  VGRD: 3, // V-component_of_wind
  VVEL: 8, // Vertical_velocity
};

// 工具函数：clamp
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 工具函数：归一化（将值映射到 0-1）
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

// ---- 帮助函数：构建颠簸场 ----
function buildCATFieldFromGrib(gribArray: GribData[]): CATField | null {
  if (!gribArray || gribArray.length < 4) return null;

  // 找到各个参数
  const tmpItem = gribArray.find(a => a.header.parameterNumber === PARAM.TMP);
  const uItem = gribArray.find(a => a.header.parameterNumber === PARAM.UGRD);
  const vItem = gribArray.find(a => a.header.parameterNumber === PARAM.VGRD);
  const wItem = gribArray.find(a => a.header.parameterNumber === PARAM.VVEL);

  if (!tmpItem || !uItem || !vItem || !wItem) {
    console.error('Missing TMP, UGRD, VGRD, or VVEL data');
    return null;
  }

  const header = tmpItem.header;
  const nx = header.nx ?? 360;
  const ny = header.ny ?? 181;
  const lon0 = header.lo1 ?? 0;
  const lat0 = header.la1 ?? 90;
  const lat2 = header.la2 ?? -90;
  const dx = header.dx ?? 1;
  const dy = header.dy ?? (lat2 < lat0 ? -1 : 1);

  const earthRadiusMeters = 6371229;
  const dataStartsFromNorth = (header.la1 ?? 90) > (header.la2 ?? -90);

  const lonMin = lon0;
  const latMax = Math.max(lat0, lat2);
  const latMin = Math.min(lat0, lat2);

  function idx(i: number, j: number) {
    const ii = ((i % nx) + nx) % nx;
    const jj = Math.max(0, Math.min(ny - 1, j));
    return jj * nx + ii;
  }

  // 双线性插值
  function bilinear(grid: GribData, lon: number, lat: number): number {
    let lambda = lon;
    if (lambda < lonMin) lambda += 360;
    if (lambda > lonMin + 360) lambda -= 360;

    const x = (lambda - lonMin) / dx;
    const i0 = Math.floor(x);
    const fi = x - i0;

    let yIndex;
    if (dataStartsFromNorth) {
      yIndex = (latMax - lat) / Math.abs(dy);
    } else {
      yIndex = (lat - latMin) / Math.abs(dy);
    }
    const j0 = Math.floor(yIndex);
    const fj = yIndex - j0;

    const i1 = i0 + 1;
    const j1 = j0 + 1;

    const i0c = ((i0 % nx) + nx) % nx;
    const i1c = ((i1 % nx) + nx) % nx;
    const j0c = Math.max(0, Math.min(ny - 1, j0));
    const j1c = Math.max(0, Math.min(ny - 1, j1));

    const v00 = grid.data[idx(i0c, j0c)] ?? 0;
    const v10 = grid.data[idx(i1c, j0c)] ?? 0;
    const v01 = grid.data[idx(i0c, j1c)] ?? 0;
    const v11 = grid.data[idx(i1c, j1c)] ?? 0;

    const v0 = v00 * (1 - fi) + v10 * fi;
    const v1 = v01 * (1 - fi) + v11 * fi;
    return v0 * (1 - fj) + v1 * fj;
  }

  // 计算水平风切变：shear = sqrt((du/dx)^2 + (dv/dy)^2)
  function computeShear(lon: number, lat: number): number {
    if (!uItem || !vItem) return 0;
    
    const dLon = 0.5; // 度
    const dLat = 0.5; // 度

    // 计算 du/dx (经度方向)
    const uEast = bilinear(uItem, lon + dLon, lat);
    const uWest = bilinear(uItem, lon - dLon, lat);
    const du_dx = (uEast - uWest) / (2 * dLon);

    // 计算 dv/dy (纬度方向)
    const vNorth = bilinear(vItem, lon, lat + dLat);
    const vSouth = bilinear(vItem, lon, lat - dLat);
    const dv_dy = (vNorth - vSouth) / (2 * dLat);

    // 考虑纬度对经度距离的影响
    const latRad = lat * Math.PI / 180;
    const mPerDeg = Math.PI * earthRadiusMeters / 180.0;
    const du_dx_m = du_dx / (mPerDeg * Math.max(1e-6, Math.cos(latRad)));
    const dv_dy_m = dv_dy / mPerDeg;

    // 风切变强度
    const shear = Math.sqrt(du_dx_m * du_dx_m + dv_dy_m * dv_dy_m);
    return shear;
  }

  // 先计算全局风切变范围（用于归一化）
  let minShear = Infinity;
  let maxShear = -Infinity;
  const sampleCount = Math.min(10000, nx * ny);
  const step = Math.max(1, Math.floor((nx * ny) / sampleCount));
  
  for (let i = 0; i < tmpItem.data.length; i += step) {
    const j = Math.floor(i / nx);
    const ii = i % nx;
    const lon = lon0 + ii * dx;
    const lat = dataStartsFromNorth 
      ? latMax - j * Math.abs(dy)
      : latMin + j * Math.abs(dy);
    
    if (lat >= -90 && lat <= 90) {
      const shear = computeShear(lon, lat);
      if (!isNaN(shear)) {
        if (shear < minShear) minShear = shear;
        if (shear > maxShear) maxShear = shear;
      }
    }
  }

  // 如果计算失败，使用默认值
  if (!isFinite(minShear) || !isFinite(maxShear) || maxShear === minShear) {
    minShear = 0;
    maxShear = 0.01; // 经验值：0.01 s^-1 为强切变
  }

  // 计算颠簸指数
  function computeTurbulenceIndex(lon: number, lat: number): number {
    if (!uItem || !vItem || !wItem || !tmpItem) return 0;

    // 1. 水平风切变
    const shear = computeShear(lon, lat);

    // 3. 垂直扰动强度
    const w = bilinear(wItem, lon, lat); // VVEL (m/s)
    const wNorm = clamp(Math.abs(w) / 0.5, 0, 1);

    // 4. 温度稳定度因子（TMP 是开尔文，250K = -23°C）
    const tmpK = bilinear(tmpItem, lon, lat);
    const tempFactor = clamp((250 - tmpK) / 40, 0, 1);

    // 5. 归一化风切变
    const shearNorm = normalize(shear, minShear, maxShear);

    // 6. 最终颠簸指数
    const turbulence = clamp(
      0.5 * shearNorm +
      0.3 * wNorm +
      0.2 * tempFactor,
      0,
      1
    );

    return turbulence;
  }

  // 计算全局颠簸范围（用于归一化）
  let minTurbulence = Infinity;
  let maxTurbulence = -Infinity;
  
  for (let i = 0; i < tmpItem.data.length; i += step) {
    const j = Math.floor(i / nx);
    const ii = i % nx;
    const lon = lon0 + ii * dx;
    const lat = dataStartsFromNorth 
      ? latMax - j * Math.abs(dy)
      : latMin + j * Math.abs(dy);
    
    if (lat >= -90 && lat <= 90) {
      const turb = computeTurbulenceIndex(lon, lat);
      if (!isNaN(turb)) {
        if (turb < minTurbulence) minTurbulence = turb;
        if (turb > maxTurbulence) maxTurbulence = turb;
      }
    }
  }

  // 如果计算失败，使用默认值
  if (!isFinite(minTurbulence) || !isFinite(maxTurbulence)) {
    minTurbulence = 0;
    maxTurbulence = 1;
  }

  const field: CATField = {
    minTurbulence,
    maxTurbulence,
    interpolate(lon: number, lat: number) {
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      const turb = computeTurbulenceIndex(lon, lat);
      if (Number.isNaN(turb)) return null;
      return turb;
    }
  };

  return field;
}

type CATLayerProps = {
  radius?: number;
  opacity?: number;
};

export function CATLayer({
  radius = 1.6,
  opacity = 0.75,
}: CATLayerProps) {
  const [catField, setCatField] = useState<CATField | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [catDataTexture, setCatDataTexture] = useState<THREE.DataTexture | null>(null);
  const [gribHeader, setGribHeader] = useState<GribHeader | null>(null);

  // 加载数据
  useEffect(() => {
    setIsLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then((gribArray: GribData[]) => {
        const field = buildCATFieldFromGrib(gribArray);
        setCatField(field);
        setIsLoading(false);

        // 构建纹理
        if (field && gribArray.length >= 4) {
          const tmpItem = gribArray.find(a => a.header.parameterNumber === PARAM.TMP);
          if (!tmpItem) return;

          const header = tmpItem.header;
          const nx = header.nx ?? 360;
          const ny = header.ny ?? 181;
          setGribHeader(header);

          // 创建纹理数据
          const size = nx * ny;
          const data = new Float32Array(size * 4);

          const lon0 = header.lo1 ?? 0;
          const lat0 = header.la1 ?? 90;
          const lat2 = header.la2 ?? -90;
          const dx = header.dx ?? 1;
          const dy = header.dy ?? (lat2 < lat0 ? -1 : 1);
          const dataStartsFromNorth = (header.la1 ?? 90) > (header.la2 ?? -90);
          const latMax = Math.max(lat0, lat2);
          const latMin = Math.min(lat0, lat2);

          for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
              const idx = j * nx + i;
              const lon = lon0 + i * dx;
              const lat = dataStartsFromNorth 
                ? latMax - j * Math.abs(dy)
                : latMin + j * Math.abs(dy);
              
              const turb = field.interpolate(lon, lat) ?? 0;
              const normalized = field.maxTurbulence > field.minTurbulence
                ? (turb - field.minTurbulence) / (field.maxTurbulence - field.minTurbulence)
                : 0.5;
              
              data[idx * 4] = normalized;
              data[idx * 4 + 1] = 0;
              data[idx * 4 + 2] = 0;
              data[idx * 4 + 3] = 1;
            }
          }

          const texture = new THREE.DataTexture(data, nx, ny, THREE.RGBAFormat, THREE.FloatType);
          texture.needsUpdate = true;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          setCatDataTexture(texture);
        }
      })
      .catch(err => {
        console.error('Failed to load CAT data:', err);
        setIsLoading(false);
      });
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uOpacity: { value: opacity },
        uRadius: { value: radius },
        uCATTexture: { value: catDataTexture },
        uTextureSize: { value: new THREE.Vector2(gribHeader?.nx ?? 360, gribHeader?.ny ?? 181) },
        uLonRange: { value: new THREE.Vector2(gribHeader?.lo1 ?? 0, (gribHeader?.lo2 ?? 359) + 1) },
        uLatRange: { value: new THREE.Vector2(gribHeader?.la1 ?? 90, gribHeader?.la2 ?? -90) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;
        varying vec2 vTexCoord;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vLocalPosition = position;
          vec3 n = normalize(position);
          float lat = asin(n.y);
          float lon = atan(n.z, -n.x);
          vTexCoord = vec2((lon + 3.141592653589793) / 6.283185307179586, (lat + 1.5707963267948966) / 3.141592653589793);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;
        varying vec2 vTexCoord;

        uniform float uOpacity;
        uniform float uRadius;
        uniform sampler2D uCATTexture;
        uniform vec2 uTextureSize;
        uniform vec2 uLonRange;
        uniform vec2 uLatRange;

        const float PI = 3.141592653589793;

        vec2 worldToLatLon(vec3 p) {
          vec3 n = normalize(p);
          float lat = asin(n.y) * 180.0 / PI;
          float lon = atan(n.z, -n.x) * 180.0 / PI - 180.0;
          return vec2(lat, lon);
        }

        float sampleCATFromTexture(vec2 latlon) {
          float lat = latlon.x;
          float lon = latlon.y;
          
          float lonRange = uLonRange.y - uLonRange.x;
          float lonOffset = lon - uLonRange.x;
          if (lonOffset < 0.0) lonOffset += 360.0;
          if (lonOffset > 360.0) lonOffset -= 360.0;
          float lonNorm = lonOffset / lonRange;
          
          float latRange = uLatRange.x - uLatRange.y;
          float latNorm = (uLatRange.x - lat) / latRange;
          latNorm = clamp(latNorm, 0.0, 1.0);
          
          vec2 texCoord = vec2(lonNorm, latNorm);
          float catNorm = texture2D(uCATTexture, texCoord).r;
          
          return catNorm;
        }

        // 颠簸指数颜色映射：从绿色（低）到红色（高）
        vec3 colorRamp(float x) {
          x = clamp(x, 0.0, 1.0);
          
          // 低颠簸：绿色系
          vec3 color0 = vec3(0.0, 0.6, 0.2);      // 绿色（无颠簸）
          vec3 color1 = vec3(0.3, 0.7, 0.3);       // 浅绿（轻微）
          vec3 color2 = vec3(0.6, 0.8, 0.2);      // 黄绿（轻度）
          vec3 color3 = vec3(0.9, 0.8, 0.1);      // 黄色（中度）
          vec3 color4 = vec3(0.95, 0.6, 0.1);     // 橙黄（中强）
          vec3 color5 = vec3(0.9, 0.3, 0.1);      // 橙色（强）
          vec3 color6 = vec3(0.8, 0.1, 0.1);      // 红色（极强）
          
          if (x < 0.166) {
            float t = smoothstep(0.0, 0.166, x);
            return mix(color0, color1, t);
          } else if (x < 0.333) {
            float t = smoothstep(0.166, 0.333, x);
            return mix(color1, color2, t);
          } else if (x < 0.5) {
            float t = smoothstep(0.333, 0.5, x);
            return mix(color2, color3, t);
          } else if (x < 0.667) {
            float t = smoothstep(0.5, 0.667, x);
            return mix(color3, color4, t);
          } else if (x < 0.833) {
            float t = smoothstep(0.667, 0.833, x);
            return mix(color4, color5, t);
          } else {
            float t = smoothstep(0.833, 1.0, x);
            return mix(color5, color6, t);
          }
        }

        void main() {
          vec2 latlon = worldToLatLon(vLocalPosition);
          float catNorm = sampleCATFromTexture(latlon);
          vec3 color = colorRamp(catNorm);
          
          // 降低亮度
          color = color * 0.85;

          float distFromCenter = length(vLocalPosition);
          float edgeFade = smoothstep(uRadius * 0.98, uRadius * 1.02, distFromCenter);
          
          float alpha = uOpacity * (0.7 + 0.2 * edgeFade);
          
          // 只在颠簸指数较高时显示（阈值 0.3）
          float visibility = smoothstep(0.05, 0.4, catNorm);
          alpha *= visibility;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [opacity, radius, catDataTexture, gribHeader]);

  // 更新 uniforms
  useFrame(() => {
    if (material.uniforms.uOpacity) material.uniforms.uOpacity.value = opacity;
    if (material.uniforms.uRadius) material.uniforms.uRadius.value = radius;
    if (material.uniforms.uCATTexture && catDataTexture) {
      material.uniforms.uCATTexture.value = catDataTexture;
    }
    if (material.uniforms.uTextureSize && gribHeader) {
      material.uniforms.uTextureSize.value.set(gribHeader.nx ?? 360, gribHeader.ny ?? 181);
    }
    if (material.uniforms.uLonRange && gribHeader) {
      material.uniforms.uLonRange.value.set(gribHeader.lo1 ?? 0, (gribHeader.lo2 ?? 359) + 1);
    }
    if (material.uniforms.uLatRange && gribHeader) {
      material.uniforms.uLatRange.value.set(gribHeader.la1 ?? 90, gribHeader.la2 ?? -90);
    }
  });

  if (isLoading || !catField || !catDataTexture) {
    return null;
  }

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius + 0.003, 128, 128]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

