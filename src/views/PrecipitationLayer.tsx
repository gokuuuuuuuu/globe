// PrecipitationLayer.tsx
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const DATA_URL =
    'https://arvis.oss-cn-chengdu.aliyuncs.com/current-tmp-surface-level-gfs-1.0.json'

// ---- 参数编号（GFS）----
const PARAM = {
    TMP: 0,
    ACPCP: 10,
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

export function PrecipitationLayer({
    radius = 1.01,
    opacity = 0.85,
}: {
    radius?: number
    opacity?: number
}) {
    const [precipTex, setPrecipTex] = useState<THREE.DataTexture | null>(null)
    const [tempTex, setTempTex] = useState<THREE.DataTexture | null>(null)
    const [header, setHeader] = useState<GribItem['header'] | null>(null)

    // 读取并构建贴图
    useEffect(() => {
        fetch(DATA_URL)
            .then(r => r.json())
            .then((arr: GribItem[]) => {
                const acpcp = arr.find(a => a.header.parameterNumber === PARAM.ACPCP)
                const tmp = arr.find(a => a.header.parameterNumber === PARAM.TMP)

                if (!acpcp || !tmp) {
                    console.error('Missing ACPCP or TMP')
                    return
                }

                const { nx, ny } = acpcp.header
                setHeader(acpcp.header)

                // ---------- ACPCP → log 强度 ----------
                const pData = new Float32Array(nx * ny * 4)

                for (let i = 0; i < nx * ny; i++) {
                    const mm = acpcp.data[i] ?? 0
                    const v = Math.log(mm + 1.0) / Math.log(50.0) 
                    pData[i * 4 + 0] = THREE.MathUtils.clamp(v, 0, 1)
                    pData[i * 4 + 1] = 0
                    pData[i * 4 + 2] = 0
                    pData[i * 4 + 3] = 1
                }

                const pTex = new THREE.DataTexture(
                    pData,
                    nx,
                    ny,
                    THREE.RGBAFormat,
                    THREE.FloatType
                )
                pTex.needsUpdate = true
                pTex.minFilter = THREE.LinearFilter
                pTex.magFilter = THREE.LinearFilter
                pTex.wrapS = THREE.RepeatWrapping
                pTex.wrapT = THREE.ClampToEdgeWrapping
                setPrecipTex(pTex)

                // ---------- TMP ----------
                const tData = new Float32Array(nx * ny * 4)

                for (let i = 0; i < nx * ny; i++) {
                    const k = tmp.data[i] ?? 273.15
                    const c = k - 273.15
                    const n = THREE.MathUtils.clamp((c + 40) / 80, 0, 1)
                    tData[i * 4 + 2] = n
                    tData[i * 4 + 3] = 1
                }

                const tTex = new THREE.DataTexture(
                    tData,
                    nx,
                    ny,
                    THREE.RGBAFormat,
                    THREE.FloatType
                )
                tTex.needsUpdate = true
                tTex.minFilter = THREE.LinearFilter
                tTex.magFilter = THREE.LinearFilter
                tTex.wrapS = THREE.RepeatWrapping
                tTex.wrapT = THREE.ClampToEdgeWrapping
                setTempTex(tTex)
            })
    }, [])

    const material = useMemo(() => {
        if (!precipTex || !tempTex || !header) return null

        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uPrecip: { value: precipTex },
                uTemp: { value: tempTex },
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

uniform sampler2D uPrecip;
uniform sampler2D uTemp;
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

  float p = texture2D(uPrecip, uv).r;
  if (p < 0.02) discard;

  // 强度压缩（nullschool 风格）
  p = pow(p, 0.45);

  float t = texture2D(uTemp, uv).b;
  float tempC = -40.0 + t * 80.0;

  // ---- 颜色 ----
  vec3 rainColor = vec3(0.12, 0.38, 0.85);
  vec3 snowColor = vec3(0.92, 0.95, 1.0);
  vec3 iceColor  = vec3(0.75, 0.45, 0.9);

  // ---- 温度权重（平滑）----
  float snowW = smoothstep( 0.5, -2.5, tempC);
  float rainW = smoothstep(-0.5,  2.0, tempC);
  float iceW  = clamp(1.0 - snowW - rainW, 0.0, 1.0);

  vec3 color =
      snowColor * snowW +
      iceColor  * iceW  +
      rainColor * rainW;

  // 强降水更亮
  color *= mix(0.6, 1.2, p);

  gl_FragColor = vec4(color, p * uOpacity);
}

      `,
        })
    }, [precipTex, tempTex, opacity, header])

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
