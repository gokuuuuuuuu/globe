import { Line, OrbitControls, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useEffect, useCallback, useState } from 'react'
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
  Group,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAppStore } from '../store/useAppStore'
import type { AtlasData, WorldData } from '../types'
import { deriveIsoCode, latLonToCartesian } from '../utils/geo'

const GLOBE_RADIUS = 1.6

// 中国的经纬度（北京）
const CHINA_LAT = 39.9042
const CHINA_LON = 116.4074

interface GlobeViewProps {
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
  geometry: BufferGeometry
}

interface LabelCandidate {
  key: string
  iso: string | null
  fallbackName: string | null
  position: Vector3
}

interface CountryLabel {
  key: string
  iso: string | null
  name: string
  position: Vector3
}

interface AirportParticle {
  id: string
  name: string
  lat: number
  lon: number
  color: string
  countryCode: string // 国家代码
  operatorCount: number // 执飞单位数量
  flightCount: number // 航班数量
  environmentRisk: number // 环境风险值
}

// 国家代码映射表：从可能的ISO代码格式映射到标准ISO_A2格式
const COUNTRY_CODE_MAP: Record<string, string> = {
  'CN': 'CN', 'CHN': 'CN', 'CHINA': 'CN',
  'US': 'US', 'USA': 'US', 'UNITED STATES': 'US',
  'GB': 'GB', 'GBR': 'GB', 'UK': 'GB', 'UNITED KINGDOM': 'GB',
  'AE': 'AE', 'ARE': 'AE', 'UAE': 'AE', 'UNITED ARAB EMIRATES': 'AE',
  'AU': 'AU', 'AUS': 'AU', 'AUSTRALIA': 'AU',
  'JP': 'JP', 'JPN': 'JP', 'JAPAN': 'JP',
  'DE': 'DE', 'DEU': 'DE', 'GERMANY': 'DE',
  'FR': 'FR', 'FRA': 'FR', 'FRANCE': 'FR',
  'SG': 'SG', 'SGP': 'SG', 'SINGAPORE': 'SG',
  'KR': 'KR', 'KOR': 'KR', 'SOUTH KOREA': 'KR',
  'TH': 'TH', 'THA': 'TH', 'THAILAND': 'TH',
}

// 标准化国家代码
function normalizeCountryCode(code: string | null): string | null {
  if (!code) return null
  const upper = code.toUpperCase().trim()
  return COUNTRY_CODE_MAP[upper] || upper
}

const DEMO_AIRPORTS: AirportParticle[] = [
  // 中国
  { id: 'PEK', name: 'Beijing Capital', lat: 40.0799, lon: 116.6031, color: '#22d3ee', countryCode: 'CN', operatorCount: 12, flightCount: 856, environmentRisk: 3.2 },
  { id: 'PVG', name: 'Shanghai Pudong', lat: 31.1434, lon: 121.8052, color: '#22d3ee', countryCode: 'CN', operatorCount: 15, flightCount: 1024, environmentRisk: 3.5 },
  { id: 'CAN', name: 'Guangzhou Baiyun', lat: 23.3924, lon: 113.2988, color: '#22d3ee', countryCode: 'CN', operatorCount: 10, flightCount: 678, environmentRisk: 2.8 },
  // 美国
  { id: 'JFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781, color: '#f472b6', countryCode: 'US', operatorCount: 18, flightCount: 1245, environmentRisk: 4.1 },
  { id: 'LAX', name: 'Los Angeles', lat: 33.9425, lon: -118.4081, color: '#f472b6', countryCode: 'US', operatorCount: 20, flightCount: 1456, environmentRisk: 4.3 },
  { id: 'ORD', name: 'Chicago O\'Hare', lat: 41.9786, lon: -87.9048, color: '#f472b6', countryCode: 'US', operatorCount: 16, flightCount: 1123, environmentRisk: 3.9 },
  // 英国
  { id: 'LHR', name: 'London Heathrow', lat: 51.4706, lon: -0.4619, color: '#facc15', countryCode: 'GB', operatorCount: 14, flightCount: 987, environmentRisk: 3.7 },
  { id: 'LGW', name: 'London Gatwick', lat: 51.1537, lon: -0.1821, color: '#facc15', countryCode: 'GB', operatorCount: 8, flightCount: 456, environmentRisk: 2.5 },
  // 阿联酋
  { id: 'DXB', name: 'Dubai International', lat: 25.2532, lon: 55.3657, color: '#fb7185', countryCode: 'AE', operatorCount: 22, flightCount: 1567, environmentRisk: 4.5 },
  // 澳大利亚
  { id: 'SYD', name: 'Sydney Kingsford', lat: -33.9399, lon: 151.1753, color: '#34d399', countryCode: 'AU', operatorCount: 11, flightCount: 723, environmentRisk: 3.0 },
  { id: 'MEL', name: 'Melbourne', lat: -37.6733, lon: 144.8433, color: '#34d399', countryCode: 'AU', operatorCount: 9, flightCount: 567, environmentRisk: 2.7 },
  // 日本
  { id: 'NRT', name: 'Tokyo Narita', lat: 35.7720, lon: 140.3929, color: '#a78bfa', countryCode: 'JP', operatorCount: 13, flightCount: 892, environmentRisk: 3.4 },
  { id: 'HND', name: 'Tokyo Haneda', lat: 35.5494, lon: 139.7798, color: '#a78bfa', countryCode: 'JP', operatorCount: 12, flightCount: 834, environmentRisk: 3.3 },
  // 德国
  { id: 'FRA', name: 'Frankfurt', lat: 50.0379, lon: 8.5622, color: '#60a5fa', countryCode: 'DE', operatorCount: 17, flightCount: 1098, environmentRisk: 3.8 },
  { id: 'MUC', name: 'Munich', lat: 48.3538, lon: 11.7861, color: '#60a5fa', countryCode: 'DE', operatorCount: 10, flightCount: 645, environmentRisk: 2.9 },
  // 法国
  { id: 'CDG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479, color: '#fbbf24', countryCode: 'FR', operatorCount: 19, flightCount: 1234, environmentRisk: 4.0 },
  // 新加坡
  { id: 'SIN', name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, color: '#10b981', countryCode: 'SG', operatorCount: 21, flightCount: 1345, environmentRisk: 4.2 },
  // 韩国
  { id: 'ICN', name: 'Seoul Incheon', lat: 37.4602, lon: 126.4407, color: '#ec4899', countryCode: 'KR', operatorCount: 15, flightCount: 956, environmentRisk: 3.6 },
  // 泰国
  { id: 'BKK', name: 'Bangkok Suvarnabhumi', lat: 13.6811, lon: 100.7475, color: '#f59e0b', countryCode: 'TH', operatorCount: 12, flightCount: 789, environmentRisk: 3.1 },
]

function sanitizeRing(ring: number[][]): number[][] {
  if (ring.length > 1) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] === last[0] && first[1] === last[1]) {
      return ring.slice(0, -1)
    }
  }
  return ring
}

export function GlobeView({ world, atlas }: GlobeViewProps) {
  const { 
    selectedCountry, 
    setSelectedCountry, 
    hoveredCountry, 
    setHoveredCountry,
    hoveredAirport,
    hoveredFlightRoute,
    tooltipPosition,
  } = useAppStore()
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  
  // 用于区分点击和拖动的状态
  const pointerStateRef = useRef<{
    downTime: number
    downX: number
    downY: number
    moved: boolean
    targetIso: string | null
  } | null>(null)

  // 创建点击/拖动处理函数
  const createPointerHandlers = useCallback((iso: string | null, onSelect: () => void) => {
    return {
      onPointerDown: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        // 从原生事件中获取坐标
        const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
        const clientX = nativeEvent.clientX ?? 0
        const clientY = nativeEvent.clientY ?? 0
        pointerStateRef.current = {
          downTime: Date.now(),
          downX: clientX,
          downY: clientY,
          moved: false,
          targetIso: iso,
        }
      },
      onPointerMove: (event: ThreeEvent<PointerEvent>) => {
        if (!pointerStateRef.current) return
        const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
        const clientX = nativeEvent.clientX ?? 0
        const clientY = nativeEvent.clientY ?? 0
        const deltaX = Math.abs(clientX - pointerStateRef.current.downX)
        const deltaY = Math.abs(clientY - pointerStateRef.current.downY)
        // 如果移动距离超过 5 像素，认为是拖动
        if (deltaX > 5 || deltaY > 5) {
          pointerStateRef.current.moved = true
        }
      },
      onPointerUp: (event: ThreeEvent<PointerEvent>) => {
        if (!pointerStateRef.current) return
        const state = pointerStateRef.current
        const duration = Date.now() - state.downTime
        const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
        const clientX = nativeEvent.clientX ?? 0
        const clientY = nativeEvent.clientY ?? 0
        const deltaX = Math.abs(clientX - state.downX)
        const deltaY = Math.abs(clientY - state.downY)
        const moved = state.moved || deltaX > 5 || deltaY > 5
        
        // 只有在短按（< 200ms）且没有移动的情况下才选中
        if (!moved && duration < 200 && state.targetIso === iso) {
          onSelect()
        }
        
        pointerStateRef.current = null
      },
    }
  }, [])

  const { linePolygons, fillPolygons, labelCandidates } = useMemo<{
    linePolygons: PolygonLine[]
    fillPolygons: PolygonFill[]
    labelCandidates: LabelCandidate[]
  }>(() => {
    const lines: PolygonLine[] = []
    const fills: PolygonFill[] = []
    const labelsMap = new Map<
      string,
      {
        iso: string | null
        fallbackName: string | null
        position: Vector3
      }
    >()
    // 用于计算每个国家的加权中心
    const countryCenters = new Map<
      string,
      {
        weightedCenter: Vector3
        totalWeight: number
        iso: string | null
        fallbackName: string | null
      }
    >()

    world.features.forEach((feature, featureIndex) => {
      const iso = deriveIsoCode(feature)
      const featureName =
        typeof feature.properties?.name === 'string' ? feature.properties.name : null
      const { geometry } = feature

      const processPolygon = (rings: number[][][], polygonIndex: number) => {
        const cleanedRings = rings.map((ring) => sanitizeRing(ring as number[][]))
        if (!cleanedRings.length) return

        const cartesianRings = cleanedRings.map((ring) =>
          ring.map(([lon, lat]) => latLonToCartesian(lat, lon, GLOBE_RADIUS + 0.003)),
        )

        cartesianRings.forEach((ring, ringIndex) => {
          if (ring.length < 2) return
          const isClosed = ring[0]?.equals(ring[ring.length - 1] ?? new Vector3())
          const points = isClosed ? ring : [...ring, ring[0]]
          lines.push({
            id: `${featureIndex}-${polygonIndex}-${ringIndex}`,
            iso,
            points,
          })
        })

        const outerOriginal = cleanedRings[0]
        if (!outerOriginal || outerOriginal.length < 3) return

        const shape = new Shape()
        shape.moveTo(outerOriginal[0][0], outerOriginal[0][1])
        outerOriginal.slice(1).forEach(([lon, lat]) => {
          shape.lineTo(lon, lat)
        })
        shape.closePath()

        cleanedRings.slice(1).forEach((ring) => {
          if (ring.length < 3) return
          const hole = new Path()
          hole.moveTo(ring[0][0], ring[0][1])
          ring.slice(1).forEach(([lon, lat]) => {
            hole.lineTo(lon, lat)
          })
          hole.closePath()
          shape.holes.push(hole)
        })

        const geometry = new ShapeGeometry(shape, 16)
        const position = geometry.getAttribute('position')
        for (let i = 0; i < position.count; i++) {
          const lon = position.getX(i)
          const lat = position.getY(i)
          const cartesian = latLonToCartesian(lat, lon, GLOBE_RADIUS -0.2)
          position.setXYZ(i, cartesian.x, cartesian.y, cartesian.z)
        }
        position.needsUpdate = true
        geometry.computeVertexNormals()
        geometry.computeBoundingSphere()

        // 计算这个多边形的中心点和权重（使用 boundingSphere 中心更准确）
        const sphere = geometry.boundingSphere
        if (sphere && sphere.center) {
          const center = sphere.center.clone()
          
          // 使用 boundingSphere 的半径作为权重（更大的多边形有更大的半径）
          const weight = sphere.radius * sphere.radius // 使用面积作为权重
          const labelKey = iso ?? featureName ?? `${featureIndex}-${polygonIndex}`
          
          const existing = countryCenters.get(labelKey)
          if (!existing) {
            countryCenters.set(labelKey, {
              weightedCenter: center.clone().multiplyScalar(weight),
              totalWeight: weight,
              iso,
              fallbackName: featureName,
            })
          } else {
            existing.weightedCenter.add(center.clone().multiplyScalar(weight))
            existing.totalWeight += weight
          }
        }

        fills.push({
          id: `fill-${featureIndex}-${polygonIndex}`,
          iso,
          geometry,
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

    // 计算每个国家的加权中心并转换为标签位置
    countryCenters.forEach((data, labelKey) => {
      const finalCenter = data.weightedCenter.clone().divideScalar(data.totalWeight)
      const normalizedCenter = finalCenter.clone().normalize()
      const labelPosition = normalizedCenter.multiplyScalar(GLOBE_RADIUS + 0.05)
      
      labelsMap.set(labelKey, {
        iso: data.iso,
        fallbackName: data.fallbackName,
        position: labelPosition,
      })
    })

    const labelCandidates: LabelCandidate[] = Array.from(labelsMap.entries()).map(
      ([key, value]) => ({
        key,
        iso: value.iso,
        fallbackName: value.fallbackName,
        position: value.position,
      }),
    )

    return { linePolygons: lines, fillPolygons: fills, labelCandidates }
  }, [world])

  const countryLabels = useMemo<CountryLabel[]>(() => {
    return labelCandidates
      .map(({ key, iso, fallbackName, position }) => {
        const country = iso ? atlas.countries[iso] : undefined
        const name = country?.name ?? fallbackName
        if (!name) return null
        return { key, iso, position, name }
      })
      .filter((value): value is CountryLabel => value !== null)
  }, [atlas.countries, labelCandidates])

  const airportInstances = useMemo(() => {
    return DEMO_AIRPORTS.map((airport) => {
      const position = latLonToCartesian(airport.lat, airport.lon, GLOBE_RADIUS + 0.01)
      return { ...airport, position }
    })
  }, [])

  // 计算航线：从选中国家的机场到其他机场
  const flightRoutes = useMemo(() => {
    if (!selectedCountry) {
      console.log('没有选中的国家')
      return []
    }
    // 标准化国家代码
    const normalizedSelectedCountry = normalizeCountryCode(selectedCountry)
    console.log('选中的国家代码 (原始):', selectedCountry, '标准化后:', normalizedSelectedCountry)
    console.log('所有机场:', airportInstances.map(a => ({ id: a.id, country: a.countryCode })))
    
    if (!normalizedSelectedCountry) {
      console.log('无法标准化国家代码')
      return []
    }
    
    const selectedAirports = airportInstances.filter(airport => 
      normalizeCountryCode(airport.countryCode) === normalizedSelectedCountry
    )
    console.log('匹配的机场数量:', selectedAirports.length, '机场:', selectedAirports.map(a => a.id))
    
    if (selectedAirports.length === 0) return []
    
    const routes: Array<{ 
      id: string
      from: Vector3
      to: Vector3
      color: string
      fromIsSelected: boolean
      toIsSelected: boolean
      flightNumber: string
      fromAirport: string
      toAirport: string
      status: string
      scheduledDeparture: string
      scheduledArrival: string
      humanRisk: number
      machineRisk: number
      environmentRisk: number
    }> = []
    selectedAirports.forEach((airport, index) => {
      airportInstances.forEach((target, targetIndex) => {
        if (target.id !== airport.id) {
          // 生成示例航班数据
          const flightNumber = `${airport.countryCode}${target.countryCode}${String(index * 100 + targetIndex).padStart(3, '0')}`
          const now = new Date()
          const departureTime = new Date(now.getTime() + (index * 60 + targetIndex * 30) * 60000)
          const arrivalTime = new Date(departureTime.getTime() + (2 + Math.random() * 4) * 3600000)
          
          routes.push({
            id: `${airport.id}-${target.id}`,
            from: airport.position.clone(),
            to: target.position.clone(),
            color: airport.color,
            fromIsSelected: true, // 起点是选中国家的机场
            toIsSelected: normalizeCountryCode(target.countryCode) === normalizedSelectedCountry,
            flightNumber,
            fromAirport: airport.name,
            toAirport: target.name,
            status: ['计划中', '已起飞', '飞行中', '已到达'][Math.floor(Math.random() * 4)],
            scheduledDeparture: departureTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            scheduledArrival: arrivalTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            humanRisk: Math.round((Math.random() * 2 + 1) * 10) / 10,
            machineRisk: Math.round((Math.random() * 2 + 1) * 10) / 10,
            environmentRisk: Math.round((Math.random() * 2 + 1) * 10) / 10,
          })
        }
      })
    })
    console.log('生成的航线数量:', routes.length)
    return routes
  }, [selectedCountry, airportInstances])

  const baseColor = new Color('#ffffff')
  const hoverColor = new Color('#facc15')
  const highlightColor = new Color('#f97316')

  return (
    <div className="view-root">
      {/* Tooltip 组件 */}
      {(hoveredAirport || hoveredFlightRoute) && tooltipPosition && (
        <div
          className="globe-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x + 15}px`,
            top: `${tooltipPosition.y + 15}px`,
            zIndex: 1000,
          }}
        >
          {hoveredAirport && (
            <div className="tooltip-content">
              <div className="tooltip-title">机场信息</div>
              <div className="tooltip-row">
                <span className="tooltip-label">机场名：</span>
                <span className="tooltip-value">{hoveredAirport.airportName}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">执飞单位数量：</span>
                <span className="tooltip-value">{hoveredAirport.operatorCount}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">航班数量：</span>
                <span className="tooltip-value">{hoveredAirport.flightCount}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">环境风险值：</span>
                <span className="tooltip-value">{hoveredAirport.environmentRisk}</span>
              </div>
            </div>
          )}
          {hoveredFlightRoute && (
            <div className="tooltip-content">
              <div className="tooltip-title">航班信息</div>
              <div className="tooltip-row">
                <span className="tooltip-label">航班号：</span>
                <span className="tooltip-value">{hoveredFlightRoute.flightNumber}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">起飞机场：</span>
                <span className="tooltip-value">{hoveredFlightRoute.fromAirport}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">降落机场：</span>
                <span className="tooltip-value">{hoveredFlightRoute.toAirport}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">状态：</span>
                <span className="tooltip-value">{hoveredFlightRoute.status}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">预飞时间：</span>
                <span className="tooltip-value">{hoveredFlightRoute.scheduledDeparture}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">预到时间：</span>
                <span className="tooltip-value">{hoveredFlightRoute.scheduledArrival}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">人风险值：</span>
                <span className="tooltip-value">{hoveredFlightRoute.humanRisk}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">机风险值：</span>
                <span className="tooltip-value">{hoveredFlightRoute.machineRisk}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">环风险值：</span>
                <span className="tooltip-value">{hoveredFlightRoute.environmentRisk}</span>
              </div>
            </div>
          )}
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 2]} intensity={0.7} />
        <Suspense fallback={null}>
          <mesh renderOrder={0}>
            <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
            <meshStandardMaterial
              color="#050505"
              roughness={0.95}
              metalness={0.05}
              transparent={false}
              opacity={1}
              depthWrite={true}
            />
          </mesh>
          <group>
            {airportInstances.map((airport) => {
              // 标准化国家代码进行匹配
              const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
              const normalizedAirportCountry = normalizeCountryCode(airport.countryCode)
              const isSelected = normalizedSelectedCountry === normalizedAirportCountry
              if (isSelected) {
                console.log('机场被选中:', airport.id, airport.countryCode, '匹配:', normalizedSelectedCountry)
              }
              return (
                <AirportParticle
                  key={airport.id}
                  airport={airport}
                  isSelected={isSelected}
                />
              )
            })}
          </group>
          {/* 航线 */}
          {flightRoutes.length > 0 && (
            <group>
              {flightRoutes.map((route, index) => {
                console.log('渲染航线:', index, '从', route.from, '到', route.to)
                return (
                  <FlightRoute
                    key={`route-${route.id}`}
                    id={route.id}
                    from={route.from}
                    to={route.to}
                    color={route.color}
                    fromIsSelected={route.fromIsSelected}
                    toIsSelected={route.toIsSelected}
                    flightNumber={route.flightNumber}
                    fromAirport={route.fromAirport}
                    toAirport={route.toAirport}
                    status={route.status}
                    scheduledDeparture={route.scheduledDeparture}
                    scheduledArrival={route.scheduledArrival}
                    humanRisk={route.humanRisk}
                    machineRisk={route.machineRisk}
                    environmentRisk={route.environmentRisk}
                  />
                )
              })}
            </group>
          )}
          {fillPolygons.map(({ id, iso, geometry }) => {
            const isSelected = !!(iso && selectedCountry === iso)
            const isHovered = !!(iso && hoveredCountry === iso)
            const handlers = createPointerHandlers(iso, () => {
              if (iso) setSelectedCountry(iso)
            })
            return (
              <ElevatedPolygon
                key={id}
                iso={iso}
                geometry={geometry}
                isSelected={isSelected}
                isHovered={isHovered}
                baseColor={baseColor}
                hoverColor={hoverColor}
                highlightColor={highlightColor}
                onPointerOver={() => {
                  if (!iso) return
                  setHoveredCountry(iso)
                }}
                onPointerOut={() => {
                  setHoveredCountry(null)
                }}
                onPointerDown={handlers.onPointerDown}
                onPointerMove={handlers.onPointerMove}
                onPointerUp={handlers.onPointerUp}
              />
            )
          })}
          {linePolygons.map(({ id, iso, points }) => {
            const isSelected = !!(iso && selectedCountry === iso)
            const isHovered = !!(iso && hoveredCountry === iso)
            const handlers = createPointerHandlers(iso, () => {
              if (iso) setSelectedCountry(iso)
            })
            return (
              <ElevatedLine
                key={id}
                iso={iso}
                points={points}
                isSelected={isSelected}
                isHovered={isHovered}
                baseColor={baseColor}
                hoverColor={hoverColor}
                highlightColor={highlightColor}
                onPointerOver={() => {
                  if (!iso) return
                  setHoveredCountry(iso)
                }}
                onPointerOut={() => {
                  setHoveredCountry(null)
                }}
                onPointerDown={handlers.onPointerDown}
                onPointerMove={handlers.onPointerMove}
                onPointerUp={handlers.onPointerUp}
              />
            )
          })}
          {countryLabels.map(({ key, iso, name, position }) => {
            const handlers = createPointerHandlers(iso, () => {
              if (iso) setSelectedCountry(iso)
            })
            return (
              <CountryLabelText
                key={key}
                iso={iso}
                name={name}
                position={position}
                isSelected={!!(iso && selectedCountry === iso)}
                isHovered={!!(iso && hoveredCountry === iso)}
                onPointerDown={handlers.onPointerDown}
                onPointerMove={handlers.onPointerMove}
                onPointerUp={handlers.onPointerUp}
                onPointerOver={() => {
                  if (!iso) return
                  setHoveredCountry(iso)
                }}
                onPointerOut={() => {
                  setHoveredCountry(null)
                }}
              />
            )
          })}
        </Suspense>
        <CameraController
          selectedCountry={selectedCountry}
          countryLabels={countryLabels}
          orbitControlsRef={orbitControlsRef}
        />
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={false}
          minDistance={2.5}
          maxDistance={8}
        />
      </Canvas>
    </div>
  )
}

export default GlobeView

interface ElevatedPolygonProps {
  iso: string | null
  geometry: BufferGeometry
  isSelected: boolean
  isHovered: boolean
  baseColor: Color
  hoverColor: Color
  highlightColor: Color
  onPointerOver: () => void
  onPointerOut: () => void
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
}

function ElevatedPolygon({
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  geometry,
  isSelected,
  isHovered,
  baseColor,
  hoverColor,
  highlightColor,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ElevatedPolygonProps) {
  const { camera } = useThree()
  const groupRef = useRef<Group>(null)
  const targetOffset = useMemo(() => new Vector3(), [])
  const currentOffset = useMemo(() => new Vector3(), [])
  const tempCameraDir = useMemo(() => new Vector3(), [])
  const tempCentroidDir = useMemo(() => new Vector3(), [])
  const [isVisible, setIsVisible] = useState(true)

  const centroid = useMemo(() => {
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere()
    }
    return geometry.boundingSphere?.center ?? new Vector3()
  }, [geometry])

  useFrame(() => {
    if (!groupRef.current) return
    
    // 检查是否在视野内（面向相机）
    const cameraDir = tempCameraDir.copy(camera.position).normalize()
    const centroidDir = tempCentroidDir.copy(centroid).normalize()
    const visible = cameraDir.dot(centroidDir) > 0.2
    setIsVisible(visible)
    
    const target = isSelected ? 0.15 : 0
    const normal = centroid.clone().normalize()
    targetOffset.copy(normal).multiplyScalar(target)

    currentOffset.lerp(targetOffset, 0.1)
    groupRef.current.position.copy(currentOffset)
  })

  const color = isSelected ? highlightColor : isHovered ? hoverColor : baseColor
  const opacity = isSelected ? 0.7 : isHovered ? 0.4 : 0.15

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        renderOrder={isSelected ? 10 : 0}
        onPointerOver={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerOver()
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onPointerOut()
        }}
        onPointerDown={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerDown(event)
        }}
        onPointerMove={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerMove(event)
        }}
        onPointerUp={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerUp(event)
        }}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthTest
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

interface ElevatedLineProps {
  iso: string | null
  points: Vector3[]
  isSelected: boolean
  isHovered: boolean
  baseColor: Color
  hoverColor: Color
  highlightColor: Color
  onPointerOver: () => void
  onPointerOut: () => void
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
}

function ElevatedLine({
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  points,
  isSelected,
  isHovered,
  baseColor,
  hoverColor,
  highlightColor,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ElevatedLineProps) {
  const { camera } = useThree()
  const groupRef = useRef<Group>(null)
  const targetOffset = useMemo(() => new Vector3(), [])
  const currentOffset = useMemo(() => new Vector3(), [])
  const tempCameraDir = useMemo(() => new Vector3(), [])
  const tempCentroidDir = useMemo(() => new Vector3(), [])
  const [isVisible, setIsVisible] = useState(true)

  const centroid = useMemo(() => {
    const center = new Vector3()
    points.forEach((p) => center.add(p))
    return center.divideScalar(points.length)
  }, [points])

  useFrame(() => {
    if (!groupRef.current) return
    
    // 检查是否在视野内（面向相机）
    const cameraDir = tempCameraDir.copy(camera.position).normalize()
    const centroidDir = tempCentroidDir.copy(centroid).normalize()
    const visible = cameraDir.dot(centroidDir) > 0.2
    setIsVisible(visible)
    
    const target = isSelected ? 0.15 : 0
    const normal = centroid.clone().normalize()
    targetOffset.copy(normal).multiplyScalar(target)

    currentOffset.lerp(targetOffset, 0.1)
    groupRef.current.position.copy(currentOffset)
  })

  const color = isSelected ? highlightColor : isHovered ? hoverColor : baseColor
  const lineWidth = isSelected ? 1.8 : isHovered ? 1.2 : 0.7

  return (
    <group ref={groupRef}>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={isSelected ? 1 : 0.75}
        renderOrder={isSelected ? 11 : 1}
        onPointerOver={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerOver()
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onPointerOut()
        }}
        onPointerDown={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerDown(event)
        }}
        onPointerMove={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerMove(event)
        }}
        onPointerUp={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerUp(event)
        }}
      />
    </group>
  )
}

function CountryLabelText({
  position,
  name,
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  isSelected,
  isHovered,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: {
  position: Vector3
  name: string
  iso: string | null
  isSelected: boolean
  isHovered: boolean
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  onPointerOver: () => void
  onPointerOut: () => void
}) {
  const { gl, camera } = useThree()
  const groupRef = useRef<Group>(null)
  const tempCameraDir = useMemo(() => new Vector3(), [])
  const tempLabelDir = useMemo(() => new Vector3(), [])
  const targetOffset = useMemo(() => new Vector3(), [])
  const currentOffset = useMemo(() => new Vector3(), [])
  const [isVisible, setIsVisible] = useState(true)

  useFrame(() => {
    if (!groupRef.current) return
    const cameraDir = tempCameraDir.copy(camera.position).normalize()
    const labelDir = tempLabelDir.copy(position).normalize()
    const visible = cameraDir.dot(labelDir) > 0.2
    setIsVisible(visible)
    groupRef.current.visible = visible

    if (visible) {
      groupRef.current.lookAt(camera.position)

      const target = isSelected ? 0.15 : 0
      const normal = position.clone().normalize()
      targetOffset.copy(normal).multiplyScalar(target)

      currentOffset.lerp(targetOffset, 0.1)
      const finalPosition = position.clone().add(currentOffset)
      groupRef.current.position.copy(finalPosition)
    }
  })

  // 根据状态确定颜色和大小
  const color = isSelected ? '#f97316' : isHovered ? '#facc15' : '#f5f5f4'
  const fontSize = isSelected ? 0.025 : isHovered ? 0.022 : 0.02
  const outlineWidth = isSelected ? 0.003 : isHovered ? 0.0025 : 0.002
  const outlineColor = isSelected ? 'rgba(0,0,0,0.8)' : isHovered ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.65)'
  const renderOrder = isSelected ? 20 : isHovered ? 10 : 5

  return (
    <group ref={groupRef} position={position.toArray()}>
      <Text
        color={color}
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        outlineWidth={outlineWidth}
        outlineColor={outlineColor}
        maxWidth={0.2}
        renderOrder={renderOrder}
        onPointerDown={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerDown(event)
        }}
        onPointerMove={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerMove(event)
        }}
        onPointerUp={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          onPointerUp(event)
        }}
        onPointerOver={(event) => {
          if (!isVisible) return
          event.stopPropagation()
          // 设置鼠标指针为可点击图标
          if (gl.domElement) {
            gl.domElement.style.cursor = 'pointer'
          }
          onPointerOver()
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          // 恢复鼠标指针为默认
          if (gl.domElement) {
            gl.domElement.style.cursor = 'default'
          }
          onPointerOut()
        }}
      >
        {name}
      </Text>
    </group>
  )
}

interface CameraControllerProps {
  selectedCountry: string | null
  countryLabels: CountryLabel[]
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>
}

function CameraController({ selectedCountry, countryLabels, orbitControlsRef }: CameraControllerProps) {
  const { camera } = useThree()
  const isInitializedRef = useRef(false)
  const targetCameraPositionRef = useRef<Vector3 | null>(null)
  const targetLookAtPointRef = useRef<Vector3 | null>(null)
  const isAnimatingRef = useRef(false)

  // 计算目标相机位置（相机应该看向目标点，并从一定距离观察）
  const calculateCameraPosition = (targetPoint: Vector3, distance: number) => {
    // 相机位置在从原点到目标点的方向上，距离原点为 distance
    const direction = targetPoint.clone().normalize()
    return direction.multiplyScalar(distance)
  }

  // 初始化：转到中国位置
  useEffect(() => {
    if (isInitializedRef.current) return
    
    // 等待 OrbitControls 初始化
    const timer = setTimeout(() => {
      const chinaPosition = latLonToCartesian(CHINA_LAT, CHINA_LON, GLOBE_RADIUS)
      const targetDistance = 3.5 // 初始距离，稍微放大
      const cameraPos = calculateCameraPosition(chinaPosition, targetDistance)
      
      // 设置初始相机位置
      camera.position.copy(cameraPos)
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(chinaPosition)
        orbitControlsRef.current.update()
      }
      
      isInitializedRef.current = true
    }, 100)
    
    return () => clearTimeout(timer)
  }, [camera, orbitControlsRef])

  // 当选择国家改变时，转到对应国家位置
  useEffect(() => {
    if (!selectedCountry || !isInitializedRef.current) return

    const countryLabel = countryLabels.find((label) => label.iso === selectedCountry)
    if (!countryLabel || !orbitControlsRef.current) return

    // 使用标签位置归一化后乘以地球半径，得到地球表面的点
    const targetPoint = countryLabel.position.clone().normalize().multiplyScalar(GLOBE_RADIUS)
    const targetDistance = 3.0 // 选择国家时的距离，更近一些
    targetCameraPositionRef.current = calculateCameraPosition(targetPoint, targetDistance)
    targetLookAtPointRef.current = targetPoint.clone()
    isAnimatingRef.current = true
  }, [selectedCountry, countryLabels, orbitControlsRef, camera])

  // 监听用户交互，如果用户在操作，停止动画并将目标点重置为原点
  useEffect(() => {
    const controls = orbitControlsRef.current
    if (!controls) return

    const handleStart = () => {
      if (isAnimatingRef.current) {
        targetCameraPositionRef.current = null
        targetLookAtPointRef.current = null
        isAnimatingRef.current = false
      }
      // 用户开始交互时，将目标点重置为原点，使相机围绕地球中心旋转
      controls.target.set(0, 0, 0)
      controls.update()
    }

    controls.addEventListener('start', handleStart)
    return () => {
      controls.removeEventListener('start', handleStart)
    }
  }, [orbitControlsRef])

  // 平滑动画到目标位置
  useFrame(() => {
    if (!orbitControlsRef.current) return

    if (targetCameraPositionRef.current !== null && targetLookAtPointRef.current !== null && isAnimatingRef.current) {
      const currentPos = camera.position.clone()
      const targetCameraPos = targetCameraPositionRef.current
      const targetLookAt = targetLookAtPointRef.current
      const distance = currentPos.distanceTo(targetCameraPos)

      // 如果距离足够近，停止动画
      if (distance < 0.01) {
        camera.position.copy(targetCameraPos)
        orbitControlsRef.current.target.copy(targetLookAt)
        orbitControlsRef.current.update()
        targetCameraPositionRef.current = null
        targetLookAtPointRef.current = null
        isAnimatingRef.current = false
      } else {
        // 平滑插值相机位置和目标点
        camera.position.lerp(targetCameraPos, 0.05)
        orbitControlsRef.current.target.lerp(targetLookAt, 0.05)
        orbitControlsRef.current.update()
      }
    }
  })

  return null
}

interface AirportParticleProps {
  airport: AirportParticle & { position: Vector3 }
  isSelected: boolean
}

function AirportParticle({ airport, isSelected }: AirportParticleProps) {
  const { gl } = useThree()
  const groupRef = useRef<Group>(null)
  const targetOffset = useMemo(() => new Vector3(), [])
  const currentOffset = useMemo(() => new Vector3(), [])
  const [glowIntensity, setGlowIntensity] = useState(1)
  const { setHoveredAirport, setTooltipPosition } = useAppStore()
  
  // 保存原始位置，避免被修改
  const basePosition = useMemo(() => airport.position.clone(), [airport.position])
  
  // 调试信息
  useEffect(() => {
    if (isSelected) {
      console.log('机场上升:', airport.id, 'isSelected:', isSelected)
    }
  }, [isSelected, airport.id])

  // 处理鼠标事件
  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
    setHoveredAirport({
      airportId: airport.id,
      airportName: airport.name,
      operatorCount: airport.operatorCount,
      flightCount: airport.flightCount,
      environmentRisk: airport.environmentRisk,
    })
    if (gl.domElement) {
      gl.domElement.style.cursor = 'pointer'
    }
  }, [airport, setHoveredAirport, setTooltipPosition, gl])

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHoveredAirport(null)
    setTooltipPosition(null)
    if (gl.domElement) {
      gl.domElement.style.cursor = 'default'
    }
  }, [setHoveredAirport, setTooltipPosition, gl])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
  }, [setTooltipPosition])

  useFrame(() => {
    if (!groupRef.current) return
    // 选中的机场上升
    const target = isSelected ? 0.15 : 0
    const normalVec = basePosition.clone().normalize()
    targetOffset.copy(normalVec).multiplyScalar(target)
    currentOffset.lerp(targetOffset, 0.1)
    
    const finalPosition = basePosition.clone().add(currentOffset)
    groupRef.current.position.copy(finalPosition)
    
    // 发光动画效果
    const time = Date.now() * 0.001
    const intensity = isSelected ? 1.2 + Math.sin(time * 3) * 0.3 : 0.8 + Math.sin(time * 2) * 0.2
    setGlowIntensity(intensity)
  })

  return (
    <group ref={groupRef}>
      {/* 最外层大光晕 */}
      <mesh 
        position={[0, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial
          color={airport.color}
          transparent
          opacity={0.2 * glowIntensity}
        />
      </mesh>
      {/* 中层光晕 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshBasicMaterial
          color={airport.color}
          transparent
          opacity={0.5 * glowIntensity}
        />
      </mesh>
      {/* 内层亮点 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  )
}

interface FlightRouteProps {
  id: string
  from: Vector3
  to: Vector3
  color: string
  fromIsSelected: boolean
  toIsSelected: boolean
  flightNumber: string
  fromAirport: string
  toAirport: string
  status: string
  scheduledDeparture: string
  scheduledArrival: string
  humanRisk: number
  machineRisk: number
  environmentRisk: number
}

function FlightRoute({ 
  id: _id, // eslint-disable-line @typescript-eslint/no-unused-vars
  from, 
  to, 
  color, 
  fromIsSelected, 
  toIsSelected,
  flightNumber,
  fromAirport,
  toAirport,
  status,
  scheduledDeparture,
  scheduledArrival,
  humanRisk,
  machineRisk,
  environmentRisk,
}: FlightRouteProps) {
  const { gl } = useThree()
  const { setHoveredFlightRoute, setTooltipPosition } = useAppStore()
  const particlePositionRef = useRef(0)
  const [isHovered, setIsHovered] = useState(false)
  
  // 根据状态确定颜色
  const getStatusColor = useCallback((status: string, baseColor: string) => {
    switch (status) {
      case '飞行中':
        return '#10b981' // 绿色 - 飞行中
      case '已起飞':
        return '#3b82f6' // 蓝色 - 已起飞
      case '已到达':
        return '#6b7280' // 灰色 - 已到达
      case '计划中':
      default:
        return baseColor // 使用原始颜色
    }
  }, [])
  
  const routeColor = useMemo(() => getStatusColor(status, color), [status, color, getStatusColor])
  
  // 计算上升后的位置
  const getElevatedPosition = useCallback((position: Vector3, isSelected: boolean) => {
    const normal = position.clone().normalize()
    const offset = isSelected ? 0.15 : 0
    return position.clone().add(normal.clone().multiplyScalar(offset))
  }, [])

  // 创建弧线路径（大圆航线）
  const curvePoints = useMemo(() => {
    const points: Vector3[] = []
    const steps = 80 // 增加点数使线条更平滑
    
    // 计算上升后的起点和终点
    const elevatedFrom = getElevatedPosition(from, fromIsSelected)
    const elevatedTo = getElevatedPosition(to, toIsSelected)
    
    // 计算大圆路径
    const start = elevatedFrom.clone().normalize()
    const end = elevatedTo.clone().normalize()
    const angle = start.angleTo(end)
    
    // 计算弧线高度（使航线呈现弧形）
    const maxHeight = 0.3 // 最大高度偏移
    // 确保航线在地球表面上方，最小距离为地球半径 + 偏移
    const minDistance = GLOBE_RADIUS + 0.05
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const currentAngle = angle * t
      
      // 使用球面线性插值 (slerp)
      const sinAngle = Math.sin(angle)
      let point: Vector3
      
      if (sinAngle < 0.0001) {
        // 如果角度太小，直接线性插值
        point = start.clone().lerp(end, t).normalize()
      } else {
        const sinT = Math.sin(currentAngle)
        const sin1T = Math.sin(angle - currentAngle)
        point = start.clone()
          .multiplyScalar(sin1T / sinAngle)
          .add(end.clone().multiplyScalar(sinT / sinAngle))
          .normalize()
      }
      
      // 计算弧线高度（中间高，两端低）
      const heightFactor = Math.sin(t * Math.PI) // 0 到 1 再到 0
      const heightOffset = heightFactor * maxHeight
      
      // 根据起点和终点的距离，计算路径上的高度
      const fromDist = Math.max(elevatedFrom.length(), minDistance)
      const toDist = Math.max(elevatedTo.length(), minDistance)
      const baseDist = fromDist + (toDist - fromDist) * t
      const finalDist = Math.max(baseDist + heightOffset, minDistance)
      
      points.push(point.multiplyScalar(finalDist))
    }
    
    return points
  }, [from, to, fromIsSelected, toIsSelected, getElevatedPosition])

  // 动画粒子位置
  useFrame(() => {
    particlePositionRef.current += 0.01
    if (particlePositionRef.current > 1) {
      particlePositionRef.current = 0
    }
  })

  // 获取粒子位置
  const getParticlePosition = useCallback(() => {
    if (curvePoints.length === 0) return null
    const index = Math.floor(particlePositionRef.current * (curvePoints.length - 1))
    return curvePoints[Math.min(index, curvePoints.length - 1)]
  }, [curvePoints])

  // 处理鼠标事件
  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(true)
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
    setHoveredFlightRoute({
      flightNumber,
      fromAirport,
      toAirport,
      status,
      scheduledDeparture,
      scheduledArrival,
      humanRisk,
      machineRisk,
      environmentRisk,
    })
    if (gl.domElement) {
      gl.domElement.style.cursor = 'pointer'
    }
  }, [flightNumber, fromAirport, toAirport, status, scheduledDeparture, scheduledArrival, humanRisk, machineRisk, environmentRisk, setHoveredFlightRoute, setTooltipPosition, gl])

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(false)
    setHoveredFlightRoute(null)
    setTooltipPosition(null)
    if (gl.domElement) {
      gl.domElement.style.cursor = 'default'
    }
  }, [setHoveredFlightRoute, setTooltipPosition, gl])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
  }, [setTooltipPosition])

  // 确保航线可见
  if (curvePoints.length === 0) {
    console.warn('航线点为空')
    return null
  }
  
  const lineWidth = isHovered ? 4 : 2.5
  const opacity = isHovered ? 1 : 0.7
  const glowOpacity = isHovered ? 0.4 : 0.25
  
  const particlePos = getParticlePosition()
  
  return (
    <group>
      {/* 外层光晕 - 最粗最透明 */}
      <Line
        points={curvePoints}
        color={routeColor}
        lineWidth={lineWidth * 2.5}
        transparent
        opacity={glowOpacity * 0.3}
        renderOrder={4}
        depthTest={true}
        depthWrite={false}
      />
      {/* 中层光晕 */}
      <Line
        points={curvePoints}
        color={routeColor}
        lineWidth={lineWidth * 1.8}
        transparent
        opacity={glowOpacity * 0.5}
        renderOrder={5}
        depthTest={true}
        depthWrite={false}
      />
      {/* 主航线 */}
      <Line
        points={curvePoints}
        color={routeColor}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        renderOrder={6}
        depthTest={true}
        depthWrite={false}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      />
      {/* 流动的粒子效果 */}
      {particlePos && status === '飞行中' && (
        <mesh position={particlePos.toArray()} renderOrder={7}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            depthTest={true}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* 起点标记 */}
      <mesh position={curvePoints[0].toArray()} renderOrder={7}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial
          color={routeColor}
          transparent
          opacity={0.9}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>
      {/* 终点标记 */}
      <mesh position={curvePoints[curvePoints.length - 1].toArray()} renderOrder={7}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial
          color={routeColor}
          transparent
          opacity={0.9}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
