// MoistureLayer.tsx
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToCartesian } from '../utils/geo'; 

// ---- 配置 ----
const DATA_URL = 'https://arvis.oss-cn-chengdu.aliyuncs.com/current-moisture-surface-level-gfs-1.0.json';
// const DEFAULT_PARTICLE_COUNT = 20000;
// const DEFAULT_TRAIL = 15;
const DEFAULT_PARTICLE_COUNT = 10000;
const DEFAULT_TRAIL = 50;
const DEFAULT_RADIUS = 1.6;

// ---- 类型 ----
type GribHeader = {
  nx?: number; ny?: number;
  lo1?: number; lo2?: number; la1?: number; la2?: number;
  dx?: number; dy?: number;
  numberPoints?: number;
  shapeName?: string;
  parameterNumber?: number;
};

type GribData = {
  header: GribHeader;
  data: number[];
};

// 水汽通量场
type MoistureFluxField = {
  interpolate: (lon: number, lat: number) => { qx: number; qy: number; q: number; speed: number } | null;
  interpolateConvergence: (lon: number, lat: number) => number | null;
  earthRadiusMeters: number;
};

// ---- 参数编号 ----
const PARAM = {
  Q: 0,  // Specific_humidity
  U: 2,  // U-component_of_wind
  V: 3,  // V-component_of_wind
};

// ---- 帮助函数：构建水汽通量场 ----
function buildMoistureFluxFieldFromGrib(gribArray: GribData[]): MoistureFluxField | null {
  if (!gribArray || gribArray.length < 3) return null;

  // 找到 q, U, V
  const qItem = gribArray.find(a => a.header.parameterNumber === PARAM.Q);
  const uItem = gribArray.find(a => a.header.parameterNumber === PARAM.U);
  const vItem = gribArray.find(a => a.header.parameterNumber === PARAM.V);

  if (!qItem || !uItem || !vItem) {
    console.error('Missing q, U, or V data');
    return null;
  }

  const header = qItem.header;
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

  function bilinear(grid: GribData, lon: number, lat: number) {
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

  // 计算辐合（convergence）：-div(Q) = -(∂Qx/∂x + ∂Qy/∂y)
  function computeConvergence(lon: number, lat: number): number {
    if (!qItem || !uItem || !vItem) return 0;
    
    const dLon = 0.5; // 度
    const dLat = 0.5; // 度

    // 计算 ∂Qx/∂x (经度方向)
    const qxEast = bilinear(uItem, lon + dLon, lat) * bilinear(qItem, lon + dLon, lat);
    const qxWest = bilinear(uItem, lon - dLon, lat) * bilinear(qItem, lon - dLon, lat);
    const dQx_dx = (qxEast - qxWest) / (2 * dLon);

    // 计算 ∂Qy/∂y (纬度方向)
    const qyNorth = bilinear(vItem, lon, lat + dLat) * bilinear(qItem, lon, lat + dLat);
    const qySouth = bilinear(vItem, lon, lat - dLat) * bilinear(qItem, lon, lat - dLat);
    const dQy_dy = (qyNorth - qySouth) / (2 * dLat);

    // 考虑纬度对经度距离的影响
    const latRad = lat * Math.PI / 180;
    const mPerDeg = Math.PI * earthRadiusMeters / 180.0;
    const dQx_dx_m = dQx_dx / (mPerDeg * Math.max(1e-6, Math.cos(latRad)));
    const dQy_dy_m = dQy_dy / mPerDeg;

    // 辐合 = -(∂Qx/∂x + ∂Qy/∂y)
    return -(dQx_dx_m + dQy_dy_m);
  }

  const field: MoistureFluxField = {
    earthRadiusMeters,
    interpolate(lon: number, lat: number) {
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      
      const q = bilinear(qItem, lon, lat);
      const u = bilinear(uItem, lon, lat);
      const v = bilinear(vItem, lon, lat);
      
      if (Number.isNaN(q) || Number.isNaN(u) || Number.isNaN(v)) return null;

      // 水汽通量：Qx = U * q, Qy = V * q
      const qx = u * q;
      const qy = v * q;
      const speed = Math.sqrt(qx * qx + qy * qy);

      return { qx, qy, q, speed };
    },
    interpolateConvergence(lon: number, lat: number) {
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      return computeConvergence(lon, lat);
    }
  };

  return field;
}

// ---- RK4 积分器（基于水汽通量场） ----
function advectRK4Moisture(lon: number, lat: number, dt: number, field: MoistureFluxField | null) {
  if (!field) return { lon, lat };

  const R = field.earthRadiusMeters;
  const mPerDeg = Math.PI * R / 180.0;

//   function velocityAt(lon_: number, lat_: number) {
//     const flux = field?.interpolate(lon_, lat_);
//     if (!flux) return { dlon: 0, dlat: 0 };
    
//     // 水汽通量转换为速度（度/秒）
//     // Qx = U * q, Qy = V * q
//     // 速度 = 通量 / q (如果 q > 0)
//     const q = flux.q;
//     if (q < 1e-8) return { dlon: 0, dlat: 0 };
    
//     const latRad = lat_ * Math.PI / 180;
//     const cosLat = Math.max(1e-6, Math.cos(latRad));
    
//     // 从通量反推速度：U = Qx / q, V = Qy / q
//     const u = flux.qx / q;
//     const v = flux.qy / q;
    
//     const dlat = v / mPerDeg;
//     const dlon = u / (mPerDeg * cosLat);
    
//     return { dlon, dlat };
//   }

function velocityAt(lon_: number, lat_: number) {
    const flux = field?.interpolate(lon_, lat_);
    if (!flux) return { dlon: 0, dlat: 0 };
  
    const latRad = lat_ * Math.PI / 180;
    const cosLat = Math.max(1e-6, Math.cos(latRad));
  
    // ✅ 用风速（从通量反推）
    const q = Math.max(flux.q, 1e-6);
    const u = flux.qx / q; // m/s
    const v = flux.qy / q; // m/s
  
    const dlat = v / mPerDeg;
    const dlon = u / (mPerDeg * cosLat);
  
    return { dlon, dlat };
  }
  
  
  const k1 = velocityAt(lon, lat);
  const k2pos = { lon: lon + 0.5 * dt * k1.dlon, lat: lat + 0.5 * dt * k1.dlat };
  const k2 = velocityAt(k2pos.lon, k2pos.lat);
  const k3pos = { lon: lon + 0.5 * dt * k2.dlon, lat: lat + 0.5 * dt * k2.dlat };
  const k3 = velocityAt(k3pos.lon, k3pos.lat);
  const k4pos = { lon: lon + dt * k3.dlon, lat: lat + dt * k3.dlat };
  const k4 = velocityAt(k4pos.lon, k4pos.lat);

  const dlon = (k1.dlon + 2 * k2.dlon + 2 * k3.dlon + k4.dlon) / 6;
  const dlat = (k1.dlat + 2 * k2.dlat + 2 * k3.dlat + k4.dlat) / 6;

  let newLon = lon + dlon * dt;
  let newLat = lat + dlat * dt;

  if (newLon < -180) newLon += 360;
  if (newLon > 180) newLon -= 360;
  if (newLat > 90) newLat = 90;
  if (newLat < -90) newLat = -90;

  return { lon: newLon, lat: newLat };
}

// ---- 主组件 ----
export function MoistureLayer({
  radius = DEFAULT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  speedScale = 1.0,
  trailLength = DEFAULT_TRAIL,
}: {
  radius?: number;
  particleCount?: number;
  speedScale?: number;
  trailLength?: number;
}) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const trailRef = useRef<THREE.LineSegments | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const trailGeomRef = useRef<THREE.BufferGeometry | null>(null);

  const [field, setField] = useState<MoistureFluxField | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 加载数据
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetch(DATA_URL);
        if (!resp.ok) {
          console.warn('Moisture data load failed');
          return;
        }
        const json = await resp.json() as GribData[];
        if (cancelled) return;
        const f = buildMoistureFluxFieldFromGrib(json);
        if (f) {
          setField(f);
          setLoaded(true);
          console.log('[MoistureLayer] moisture flux field built');
        }
      } catch (e) {
        console.warn('[MoistureLayer] load error', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // 粒子经纬与 age
  const particles = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3 + 0] = (Math.random() * 360 - 180);
      arr[i * 3 + 1] = (Math.random() * 180 - 90);
      arr[i * 3 + 2] = Math.random() * 1000;
    }
    return arr;
  }, [particleCount]);

  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const intensities = useMemo(() => new Float32Array(particleCount), [particleCount]); // 速度 × 湿度

  const trailHistory = useRef<Float32Array[]>([]);
  useEffect(() => {
    trailHistory.current = [];
    for (let i = 0; i < particleCount; i++) {
      const trail = new Float32Array(trailLength * 3);
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      const p = latLonToCartesian(lat, lon, radius + 0.002);
      for (let j = 0; j < trailLength; j++) {
        trail[j * 3 + 0] = p.x;
        trail[j * 3 + 1] = p.y;
        trail[j * 3 + 2] = p.z;
      }
      trailHistory.current.push(trail);
    }
  }, [particleCount, trailLength, radius, particles]);

  const trailPositions = useMemo(() => new Float32Array(particleCount * (trailLength - 1) * 2 * 3), [particleCount, trailLength]);
  const trailColors = useMemo(() => new Float32Array(particleCount * (trailLength - 1) * 2 * 3), [particleCount, trailLength]);

  useEffect(() => {
    if (!geometryRef.current) {
      geometryRef.current = new THREE.BufferGeometry();
    }
    if (!trailGeomRef.current) {
      trailGeomRef.current = new THREE.BufferGeometry();
    }

    for (let i = 0; i < particleCount; i++) {
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      const p = latLonToCartesian(lat, lon, radius + 0.002);
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      intensities[i] = 0;
    }
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('aIntensity', new THREE.BufferAttribute(intensities, 1));

    trailGeomRef.current.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeomRef.current.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
  }, [particleCount, positions, intensities, trailPositions, trailColors, radius, particles]);

  useFrame((_state, delta) => {
    if (!geometryRef.current || !trailGeomRef.current) return;

    const posAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute;
    const intensityAttr = geometryRef.current.getAttribute('aIntensity') as THREE.BufferAttribute;
    const trailPosAttr = trailGeomRef.current.getAttribute('position') as THREE.BufferAttribute;
    const trailColorAttr = trailGeomRef.current.getAttribute('color') as THREE.BufferAttribute;

    // const dt = delta * 15.0 * speedScale * 1500;
    const dt = delta * speedScale * 500.0;


    for (let i = 0; i < particleCount; i++) {
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      let age = particles[i * 3 + 2];

      const adv = advectRK4Moisture(lon, lat, dt, field);
      let newLon = adv.lon;
      let newLat = adv.lat;

    //   newLon += (Math.random() - 0.5) * 0.02;
    //   newLat += (Math.random() - 0.5) * 0.01;

      age += 1;

      let reset = false;
    //   let isInVortex = false;
      
    //   if (field) {
    //     const flux = field.interpolate(newLon, newLat);
    //     if (flux) {
    //       const speed = flux.speed;
    //       if (speed < 0.5) {
    //         isInVortex = true;
    //       }
    //     }
    //   }

      const MAX_AGE = 3000;
      if (
        newLat > 90 ||
        newLat < -90 ||
        newLon > 180 ||
        newLon < -180 ||
        age > MAX_AGE 
        // isInVortex
      ) {
        newLon = (Math.random() * 360 - 180);
        newLat = (Math.random() * 180 - 90);
        age = 0;
        reset = true;
      }

      particles[i * 3 + 0] = newLon;
      particles[i * 3 + 1] = newLat;
      particles[i * 3 + 2] = age;

      const p3 = latLonToCartesian(newLat, newLon, radius + 0.002);
      posAttr.array[i * 3 + 0] = p3.x;
      posAttr.array[i * 3 + 1] = p3.y;
      posAttr.array[i * 3 + 2] = p3.z;

      // 强度 = 速度 × 湿度
      let intensity = 0;
      if (field) {
        const flux = field.interpolate(newLon, newLat);
        if (flux) {
          // 速度（从通量计算）
        //   const speed = flux.speed;
          // 强度 = 速度 × 湿度
        //   intensity = speed * flux.q * 1e6; // 放大湿度值以便可视化
        intensity = Math.sqrt(flux.qx * flux.qx + flux.qy * flux.qy) * 1e5;

        }
      }
      intensityAttr.array[i] = intensity;

      const trail = trailHistory.current[i];
      if (!trail) continue;

      if (reset) {
        for (let t = 0; t < trailLength; t++) {
          trail[t * 3 + 0] = p3.x;
          trail[t * 3 + 1] = p3.y;
          trail[t * 3 + 2] = p3.z;
        }
      } else {
        // for (let t = trailLength - 1; t > 0; t--) {
        //   trail[t * 3 + 0] = trail[(t - 1) * 3 + 0];
        //   trail[t * 3 + 1] = trail[(t - 1) * 3 + 1];
        //   trail[t * 3 + 2] = trail[(t - 1) * 3 + 2];
        // }
        // trail[0] = p3.x;
        // trail[1] = p3.y;
        // trail[2] = p3.z;
        const dx = trail[0] - p3.x;
  const dy = trail[1] - p3.y;
  const dz = trail[2] - p3.z;
  const dist2 = dx * dx + dy * dy + dz * dz;

  // 阈值很小，避免数值抖动
  if (dist2 > 1e-5) {
    for (let t = trailLength - 1; t > 0; t--) {
      trail[t * 3 + 0] = trail[(t - 1) * 3 + 0];
      trail[t * 3 + 1] = trail[(t - 1) * 3 + 1];
      trail[t * 3 + 2] = trail[(t - 1) * 3 + 2];
    }
    trail[0] = p3.x;
    trail[1] = p3.y;
    trail[2] = p3.z;
  }
      }

      const baseIdx = i * (trailLength - 1) * 2 * 3;
      const col = intensityToColor(intensity);
      for (let t = 0; t < trailLength - 1; t++) {
        const segIdx = baseIdx + t * 2 * 3;
        trailPosAttr.array[segIdx + 0] = trail[t * 3 + 0];
        trailPosAttr.array[segIdx + 1] = trail[t * 3 + 1];
        trailPosAttr.array[segIdx + 2] = trail[t * 3 + 2];
        trailPosAttr.array[segIdx + 3] = trail[(t + 1) * 3 + 0];
        trailPosAttr.array[segIdx + 4] = trail[(t + 1) * 3 + 1];
        trailPosAttr.array[segIdx + 5] = trail[(t + 1) * 3 + 2];

        const tNorm = t / (trailLength - 1);
        const alpha = Math.pow(1 - tNorm, 1.5) * 0.9;
        trailColorAttr.array[segIdx + 0] = col[0] * alpha;
        trailColorAttr.array[segIdx + 1] = col[1] * alpha;
        trailColorAttr.array[segIdx + 2] = col[2] * alpha;
        trailColorAttr.array[segIdx + 3] = col[0] * alpha * 0.6;
        trailColorAttr.array[segIdx + 4] = col[1] * alpha * 0.6;
        trailColorAttr.array[segIdx + 5] = col[2] * alpha * 0.6;
      }
    }

    posAttr.needsUpdate = true;
    intensityAttr.needsUpdate = true;
    trailPosAttr.needsUpdate = true;
    trailColorAttr.needsUpdate = true;
  });

  // 强度->颜色（水汽通量颜色映射，蓝色系）
  function intensityToColor(intensity: number): [number, number, number] {
    // 强度范围大致在 0-100 之间（速度 m/s × 湿度 kg/kg × 1e6）
    const normalized = Math.min(intensity / 50.0, 1.0);
    
    if (normalized < 0.2) return [0.1, 0.3, 0.6];      // 深蓝
    if (normalized < 0.4) return [0.2, 0.5, 0.8];      // 蓝色
    if (normalized < 0.6) return [0.3, 0.7, 0.9];      // 浅蓝
    if (normalized < 0.8) return [0.4, 0.8, 0.95];     // 青蓝
    return [0.5, 0.9, 1.0];                            // 亮青
  }

  const pointMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        size: { value: 0.01 },
      },
      vertexShader: `
        uniform float size;
        attribute float aIntensity;
        varying float vIntensity;
        void main() {
          vIntensity = aIntensity;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vIntensity;
        vec3 colorFor(float i) {
          float n = clamp(i / 50.0, 0.0, 1.0);
          if (n < 0.2) return vec3(0.1,0.3,0.6);
          if (n < 0.4) return vec3(0.2,0.5,0.8);
          if (n < 0.6) return vec3(0.3,0.7,0.9);
          if (n < 0.8) return vec3(0.4,0.8,0.95);
          return vec3(0.5,0.9,1.0);
        }
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, r);
          vec3 c = colorFor(vIntensity);
          gl_FragColor = vec4(c, alpha * 0.9);
        }
      `
    });
  }, []);

  const trailMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
  }, []);

  // 确保线段和点云不会被裁剪，并控制渲染顺序（通过 ref 设置，避免 TS 类型报错）
  useEffect(() => {
    if (trailRef.current) {
      trailRef.current.frustumCulled = false
      trailRef.current.renderOrder = 99
    }
    if (pointsRef.current) {
      pointsRef.current.frustumCulled = false
      pointsRef.current.renderOrder = 100
    }
  }, [])

  return (
    <group>
      <lineSegments ref={trailRef}>
        <bufferGeometry ref={trailGeomRef} />
        <primitive object={trailMaterial} attach="material" />
      </lineSegments>

      <points ref={pointsRef}>
        <bufferGeometry ref={geometryRef} />
        <primitive object={pointMaterial} attach="material" />
      </points>

      {!loaded && (
        <mesh visible={false} />
      )}
    </group>
  );
}

