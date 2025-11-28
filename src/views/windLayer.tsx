import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToCartesian } from '../utils/geo';

// 风场接口：传入经度 lon（-180..180）和纬度 lat（-90..90），返回 {u, v}（m/s）
// 你可以把这个函数替换为真实的 GFS / ECMWF 插值函数
function sampleField(lon: number, lat: number) {
  // 一个示例合成场：赤道附近向东，南北半球有些摆动
  const u = 8 * Math.cos((lat / 90) * Math.PI) * Math.cos((lon / 180) * Math.PI);
  const v = 4 * Math.sin((lon / 180) * Math.PI) * Math.sin((lat / 90) * Math.PI);
  return { u, v };
}

type WindLayerProps = {
  radius?: number;
  particleCount?: number;
  speedScale?: number; // 风速到角度/经纬移动的缩放（经验值）
  trailLength?: number; // 拖尾长度（历史位置数量）
};

export function WindParticles({ 
  radius = 1.6, 
  particleCount = 6000, 
  speedScale = 0.0012,
  trailLength = 15 // 每个粒子保存15个历史位置
}: WindLayerProps = {}) {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);

  // 每个粒子记录：lon, lat, age
  const particles = useMemo(() => {
    const arr: Float32Array = new Float32Array(particleCount * 3); // lon, lat, age
    for (let i = 0; i < particleCount; i++) {
      const lon = (Math.random() * 360 - 180);
      const lat = (Math.random() * 180 - 90);
      const age = Math.random() * 1000;
      arr[i * 3 + 0] = lon;
      arr[i * 3 + 1] = lat;
      arr[i * 3 + 2] = age;
    }
    return arr;
  }, [particleCount]);

  // 用来给 GPU 绘制的坐标缓存
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const speeds = useMemo(() => new Float32Array(particleCount), [particleCount]);

  // 拖尾历史位置：每个粒子保存 trailLength 个历史位置
  // 格式：[particle0_pos0, particle0_pos1, ..., particle0_posN, particle1_pos0, ...]
  const trailHistory = useRef<Float32Array[]>([]);
  
  // 初始化拖尾历史
  useEffect(() => {
    trailHistory.current = [];
    for (let i = 0; i < particleCount; i++) {
      const trail = new Float32Array(trailLength * 3);
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      const p = latLonToCartesian(lat, lon, radius + 0.002);
      // 初始化所有历史位置为当前位置
      for (let j = 0; j < trailLength; j++) {
        trail[j * 3 + 0] = p.x;
        trail[j * 3 + 1] = p.y;
        trail[j * 3 + 2] = p.z;
      }
      trailHistory.current.push(trail);
    }
  }, [particleCount, particles, radius, trailLength]);

  // geometry refs
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const trailGeometryRef = useRef<THREE.BufferGeometry>(null);

  // 拖尾线条的顶点数据（每条拖尾需要 trailLength 个线段，每个线段2个顶点）
  const trailPositions = useMemo(() => 
    new Float32Array(particleCount * (trailLength - 1) * 2 * 3), 
    [particleCount, trailLength]
  );
  const trailColors = useMemo(() => 
    new Float32Array(particleCount * (trailLength - 1) * 2 * 3), 
    [particleCount, trailLength]
  );

  // 初始化 positions
  useEffect(() => {
    if (!geometryRef.current) return;
    
    for (let i = 0; i < particleCount; i++) {
      const lon = particles[i * 3 + 0];
      const lat = particles[i * 3 + 1];
      const p = latLonToCartesian(lat, lon, radius + 0.002); // 注意：latLonToCartesian 的参数顺序是 (lat, lon, radius)
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      speeds[i] = 0;
    }
    
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometryRef.current.attributes.position.needsUpdate = true;
  }, [particleCount, particles, positions, speeds, radius]);

  // 初始化拖尾 geometry
  useEffect(() => {
    if (!trailGeometryRef.current) return;
    
    trailGeometryRef.current.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometryRef.current.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    trailGeometryRef.current.attributes.position.needsUpdate = true;
  }, [trailPositions, trailColors]);

  // update loop
  useFrame((_state, delta) => {
    if (!geometryRef.current || !trailGeometryRef.current) return;
    
    const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
    const speedAttr = geometryRef.current.attributes.aSpeed as THREE.BufferAttribute;
    const trailPosAttr = trailGeometryRef.current.attributes.position as THREE.BufferAttribute;
    const trailColorAttr = trailGeometryRef.current.attributes.color as THREE.BufferAttribute;

    // 计算速度到颜色的映射函数
    const speedToColor = (speed: number): [number, number, number] => {
      if (speed < 2.0) return [0.15, 0.5, 0.8];
      if (speed < 6.0) return [0.35, 0.7, 0.6];
      if (speed < 10.0) return [0.9, 0.8, 0.3];
      return [0.9, 0.35, 0.2];
    };

    for (let i = 0; i < particleCount; i++) {
      let lon = particles[i * 3 + 0];
      let lat = particles[i * 3 + 1];
      let age = particles[i * 3 + 2];

      // 获取风速向量（u: 东向, v: 北向）
      const w = sampleField(lon, lat);

      // 将风场速度映射成经纬度变化量（经验值）
      // u (m/s) -> dLon (deg) ; v (m/s) -> dLat (deg)
      // 注意：经度角度变化需要除以 cos(lat) 的尺度因子
      const dLat = w.v * speedScale * (180 / Math.PI);
      const dLon = (w.u * speedScale * (180 / Math.PI)) / Math.max(0.0001, Math.cos((lat * Math.PI) / 180));

      lon += dLon * delta * 60; // delta*60 把秒尺度拉到每分钟级（可调）
      lat += dLat * delta * 60;
      age += 1;

      // 计算速度用于颜色映射
      const spd = Math.sqrt(w.u * w.u + w.v * w.v);

      // 超出范围或寿命到则重置
      let resetTrail = false;
      if (lat > 90 || lat < -90 || lon > 180 || lon < -180 || age > 6000) {
        lon = Math.random() * 360 - 180;
        lat = Math.random() * 180 - 90;
        age = 0;
        resetTrail = true;
      }

      particles[i * 3 + 0] = lon;
      particles[i * 3 + 1] = lat;
      particles[i * 3 + 2] = age;

      // 计算新的 3D 位置
      const newPos = latLonToCartesian(lat, lon, radius + 0.002); // 注意参数顺序
      posAttr.array[i * 3 + 0] = newPos.x;
      posAttr.array[i * 3 + 1] = newPos.y;
      posAttr.array[i * 3 + 2] = newPos.z;

      // 速度作为属性，后面可用于 shader 映射颜色
      speedAttr.array[i] = spd;

      // 更新拖尾历史
      const trail = trailHistory.current[i];
      
      if (resetTrail) {
        // 重置时，所有历史位置设为当前位置
        for (let j = 0; j < trailLength; j++) {
          trail[j * 3 + 0] = newPos.x;
          trail[j * 3 + 1] = newPos.y;
          trail[j * 3 + 2] = newPos.z;
        }
      } else {
        // 将新位置添加到历史的最前面，移除最旧的位置
        // 向后移动所有历史位置
        for (let j = trailLength - 1; j > 0; j--) {
          trail[j * 3 + 0] = trail[(j - 1) * 3 + 0];
          trail[j * 3 + 1] = trail[(j - 1) * 3 + 1];
          trail[j * 3 + 2] = trail[(j - 1) * 3 + 2];
        }
        // 添加新位置
        trail[0] = newPos.x;
        trail[1] = newPos.y;
        trail[2] = newPos.z;
      }

      // 将拖尾历史转换为线段顶点
      // 每条拖尾有 (trailLength - 1) 个线段，每个线段2个顶点
      const trailBaseIndex = i * (trailLength - 1) * 2;
      const [baseR, baseG, baseB] = speedToColor(spd);

      for (let j = 0; j < trailLength - 1; j++) {
        const segmentIndex = trailBaseIndex + j * 2;
        const t = j / (trailLength - 1); // 0 到 1，0 是最新，1 是最旧
        
        // 渐隐透明度：使用平滑的指数衰减
        // 使用 smoothstep 和指数衰减组合，让拖尾更自然
        const smoothT = t * t * (3.0 - 2.0 * t); // smoothstep 函数
        const alpha = Math.max(0, Math.pow(1.0 - smoothT, 1.5)); // 指数衰减
        
        // 线段起点
        trailPosAttr.array[segmentIndex * 3 + 0] = trail[j * 3 + 0];
        trailPosAttr.array[segmentIndex * 3 + 1] = trail[j * 3 + 1];
        trailPosAttr.array[segmentIndex * 3 + 2] = trail[j * 3 + 2];
        
        // 线段终点
        trailPosAttr.array[(segmentIndex + 1) * 3 + 0] = trail[(j + 1) * 3 + 0];
        trailPosAttr.array[(segmentIndex + 1) * 3 + 1] = trail[(j + 1) * 3 + 1];
        trailPosAttr.array[(segmentIndex + 1) * 3 + 2] = trail[(j + 1) * 3 + 2];

        // 设置颜色（带透明度，AdditiveBlending 模式下颜色值会被叠加）
        const color = [baseR * alpha * 0.5, baseG * alpha * 0.5, baseB * alpha * 0.5];
        
        // 起点颜色
        trailColorAttr.array[segmentIndex * 3 + 0] = color[0];
        trailColorAttr.array[segmentIndex * 3 + 1] = color[1];
        trailColorAttr.array[segmentIndex * 3 + 2] = color[2];
        
        // 终点颜色（稍微更透明）
        const tNext = (j + 1) / (trailLength - 1);
        const smoothTNext = tNext * tNext * (3.0 - 2.0 * tNext);
        const alphaNext = Math.max(0, Math.pow(1.0 - smoothTNext, 1.5));
        const colorNext = [baseR * alphaNext * 0.5, baseG * alphaNext * 0.5, baseB * alphaNext * 0.5];
        trailColorAttr.array[(segmentIndex + 1) * 3 + 0] = colorNext[0];
        trailColorAttr.array[(segmentIndex + 1) * 3 + 1] = colorNext[1];
        trailColorAttr.array[(segmentIndex + 1) * 3 + 2] = colorNext[2];
      }
    }

    posAttr.needsUpdate = true;
    speedAttr.needsUpdate = true;
    trailPosAttr.needsUpdate = true;
    trailColorAttr.needsUpdate = true;
  });

  // Points material 使用 shader 来根据速度映射颜色（可定制）
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        size: { value: 0.012 },
        pointScale: { value: 300 },
      },
      vertexShader: `
        uniform float size;
        attribute float aSpeed;
        varying float vSpeed;
        void main() {
          vSpeed = aSpeed;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vSpeed;
        // 简单速度到色彩映射
        vec3 colorFor(float s) {
          if (s < 2.0) return vec3(0.15, 0.5, 0.8);
          if (s < 6.0) return vec3(0.35, 0.7, 0.6);
          if (s < 10.0) return vec3(0.9, 0.8, 0.3);
          return vec3(0.9, 0.35, 0.2);
        }
        void main() {
          float a = 1.0;
          vec3 c = colorFor(vSpeed);
          // 软圆点
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, r);
          gl_FragColor = vec4(c, alpha * 0.9);
        }
      `,
    });
    return mat;
  }, []);

  // 拖尾线条 material（使用顶点颜色，通过 RGB 值缩放实现透明度）
  const trailMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      linewidth: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // 叠加混合模式，让拖尾更亮
    });
  }, []);

  return (
    <group>
      {/* 拖尾线条 */}
      <lineSegments ref={linesRef} frustumCulled={false} renderOrder={99}>
        <bufferGeometry ref={trailGeometryRef} />
        <primitive object={trailMaterial} attach="material" />
      </lineSegments>
      {/* 粒子点 */}
      <points ref={pointsRef} frustumCulled={false} renderOrder={100}>
        <bufferGeometry ref={geometryRef} />
        <primitive object={material} attach="material" />
      </points>
    </group>
  );
}
