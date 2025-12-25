import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { latLonToCartesian } from '../utils/geo'

/**
 * 闪电参数
 */
const LIGHTNING_INTERVAL = 0.25 // 平均每 0.25s 一次
const LIGHTNING_LIFETIME = 2 // 闪电存在时间
const SEGMENTS = 14
const JITTER = 0.04

type LightningStrike = {
  age: number
  duration: number
  lines: THREE.Line[]
}

function generateLightningPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments = SEGMENTS,
  jitter = JITTER
) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = start.clone().lerp(end, t)
    p.x += (Math.random() - 0.5) * jitter
    p.y += (Math.random() - 0.5) * jitter
    p.z += (Math.random() - 0.5) * jitter
    pts.push(p)
  }
  return pts
}

function generateBranches(
  base: THREE.Vector3[],
  depth = 1
) {
  const branches: THREE.Vector3[][] = []
  if (depth <= 0) return branches

  for (let i = 2; i < base.length - 2; i++) {
    if (Math.random() < 0.3) {
      const p = base[i]
      const dir = base[i + 1].clone().sub(p).normalize()
      const axis = new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random()
      ).normalize()

      const end = p
        .clone()
        .add(
          dir
            .applyAxisAngle(axis, (Math.random() - 0.5) * 1.2)
            .multiplyScalar(0.25)
        )

      branches.push(generateLightningPath(p, end, 6, 0.025))
    }
  }
  return branches
}

function lightningColorByIntensity(intensity: number): THREE.Color {
  if (intensity < 0.6) {
    return new THREE.Color('rgb(255,230,77)')   // 低
  }
  if (intensity < 0.8) {
    return new THREE.Color('rgb(255,243,128)') // 中
  }
  if (intensity < 0.9) {
    return new THREE.Color('rgb(255,255,179)') // 高
  }
  return new THREE.Color('rgb(255,255,255)')   // 极高
}


export function LightningLayer({
  radius = 1.6,
}: {
  radius?: number
}) {
  const { scene } = useThree()
  const strikes = useRef<LightningStrike[]>([])
  const timer = useRef(0)

  function spawnLightning() {
    const lon = Math.random() * 360 - 180
    const lat = Math.random() * 120 - 60
  
    // 强度：模拟 CAPE + APCP 结果（0.4 ~ 1.0）
    const intensity = 0.4 + Math.pow(Math.random(), 0.6) * 0.6
  
    const start = latLonToCartesian(lat, lon, radius + 0.09)
    const end = latLonToCartesian(lat, lon, radius - 0.03)
  
    const mainPath = generateLightningPath(start, end)
    const branchDepth = intensity > 0.85 ? 2 : 1
    const branches = generateBranches(mainPath, branchDepth)
  
    const color = lightningColorByIntensity(intensity)
  
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  
    const lines: THREE.Line[] = []
  
    function addLine(path: THREE.Vector3[]) {
      const geom = new THREE.BufferGeometry().setFromPoints(path)
      const line = new THREE.Line(geom, material.clone())
      scene.add(line)
      lines.push(line)
    }
  
    addLine(mainPath)
  
    // 🔥 分叉概率随强度变化
    branches.forEach(b => {
      if (Math.random() < intensity) {
        addLine(b)
      }
    })
  
    strikes.current.push({
      age: 0,
      duration: LIGHTNING_LIFETIME + intensity * 0.4,
      lines,
    })
  }
  

  useFrame((_, dt) => {
    timer.current += dt

    // 生成闪电
    if (timer.current > LIGHTNING_INTERVAL) {
      timer.current = 0
      if (strikes.current.length > 8) return

      spawnLightning()
    }

    // 更新闪电
    strikes.current.forEach(s => {
      s.age += dt
      const t = s.age / s.duration
      const alpha =
  t < 0.15 ? 1.0 :
  t < 0.35 ? 0.4 :
  t < 0.45 ? 0.9 :
  t < 0.7  ? 0.3 :
  1.0 - t

      s.lines.forEach(l => {
        const m = l.material as THREE.LineBasicMaterial
        m.opacity = Math.max(alpha, 0)
      })
    })

    // 回收
    strikes.current = strikes.current.filter(s => {
      if (s.age >= s.duration) {
        s.lines.forEach(l => {
          scene.remove(l)
          l.geometry.dispose()
          ;(l.material as THREE.Material).dispose()
        })
        return false
      }
      return true
    })
  })

  return null
}
