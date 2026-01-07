// WindLayer.tsx
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToCartesian } from '../utils/geo'; 

// ---- 配置 ----
const DATA_URL = 'https://arvis.oss-cn-chengdu.aliyuncs.com/current-wind-surface-level-gfs-1.0.json';
// 提高默认粒子数量，让整体风场更加“饱满”
const DEFAULT_PARTICLE_COUNT = 16000;
const DEFAULT_TRAIL = 12;
const DEFAULT_RADIUS = 1.6;

// ---- 类型 ----
type GribHeader = {
  nx?: number; ny?: number;
  lo1?: number; lo2?: number; la1?: number; la2?: number;
  dx?: number; dy?: number;
  numberPoints?: number;
  shapeName?: string;
  // 其它字段略
};

type GribData = {
  header: GribHeader;
  data: number[];
};

// 表示可插值风场
type WindField = {
  interpolate: (lon: number, lat: number) => { u: number; v: number } | null;
  earthRadiusMeters: number;
};

// ---- 帮助函数：把 GRIB2 JSON 转成可插值字段 ----
function buildWindFieldFromGrib(gribArray: GribData[]): WindField | null {
  if (!gribArray || gribArray.length < 2) return null;

  // 找到 U 和 V 分量（parameterNumber 2/3 常见），但是我们这里假设上传数据第一是 U，第二是 V（或通过 header 判断）。
  const uItem = gribArray[0];
  const vItem = gribArray[1];

  const uHeader = uItem.header;
  const nx = uHeader.nx ?? 360;
  const ny = uHeader.ny ?? 181;
  const lon0 = uHeader.lo1 ?? 0;
  const lat0 = uHeader.la1 ?? 90;
  const lat2 = uHeader.la2 ?? -90;
  const dx = uHeader.dx ?? 1;
  const dy = uHeader.dy ?? (lat2 < lat0 ? -1 : 1);

  // GRIB 给的地球半径信息通常在 shapeName 或者其他字段里，但我们使用常见值（NCEP 用 6371229）
  const earthRadiusMeters = 6371229;

  // data starts from la1 (通常为北纬90) -> 顺序为从北到南
  const dataStartsFromNorth = (uHeader.la1 ?? 90) > (uHeader.la2 ?? -90);

  // 计算 lon/lat 范围
  const lonMin = lon0;
  const latMax = Math.max(lat0, lat2);
  const latMin = Math.min(lat0, lat2);

  // 包装 index 与取值（支持经度环绕）
  function idx(i: number, j: number) {
    // i: 0..nx-1, j: 0..ny-1
    const ii = ((i % nx) + nx) % nx;
    const jj = Math.max(0, Math.min(ny - 1, j));
    return jj * nx + ii;
  }

  function bilinear(grid: GribData, lon: number, lat: number) {
    // 把 lon 规范为 [lonMin, lonMin+360)
    let lambda = lon;
    if (lambda < lonMin) lambda += 360;
    if (lambda > lonMin + 360) lambda -= 360;

    // x 索引（经度）
    const x = (lambda - lonMin) / dx;
    const i0 = Math.floor(x);
    const fi = x - i0;

    // y 索引（纬度）
    // 注意数据可能从北到南
    let yIndex;
    if (dataStartsFromNorth) {
      // latMax ... latMin
      yIndex = (latMax - lat) / Math.abs(dy);
    } else {
      yIndex = (lat - latMin) / Math.abs(dy);
    }
    const j0 = Math.floor(yIndex);
    const fj = yIndex - j0;

    const i1 = i0 + 1;
    const j1 = j0 + 1;

    // 边界保护
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
    const vv = v0 * (1 - fj) + v1 * fj;
    return vv;
  }

  const field: WindField = {
    earthRadiusMeters,
    interpolate(lon: number, lat: number) {
      // 检查范围
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      const u = bilinear(uItem, lon, lat);
      const v = bilinear(vItem, lon, lat);
      if (Number.isNaN(u) || Number.isNaN(v)) return null;
      return { u, v };
    }
  };

  return field;
}

// ---- RK4 积分器（在经纬坐标上推进粒子） ----
// 输入：lon, lat (deg), dt (s), field.interpolate 返回 u(m/s)东向, v(m/s)北向
function advectRK4(lon: number, lat: number, dt: number, field: WindField | null) {
  if (!field) return { lon, lat };

  const R = field.earthRadiusMeters;
  const mPerDeg = Math.PI * R / 180.0; // 米/度

  function velocityAt(lon_: number, lat_: number) {
    const w = field?.interpolate(lon_, lat_);
    if (!w) return { dlon: 0, dlat: 0 };
    // 将 m/s 转成 deg/s
    // dLat = v (m/s) / mPerDeg
    // dLon = u (m/s) / (mPerDeg * cos(lat))
    const latRad = lat_ * Math.PI / 180;
    const dlat = w.v / mPerDeg;
    const cosLat = Math.max(1e-6, Math.cos(latRad));
    const dlon = w.u / (mPerDeg * cosLat);
    return { dlon, dlat };
  }

  // RK4
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

  // wrap lon
  if (newLon < -180) newLon += 360;
  if (newLon > 180) newLon -= 360;
  // clamp lat a bit inside
  if (newLat > 90) newLat = 90;
  if (newLat < -90) newLat = -90;

  return { lon: newLon, lat: newLat };
}

// ---- 主组件 ----
export function WindLayer({
  radius = DEFAULT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  speedScale = 1.0, // 放大风速用的系数（默认 1）
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

  const [field, setField] = useState<WindField | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 加载风数据
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetch(DATA_URL);
        if (!resp.ok) {
          console.warn('Wind data load failed, use simulated fallback');
          return;
        }
        const json = await resp.json() as GribData[];
        if (cancelled) return;
        const f = buildWindFieldFromGrib(json);
        if (f) {
          setField(f);
          setLoaded(true);
          console.log('[WindLayer] wind field built');
        } else {
          console.warn('[WindLayer] buildWindFieldFromGrib failed');
        }
      } catch (e) {
        console.warn('[WindLayer] load error', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // 粒子经纬与 age，存在内存中（非 state）
  const particles = useMemo(() => {
    const arr = new Float32Array(particleCount * 3); // lon, lat, age
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3 + 0] = (Math.random() * 360 - 180); // lon
      arr[i * 3 + 1] = (Math.random() * 180 - 90);  // lat
      arr[i * 3 + 2] = Math.random() * 1000;        // age
    }
    return arr;
  }, [particleCount]);

  // 当前点在三维空间的位置 buffer（送给 THREE.Points）
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const speeds = useMemo(() => new Float32Array(particleCount), [particleCount]);

  // 拖尾历史（每个粒子 trailLength 个 vec3）
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

  // trail buffer arrays
  const trailPositions = useMemo(() => new Float32Array(particleCount * (trailLength - 1) * 2 * 3), [particleCount, trailLength]);
  const trailColors = useMemo(() => new Float32Array(particleCount * (trailLength - 1) * 2 * 3), [particleCount, trailLength]);

  // 初始设置 geometry attribute
  useEffect(() => {
    if (!geometryRef.current) {
      geometryRef.current = new THREE.BufferGeometry();
    }
    if (!trailGeomRef.current) {
      trailGeomRef.current = new THREE.BufferGeometry();
    }

    // 初始化 positions（映射经纬 -> 三维）
    for (let i = 0; i < particleCount; i++) {
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      const p = latLonToCartesian(lat, lon, radius + 0.002);
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      speeds[i] = 0;
    }
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    trailGeomRef.current.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeomRef.current.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
  }, [particleCount, positions, speeds, trailPositions, trailColors, radius, particles]);

  // update loop
  useFrame((_state, delta) => {
    if (!geometryRef.current || !trailGeomRef.current) return;

    const posAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute;
    const speedAttr = geometryRef.current.getAttribute('aSpeed') as THREE.BufferAttribute;
    const trailPosAttr = trailGeomRef.current.getAttribute('position') as THREE.BufferAttribute;
    const trailColorAttr = trailGeomRef.current.getAttribute('color') as THREE.BufferAttribute;

    // 时间步：用 delta（s）乘以一个放大因子，使粒子移动在可视范围
    // 这里让 speedScale 控制每秒的倍增（经验值），不要太大
    const dt = delta * 15.0 * speedScale * 1500; // speedScale 可调（1 默认）

    for (let i = 0; i < particleCount; i++) {
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      let age = particles[i * 3 + 2];

      // RK4 推进
      const adv = advectRK4(lon, lat, dt, field);
      // 若 field 为 null（未加载），advectRK4 会返回原坐标 -> fallback 使用简单合成风
      let newLon = adv.lon;
      let newLat = adv.lat;

      // 少量随机扰动，打破同步
      newLon += (Math.random() - 0.5) * 0.02;
      newLat += (Math.random() - 0.5) * 0.01;

      age += 1;

      // 重置策略：
      // 1）超出范围
      // 2）age 太大
      // 3）进入涡心（局部风速几乎为 0） -> 立即“死亡重生”
      let reset = false;

      // 判断是否进入涡心：当前位置风速很小
      let isInVortex = false;
      if (field) {
        const wLocal = field.interpolate(newLon, newLat);
        if (wLocal) {
          const speedLocal = Math.sqrt(wLocal.u * wLocal.u + wLocal.v * wLocal.v);
          const VORTEX_SPEED_THRESHOLD = 0.5; // m/s 以下认为是涡心/停滞区
          if (speedLocal < VORTEX_SPEED_THRESHOLD) {
            isInVortex = true;
          }
        }
      }

      // 将最大寿命从 9000 大幅降低到 1200，让粒子更频繁「死亡-重生」
      const MAX_AGE = 1200;
      if (
        newLat > 90 ||
        newLat < -90 ||
        newLon > 180 ||
        newLon < -180 ||
        age > MAX_AGE ||
        isInVortex
      ) {
        newLon = (Math.random() * 360 - 180);
        newLat = (Math.random() * 180 - 90);
        age = 0;
        reset = true;
      }

      particles[i * 3 + 0] = newLon;
      particles[i * 3 + 1] = newLat;
      particles[i * 3 + 2] = age;

      // 计算三维位置写回 buffer
      const p3 = latLonToCartesian(newLat, newLon, radius + 0.002);
      posAttr.array[i * 3 + 0] = p3.x;
      posAttr.array[i * 3 + 1] = p3.y;
      posAttr.array[i * 3 + 2] = p3.z;

      // 速度值用于着色（从 field 直接取）
      let spd = 0;
      if (field) {
        const w = field.interpolate(newLon, newLat);
        if (w) spd = Math.sqrt(w.u * w.u + w.v * w.v);
      }
      speedAttr.array[i] = spd;

      // 更新拖尾历史：将新位置放到 trail[0]，移位其余
      const trail = trailHistory.current[i];
      if (!trail) continue;

      if (reset) {
        for (let t = 0; t < trailLength; t++) {
          trail[t * 3 + 0] = p3.x;
          trail[t * 3 + 1] = p3.y;
          trail[t * 3 + 2] = p3.z;
        }
      } else {
        for (let t = trailLength - 1; t > 0; t--) {
          trail[t * 3 + 0] = trail[(t - 1) * 3 + 0];
          trail[t * 3 + 1] = trail[(t - 1) * 3 + 1];
          trail[t * 3 + 2] = trail[(t - 1) * 3 + 2];
        }
        trail[0] = p3.x;
        trail[1] = p3.y;
        trail[2] = p3.z;
      }

      // 把 trail 转为线段顶点（(trailLength-1) 段，每段2顶点）
      const baseIdx = i * (trailLength - 1) * 2 * 3;
      // 颜色渐隐（根据 speed）
      const col = speedToColor(spd);
      for (let t = 0; t < trailLength - 1; t++) {
        const segIdx = baseIdx + t * 2 * 3;
        // 起点
        trailPosAttr.array[segIdx + 0] = trail[t * 3 + 0];
        trailPosAttr.array[segIdx + 1] = trail[t * 3 + 1];
        trailPosAttr.array[segIdx + 2] = trail[t * 3 + 2];
        // 终点
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
    } // end loop particles

    posAttr.needsUpdate = true;
    speedAttr.needsUpdate = true;
    trailPosAttr.needsUpdate = true;
    trailColorAttr.needsUpdate = true;
  });

  // 速度->颜色（可按需修改色谱）
  function speedToColor(s: number): [number, number, number] {
    if (s < 2) return [0.15, 0.5, 0.8];
    if (s < 6) return [0.35, 0.7, 0.6];
    if (s < 12) return [0.9, 0.8, 0.3];
    return [0.9, 0.35, 0.2];
  }

  // materials
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
        attribute float aSpeed;
        varying float vSpeed;
        void main() {
          vSpeed = aSpeed;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vSpeed;
        vec3 colorFor(float s) {
          if (s < 2.0) return vec3(0.15,0.5,0.8);
          if (s < 6.0) return vec3(0.35,0.7,0.6);
          if (s < 12.0) return vec3(0.9,0.8,0.3);
          return vec3(0.9,0.35,0.2);
        }
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, r);
          vec3 c = colorFor(vSpeed);
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
