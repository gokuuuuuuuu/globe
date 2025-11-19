import { Line, OrthographicCamera, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { Color, DoubleSide, Path, Shape, Vector3 } from 'three'
import { useAppStore } from '../store/useAppStore'
import type { AtlasData, WorldData } from '../types'
import { deriveIsoCode, latLonToPlane } from '../utils/geo'

const MAP_SCALE = 6

interface MapViewProps {
  world: WorldData
  atlas: AtlasData
}

interface PolygonLine {
  id: string
  iso: string | null
  points: Vector3[]
}

interface PolygonFill {
  id: string
  iso: string | null
  shape: Shape
}

export function MapView({ world, atlas }: MapViewProps) {
  const { selectedCountry, setSelectedCountry, hoveredCountry, setHoveredCountry } = useAppStore()

  const { linePolygons, fillPolygons } = useMemo<{
    linePolygons: PolygonLine[]
    fillPolygons: PolygonFill[]
  }>(() => {
    const lines: PolygonLine[] = []
    const fills: PolygonFill[] = []

    world.features.forEach((feature, featureIndex) => {
      const iso = deriveIsoCode(feature)
      const { geometry } = feature

      const processPolygon = (rings: number[][][], polygonIndex: number) => {
        if (!rings.length) return

        const planeRings = rings.map((ring) =>
          ring.map(([lon, lat]) => latLonToPlane(lat, lon, MAP_SCALE)),
        )

        planeRings.forEach((ring, ringIndex) => {
          if (ring.length < 2) return
          const isClosed = ring[0]?.equals(ring[ring.length - 1] ?? new Vector3())
          const points = isClosed ? ring : [...ring, ring[0]]
          lines.push({
            id: `${featureIndex}-${polygonIndex}-${ringIndex}`,
            iso,
            points,
          })
        })

        const outerRing = planeRings[0]
        if (!outerRing || outerRing.length < 3) return

        const shape = new Shape()
        shape.moveTo(outerRing[0].x, outerRing[0].y)
        outerRing.slice(1).forEach((point) => {
          shape.lineTo(point.x, point.y)
        })

        planeRings.slice(1).forEach((holeRing) => {
          if (holeRing.length < 3) return
          const holePath = new Path()
          holePath.moveTo(holeRing[0].x, holeRing[0].y)
          holeRing.slice(1).forEach((point) => {
            holePath.lineTo(point.x, point.y)
          })
          holePath.lineTo(holeRing[0].x, holeRing[0].y)
          shape.holes.push(holePath)
        })

        fills.push({
          id: `fill-${featureIndex}-${polygonIndex}`,
          iso,
          shape,
        })
      }

      if (geometry.type === 'Polygon') {
        processPolygon(geometry.coordinates as number[][][], 0)
      } else if (geometry.type === 'MultiPolygon') {
        ;(geometry.coordinates as number[][][][]).forEach((polygon, polygonIndex) => {
          processPolygon(polygon as number[][][], polygonIndex)
        })
      }
    })

    return { linePolygons: lines, fillPolygons: fills }
  }, [world])

  const baseColor = new Color('#2dd4bf')
  const hoverColor = new Color('#facc15')
  const highlightColor = new Color('#f97316')

  return (
    <div className="view-root">
      <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 60 }}>
        <color attach="background" args={['#050505']} />
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
        <ambientLight intensity={0.8} />
        <Suspense fallback={null}>
          <mesh position={[0, 0, -1]}>
            <planeGeometry args={[MAP_SCALE * 3.8, MAP_SCALE * 1.9]} />
            <meshBasicMaterial color="#040b1a" />
          </mesh>
          {fillPolygons.map(({ id, iso, shape }) => {
            const isSelected = iso && selectedCountry === iso
            const isHovered = iso && hoveredCountry === iso
            const color = isSelected ? highlightColor : isHovered ? hoverColor : baseColor
            const opacity = isSelected ? 0.6 : isHovered ? 0.4 : 0.2
            return (
              <mesh
                key={id}
                position={[0, 0, -0.01]}
                renderOrder={0}
                onPointerOver={(event) => {
                  if (!iso) return
                  event.stopPropagation()
                  setHoveredCountry(iso)
                }}
                onPointerOut={(event) => {
                  event.stopPropagation()
                  setHoveredCountry(null)
                }}
                onPointerDown={(event) => {
                  if (!iso) return
                  event.stopPropagation()
                  setSelectedCountry(iso)
                }}
              >
                <shapeGeometry args={[shape]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} />
              </mesh>
            )
          })}
          {linePolygons.map(({ id, iso, points }) => {
            const isSelected = iso && selectedCountry === iso
            const isHovered = iso && hoveredCountry === iso
            const color = isSelected ? highlightColor : isHovered ? hoverColor : baseColor
            const lineWidth = isSelected ? 1.4 : isHovered ? 1.1 : 0.8
            return (
              <Line
                key={id}
                points={points}
                color={color}
                lineWidth={lineWidth}
                transparent
                opacity={isSelected ? 1 : 0.7}
                onPointerOver={(event) => {
                  if (!iso) return
                  event.stopPropagation()
                  setHoveredCountry(iso)
                }}
                onPointerOut={(event) => {
                  event.stopPropagation()
                  setHoveredCountry(null)
                }}
                onPointerDown={(event) => {
                  if (!iso) return
                  event.stopPropagation()
                  setSelectedCountry(iso)
                }}
              />
            )
          })}
        </Suspense>
        <OrbitControls enableRotate={false} enablePan maxZoom={120} minZoom={20} />
      </Canvas>
      <div className="view-overlay">
        <h2>Map view</h2>
        <p>二维投影，以简化方式呈现各国轮廓。</p>
        {selectedCountry && atlas.countries[selectedCountry] && (
          <div className="country-card">
            <h3>{atlas.countries[selectedCountry].name}</h3>
            <p>
              所在纬度：{atlas.countries[selectedCountry].lat?.toFixed(2) ?? '未知'}，经度：
              {atlas.countries[selectedCountry].lon?.toFixed(2) ?? '未知'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapView


