// FogLayer.tsx
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const DATA_URL = 'https://arvis.oss-cn-chengdu.aliyuncs.com/current-fog-surface-level-gfs-1.0.json'

// ---- 参数编号（GFS）----
const PARAM = {
    TMP: 0,  // Temperature
    DPT: 6,  // Dew_point_temperature
}

type GribItem = {
    header: {
        nx: number
        ny: number
        lo1: number
        la1: number
        lo2: number
        la2: number
        dx: number
        dy: number
        parameterNumber: number
    }
    data: number[]
}

export function FogLayer({
    radius = 1.01,
    opacity = 0.85,
}: {
    radius?: number
    opacity?: number
}) {
    const [tmpTex, setTmpTex] = useState<THREE.DataTexture | null>(null)
    const [dptTex, setDptTex] = useState<THREE.DataTexture | null>(null)
    const [header, setHeader] = useState<GribItem['header'] | null>(null)

    // 读取并构建贴图
    useEffect(() => {
        fetch(DATA_URL)
            .then(r => r.json())
            .then((arr: GribItem[]) => {
                const tmp = arr.find(a => a.header.parameterNumber === PARAM.TMP)
                const dpt = arr.find(a => a.header.parameterNumber === PARAM.DPT)

                if (!tmp || !dpt) {
                    console.error('Missing TMP or DPT')
                    return
                }

                const { nx, ny } = tmp.header
                setHeader(tmp.header)

                // ---------- TMP 纹理 ----------
                const tmpData = new Float32Array(nx * ny * 4)

                for (let i = 0; i < nx * ny; i++) {
                    const k = tmp.data[i] ?? 273.15
                    const c = k - 273.15  // 开尔文转摄氏度
                    tmpData[i * 4 + 0] = c
                    tmpData[i * 4 + 1] = 0
                    tmpData[i * 4 + 2] = 0
                    tmpData[i * 4 + 3] = 1
                }

                const tmpTexture = new THREE.DataTexture(
                    tmpData,
                    nx,
                    ny,
                    THREE.RGBAFormat,
                    THREE.FloatType
                )
                tmpTexture.needsUpdate = true
                tmpTexture.minFilter = THREE.LinearFilter
                tmpTexture.magFilter = THREE.LinearFilter
                tmpTexture.wrapS = THREE.RepeatWrapping
                tmpTexture.wrapT = THREE.ClampToEdgeWrapping
                setTmpTex(tmpTexture)

                // ---------- DPT 纹理 ----------
                const dptData = new Float32Array(nx * ny * 4)

                for (let i = 0; i < nx * ny; i++) {
                    const k = dpt.data[i] ?? 273.15
                    const c = k - 273.15  // 开尔文转摄氏度
                    dptData[i * 4 + 0] = c
                    dptData[i * 4 + 1] = 0
                    dptData[i * 4 + 2] = 0
                    dptData[i * 4 + 3] = 1
                }

                const dptTexture = new THREE.DataTexture(
                    dptData,
                    nx,
                    ny,
                    THREE.RGBAFormat,
                    THREE.FloatType
                )
                dptTexture.needsUpdate = true
                dptTexture.minFilter = THREE.LinearFilter
                dptTexture.magFilter = THREE.LinearFilter
                dptTexture.wrapS = THREE.RepeatWrapping
                dptTexture.wrapT = THREE.ClampToEdgeWrapping
                setDptTex(dptTexture)
            })
    }, [])

    const material = useMemo(() => {
        if (!tmpTex || !dptTex || !header) return null

        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTmp: { value: tmpTex },
                uDpt: { value: dptTex },
                uOpacity: { value: opacity },
                uTexSize: {
                    value: new THREE.Vector2(header.nx, header.ny),
                },
                uLonRange: {
                    value: new THREE.Vector2(header.lo1, header.lo2),
                },
                uLatRange: {
                    value: new THREE.Vector2(header.la1, header.la2),
                },
            },
            vertexShader: `
  #define PI 3.141592653589793

varying vec3 vPos;

void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`,

            fragmentShader: `
       precision highp float;

uniform sampler2D uTmp;
uniform sampler2D uDpt;
uniform float uOpacity;

uniform vec2 uTexSize;
uniform vec2 uLonRange;
uniform vec2 uLatRange;

varying vec3 vPos;

const float PI = 3.141592653589793;

vec2 latLon(vec3 p) {
  vec3 n = normalize(p);
  float lat = asin(n.y) * 180.0 / PI;
  float lon = atan(n.z, -n.x) * 180.0 / PI;
  if (lon < 0.0) lon += 360.0;
  return vec2(lat, lon);
}

vec2 gridUV(vec2 ll) {
  float u = (ll.y - uLonRange.x) / (uLonRange.y - uLonRange.x);
  float v = (uLatRange.x - ll.x) / (uLatRange.x - uLatRange.y);
  vec2 texel = 1.0 / uTexSize;
  return vec2(u, v) + texel * 0.5;
}

void main() {
  vec2 ll = latLon(vPos);
  vec2 uv = gridUV(ll);

  // 采样温度和露点温度（摄氏度）
  float tmp = texture2D(uTmp, uv).r;
  float dpt = texture2D(uDpt, uv).r;

  // 计算露点差：DewPointSpread = TMP - DPT
  float spread = tmp - dpt;

  // 判定条件：
  // ≤ 0.5°C  浓雾
  // 0.5 ~ 2°C  薄雾
  // > 2°C  无雾

  // 无雾区域，不渲染
  if (spread > 2.0) {
    discard;
  }

  // 计算雾的强度（0-1）
  float fogIntensity;
  if (spread <= 0.5) {
    // 浓雾：spread 从 0.5 到 0，强度从 1.0 到 1.0（保持最强）
    fogIntensity = 1.0;
  } else {
    // 薄雾：spread 从 0.5 到 2.0，强度从 1.0 到 0.0（线性衰减）
    fogIntensity = 1.0 - (spread - 0.5) / 1.5;
  }

  // 雾的颜色（白色/灰白色）
  vec3 fogColor = vec3(0.95, 0.95, 0.98);

  // 根据强度调整颜色亮度
  fogColor *= mix(0.7, 1.0, fogIntensity);

  // 输出颜色和透明度
  gl_FragColor = vec4(fogColor, fogIntensity * uOpacity);
}

      `,
        })
    }, [tmpTex, dptTex, opacity, header])

    useFrame(() => {
        if (material) material.uniforms.uOpacity.value = opacity
    })

    if (!material) return null

    return (
        <mesh>
            <sphereGeometry args={[radius, 128, 128]} />
            <primitive object={material} attach="material" />
        </mesh>
    )
}

