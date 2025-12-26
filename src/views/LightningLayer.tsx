// LightningLayer.tsx - 雷电图层
import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ---- 配置 ----
const DATA_URL = '/data/weather/current/current-lightning-surface-level-gfs-1.0.json';

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

// 雷电场
type LightningField = {
  interpolate: (lon: number, lat: number) => number | null; // 返回雷电概率 0-1
  minProbability: number;
  maxProbability: number;
};

// ---- 参数编号 ----
const PARAM = {
  CAPE: 6,  // Convective_available_potential_energy
  APCP: 8,  // Total_precipitation
};

// 工具函数：clamp
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---- 帮助函数：构建雷电场 ----
function buildLightningFieldFromGrib(gribArray: GribData[]): LightningField | null {
  if (!gribArray || gribArray.length < 2) return null;

  // 找到各个参数
  const capeItem = gribArray.find(a => a.header.parameterNumber === PARAM.CAPE);
  const apcpItem = gribArray.find(a => a.header.parameterNumber === PARAM.APCP);

  if (!capeItem || !apcpItem) {
    console.error('Missing CAPE or APCP data');
    return null;
  }

  const header = capeItem.header;
  const nx = header.nx ?? 360;
  const ny = header.ny ?? 181;
  const lon0 = header.lo1 ?? 0;
  const lat0 = header.la1 ?? 90;
  const lat2 = header.la2 ?? -90;
  const dx = header.dx ?? 1;
  const dy = header.dy ?? (lat2 < lat0 ? -1 : 1);

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

  // 计算雷电概率（基于 CAPE + APCP）
  function computeLightningProbability(lon: number, lat: number): number {
    if (!capeItem || !apcpItem) return 0;

    const cape = bilinear(capeItem, lon, lat);
    const apcp = bilinear(apcpItem, lon, lat);

    // 归一化 CAPE (0-5000 J/kg -> 0-1)
    const capeNorm = clamp(cape / 5000.0, 0, 1);
    
    // 归一化 APCP (0-50 mm -> 0-1)
    const apcpNorm = clamp(apcp / 50.0, 0, 1);

    // 组合概率：CAPE 权重 0.6，APCP 权重 0.4
    const probability = clamp(
      capeNorm * 0.6 + apcpNorm * 0.4,
      0, 1
    );

    // 映射到 0.4-1.0 范围（与原代码保持一致）
    return 0.4 + probability * 0.6;
  }

  // 计算全局概率范围（用于归一化）
  let minProbability = Infinity;
  let maxProbability = -Infinity;
  const sampleCount = Math.min(10000, nx * ny);
  const step = Math.max(1, Math.floor((nx * ny) / sampleCount));
  
  for (let i = 0; i < capeItem.data.length; i += step) {
    const j = Math.floor(i / nx);
    const ii = i % nx;
    const lon = lon0 + ii * dx;
    const lat = dataStartsFromNorth 
      ? latMax - j * Math.abs(dy)
      : latMin + j * Math.abs(dy);
    
    if (lat >= -90 && lat <= 90) {
      const prob = computeLightningProbability(lon, lat);
      if (!isNaN(prob)) {
        if (prob < minProbability) minProbability = prob;
        if (prob > maxProbability) maxProbability = prob;
      }
    }
  }

  // 如果计算失败，使用默认值
  if (!isFinite(minProbability) || !isFinite(maxProbability)) {
    minProbability = 0.4;
    maxProbability = 1.0;
  }

  const field: LightningField = {
    minProbability,
    maxProbability,
    interpolate(lon: number, lat: number) {
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      const prob = computeLightningProbability(lon, lat);
      if (Number.isNaN(prob)) return null;
      return prob;
    }
  };

  return field;
}

type LightningLayerProps = {
  radius?: number;
  opacity?: number;
};

export function LightningLayer({
  radius = 1.6,
  opacity = 0.75,
}: LightningLayerProps) {
  const [lightningField, setLightningField] = useState<LightningField | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lightningDataTexture, setLightningDataTexture] = useState<THREE.DataTexture | null>(null);
  const [gribHeader, setGribHeader] = useState<GribHeader | null>(null);

  // 加载数据
  useEffect(() => {
    setIsLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then((gribArray: GribData[]) => {
        const field = buildLightningFieldFromGrib(gribArray);
        setLightningField(field);
        setIsLoading(false);

        // 构建纹理
        if (field && gribArray.length >= 2) {
          const capeItem = gribArray.find(a => a.header.parameterNumber === PARAM.CAPE);
          if (!capeItem) return;

          const header = capeItem.header;
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
              
              const prob = field.interpolate(lon, lat) ?? 0;
              const normalized = field.maxProbability > field.minProbability
                ? (prob - field.minProbability) / (field.maxProbability - field.minProbability)
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
          
          setLightningDataTexture(texture);
        }
      })
      .catch(err => {
        console.error('Failed to load lightning data:', err);
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
        uLightningTexture: { value: lightningDataTexture },
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
        uniform sampler2D uLightningTexture;
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

        float sampleLightningFromTexture(vec2 latlon) {
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
          float probNorm = texture2D(uLightningTexture, texCoord).r;
          
          return probNorm;
        }

        // 雷电概率颜色映射：黄色系
        vec3 lightningColor(float x) {
          x = clamp(x, 0.0, 1.0);
          
          // 黄色系渐变：从深黄到白色
          vec3 color0 = vec3(1.0, 0.9, 0.3);      // 深黄 (rgb(255,230,77))
          vec3 color1 = vec3(1.0, 0.95, 0.5);     // 亮黄 (rgb(255,243,128))
          vec3 color2 = vec3(1.0, 1.0, 0.7);     // 淡黄 (rgb(255,255,179))
          vec3 color3 = vec3(1.0, 1.0, 1.0);      // 白色 (rgb(255,255,255))
          
          if (x < 0.33) {
            float t = smoothstep(0.0, 0.33, x);
            return mix(color0, color1, t);
          } else if (x < 0.67) {
            float t = smoothstep(0.33, 0.67, x);
            return mix(color1, color2, t);
          } else {
            float t = smoothstep(0.67, 1.0, x);
            return mix(color2, color3, t);
          }
        }

        void main() {
          vec2 latlon = worldToLatLon(vLocalPosition);
          float probNorm = sampleLightningFromTexture(latlon);
          vec3 color = lightningColor(probNorm);
          
          // 降低亮度
          color = color * 0.85;

          float distFromCenter = length(vLocalPosition);
          float edgeFade = smoothstep(uRadius * 0.98, uRadius * 1.02, distFromCenter);
          
          float alpha = uOpacity * (0.7 + 0.2 * edgeFade);
          
          // 只在概率较高时显示
          float visibility = smoothstep(0.4, 0.6, probNorm);
          alpha *= visibility;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [opacity, radius, lightningDataTexture, gribHeader]);

  // 更新 uniforms
  useFrame(() => {
    if (material.uniforms.uOpacity) material.uniforms.uOpacity.value = opacity;
    if (material.uniforms.uRadius) material.uniforms.uRadius.value = radius;
    if (material.uniforms.uLightningTexture && lightningDataTexture) {
      material.uniforms.uLightningTexture.value = lightningDataTexture;
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

  if (isLoading || !lightningField || !lightningDataTexture) {
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
