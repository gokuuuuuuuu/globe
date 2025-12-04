// TemperatureLayer.tsx
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { latLonToCartesian } from '../utils/geo';

// ---- 配置 ----
const DATA_URL = '/data/weather/current/current-tmp-surface-level-gfs-1.0.json';

// ---- 类型 ----
type GribHeader = {
  nx?: number; ny?: number;
  lo1?: number; lo2?: number; la1?: number; la2?: number;
  dx?: number; dy?: number;
  numberPoints?: number;
  parameterUnit?: string;
};

type GribData = {
  header: GribHeader;
  data: number[];
};

// 表示可插值温度场
type TemperatureField = {
  interpolate: (lon: number, lat: number) => number | null;
  minTemp: number;
  maxTemp: number;
};

// ---- 帮助函数：把 GRIB2 JSON 转成可插值字段 ----
function buildTemperatureFieldFromGrib(gribArray: GribData[]): TemperatureField | null {
  if (!gribArray || gribArray.length < 1) return null;

  const tempItem = gribArray[0];
  const header = tempItem.header;
  const nx = header.nx ?? 360;
  const ny = header.ny ?? 181;
  const lon0 = header.lo1 ?? 0;
  const lat0 = header.la1 ?? 90;
  const lat2 = header.la2 ?? -90;
  const dx = header.dx ?? 1;
  const dy = header.dy ?? (lat2 < lat0 ? -1 : 1);

  // 数据从北到南
  const dataStartsFromNorth = (header.la1 ?? 90) > (header.la2 ?? -90);

  // 计算 lon/lat 范围
  const lonMin = lon0;
  const latMax = Math.max(lat0, lat2);
  const latMin = Math.min(lat0, lat2);

  // 包装 index
  function idx(i: number, j: number) {
    const ii = ((i % nx) + nx) % nx;
    const jj = Math.max(0, Math.min(ny - 1, j));
    return jj * nx + ii;
  }

  // 双线性插值
  function bilinear(lon: number, lat: number): number {
    // 规范经度
    let lambda = lon;
    if (lambda < lonMin) lambda += 360;
    if (lambda > lonMin + 360) lambda -= 360;

    // x 索引（经度）
    const x = (lambda - lonMin) / dx;
    const i0 = Math.floor(x);
    const fi = x - i0;

    // y 索引（纬度）
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

    // 边界保护
    const i0c = ((i0 % nx) + nx) % nx;
    const i1c = ((i1 % nx) + nx) % nx;
    const j0c = Math.max(0, Math.min(ny - 1, j0));
    const j1c = Math.max(0, Math.min(ny - 1, j1));

    const v00 = tempItem.data[idx(i0c, j0c)] ?? 0;
    const v10 = tempItem.data[idx(i1c, j0c)] ?? 0;
    const v01 = tempItem.data[idx(i0c, j1c)] ?? 0;
    const v11 = tempItem.data[idx(i1c, j1c)] ?? 0;

    const v0 = v00 * (1 - fi) + v10 * fi;
    const v1 = v01 * (1 - fi) + v11 * fi;
    const vv = v0 * (1 - fj) + v1 * fj;
    return vv;
  }

  // 计算温度范围（开尔文转摄氏度）
  const kelvinToCelsius = (k: number) => k - 273.15;
  const allTemps = tempItem.data.map(kelvinToCelsius).filter(t => !isNaN(t));
  const minTemp = Math.min(...allTemps);
  const maxTemp = Math.max(...allTemps);

  const field: TemperatureField = {
    minTemp,
    maxTemp,
    interpolate(lon: number, lat: number) {
      // 检查范围
      if (lat < Math.min(latMin - 1, -90) || lat > Math.max(latMax + 1, 90)) return null;
      const tempK = bilinear(lon, lat);
      if (Number.isNaN(tempK)) return null;
      // 转换为摄氏度
      return kelvinToCelsius(tempK);
    }
  };

  return field;
}

type TemperatureLayerProps = {
  radius?: number;
  // 温度范围（用于颜色映射，如果未提供则从数据中计算）
  minTemp?: number;
  maxTemp?: number;
  opacity?: number;
  showTemperatureLabels?: boolean;
};

export function TemperatureLayer({
  radius = 1.6,
  minTemp: propMinTemp,
  maxTemp: propMaxTemp,
  opacity = 0.75,
  showTemperatureLabels = false,
}: TemperatureLayerProps) {
  const [temperatureField, setTemperatureField] = useState<TemperatureField | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载温度数据
  useEffect(() => {
    setIsLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then((gribArray: GribData[]) => {
        const field = buildTemperatureFieldFromGrib(gribArray);
        setTemperatureField(field);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load temperature data:', err);
        setIsLoading(false);
      });
  }, []);

  // 使用数据中的温度范围，或使用 props
  const minTemp = propMinTemp ?? (temperatureField?.minTemp ?? -40);
  const maxTemp = propMaxTemp ?? (temperatureField?.maxTemp ?? 50);

  // 创建温度纹理
  const temperatureTexture = useMemo(() => {
    if (!temperatureField) return null;

    // 从 GRIB 数据构建纹理
    // 假设数据是 360x181 的网格
    const nx = 360;
    const ny = 181;
    const size = nx * ny;
    const data = new Float32Array(size * 4); // RGBA 纹理

    // 我们需要从 temperatureField 获取原始数据
    // 但由于我们已经有了插值函数，我们需要重新构建数据数组
    // 更好的方法是直接从 GRIB JSON 构建纹理
    return null; // 暂时返回 null，我们将在 shader 中使用 uniform 数组或纹理
  }, [temperatureField]);

  // 创建温度数据纹理（从 GRIB 数据直接构建）
  const [temperatureDataTexture, setTemperatureDataTexture] = useState<THREE.DataTexture | null>(null);
  const [gribHeader, setGribHeader] = useState<GribHeader | null>(null);

  useEffect(() => {
    if (!temperatureField) return;

    // 重新加载原始数据来构建纹理
    fetch(DATA_URL)
      .then(res => res.json())
      .then((gribArray: GribData[]) => {
        if (!gribArray || gribArray.length < 1) return;

        const tempItem = gribArray[0];
        const header = tempItem.header;
        const nx = header.nx ?? 360;
        const ny = header.ny ?? 181;
        
        // 保存 header 信息用于 shader
        setGribHeader(header);

        // 创建纹理数据（R 通道存储温度，开尔文转摄氏度后归一化）
        const size = nx * ny;
        const data = new Float32Array(size * 4);
        
        const kelvinToCelsius = (k: number) => k - 273.15;
        const actualMin = propMinTemp ?? temperatureField.minTemp;
        const actualMax = propMaxTemp ?? temperatureField.maxTemp;
        const range = actualMax - actualMin;

        for (let i = 0; i < size; i++) {
          const tempK = tempItem.data[i] ?? 0;
          const tempC = kelvinToCelsius(tempK);
          const normalized = range > 0 ? (tempC - actualMin) / range : 0.5;
          // 存储归一化温度到 R 通道
          data[i * 4] = normalized;
          data[i * 4 + 1] = 0;
          data[i * 4 + 2] = 0;
          data[i * 4 + 3] = 1;
        }

        const texture = new THREE.DataTexture(data, nx, ny, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping; // 经度环绕
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        setTemperatureDataTexture(texture);
      })
      .catch(err => {
        console.error('Failed to build temperature texture:', err);
      });
  }, [temperatureField, propMinTemp, propMaxTemp]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uMinTemp: { value: minTemp },
        uMaxTemp: { value: maxTemp },
        uOpacity: { value: opacity },
        uRadius: { value: radius },
        uTemperatureTexture: { value: temperatureDataTexture },
        uTextureSize: { value: new THREE.Vector2(gribHeader?.nx ?? 360, gribHeader?.ny ?? 181) },
        uLonRange: { value: new THREE.Vector2(gribHeader?.lo1 ?? 0, (gribHeader?.lo2 ?? 359) + 1) }, // lo1, lo2+1
        uLatRange: { value: new THREE.Vector2(gribHeader?.la1 ?? 90, gribHeader?.la2 ?? -90) }, // la1, la2
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;
        varying vec2 vTexCoord;

        void main() {
          // 把顶点位置转换到世界坐标（包含父级旋转）
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          // 同时保存局部坐标（用于正确的经纬度计算）
          vLocalPosition = position;
          // 计算纹理坐标（从球面坐标映射）
          vec3 n = normalize(position);
          float lat = asin(n.y);
          float lon = atan(n.z, -n.x);
          // 映射到 [0,1] 纹理坐标
          vTexCoord = vec2((lon + 3.141592653589793) / 6.283185307179586, (lat + 1.5707963267948966) / 3.141592653589793);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec3 vWorldPosition;
        varying vec3 vLocalPosition;
        varying vec2 vTexCoord;

        uniform float uMinTemp;
        uniform float uMaxTemp;
        uniform float uOpacity;
        uniform float uRadius;
        uniform sampler2D uTemperatureTexture;
        uniform vec2 uTextureSize;
        uniform vec2 uLonRange;
        uniform vec2 uLatRange;

        const float PI = 3.141592653589793;

        // 工具：世界坐标 -> 经纬度（度）
        vec2 worldToLatLon(vec3 p) {
          vec3 n = normalize(p);
          float lat = asin(n.y) * 180.0 / PI;
          float lon = atan(n.z, -n.x) * 180.0 / PI - 180.0;
          return vec2(lat, lon);
        }

        // 从温度纹理采样温度（归一化值 0-1）
        float sampleTemperatureFromTexture(vec2 latlon) {
          float lat = latlon.x; // 纬度 [-90, 90]
          float lon = latlon.y; // 经度 [-180, 180]
          
          // 将经纬度转换为纹理坐标
          // 经度：从 [-180, 180] 映射到 [0, 1]，支持环绕
          float lonRange = uLonRange.y - uLonRange.x;
          float lonOffset = lon - uLonRange.x;
          // 处理经度环绕
          if (lonOffset < 0.0) lonOffset += 360.0;
          if (lonOffset > 360.0) lonOffset -= 360.0;
          float lonNorm = lonOffset / lonRange;
          
          // 纬度：从 [90, -90] (北到南) 映射到 [0, 1]
          float latRange = uLatRange.x - uLatRange.y; // 应该是正数（90 - (-90) = 180）
          float latNorm = (uLatRange.x - lat) / latRange;
          latNorm = clamp(latNorm, 0.0, 1.0);
          
          vec2 texCoord = vec2(lonNorm, latNorm);
          
          // 采样纹理（GPU 自动进行双线性插值）
          float normalizedTemp = texture2D(uTemperatureTexture, texCoord).r;
          
          return normalizedTemp;
        }

        // 将归一化温度（0..1）映射回实际温度（摄氏度）
        float denormalizeTemp(float tNorm) {
          return uMinTemp + tNorm * (uMaxTemp - uMinTemp);
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
          vec2 latlon = worldToLatLon(vLocalPosition);
          
          // 2. 从纹理采样归一化温度（0-1）
          float tNorm = sampleTemperatureFromTexture(latlon);
          
          // 3. 映射到颜色
          vec3 color = colorRamp(tNorm);
          
          // 4. 进一步降低颜色亮度，使色调更柔和
          color = color * 0.85; // 降低15%的亮度

          // 5. 边缘柔化：基于距离中心的距离（使用局部坐标）
          float distFromCenter = length(vLocalPosition);
          float edgeFade = smoothstep(uRadius * 0.98, uRadius * 1.02, distFromCenter);
          
          // 6. 组合透明度
          float alpha = uOpacity * (0.7 + 0.2 * edgeFade);

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [minTemp, maxTemp, opacity, radius, temperatureDataTexture, gribHeader]);

  // 更新 uniforms
  useFrame(() => {
    if (material.uniforms.uMinTemp) material.uniforms.uMinTemp.value = minTemp;
    if (material.uniforms.uMaxTemp) material.uniforms.uMaxTemp.value = maxTemp;
    if (material.uniforms.uOpacity) material.uniforms.uOpacity.value = opacity;
    if (material.uniforms.uRadius) material.uniforms.uRadius.value = radius;
    if (material.uniforms.uTemperatureTexture && temperatureDataTexture) {
      material.uniforms.uTemperatureTexture.value = temperatureDataTexture;
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

  // 温度计算函数（用于显示标签，使用真实数据）
  const calculateTemperature = (lon: number, lat: number, _time: number): number => {
    if (!temperatureField) return 0;
    const temp = temperatureField.interpolate(lon, lat);
    return temp ?? 0;
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

  // 如果数据未加载或加载失败，不渲染
  if (isLoading || !temperatureField || !temperatureDataTexture) {
    return null;
  }

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
