// TemperatureLayer.tsx
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { latLonToCartesian } from '../utils/geo';

type TemperatureLayerProps = {
  radius?: number;
  // 温度范围（用于颜色映射）
  minTemp?: number; // e.g. -40
  maxTemp?: number; // e.g.  50 (提高以容纳更高的赤道温度)
  opacity?: number;
  showTemperatureLabels?: boolean; // 是否显示温度标签
};

export function TemperatureLayer({
  radius = 1.6,
  minTemp = -40,
  maxTemp = 50, // 提高最大值以容纳更高的赤道温度
  opacity = 0.75,
  showTemperatureLabels = false,
}: TemperatureLayerProps) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uMinTemp: { value: minTemp },
        uMaxTemp: { value: maxTemp },
        uOpacity: { value: opacity },
        uTime: { value: 0 }, // 用于季节变化动画
        uRadius: { value: radius }, // 用于边缘柔化
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;

        void main() {
          // 把顶点位置转换到世界坐标（包含父级旋转）
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          // 同时保存局部坐标（用于正确的经纬度计算）
          vLocalPosition = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;

        uniform float uMinTemp;
        uniform float uMaxTemp;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uRadius;

        const float PI = 3.141592653589793;

        // 工具：世界坐标 -> 经纬度（度）
        vec2 worldToLatLon(vec3 p) {
          vec3 n = normalize(p);
          float lat = asin(n.y) * 180.0 / PI;
          float lon = atan(n.z, -n.x) * 180.0 / PI - 180.0;
          return vec2(lat, lon);
        }

        // 简单的噪声函数（用于模拟自然变化）
        float noise2D(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // 平滑噪声
        float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = noise2D(i);
          float b = noise2D(i + vec2(1.0, 0.0));
          float c = noise2D(i + vec2(0.0, 1.0));
          float d = noise2D(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // 分形噪声（多层叠加）
        float fractalNoise(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for (int i = 0; i < 4; i++) {
            value += amplitude * smoothNoise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          
          return value;
        }

        // 判断是否为海洋区域（简化：基于经度模式）
        float isOcean(float lon, float lat) {
          // 模拟主要海洋区域
          // 太平洋：大致在 -180 到 -60 和 120 到 180 经度
          // 大西洋：大致在 -60 到 20 经度
          // 印度洋：大致在 20 到 120 经度
          float oceanPattern = sin((lon + 60.0) * PI / 180.0) * 0.5 + 0.5;
          
          // 高纬度地区海洋比例更高
          float latFactor = 1.0 - abs(lat) / 90.0;
          return mix(0.3, 0.7, latFactor) * oceanPattern;
        }

        // 改进的温度场函数：更真实的温度分布
        float sampleTemp(float lon, float lat) {
          float latRad = lat * PI / 180.0;
          float lonRad = lon * PI / 180.0;
          
          // 1. 基础温度：纬度效应（赤道热，两极冷）
          // 赤道约 38°C，两极约 -25°C（提高赤道温度）
          float baseTemp = 38.0 * cos(latRad) - 15.0;
          
          // 赤道增强：在赤道附近（-10°到10°）额外增加温度
          float equatorBoost = 0.0;
          if (abs(lat) < 10.0) {
            float equatorFactor = 1.0 - abs(lat) / 10.0; // 赤道为1，10°为0
            equatorBoost = 8.0 * equatorFactor; // 赤道额外增加8°C
          }
          
          // 2. 季节效应：模拟南北半球季节差异
          // 使用时间参数模拟季节变化（简化：基于纬度）
          float seasonPhase = uTime * 0.1; // 季节变化速度
          float seasonEffect = 8.0 * sin(seasonPhase + latRad) * cos(latRad);
          
          // 3. 海洋/大陆效应
          // 海洋温度变化小，大陆温度变化大
          float oceanFactor = isOcean(lon, lat);
          float continentEffect = (1.0 - oceanFactor) * 12.0 * sin(lonRad * 2.0) * (1.0 - abs(lat / 90.0));
          float oceanModeration = oceanFactor * (-5.0); // 海洋温度更稳定
          
          // 4. 海拔效应：模拟高海拔地区温度较低
          // 使用噪声模拟地形
          float altitudeNoise = fractalNoise(vec2(lon * 0.1, lat * 0.1));
          float altitudeEffect = -8.0 * altitudeNoise * (1.0 - abs(lat / 90.0));
          
          // 5. 洋流效应：模拟暖流和寒流
          // 北大西洋暖流（约 0-30°W, 40-70°N）
          float gulfStream = 0.0;
          if (lon > -30.0 && lon < 0.0 && lat > 40.0 && lat < 70.0) {
            gulfStream = 5.0 * (1.0 - abs(lon + 15.0) / 15.0);
          }
          
          // 6. 自然波动：使用分形噪声模拟小尺度变化
          float naturalVariation = 3.0 * (fractalNoise(vec2(lon * 0.05, lat * 0.05)) - 0.5);
          
          // 7. 极地效应：两极地区温度更低
          float polarEffect = -15.0 * pow(abs(lat) / 90.0, 3.0);
          
          // 组合所有效应
          float temp = baseTemp 
                     + equatorBoost
                     + seasonEffect 
                     + continentEffect 
                     + oceanModeration 
                     + altitudeEffect 
                     + gulfStream 
                     + naturalVariation 
                     + polarEffect;
          
          return temp;
        }

        // 平滑的温度采样（多采样平均，减少突变）
        float smoothSampleTemp(float lon, float lat) {
          float temp = sampleTemp(lon, lat);
          
          // 对周围点进行采样并加权平均
          float offset = 0.8; // 采样偏移（度）
          float temp1 = sampleTemp(lon + offset, lat);
          float temp2 = sampleTemp(lon - offset, lat);
          float temp3 = sampleTemp(lon, lat + offset);
          float temp4 = sampleTemp(lon, lat - offset);
          
          // 加权平均：中心点权重更高
          return (temp * 0.5 + (temp1 + temp2 + temp3 + temp4) * 0.125);
        }

        // 将温度（摄氏度）映射为 0..1
        float normalizeTemp(float t) {
          return clamp((t - uMinTemp) / (uMaxTemp - uMinTemp), 0.0, 1.0);
        }

        // 改进的颜色映射：更平滑的过渡，类似真实温度图（柔和色调）
        vec3 colorRamp(float x) {
          x = clamp(x, 0.0, 1.0);
          
          // 使用 smoothstep 实现更平滑的过渡
          // 定义关键颜色点（降低亮度，更柔和的色调）
          vec3 color0 = vec3(0.0, 0.0, 0.25);      // 深蓝（极冷 < -30°C）
          vec3 color1 = vec3(0.08, 0.15, 0.5);      // 蓝（-30°C ~ -20°C）
          vec3 color2 = vec3(0.15, 0.35, 0.65);     // 浅蓝（-20°C ~ -10°C）
          vec3 color3 = vec3(0.2, 0.5, 0.7);        // 青蓝（-10°C ~ 0°C）
          vec3 color4 = vec3(0.25, 0.6, 0.7);       // 青色（0°C ~ 10°C）
          vec3 color5 = vec3(0.2, 0.65, 0.45);     // 青绿（10°C ~ 15°C）
          vec3 color6 = vec3(0.35, 0.7, 0.3);       // 绿色（15°C ~ 20°C）
          vec3 color7 = vec3(0.6, 0.75, 0.25);      // 黄绿（20°C ~ 25°C）
          vec3 color8 = vec3(0.75, 0.7, 0.2);       // 黄色（25°C ~ 30°C）
          vec3 color9 = vec3(0.8, 0.5, 0.15);       // 橙色（30°C ~ 35°C）
          vec3 color10 = vec3(0.75, 0.35, 0.2);     // 红橙（35°C ~ 40°C）
          vec3 color11 = vec3(0.6, 0.2, 0.2);      // 红色（> 40°C）
          
          // 分段插值，使用 smoothstep 让过渡更自然
          if (x < 0.083) {
            float t = smoothstep(0.0, 0.083, x);
            return mix(color0, color1, t);
          } else if (x < 0.167) {
            float t = smoothstep(0.083, 0.167, x);
            return mix(color1, color2, t);
          } else if (x < 0.25) {
            float t = smoothstep(0.167, 0.25, x);
            return mix(color2, color3, t);
          } else if (x < 0.333) {
            float t = smoothstep(0.25, 0.333, x);
            return mix(color3, color4, t);
          } else if (x < 0.417) {
            float t = smoothstep(0.333, 0.417, x);
            return mix(color4, color5, t);
          } else if (x < 0.5) {
            float t = smoothstep(0.417, 0.5, x);
            return mix(color5, color6, t);
          } else if (x < 0.583) {
            float t = smoothstep(0.5, 0.583, x);
            return mix(color6, color7, t);
          } else if (x < 0.667) {
            float t = smoothstep(0.583, 0.667, x);
            return mix(color7, color8, t);
          } else if (x < 0.75) {
            float t = smoothstep(0.667, 0.75, x);
            return mix(color8, color9, t);
          } else if (x < 0.833) {
            float t = smoothstep(0.75, 0.833, x);
            return mix(color9, color10, t);
          } else {
            float t = smoothstep(0.833, 1.0, x);
            return mix(color10, color11, t);
          }
        }

        void main() {
          // 1. 使用局部坐标计算经纬度（确保跟随地球旋转）
          // 因为温度图层是地球的子对象，局部坐标会随着地球旋转而旋转
          vec2 latlon = worldToLatLon(vLocalPosition);
          float lat = latlon.x;
          float lon = latlon.y;

          // 2. 平滑采样温度
          float tempC = smoothSampleTemp(lon, lat);

          // 3. 映射到 0..1
          float tNorm = normalizeTemp(tempC);

          // 4. 映射到颜色
          vec3 color = colorRamp(tNorm);
          
          // 4.5. 进一步降低颜色亮度，使色调更柔和
          color = color * 0.85; // 降低15%的亮度

          // 5. 边缘柔化：基于距离中心的距离（使用局部坐标）
          float distFromCenter = length(vLocalPosition);
          float edgeFade = smoothstep(uRadius * 0.98, uRadius * 1.02, distFromCenter);
          
          // 6. 组合透明度（稍微降低基础透明度）
          float alpha = uOpacity * (0.7 + 0.2 * edgeFade);

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [minTemp, maxTemp, opacity, radius]);

  // 更新时间动画（季节变化）
  useFrame((_state, delta) => {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value += delta * 0.1; // 控制季节变化速度
    }
    // 更新其他 uniforms（当 props 改变时）
    if (material.uniforms.uMinTemp) material.uniforms.uMinTemp.value = minTemp;
    if (material.uniforms.uMaxTemp) material.uniforms.uMaxTemp.value = maxTemp;
    if (material.uniforms.uOpacity) material.uniforms.uOpacity.value = opacity;
    if (material.uniforms.uRadius) material.uniforms.uRadius.value = radius;
  });

  // 温度计算函数（用于显示标签，简化版）
  const calculateTemperature = (lon: number, lat: number, time: number): number => {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    
    // 基础温度（与 shader 保持一致）
    const baseTemp = 38.0 * Math.cos(latRad) - 15.0;
    
    // 赤道增强
    let equatorBoost = 0;
    if (Math.abs(lat) < 10) {
      const equatorFactor = 1.0 - Math.abs(lat) / 10.0;
      equatorBoost = 8.0 * equatorFactor;
    }
    
    // 季节效应
    const seasonPhase = time * 0.1;
    const seasonEffect = 8.0 * Math.sin(seasonPhase + latRad) * Math.cos(latRad);
    
    // 简化的大陆效应
    const continentEffect = 6.0 * Math.sin(lonRad * 2.0) * (1.0 - Math.abs(lat) / 90.0);
    
    // 极地效应
    const polarEffect = -15.0 * Math.pow(Math.abs(lat) / 90.0, 3);
    
    return baseTemp + equatorBoost + seasonEffect + continentEffect + polarEffect;
  };

  // 关键位置（用于显示温度标签）
  const temperaturePoints = useMemo(() => {
    const points = [
      { lat: 0, lon: 0, name: '赤道' }, // 赤道中心
      { lat: 0, lon: 120, name: '赤道' }, // 赤道东
      { lat: 0, lon: -60, name: '赤道' }, // 赤道西
      { lat: 30, lon: 120, name: '亚热带' }, // 中国南部
      { lat: -30, lon: 150, name: '亚热带' }, // 澳大利亚
      { lat: 40, lon: -74, name: '温带' }, // 纽约
      { lat: 51, lon: 0, name: '温带' }, // 伦敦
      { lat: 60, lon: 30, name: '寒带' }, // 圣彼得堡
      { lat: -60, lon: 0, name: '寒带' }, // 南极附近
    ];
    return points;
  }, []);

  return (
    <group>
      <mesh>
        {/* 用一个比地球略大一点的球体，避免 z-fighting，增加细分提高质量 */}
        <sphereGeometry args={[radius + 0.003, 128, 128]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* 温度标签 */}
      {showTemperatureLabels && (
        <TemperatureLabels
          points={temperaturePoints}
          radius={radius}
          calculateTemperature={calculateTemperature}
          material={material}
        />
      )}
    </group>
  );
}

// 温度标签组件
function TemperatureLabels({
  points,
  radius,
  calculateTemperature,
  material,
}: {
  points: Array<{ lat: number; lon: number; name: string }>;
  radius: number;
  calculateTemperature: (lon: number, lat: number, time: number) => number;
  material: THREE.ShaderMaterial;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    // 标签始终面向相机
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Group) {
        child.lookAt(camera.position);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {points.map((point, index) => {
        const position = latLonToCartesian(point.lat, point.lon, radius + 0.01);
        const time = material.uniforms.uTime?.value || 0;
        const temp = calculateTemperature(point.lon, point.lat, time);
        
        return (
          <TemperatureLabel
            key={index}
            position={position}
            temperature={temp}
          />
        );
      })}
    </group>
  );
}

// 单个温度标签
function TemperatureLabel({
  position,
  temperature,
}: {
  position: THREE.Vector3;
  temperature: number;
}) {
  const tempText = `${Math.round(temperature)}°C`;
  const color = temperature > 30 ? '#ff6b6b' : temperature > 20 ? '#ffa500' : temperature > 10 ? '#4ecdc4' : '#6c9bcf';

  return (
    <group position={[position.x, position.y, position.z]}>
      <Text
        fontSize={0.015}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.002}
        outlineColor="#000000"
        maxWidth={0.2}
        renderOrder={100}
      >
        {tempText}
      </Text>
    </group>
  );
}
