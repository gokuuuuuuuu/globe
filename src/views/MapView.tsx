import { Line, OrthographicCamera, OrbitControls, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useCallback, useEffect } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Color, DoubleSide, Path, Shape, Vector3, Group, MeshBasicMaterial } from 'three'
import { useAppStore } from '../store/useAppStore'
import type { WorldData, AtlasData } from '../types'
import { deriveIsoCode, latLonToPlane } from '../utils/geo'
import { AIRPORTS, FLIGHTS, getAirportByCode, getRiskColor } from '../data/flightData'
import { MapFlightPaths } from '../components/MapFlightPaths'
import type { OrthographicCamera as OrthographicCameraImpl } from 'three'

const MAP_SCALE = 6

interface MapViewProps {
  world: WorldData
  atlas?: AtlasData
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

// 国家代码映射表
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

function normalizeCountryCode(code: string | null): string | null {
  if (!code) return null
  const upper = code.toUpperCase().trim()
  return COUNTRY_CODE_MAP[upper] || upper
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

export function MapView({ world, atlas }: MapViewProps) {
  const { 
    selectedCountry, 
    setSelectedCountry, 
    hoveredCountry, 
    setHoveredCountry,
    hoveredAirport,
    hoveredFlightRoute,
    tooltipPosition,
    viewingAirportId,
    selectedFlightRouteId,
    showLabels,
  } = useAppStore()
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)

  // 跟踪空白区域的点击状态（用于区分点击和拖动）
  const blankAreaPointerStateRef = useRef<{
    downTime: number
    downX: number
    downY: number
    moved: boolean
  } | null>(null)

  // 设置鼠标按钮：左键用于拖动
  useEffect(() => {
    const controls = orbitControlsRef.current
    if (!controls) return
    
    // 设置鼠标按钮：左键用于拖动（平移），禁用中键和右键
    // 0 = 旋转, 1 = 平移, 2 = 缩放
    controls.mouseButtons = {
      LEFT: 1, // 左键用于拖动（平移）
      MIDDLE: undefined, // 禁用中键
      RIGHT: undefined, // 禁用右键
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

        // 计算这个多边形的中心点和权重
        const center = new Vector3()
        outerRing.forEach((point) => {
          center.add(point)
        })
        center.divideScalar(outerRing.length)
        
        // 使用多边形面积作为权重（简化计算：使用边界框面积）
        const minX = Math.min(...outerRing.map(p => p.x))
        const maxX = Math.max(...outerRing.map(p => p.x))
        const minY = Math.min(...outerRing.map(p => p.y))
        const maxY = Math.max(...outerRing.map(p => p.y))
        const weight = (maxX - minX) * (maxY - minY)
        
        const updateCenter = (key: string, isoCode: string | null, name: string | null) => {
          const existing = countryCenters.get(key)
          if (!existing) {
            countryCenters.set(key, {
              weightedCenter: center.clone().multiplyScalar(weight),
              totalWeight: weight,
              iso: isoCode,
              fallbackName: name,
            })
          } else {
            existing.weightedCenter.add(center.clone().multiplyScalar(weight))
            existing.totalWeight += weight
          }
        }

        const labelKey = iso ?? featureName ?? `${featureIndex}-${polygonIndex}`
        
        if (iso === 'CN' && featureName) {
          // 1. 省份标签
          updateCenter(`CN-${featureName}`, iso, featureName)
          // 2. 国家标签 (聚合)
          updateCenter('CN', iso, null)
        } else {
          updateCenter(labelKey, iso, featureName)
        }
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
      
      labelsMap.set(labelKey, {
        iso: data.iso,
        fallbackName: data.fallbackName,
        position: finalCenter,
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
    if (!atlas) return []
    return labelCandidates
      .map(({ key, iso, fallbackName, position }) => {
        // 如果是中国的省份（key 以 CN- 开头），直接使用 fallbackName
        if (key.startsWith('CN-') && fallbackName) {
          return { key, iso, position, name: fallbackName }
        }

        const country = iso ? atlas.countries[iso] : undefined
        const name = country?.name ?? fallbackName
        if (!name) return null
        return { key, iso, position, name }
      })
      .filter((value): value is CountryLabel => value !== null)
  }, [atlas, labelCandidates])

  // 机场实例（使用平面坐标）
  const airportInstances = useMemo(() => {
    return AIRPORTS.map((airport) => {
      const position = latLonToPlane(airport.lat, airport.lon, MAP_SCALE)
      return { ...airport, position }
    })
  }, [])

  // 计算航线
  const flightRoutes = useMemo(() => {
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
    
    // 情况1: 如果选中了特定航线，只显示该航线
    if (selectedFlightRouteId) {
      const flight = FLIGHTS.find(f => f.id === selectedFlightRouteId)
      if (flight) {
        const fromAirport = getAirportByCode(flight.fromAirport)
        const toAirport = getAirportByCode(flight.toAirport)
        
        if (fromAirport && toAirport) {
          const fromAirportInstance = airportInstances.find(a => a.id === fromAirport.id)
          const toAirportInstance = airportInstances.find(a => a.id === toAirport.id)
          
          if (fromAirportInstance && toAirportInstance) {
            // 确保航线起点和终点与机场圆点位置一致（z=0.05）
            const fromPos = fromAirportInstance.position.clone()
            fromPos.z = 0.05
            const toPos = toAirportInstance.position.clone()
            toPos.z = 0.05
            
            // 根据环境风险值设置航线颜色
            const routeColor = getRiskColor(flight.environmentRisk)
            
            routes.push({
              id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
              from: fromPos,
              to: toPos,
              color: routeColor, // 根据环境风险值设置颜色
              fromIsSelected: false,
              toIsSelected: false,
              flightNumber: flight.flightNumber,
              fromAirport: fromAirport.name,
              toAirport: toAirport.name,
              status: flight.status,
              scheduledDeparture: flight.scheduledDeparture,
              scheduledArrival: flight.scheduledArrival,
              humanRisk: flight.humanRisk,
              machineRisk: flight.machineRisk,
              environmentRisk: flight.environmentRisk,
            })
          }
        }
      }
      return routes
    }
    
    // 情况2: 如果正在查看某个机场，显示该机场的所有航线
    if (viewingAirportId) {
      const viewingAirport = AIRPORTS.find(a => a.id === viewingAirportId)
      if (!viewingAirport) return routes
      
      const relevantFlights = FLIGHTS.filter(flight => {
        return flight.fromAirport === viewingAirport.code || flight.toAirport === viewingAirport.code
      })
      
      relevantFlights.forEach(flight => {
        const fromAirport = getAirportByCode(flight.fromAirport)
        const toAirport = getAirportByCode(flight.toAirport)
        
        if (!fromAirport || !toAirport) return
        
        const fromAirportInstance = airportInstances.find(a => a.id === fromAirport.id)
        const toAirportInstance = airportInstances.find(a => a.id === toAirport.id)
        
        if (!fromAirportInstance || !toAirportInstance) return
        
        const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
        const fromIsSelected = normalizedSelectedCountry && normalizeCountryCode(fromAirport.countryCode) === normalizedSelectedCountry
        const toIsSelected = normalizedSelectedCountry && normalizeCountryCode(toAirport.countryCode) === normalizedSelectedCountry
        
        // 确保航线起点和终点与机场圆点位置一致（z=0.05）
        const fromPos = fromAirportInstance.position.clone()
        fromPos.z = 0.05
        const toPos = toAirportInstance.position.clone()
        toPos.z = 0.05
        
        // 根据环境风险值设置航线颜色
        const routeColor = getRiskColor(flight.environmentRisk)
        
        routes.push({
          id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
          from: fromPos,
          to: toPos,
          color: routeColor, // 根据环境风险值设置颜色
          fromIsSelected: !!fromIsSelected,
          toIsSelected: !!toIsSelected,
          flightNumber: flight.flightNumber,
          fromAirport: fromAirport.name,
          toAirport: toAirport.name,
          status: flight.status,
          scheduledDeparture: flight.scheduledDeparture,
          scheduledArrival: flight.scheduledArrival,
          humanRisk: flight.humanRisk,
          machineRisk: flight.machineRisk,
          environmentRisk: flight.environmentRisk,
        })
      })
      
      return routes
    }
    
    // 情况3: 默认情况，显示所有航线
    // 从统一航班数据中获取所有航班
    const allFlights = FLIGHTS
    
    allFlights.forEach(flight => {
      const fromAirport = getAirportByCode(flight.fromAirport)
      const toAirport = getAirportByCode(flight.toAirport)
      
      if (!fromAirport || !toAirport) return
      
      const fromAirportInstance = airportInstances.find(a => a.id === fromAirport.id)
      const toAirportInstance = airportInstances.find(a => a.id === toAirport.id)
      
      if (!fromAirportInstance || !toAirportInstance) return
      
      // 标准化国家代码（用于判断是否选中）
      const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
      const fromIsSelected = !!(normalizedSelectedCountry && normalizeCountryCode(fromAirport.countryCode) === normalizedSelectedCountry)
      const toIsSelected = !!(normalizedSelectedCountry && normalizeCountryCode(toAirport.countryCode) === normalizedSelectedCountry)

      // 确保航线起点和终点与机场圆点位置一致（z=0.05）
      const fromPos = fromAirportInstance.position.clone()
      fromPos.z = 0.05
      const toPos = toAirportInstance.position.clone()
      toPos.z = 0.05

      // 根据环境风险值设置航线颜色
      const routeColor = getRiskColor(flight.environmentRisk)

      routes.push({
        id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
        from: fromPos,
        to: toPos,
        color: routeColor, // 根据环境风险值设置颜色
        fromIsSelected,
        toIsSelected,
        flightNumber: flight.flightNumber,
        fromAirport: fromAirport.name,
        toAirport: toAirport.name,
        status: flight.status,
        scheduledDeparture: flight.scheduledDeparture,
        scheduledArrival: flight.scheduledArrival,
        humanRisk: flight.humanRisk,
        machineRisk: flight.machineRisk,
        environmentRisk: flight.environmentRisk,
      })
    })
    
    return routes
  }, [selectedCountry, airportInstances, viewingAirportId, selectedFlightRouteId])

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
          <mesh 
            position={[0, 0, -1]}
            onPointerDown={(event) => {
              // 记录按下状态，用于区分点击和拖动
              const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
              const clientX = nativeEvent.clientX ?? 0
              const clientY = nativeEvent.clientY ?? 0
              blankAreaPointerStateRef.current = {
                downTime: Date.now(),
                downX: clientX,
                downY: clientY,
                moved: false,
              }
            }}
            onPointerMove={(event) => {
              // 检测是否拖动
              if (!blankAreaPointerStateRef.current) return
              const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
              const clientX = nativeEvent.clientX ?? 0
              const clientY = nativeEvent.clientY ?? 0
              const deltaX = Math.abs(clientX - blankAreaPointerStateRef.current.downX)
              const deltaY = Math.abs(clientY - blankAreaPointerStateRef.current.downY)
              // 如果移动距离超过 5 像素，认为是拖动
              if (deltaX > 5 || deltaY > 5) {
                blankAreaPointerStateRef.current.moved = true
              }
            }}
            onPointerUp={(event) => {
              // 只有在短按（< 200ms）且没有移动的情况下才取消选择
              if (!blankAreaPointerStateRef.current) return
              const state = blankAreaPointerStateRef.current
              const duration = Date.now() - state.downTime
              const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
              const clientX = nativeEvent.clientX ?? 0
              const clientY = nativeEvent.clientY ?? 0
              const deltaX = Math.abs(clientX - state.downX)
              const deltaY = Math.abs(clientY - state.downY)
              const moved = state.moved || deltaX > 5 || deltaY > 5
              
              // 只有在短按且没有移动的情况下才取消选择
              if (!moved && duration < 200 && selectedCountry) {
                setSelectedCountry(null)
              }
              
              blankAreaPointerStateRef.current = null
            }}
          >
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
          {/* 机场显示 */}
          {airportInstances.map((airport) => {
            const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
            const normalizedAirportCountry = normalizeCountryCode(airport.countryCode)
            const isSelected = normalizedSelectedCountry === normalizedAirportCountry
            return (
              <MapAirportParticle
                key={airport.id}
                airport={airport}
                isSelected={isSelected}
              />
            )
          })}
          {/* 航线显示 */}
          {flightRoutes.length > 0 && (
            <MapFlightPaths routes={flightRoutes} />
          )}
          {/* 国家标签 - 只显示选中的国家、悬停的国家或主要国家 */}
          {showLabels && countryLabels
            .filter(({ key, iso }) => {
              // 只显示选中的国家、悬停的国家，或者主要大国
              const isSelected = iso && selectedCountry === iso
              const isHovered = iso && hoveredCountry === iso
              
              // 主要国家列表（基于面积和重要性，只显示最重要的国家）
              const majorCountries = ['CN', 'US', 'RU', 'CA', 'BR', 'AU', 'IN', 'AR', 'KZ', 'DZ', 'SA', 'MX', 'ID', 'MN', 'LY', 'IR', 'PE', 'NG', 'TZ', 'EG', 'MA', 'ZA', 'SD', 'YE', 'TH', 'ES', 'TR', 'BO', 'MM', 'AF', 'VE', 'MY', 'PH', 'IQ', 'SE', 'GB', 'FR', 'DE', 'JP', 'IT', 'KR', 'PL', 'VN', 'NO', 'NZ', 'BD', 'EC', 'RO', 'KE', 'SY', 'KH', 'UY', 'TN', 'BG', 'NP', 'GR', 'BA', 'LK', 'GT', 'JO', 'AE', 'CZ', 'PT', 'HU', 'RS', 'IE', 'GE', 'CR', 'SK', 'HR', 'LV', 'LT', 'SI', 'ME', 'EE', 'DK', 'NL', 'CH', 'AT', 'BE', 'SG']
              
              // 省份标签：完全隐藏，避免遮挡地图
              // 如果需要显示省份，可以改为：return selectedCountry === 'CN' && isHovered
              if (key.startsWith('CN-')) {
                return false // 不显示省份标签
              }
              
              // 中国国家标签仅在未选中中国时显示
              if (key === 'CN') {
                return selectedCountry !== 'CN'
              }
              
              // 显示选中的国家、悬停的国家，或主要国家
              if (isSelected || isHovered) {
                return true
              }
              
              // 只显示主要国家（避免标签过多）
              return iso && majorCountries.includes(iso)
            })
            .map(({ key, iso, name, position }) => {
              return (
                <MapCountryLabel
                  key={key}
                  iso={iso}
                  name={name}
                  position={position}
                  isSelected={!!(iso && selectedCountry === iso)}
                  isHovered={!!(iso && hoveredCountry === iso)}
                  onPointerOver={() => {
                    if (!iso) return
                    setHoveredCountry(iso)
                  }}
                  onPointerOut={() => {
                    setHoveredCountry(null)
                  }}
                  onPointerDown={() => {
                    if (iso) setSelectedCountry(iso)
                  }}
                />
              )
            })}
        </Suspense>
        <MapCameraController
          selectedCountry={selectedCountry}
          countryLabels={countryLabels}
          orbitControlsRef={orbitControlsRef}
        />
        <OrbitControls 
          ref={orbitControlsRef}
          enableRotate={false} 
          enablePan={true} 
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.05}
          panSpeed={1.0}
          zoomSpeed={1.0}
          maxZoom={300} 
          minZoom={20}
        />
      </Canvas>
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
    </div>
  )
}

interface MapAirportParticleProps {
  airport: typeof AIRPORTS[0] & { position: Vector3 }
  isSelected: boolean
}

function MapAirportParticle({ airport, isSelected }: MapAirportParticleProps) {
  const { gl, camera } = useThree()
  const groupRef = useRef<Group>(null)
  const labelRef = useRef<Group>(null)
  const glowIntensityRef = useRef(1)
  const materialRefs = useRef<{ outer?: MeshBasicMaterial; inner?: MeshBasicMaterial }>({})
  const { setHoveredAirport, setTooltipPosition, viewingAirportId } = useAppStore()
  const isViewing = viewingAirportId === airport.id
  
  const basePosition = useMemo(() => airport.position.clone(), [airport.position])
  
  // 根据风险值计算闪烁参数
  const getPulseParams = useMemo(() => {
    const risk = airport.environmentRisk
    if (risk >= 7) {
      // 高风险：快速闪烁，强度大
      return { speed: 4, intensity: 0.4, baseColor: new Color('#ff1744'), brightColor: new Color('#ff6b9d') }
    } else if (risk >= 5) {
      // 中风险：中等速度闪烁
      return { speed: 3, intensity: 0.3, baseColor: new Color('#ff6f00'), brightColor: new Color('#ffb74d') }
    } else if (risk >= 2) {
      // 低风险：慢速闪烁
      return { speed: 2, intensity: 0.25, baseColor: new Color('#ffc107'), brightColor: new Color('#ffeb3b') }
    } else {
      // 极低风险：很慢的闪烁
      return { speed: 1.5, intensity: 0.2, baseColor: new Color('#4caf50'), brightColor: new Color('#81c784') }
    }
  }, [airport.environmentRisk])

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
    
    const finalPosition = basePosition.clone()
    finalPosition.z = 0.05 // 稍微抬高以便在地图上方显示
    groupRef.current.position.copy(finalPosition)
    
    // 增强发光动画效果 - 提高基础亮度
    const time = Date.now() * 0.001
    let intensity = isSelected ? 1.5 + Math.sin(time * 2) * 0.3 : 1.2 + Math.sin(time * 1.5) * 0.25
    
    if (isViewing) {
      intensity = 2.0 + Math.sin(time * 3) * 0.4
    }
    
    glowIntensityRef.current = intensity
    
    // 闪烁颜色动画 - 根据风险值动态调整颜色
    const pulse = Math.sin(time * getPulseParams.speed) * 0.5 + 0.5 // 0 到 1 之间
    const currentColor = new Color().lerpColors(
      getPulseParams.baseColor,
      getPulseParams.brightColor,
      pulse * getPulseParams.intensity
    )
    
    // 增强发光效果 - 提高透明度和亮度
    if (materialRefs.current.outer) {
      materialRefs.current.outer.color.copy(currentColor)
      // 大幅提高外层光晕的亮度和透明度
      materialRefs.current.outer.opacity = (isViewing ? 0.8 : isSelected ? 0.7 : 0.6) * intensity
    }
    if (materialRefs.current.inner) {
      materialRefs.current.inner.color.copy(currentColor)
      // 提高内层实心点的亮度
      materialRefs.current.inner.opacity = (isViewing ? 1.0 : isSelected ? 1.0 : 1.0) * Math.min(intensity, 1.2)
    }
    
    if (isViewing && labelRef.current && camera) {
      labelRef.current.lookAt(camera.position)
      const labelOffset = new Vector3(0, 0, 0.08)
      labelRef.current.position.copy(finalPosition.clone().add(labelOffset))
    }
  })

  // 2D地图上的机场显示：使用扁平圆形 - 增大尺寸以增强可见性
  const size = isViewing ? 0.12 : isSelected ? 0.10 : 0.08 // 缩小外层光晕半径
  const innerSize = isViewing ? 0.05 : isSelected ? 0.04 : 0.03 // 缩小内层半径
  const glowSize = size * 1.5 // 添加更大的外层光晕

  return (
    <group ref={groupRef}>
      {/* 最外层大光晕（增强发光效果） */}
      <mesh 
        position={[0, 0, -0.01]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <circleGeometry args={[glowSize, 32]} />
        <meshBasicMaterial
          color={airport.color}
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>
      {/* 外层光晕（扁平圆形） */}
      <mesh 
        position={[0, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial
          ref={(ref) => { if (ref) materialRefs.current.outer = ref }}
          color={airport.color}
          transparent
          opacity={0.6}
          side={DoubleSide}
        />
      </mesh>
      {/* 内层实心点 */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[innerSize, 16]} />
        <meshBasicMaterial
          ref={(ref) => { if (ref) materialRefs.current.inner = ref }}
          color={airport.color}
          transparent
          opacity={1.0}
          side={DoubleSide}
        />
      </mesh>
      {/* 中心白点 */}
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[innerSize * 0.5, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1.0}
          side={DoubleSide}
        />
      </mesh>
      {/* 正在查看时的机场名称标签 */}
      {isViewing && (
        <group ref={labelRef}>
          <Text
            color="#ffffff"
            fontSize={0.2}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={2}
            renderOrder={100}
          >
            {airport.code}
          </Text>
        </group>
      )}
    </group>
  )
}

interface MapCountryLabelProps {
  iso: string | null
  name: string
  position: Vector3
  isSelected: boolean
  isHovered: boolean
  onPointerOver: () => void
  onPointerOut: () => void
  onPointerDown: () => void
}

function MapCountryLabel({
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  name,
  position,
  isSelected,
  isHovered,
  onPointerOver,
  onPointerOut,
  onPointerDown,
}: MapCountryLabelProps) {
  const { gl, camera } = useThree()
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (!groupRef.current || !camera) return
    // 在2D地图上，标签始终面向相机
    groupRef.current.lookAt(camera.position)
  })

  // 减小字体大小，避免遮挡地图
  const fontSize = isSelected ? 0.18 : isHovered ? 0.16 : 0.14
  const outlineWidth = isSelected ? 0.025 : isHovered ? 0.02 : 0.015
  const renderOrder = isSelected ? 20 : isHovered ? 10 : 5
  // 通过颜色透明度实现效果
  const color = isSelected 
    ? '#f97316' 
    : isHovered 
    ? '#facc15' 
    : 'rgba(229, 231, 235, 0.7)' // 降低非选中/悬停标签的透明度

  return (
    <group ref={groupRef} position={[position.x, position.y, 0.1]}>
      <Text
        color={color}
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        outlineWidth={outlineWidth}
        outlineColor="#000000"
        maxWidth={1.5}
        renderOrder={renderOrder}
        onPointerDown={(event) => {
          event.stopPropagation()
          onPointerDown()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          if (gl.domElement) {
            gl.domElement.style.cursor = 'pointer'
          }
          onPointerOver()
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
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

interface MapCameraControllerProps {
  selectedCountry: string | null
  countryLabels: CountryLabel[]
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>
}

function MapCameraController({
  selectedCountry,
  countryLabels,
  orbitControlsRef,
}: MapCameraControllerProps) {
  const { camera } = useThree()
  const orthoCamera = camera as OrthographicCameraImpl

  const isAnimatingRef = useRef(false)
  const animStartRef = useRef(0)
  const animDuration = 600 // 毫秒
  const startPosRef = useRef(new Vector3())
  const targetPosRef = useRef(new Vector3())
  const startTargetRef = useRef(new Vector3())
  const targetTargetRef = useRef(new Vector3())
  const startZoomRef = useRef<number>(orthoCamera.zoom)
  const targetZoomRef = useRef<number>(100) // 默认回到的 zoom
  const initialZoom = 100 // 初始 zoom

  // 配置：选中时的目标 zoom（数值越大越“放大”）
  const selectedCountryZoom = 150 // 当选中某国时缩放到这个 zoom

  // 缓动函数（easeInOutQuad）
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

  // 获取国家中心位置（xy），如果找不到则返回 null
  const findCountryPosition = useCallback((iso: string | null) => {
    if (!iso) return null
    const found = countryLabels.find((c) => c.iso === iso)
    if (found) return found.position.clone()
    // 兜底：有时 key 不是 iso，可以尝试按 key 匹配（如果你有这种需求）
    const alt = countryLabels.find((c) => c.key === iso)
    return alt ? alt.position.clone() : null
  }, [countryLabels])

  // 启动动画（设置起始/目标状态）
  const startAnimation = useCallback((toPosition: Vector3 | null, toZoom: number) => {
    // 记录开始时间与起始状态
    isAnimatingRef.current = true
    animStartRef.current = performance.now()

    startPosRef.current.copy(camera.position)
    startTargetRef.current.copy(orbitControlsRef.current?.target ?? new Vector3(0, 0, 0))

    if (toPosition) {
      // 摄像机位置保持 z，不改变 z
      const camZ = camera.position.z
      targetPosRef.current.set(toPosition.x, toPosition.y, camZ)
      // controls.target 指向地图平面上的点（z = 0）
      targetTargetRef.current.set(toPosition.x, toPosition.y, 0)
    } else {
      // 回到原点视角
      targetPosRef.current.set(0, 0, camera.position.z)
      targetTargetRef.current.set(0, 0, 0)
    }

    startZoomRef.current = orthoCamera.zoom
    targetZoomRef.current = toZoom

    // 临时禁用 OrbitControls 的交互以避免用户打断动画
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }
  }, [camera, orthoCamera, orbitControlsRef])

  // 每次 selectedCountry 改变时触发动画
  useEffect(() => {
    const pos = findCountryPosition(selectedCountry)
    if (selectedCountry && pos) {
      // 有选中时放大
      startAnimation(pos, selectedCountryZoom)
    } else {
      // 取消选中时回到默认视角与 zoom
      startAnimation(null, initialZoom)
    }
  }, [selectedCountry, findCountryPosition, startAnimation])

  // useFrame 中执行 LERP 动画
  useFrame(() => {
    if (!isAnimatingRef.current) return

    const now = performance.now()
    const tRaw = (now - animStartRef.current) / animDuration
    const t = Math.min(1, Math.max(0, tRaw))
    const tt = ease(t)

    // 位置 lerp
    camera.position.lerpVectors(startPosRef.current, targetPosRef.current, tt)
    // controls.target lerp (如果存在 controls)
    if (orbitControlsRef.current) {
      const currTarget = orbitControlsRef.current.target
      currTarget.lerpVectors(startTargetRef.current, targetTargetRef.current, tt)
      orbitControlsRef.current.update()
    }

    // zoom lerp（正交相机需要手动 updateProjectionMatrix）
    orthoCamera.zoom = startZoomRef.current + (targetZoomRef.current - startZoomRef.current) * tt
    orthoCamera.updateProjectionMatrix()

    if (t >= 1) {
      // 结束动画：确保到达目标，恢复 controls
      isAnimatingRef.current = false
      if (orbitControlsRef.current) {
        // 最终写入 target，并允许交互（可根据需求保持禁用）
        orbitControlsRef.current.target.copy(targetTargetRef.current)
        orbitControlsRef.current.update()
        orbitControlsRef.current.enabled = true
      }
    }
  })

  // 初始化：把 camera 和 controls target 设为默认（只执行一次）
  const initedRef = useRef(false)
  useEffect(() => {
    if (initedRef.current) return
    // 确保初始状态一致
    orthoCamera.zoom = initialZoom
    orthoCamera.updateProjectionMatrix()
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(0, 0, 0)
      orbitControlsRef.current.update()
    }
    initedRef.current = true
  }, [orthoCamera, orbitControlsRef])

  return null
}


export default MapView


