// VisibilityLayer.tsx - 能见度图层
import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ---- 配置 ----
const DATA_URL = 'https://arvis.oss-cn-chengdu.aliyuncs.com/current-visibility-surface-level-gfs-1.0.json';

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

// 能见度场
type VisibilityField = {
  interpolate: (lon: number, lat: number) => number | null; // 返回能见度风险指数 0-1
  minVisibility: number;
  maxVisibility: number;
};

// ---- 参数编号 ----
const PARAM = {
  TMP: 0,  // Temperature
  RH: 1,   // Relative_humidity
  UGRD: 2, // U-component_of_wind
  VGRD: 3, // V-component_of_wind
};

// 工具函数：clamp
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 工具函数：smoothstep
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// 计算露点温度（°C）
// 使用 Magnus 公式的简化版本
function dewPoint(Tc: number, RHn: number): number {
  // 如果相对湿度为 0，返回一个很低的温度
  if (RHn <= 0) return Tc - 20;
  
  // Magnus 公式参数
  const a = 17.27;
  const b = 237.7;
  
  // 计算露点温度
  const alpha = (a * Tc) / (b + Tc) + Math.log(RHn);
  const Td = (b * alpha) / (a - alpha);
  
  return Td;
}

// ---- 帮助函数：构建能见度场 ----
function buildVisibilityFieldFromGrib(gribArray: GribData[]): VisibilityField | null {
  if (!gribArray || gribArray.length < 4) return null;

  // 找到各个参数
  const tmpItem = gribArray.find(a => a.header.parameterNumber === PARAM.TMP);
  const rhItem = gribArray.find(a => a.header.parameterNumber === PARAM.RH);
  const uItem = gribArray.find(a => a.header.parameterNumber === PARAM.UGRD);
  const vItem = gribArray.find(a => a.header.parameterNumber === PARAM.VGRD);

  if (!tmpItem || !rhItem || !uItem || !vItem) {
    console.error('Missing TMP, RH, UGRD, or VGRD data');
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

  // 计算能见度风险指数
  function computeVisibilityRisk(lon: number, lat: number): number {
    if (!tmpItem || !rhItem || !uItem || !vItem) return 0;

    // 1. 基础量
    const u = bilinear(uItem, lon, lat);
    const v = bilinear(vItem, lon, lat);
    const windSpeed = Math.sqrt(u * u + v * v); // m/s
    const RH = bilinear(rhItem, lon, lat);
    const RHn = RH / 100.0; // 0–1
    const TMP = bilinear(tmpItem, lon, lat);
    const Tc = TMP - 273.15; // °C

    // 2. 露点 & 饱和因子
    const Td = dewPoint(Tc, RHn);
    const saturation = clamp(1.0 - (Tc - Td) / 3.0, 0, 1);

    // 3. 风抑制因子（风速越小，能见度风险越高）
    const windFactor = smoothstep(4.0, 0.5, windSpeed);

    // 4. 湿度因子（湿度越高，能见度风险越高）
    const rhFactor = smoothstep(0.85, 0.98, RHn);

    // 5. 最终能见度风险指数
    const visibilityRisk = clamp(
      saturation * 0.5 +
      rhFactor * 0.3 +
      windFactor * 0.2,
      0, 1
    );

    return visibilityRisk;
  }

  // 计算全局能见度范围（用于归一化）
  let minVisibility = Infinity;
  let maxVisibility = -Infinity;
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
      const risk = computeVisibilityRisk(lon, lat);
      if (!isNaN(risk)) {
        if (risk < minVisibility) minVisibility = risk;
        if (risk > maxVisibility) maxVisibility = risk;
      }
    }
  }

  // 如果计算失败，使用默认值
  if (!isFinite(minVisibility) || !isFinite(maxVisibility)) {
    minVisibility = 0;
    maxVisibility = 1;
  }

  const field: VisibilityField = {
    minVisibility,
    maxVisibility,
    interpolate(lon: number, lat: number) {
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      const risk = computeVisibilityRisk(lon, lat);
      if (Number.isNaN(risk)) return null;
      return risk;
    }
  };

  return field;
}

type VisibilityLayerProps = {
  radius?: number;
  opacity?: number;
};

export function VisibilityLayer({
  radius = 1.6,
  opacity = 0.75,
}: VisibilityLayerProps) {
  const [visibilityField, setVisibilityField] = useState<VisibilityField | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibilityDataTexture, setVisibilityDataTexture] = useState<THREE.DataTexture | null>(null);
  const [gribHeader, setGribHeader] = useState<GribHeader | null>(null);

  // 加载数据
  useEffect(() => {
    setIsLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then((gribArray: GribData[]) => {
        const field = buildVisibilityFieldFromGrib(gribArray);
        setVisibilityField(field);
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
              
              const risk = field.interpolate(lon, lat) ?? 0;
              const normalized = field.maxVisibility > field.minVisibility
                ? (risk - field.minVisibility) / (field.maxVisibility - field.minVisibility)
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
          
          setVisibilityDataTexture(texture);
        }
      })
      .catch(err => {
        console.error('Failed to load visibility data:', err);
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
        uVisibilityTexture: { value: visibilityDataTexture },
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
        uniform sampler2D uVisibilityTexture;
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

        float sampleVisibilityFromTexture(vec2 latlon) {
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
          float visNorm = texture2D(uVisibilityTexture, texCoord).r;
          
          return visNorm;
        }

        // 能见度颜色映射：从青色到白色
        vec3 fogColor(float x) {
          return mix(
            vec3(0.2, 0.6, 0.6),
            vec3(0.9, 0.9, 0.9),
            smoothstep(0.4, 0.9, x)
          );
        }

        void main() {
          vec2 latlon = worldToLatLon(vLocalPosition);
          float visNorm = sampleVisibilityFromTexture(latlon);
          vec3 color = fogColor(visNorm);
          
          // 降低亮度
          color = color * 0.85;

          float distFromCenter = length(vLocalPosition);
          float edgeFade = smoothstep(uRadius * 0.98, uRadius * 1.02, distFromCenter);
          
          float alpha = uOpacity * (0.7 + 0.2 * edgeFade);
          
          // 只在能见度风险较高时显示
          float visibility = smoothstep(0.05, 0.4, visNorm);
          alpha *= visibility;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [opacity, radius, visibilityDataTexture, gribHeader]);

  // 更新 uniforms
  useFrame(() => {
    if (material.uniforms.uOpacity) material.uniforms.uOpacity.value = opacity;
    if (material.uniforms.uRadius) material.uniforms.uRadius.value = radius;
    if (material.uniforms.uVisibilityTexture && visibilityDataTexture) {
      material.uniforms.uVisibilityTexture.value = visibilityDataTexture;
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

  if (isLoading || !visibilityField || !visibilityDataTexture) {
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

