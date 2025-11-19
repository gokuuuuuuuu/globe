import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { Color } from 'three'
import { useAppStore } from '../store/useAppStore'
import type { AtlasData } from '../types'
import { latLonToPlane } from '../utils/geo'

const MAP_SCALE = 6
const BAR_SIZE = 0.18

interface CountryStacksViewProps {
  atlas: AtlasData
}

interface StackItem {
  code: string
  name: string
  position: [number, number, number]
  height: number
  total: number
}

export function CountryStacksView({ atlas }: CountryStacksViewProps) {
  const { selectedCountry, setSelectedCountry, hoveredCountry, setHoveredCountry } = useAppStore()

  const stacks = useMemo<StackItem[]>(() => {
    const items: StackItem[] = []
    const countries = atlas.countries ?? {}
    for (const [code, country] of Object.entries(countries)) {
      if (typeof country.lat !== 'number' || typeof country.lon !== 'number') continue
      const total =
        country.exports ??
        Object.values(country.products ?? {}).reduce((acc, value) => acc + value, 0)
      if (!total || total <= 0) continue
      const point = latLonToPlane(country.lat, country.lon, MAP_SCALE)
      const x = point.x
      const z = -point.y
      items.push({
        code,
        name: country.name,
        position: [x, 0, z],
        height: Math.max(total / 3e7, 0.1),
        total,
      })
    }
    return items.sort((a, b) => b.total - a.total)
  }, [atlas])

  const maxTotal = stacks[0]?.total ?? 1
  const colorScale = new Color()

  return (
    <div className="view-root">
      <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 12, 6]} intensity={0.8} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[MAP_SCALE * 3.8, MAP_SCALE * 1.9, 1, 1]} />
          <meshStandardMaterial color="#0a0f1c" />
        </mesh>
        {stacks.map(({ code, position, height, total }) => {
          const isSelected = selectedCountry === code
          const isHovered = hoveredCountry === code
          const strength = Math.min(1, total / maxTotal)
          colorScale.setHSL(0.55 - strength * 0.25, 0.6 + strength * 0.2, 0.5 + strength * 0.1)
          const color = isSelected ? '#f97316' : isHovered ? '#facc15' : colorScale.getStyle()

          return (
            <mesh
              key={code}
              position={[position[0], height / 2, position[2]]}
              onPointerOver={(event) => {
                event.stopPropagation()
                setHoveredCountry(code)
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                setHoveredCountry(null)
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                setSelectedCountry(code)
              }}
            >
              <boxGeometry args={[BAR_SIZE, height, BAR_SIZE]} />
              <meshStandardMaterial
                color={color}
                emissive={isSelected ? '#ff7f50' : '#000000'}
                emissiveIntensity={isSelected ? 0.6 : 0}
              />
            </mesh>
          )
        })}
        <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={20} />
      </Canvas>
      <div className="view-overlay">
        <h2>Country stacks</h2>
        <p>柱体高度近似代表总出口额，可点击选择国家。</p>
        <ol className="top-list">
          {stacks.slice(0, 5).map((item) => (
            <li
              key={item.code}
              className={
                item.code === selectedCountry
                  ? 'top-list-item selected'
                  : item.code === hoveredCountry
                    ? 'top-list-item hovered'
                    : 'top-list-item'
              }
              onMouseEnter={() => setHoveredCountry(item.code)}
              onMouseLeave={() => setHoveredCountry(null)}
              onClick={() => setSelectedCountry(item.code)}
            >
              <span>{item.name}</span>
              <span>{formatValue(item.total)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '未知'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`
  return value.toFixed(0)
}

export default CountryStacksView


