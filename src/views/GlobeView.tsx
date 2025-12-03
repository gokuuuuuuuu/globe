import { Line, OrbitControls, Text, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useEffect, useCallback, useState } from 'react'
import { GlowingFlightPaths } from '../components/GlowingFlightPaths'
import { Sidebar } from '../components/Sidebar'
import { WindLegend, TemperatureLegend } from '../components/Legend'
import { WindLayer } from './windLayer'
import { TemperatureLayer } from './TemperatureLayer'

import {
  BufferGeometry,
  Color,
  DoubleSide,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
  Group,
  MeshBasicMaterial,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAppStore } from '../store/useAppStore'
import type { AtlasData, WorldData } from '../types'
import { deriveIsoCode, latLonToCartesian } from '../utils/geo'
import { AIRPORTS, FLIGHTS, PROVINCE_AIRPORTS, getAirportByCode, getRiskColor } from '../data/flightData'

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
  key?: string // 省份的 key（如 CN-北京），用于省份级别的选中
}

interface PolygonFill {
  id: string
  iso: string | null
  geometry: BufferGeometry
  key?: string // 省份的 key（如 CN-北京），用于省份级别的选中
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

// 使用统一数据源中的Airport接口
import type { Airport } from '../data/flightData'

// Airport接口已经包含了所有需要的字段，直接使用
type AirportParticle = Airport

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

// 使用统一数据源
const DEMO_AIRPORTS: AirportParticle[] = AIRPORTS

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
    viewingAirportId,
    selectedFlightRouteId,
    showWindLayer,
    showTemperatureLayer,
    showLabels,
  } = useAppStore()
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  const globeGroupRef = useRef<Group>(null)
  const isInteractingRef = useRef(false)

  useEffect(() => {
    const controls = orbitControlsRef.current
    if (!controls) return
    const onStart = () => { isInteractingRef.current = true }
    const onEnd = () => { isInteractingRef.current = false }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [])

  // 用于区分点击和拖动的状态
  const pointerStateRef = useRef<{
    downTime: number
    downX: number
    downY: number
    moved: boolean
    targetIso: string | null
  } | null>(null)

  // 跟踪空白区域的点击状态（用于区分点击和拖动）
  const blankAreaPointerStateRef = useRef<{
    downTime: number
    downX: number
    downY: number
    moved: boolean
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

        // 计算省份的 key（如果是中国省份）
        const provinceKey = iso === 'CN' && featureName ? `CN-${featureName}` : undefined
        
        cartesianRings.forEach((ring, ringIndex) => {
          if (ring.length < 2) return
          const isClosed = ring[0]?.equals(ring[ring.length - 1] ?? new Vector3())
          const points = isClosed ? ring : [...ring, ring[0]]
          lines.push({
            id: `${featureIndex}-${polygonIndex}-${ringIndex}`,
            iso,
            points,
            key: provinceKey,
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
             // 2. 国家标签 (聚合) - fallbackName 为 null，以便后续使用 atlas 中的国家名
             updateCenter('CN', iso, null)
          } else {
             updateCenter(labelKey, iso, featureName)
          }
        }

        fills.push({
          id: `fill-${featureIndex}-${polygonIndex}`,
          iso,
          geometry,
          key: provinceKey,
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
        const labelPosition = normalizedCenter.multiplyScalar(GLOBE_RADIUS + 0.08)
      
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
  }, [atlas.countries, labelCandidates])

  const airportInstances = useMemo(() => {
    return DEMO_AIRPORTS.map((airport) => {
      const position = latLonToCartesian(airport.lat, airport.lon, GLOBE_RADIUS + 0.01)
      return { ...airport, position }
    })
  }, [])

  // 计算航线：基于统一的航班数据生成航线
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
            // 标准化国家代码（用于判断是否选中）
            const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
            const fromIsSelected = !!(normalizedSelectedCountry && normalizeCountryCode(fromAirport.countryCode) === normalizedSelectedCountry)
            const toIsSelected = !!(normalizedSelectedCountry && normalizeCountryCode(toAirport.countryCode) === normalizedSelectedCountry)
            
            // 不再使用上升效果，直接使用原始位置
            const fromPos = fromAirportInstance.position.clone()
            const fromElevated = fromPos
            
            const toPos = toAirportInstance.position.clone()
            const toElevated = toPos
            
            // 根据环境风险值设置航线颜色
            const routeColor = getRiskColor(flight.environmentRisk)
            
            routes.push({
              id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
              from: fromElevated,
              to: toElevated,
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
          }
        }
      }
      return routes
    }
    
    // 情况2: 如果正在查看某个机场，显示该机场的所有航线
    if (viewingAirportId) {
      const viewingAirport = AIRPORTS.find(a => a.id === viewingAirportId)
      if (!viewingAirport) return routes
      
      // 筛选与该机场相关的航班（起飞机场或降落机场）
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
        
        const fromPos = fromAirportInstance.position.clone()
        const toPos = toAirportInstance.position.clone()
        
        // 如果机场在选中的国家，则升起
        const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
        const fromIsSelected = normalizedSelectedCountry && normalizeCountryCode(fromAirport.countryCode) === normalizedSelectedCountry
        const toIsSelected = normalizedSelectedCountry && normalizeCountryCode(toAirport.countryCode) === normalizedSelectedCountry
        
        // 不再使用上升效果，直接使用原始位置
        const fromElevated = fromPos
        const toElevated = toPos

        // 根据环境风险值设置航线颜色
        const routeColor = getRiskColor(flight.environmentRisk)
        
        routes.push({
          id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
          from: fromElevated,
          to: toElevated,
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
    
    // 情况3: 默认情况
    // 根据是否选中国家/省份决定显示哪些航线：
    // - 未选中国家/省份：显示所有航线
    // - 选中国家：仅显示与该国家相关的航线（起飞或降落机场位于该国）
    // - 选中省份（如 CN-北京市）：仅显示与该省份机场相关的航线
    const allFlights = FLIGHTS
    const normalizedSelectedCountry = selectedCountry
      ? (() => {
          // 如果是中国省份 key（例如 CN-北京市），仍然需要知道对应国家（CN）
          if (selectedCountry.startsWith('CN-')) return 'CN'
          return normalizeCountryCode(selectedCountry)
        })()
      : null
    
    allFlights.forEach(flight => {
      const fromAirport = getAirportByCode(flight.fromAirport)
      const toAirport = getAirportByCode(flight.toAirport)
      
      // 如果机场不在列表中，跳过
      if (!fromAirport || !toAirport) return
      
      // 如果有选中国家/省份，则只保留与该国家/省份相关的航线
      if (normalizedSelectedCountry) {
        const fromCountry = normalizeCountryCode(fromAirport.countryCode)
        const toCountry = normalizeCountryCode(toAirport.countryCode)

        // 先按国家过滤（必须至少一端在该国家）
        if (fromCountry !== normalizedSelectedCountry && toCountry !== normalizedSelectedCountry) {
          return
        }

        // 如果选中的是具体省份（如 CN-北京市），进一步按省份下的机场过滤
        if (selectedCountry && selectedCountry.startsWith && selectedCountry.startsWith('CN-')) {
          const provinceAirports = PROVINCE_AIRPORTS[selectedCountry] || []
          const fromInProvince = provinceAirports.includes(fromAirport.code)
          const toInProvince = provinceAirports.includes(toAirport.code)

          // 起点和终点都不在该省份，则不显示这条航线
          if (!fromInProvince && !toInProvince) {
            return
          }
        }
      }
      
      // 查找对应的airportInstances（包含position）
      const fromAirportInstance = airportInstances.find(a => a.id === fromAirport.id)
      const toAirportInstance = airportInstances.find(a => a.id === toAirport.id)
      
      if (!fromAirportInstance || !toAirportInstance) return
      
      // 标准化国家代码（用于判断是否选中）
      const normalizedFromCountry = normalizeCountryCode(fromAirport.countryCode)
      const normalizedToCountry = normalizeCountryCode(toAirport.countryCode)
      const fromIsSelected = !!(normalizedSelectedCountry && normalizedFromCountry === normalizedSelectedCountry)
      const toIsSelected = !!(normalizedSelectedCountry && normalizedToCountry === normalizedSelectedCountry)
      
      // 不再使用上升效果，直接使用原始位置
      const fromPos = fromAirportInstance.position.clone()
      const fromElevated = fromPos
      
      const toPos = toAirportInstance.position.clone()
      const toElevated = toPos

      // 根据环境风险值设置航线颜色
      const routeColor = getRiskColor(flight.environmentRisk)

      routes.push({
        id: `${fromAirport.id}-${toAirport.id}-${flight.id}`, // 使用航班ID确保唯一性
        from: fromElevated,
        to: toElevated,
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

  // 使用 useMemo 缓存颜色对象，避免每次渲染创建新对象
  const baseColor = useMemo(() => new Color('#ffffff'), [])
  const hoverColor = useMemo(() => new Color('#facc15'), [])
  const highlightColor = useMemo(() => new Color('#f97316'), [])

  return (
    <div className="view-root">
      {/* 侧边栏 */}
      <Sidebar />
      {/* 标题覆盖层 */}
      <div className="canvas-title-overlay">
        <h1>航空预测风险可视化大屏</h1>
      </div>
      {/* 无航线提示 */}
      {((viewingAirportId && flightRoutes.length === 0) || (selectedFlightRouteId && flightRoutes.length === 0)) && (
        <div className="globe-empty-routes-hint">
          <div className="empty-routes-content">
            <div className="empty-routes-icon">✈️</div>
            <div className="empty-routes-title">暂无航线数据</div>
            <div className="empty-routes-message">
              {viewingAirportId 
                ? '该机场当前没有可显示的航线'
                : '当前选中的航线无法在地图上显示'}
            </div>
          </div>
        </div>
      )}
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
      {/* 图例组件 */}
      <WindLegend visible={showWindLayer} />
      <TemperatureLegend 
        visible={showTemperatureLayer} 
        minTemp={-40}
        maxTemp={50}
      />
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }}
        performance={{ min: 0.5 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        <color attach="background" args={['#000000']} />
        <Stars
          radius={300}
          depth={60}
          count={2000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 2]} intensity={0.7} />
        <Suspense fallback={null}>
          <GlobeRotator
            globeGroupRef={globeGroupRef}
            isInteractingRef={isInteractingRef}
            selectedCountry={selectedCountry}
            hoveredCountry={hoveredCountry}
          />
          <group ref={globeGroupRef}>
            <mesh 
              renderOrder={-1}
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
            {/* 风粒子图层 */}
            {showWindLayer && (
              <WindLayer 
              radius={GLOBE_RADIUS + 0.01}
              particleCount={20000}
              trailLength={30}
              speedScale={2.5}
              />
            )}
            {/* 温度热力图图层 */}
            {showTemperatureLayer && (
              <TemperatureLayer 
                radius={GLOBE_RADIUS}
                minTemp={-40}
                maxTemp={50}
                opacity={0.75}
                showTemperatureLabels={false}
              />
            )}
            <group>
              {airportInstances.map((airport) => {
                // 标准化国家代码进行匹配
                const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
                const normalizedAirportCountry = normalizeCountryCode(airport.countryCode)
                const isSelected = normalizedSelectedCountry === normalizedAirportCountry
                return (
                  <AirportParticle
                    key={airport.id}
                    airport={airport}
                    isSelected={isSelected}
                  />
                )
              })}
            </group>
            {/* 航线 - 使用新的发光路径组件 */}
            {flightRoutes.length > 0 && (
               <GlowingFlightPaths routes={flightRoutes} radius={GLOBE_RADIUS} />
            )}
            {/* 后期处理 - Bloom 泛光效果 */}
            {/* 后期处理 - Bloom 泛光效果 - 降低强度以提升性能 */}
            <EffectComposer>
              <Bloom luminanceThreshold={0.7} intensity={0.6} radius={0.3} mipmapBlur />
            </EffectComposer>
            
            {fillPolygons.map(({ id, iso, geometry, key }) => {
              // 支持省份级别的选中：如果 selectedCountry 是省份的 key，或者 selectedCountry 是 iso（非省份情况）
              const isSelected = !!(iso && (
                selectedCountry === iso || 
                (key && selectedCountry === key)
              ))
              const isHovered = !!(iso && hoveredCountry === iso)
              const handlers = createPointerHandlers(iso, () => {
                // 如果是中国省份，必须先选中中国才能选中省份
                if (key && iso === 'CN') {
                  if (selectedCountry === 'CN') {
                    // 已经选中中国，可以选中省份
                    setSelectedCountry(key)
                  } else {
                    // 未选中中国，先选中中国
                    setSelectedCountry('CN')
                  }
                } else if (iso) {
                  // 非省份情况，直接选中
                  setSelectedCountry(iso)
                }
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
            {linePolygons.map(({ id, iso, points, key }) => {
              // 支持省份级别的选中：如果 selectedCountry 是省份的 key，或者 selectedCountry 是 iso（非省份情况）
              const isSelected = !!(iso && (
                selectedCountry === iso || 
                (key && selectedCountry === key)
              ))
              const isHovered = !!(iso && hoveredCountry === iso)
              
              // 直接使用内联函数，createPointerHandlers 已经使用 useCallback 优化
              const handlers = createPointerHandlers(iso, () => {
                // 如果是中国省份，必须先选中中国才能选中省份
                if (key && iso === 'CN') {
                  if (selectedCountry === 'CN') {
                    // 已经选中中国，可以选中省份
                    setSelectedCountry(key)
                  } else {
                    // 未选中中国，先选中中国
                    setSelectedCountry('CN')
                  }
                } else if (iso) {
                  // 非省份情况，直接选中
                  setSelectedCountry(iso)
                }
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
            {showLabels && countryLabels.map(({ key, iso, name, position }) => {
              // 过滤逻辑：
              // 1. 省份标签 (CN-xxx)：在选中中国或该省份时显示
              if (key.startsWith('CN-')) {
                if (selectedCountry !== 'CN' && selectedCountry !== key) return null
              }
              // 2. 中国国家标签 (CN)：仅在未选中中国且未选中任何省份时显示
              if (key === 'CN') {
                if (selectedCountry === 'CN' || (selectedCountry && selectedCountry.startsWith('CN-'))) return null
              }

              // 直接使用内联函数，createPointerHandlers 已经使用 useCallback 优化
              const handlers = createPointerHandlers(iso, () => {
                // 如果是省份标签，必须先选中中国才能选中省份
                if (key.startsWith('CN-')) {
                  if (selectedCountry === 'CN') {
                    // 已经选中中国，可以选中省份
                    setSelectedCountry(key)
                  } else {
                    // 未选中中国，先选中中国
                    setSelectedCountry('CN')
                  }
                } else if (iso) {
                  // 非省份情况，直接选中
                  setSelectedCountry(iso)
                }
              })
              return (
                <CountryLabelText
                  key={key}
                  iso={iso}
                  name={name}
                  position={position}
                  isSelected={!!(selectedCountry === key || (iso && selectedCountry === iso))}
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
          </group>
        </Suspense>
        <CameraController
          selectedCountry={selectedCountry}
          countryLabels={countryLabels}
          orbitControlsRef={orbitControlsRef}
          globeGroupRef={globeGroupRef}
          airportInstances={airportInstances}
          flightRoutes={flightRoutes}
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
  const tempCameraDir = useMemo(() => new Vector3(), [])
  const tempCentroidDir = useMemo(() => new Vector3(), [])
  const isVisibleRef = useRef(true)
  const [isVisible, setIsVisible] = useState(true)

  const centroid = useMemo(() => {
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere()
    }
    return geometry.boundingSphere?.center ?? new Vector3()
  }, [geometry])

  // 使用计数器降低可见性检查频率（每3帧检查一次）
  const frameCountRef = useRef(0)
  useFrame(() => {
    if (!groupRef.current) return
    
    frameCountRef.current++
    // 每3帧检查一次可见性，减少计算量
    if (frameCountRef.current % 3 === 0) {
      const cameraDir = tempCameraDir.copy(camera.position).normalize()
      const centroidDir = tempCentroidDir.copy(centroid).normalize()
      // 降低阈值，允许更多角度可见（从0.2改为-0.3，只有在背面很远时才隐藏）
      const visible = cameraDir.dot(centroidDir) > -0.3
      if (isVisibleRef.current !== visible) {
        isVisibleRef.current = visible
        setIsVisible(visible)
        // 直接设置可见性，避免不必要的渲染
        groupRef.current.visible = visible
      }
    }
  })

  const color = useMemo(() => 
    isSelected ? highlightColor : isHovered ? hoverColor : baseColor,
    [isSelected, isHovered, highlightColor, hoverColor, baseColor]
  )
  const opacity = useMemo(() => 
    isSelected ? 0.7 : isHovered ? 0.4 : 0.15,
    [isSelected, isHovered]
  )

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        renderOrder={isSelected ? 10 : 0}
        visible={isVisible}
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
  const tempCameraDir = useMemo(() => new Vector3(), [])
  const tempCentroidDir = useMemo(() => new Vector3(), [])
  const isVisibleRef = useRef(true)
  const [isVisible, setIsVisible] = useState(true)

  const centroid = useMemo(() => {
    const center = new Vector3()
    points.forEach((p) => center.add(p))
    return center.divideScalar(points.length)
  }, [points])

  // 使用计数器降低可见性检查频率（每3帧检查一次）
  const frameCountRef = useRef(0)
  useFrame(() => {
    if (!groupRef.current) return
    
    frameCountRef.current++
    // 每3帧检查一次可见性，减少计算量
    if (frameCountRef.current % 3 === 0) {
      const cameraDir = tempCameraDir.copy(camera.position).normalize()
      const centroidDir = tempCentroidDir.copy(centroid).normalize()
      // 降低阈值，允许更多角度可见（从0.2改为-0.3，只有在背面很远时才隐藏）
      const visible = cameraDir.dot(centroidDir) > -0.3
      if (isVisibleRef.current !== visible) {
        isVisibleRef.current = visible
        setIsVisible(visible)
        // 直接设置可见性，避免不必要的渲染
        groupRef.current.visible = visible
      }
    }
  })

  const color = useMemo(() => 
    isSelected ? highlightColor : isHovered ? hoverColor : baseColor,
    [isSelected, isHovered, highlightColor, hoverColor, baseColor]
  )
  const lineWidth = useMemo(() => 
    isSelected ? 1.8 : isHovered ? 1.2 : 0.7,
    [isSelected, isHovered]
  )

  return (
    <group ref={groupRef}>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={isSelected ? 1 : 0.75}
        renderOrder={isSelected ? 11 : 1}
        visible={isVisible}
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
  const [isVisible, setIsVisible] = useState(true)

  useFrame(() => {
    if (!groupRef.current) return
    const cameraDir = tempCameraDir.copy(camera.position).normalize()
    const labelDir = tempLabelDir.copy(position).normalize()
    // 降低阈值，允许更多角度可见（从0.2改为-0.3，只有在背面很远时才隐藏）
    const visible = cameraDir.dot(labelDir) > -0.3
    setIsVisible(visible)
    groupRef.current.visible = visible

    if (visible) {
      groupRef.current.lookAt(camera.position)
      // 不再使用上升效果，保持原始位置
      groupRef.current.position.copy(position)
    }
  })

  // 根据状态确定颜色和大小
  const color = isSelected ? '#f97316' : isHovered ? '#facc15' : '#f5f5f4'
  const fontSize = isSelected ? 0.025 : isHovered ? 0.022 : 0.02
  const outlineWidth = isSelected ? 0.003 : isHovered ? 0.0025 : 0.002
  const outlineColor = '#000000'
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

interface GlobeRotatorProps {
  globeGroupRef: React.MutableRefObject<Group | null>
  isInteractingRef: React.MutableRefObject<boolean>
  selectedCountry: string | null
  hoveredCountry: string | null
}

function GlobeRotator({
  globeGroupRef,
  isInteractingRef,
  selectedCountry,
  hoveredCountry,
}: GlobeRotatorProps) {
  const { viewingAirportId, viewingFlightRouteId, selectedFlightRouteId, autoRotate } = useAppStore()
  useFrame((_state, delta) => {
    // 只有在 autoRotate 为 true 且没有其他条件阻止时才自转
    if (
      globeGroupRef.current && 
      autoRotate &&
      !selectedCountry && 
      !isInteractingRef.current && 
      !hoveredCountry && 
      !viewingAirportId && 
      !viewingFlightRouteId && 
      !selectedFlightRouteId
    ) {
      globeGroupRef.current.rotation.y += delta * 0.05
    }
  })
  return null
}

interface CameraControllerProps {
  selectedCountry: string | null
  countryLabels: CountryLabel[]
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>
  globeGroupRef: React.MutableRefObject<Group | null>
  airportInstances: Array<AirportParticle & { position: Vector3 }>
  flightRoutes: Array<{
    id: string
    from: Vector3
    to: Vector3
    flightNumber: string
    fromAirport: string
    toAirport: string
  }>
}

function CameraController({ selectedCountry, countryLabels, orbitControlsRef, globeGroupRef, airportInstances, flightRoutes }: CameraControllerProps) {
  const { camera } = useThree()
  const { targetAirportId, setTargetAirportId, setViewingAirportId, targetFlightRouteId, setTargetFlightRouteId, setViewingFlightRouteId } = useAppStore()
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
      const chinaLocalPosition = latLonToCartesian(CHINA_LAT, CHINA_LON, GLOBE_RADIUS)
      const chinaPosition = chinaLocalPosition.clone()
      
      // 转换为世界坐标
      if (globeGroupRef.current) {
        chinaPosition.applyMatrix4(globeGroupRef.current.matrixWorld)
      }

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
  }, [camera, orbitControlsRef, globeGroupRef])

  // 当选择国家改变时，转到对应国家位置
  useEffect(() => {
    if (!selectedCountry || !isInitializedRef.current) return

    // 支持省份选中：如果是省份 key（如 CN-北京），使用 key 查找；否则使用 iso 查找
    const countryLabel = countryLabels.find((label) => 
      label.key === selectedCountry || label.iso === selectedCountry
    )
    if (!countryLabel || !orbitControlsRef.current) return

    // 使用标签位置归一化后乘以地球半径，得到地球表面的点
    const localPoint = countryLabel.position.clone().normalize().multiplyScalar(GLOBE_RADIUS)
    
    // 转换为世界坐标
    const targetPoint = localPoint.clone()
    if (globeGroupRef.current) {
      targetPoint.applyMatrix4(globeGroupRef.current.matrixWorld)
    }

    const targetDistance = 3.0 // 选择国家时的距离，更近一些
    targetCameraPositionRef.current = calculateCameraPosition(targetPoint, targetDistance)
    targetLookAtPointRef.current = targetPoint.clone()
    isAnimatingRef.current = true
  }, [selectedCountry, countryLabels, orbitControlsRef, camera, globeGroupRef])

  // 当targetAirportId改变时，zoom到对应机场
  useEffect(() => {
    if (!targetAirportId || !isInitializedRef.current || !orbitControlsRef.current) return

    const airport = airportInstances.find(a => a.id === targetAirportId)
    if (!airport) return

    // 设置正在查看的机场，用于显示高亮效果
    setViewingAirportId(targetAirportId)

    // 使用机场位置
    const localPoint = airport.position.clone()
    
    // 转换为世界坐标
    const targetPoint = localPoint.clone()
    if (globeGroupRef.current) {
      targetPoint.applyMatrix4(globeGroupRef.current.matrixWorld)
    }

    const targetDistance = 2.5 // zoom到机场时的距离，更近
    targetCameraPositionRef.current = calculateCameraPosition(targetPoint, targetDistance)
    targetLookAtPointRef.current = targetPoint.clone()
    isAnimatingRef.current = true

    // 清除targetAirportId，避免重复触发
    setTimeout(() => {
      setTargetAirportId(null)
    }, 100)
  }, [targetAirportId, airportInstances, orbitControlsRef, camera, globeGroupRef, setTargetAirportId, setViewingAirportId])

  // 当targetFlightRouteId改变时，zoom到对应航线
  useEffect(() => {
    if (!targetFlightRouteId || !isInitializedRef.current || !orbitControlsRef.current) return

    const route = flightRoutes.find(r => r.id === targetFlightRouteId)
    if (!route) return

    // 设置正在查看的航线，用于显示高亮效果
    setViewingFlightRouteId(targetFlightRouteId)

    // 计算航线的中点（在航线上方）
    const midPoint = new Vector3().addVectors(route.from, route.to).multiplyScalar(0.5)
    // 将中点向外延伸，使其位于航线拱形上方
    const routeDistance = route.from.distanceTo(route.to)
    const midLen = midPoint.length()
    const heightOffset = GLOBE_RADIUS * 0.3 + routeDistance * 0.3
    const elevatedMidPoint = midPoint.clone().normalize().multiplyScalar(midLen + heightOffset)
    
    // 计算航线的方向向量（从起点到终点）
    const routeDirection = new Vector3().subVectors(route.to, route.from).normalize()
    
    // 计算从原点到中点的方向（径向方向）
    const radialDirection = elevatedMidPoint.clone().normalize()
    
    // 计算垂直于航线方向和径向方向的向量（用于确定相机的侧向位置）
    // 这个向量将帮助我们让相机正对航线
    let sideVector = new Vector3().crossVectors(routeDirection, radialDirection)
    
    // 如果叉积结果为零（方向平行），使用另一个方向
    if (sideVector.length() < 0.01) {
      // 使用一个默认的上方向
      const upVector = new Vector3(0, 1, 0)
      sideVector = new Vector3().crossVectors(routeDirection, upVector)
      if (sideVector.length() < 0.01) {
        // 如果还是平行，使用另一个方向
        sideVector = new Vector3(1, 0, 0).cross(routeDirection)
      }
    }
    sideVector.normalize()
    
    // 计算相机应该位于的位置：在航线中点的侧上方，正对航线
    // 使用侧向偏移和适当的距离，使相机能够正对航线
    const sideOffset = sideVector.clone().multiplyScalar(routeDistance * 0.5) // 侧向偏移，使相机能够看到航线的侧面
    const cameraOffset = elevatedMidPoint.clone().add(sideOffset) // 相机应该看向的点（航线中点 + 侧向偏移）
    
    // zoom到航线时的距离，要根据航线长度调整
    const targetDistance = Math.max(2.5, Math.min(4.0, routeDistance * 1.2))
    
    // 计算相机位置：从原点出发，沿着相机偏移方向，距离为 targetDistance
    const cameraDirection = cameraOffset.clone().normalize()
    const cameraPosition = cameraDirection.multiplyScalar(targetDistance)
    
    // 转换为世界坐标
    const targetPoint = elevatedMidPoint.clone()
    if (globeGroupRef.current) {
      cameraPosition.applyMatrix4(globeGroupRef.current.matrixWorld)
      targetPoint.applyMatrix4(globeGroupRef.current.matrixWorld)
    }
    
    targetCameraPositionRef.current = cameraPosition
    targetLookAtPointRef.current = targetPoint.clone()
    isAnimatingRef.current = true

    // 清除targetFlightRouteId，避免重复触发
    setTimeout(() => {
      setTargetFlightRouteId(null)
    }, 100)
  }, [targetFlightRouteId, flightRoutes, orbitControlsRef, camera, globeGroupRef, setTargetFlightRouteId, setViewingFlightRouteId])

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
      // 用户开始交互时，清除查看状态，允许地球继续旋转
      setViewingAirportId(null)
      setViewingFlightRouteId(null)
      // 用户开始交互时，将目标点重置为原点，使相机围绕地球中心旋转
      controls.target.set(0, 0, 0)
      controls.update()
    }

    controls.addEventListener('start', handleStart)
    return () => {
      controls.removeEventListener('start', handleStart)
    }
  }, [orbitControlsRef, setViewingAirportId, setViewingFlightRouteId])

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
  const { gl, camera } = useThree()
  const groupRef = useRef<Group>(null)
  const ringRef = useRef<Group>(null)
  const labelRef = useRef<Group>(null)
  const glowIntensityRef = useRef(1)
  const materialRefs = useRef<{ outer?: MeshBasicMaterial; middle?: MeshBasicMaterial; ring?: MeshBasicMaterial }>({})
  const { setHoveredAirport, setTooltipPosition, viewingAirportId } = useAppStore()
  const isViewing = viewingAirportId === airport.id
  
  // 保存原始位置，避免被修改
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
    // 不再使用上升效果，保持原始位置
    groupRef.current.position.copy(basePosition)
    
    // 增强发光动画效果 - 提高基础亮度
    const time = Date.now() * 0.001
    let intensity = isSelected ? 1.4 + Math.sin(time * 3) * 0.3 : 1.0 + Math.sin(time * 2) * 0.25
    
    // 如果是正在查看的机场，增强效果
    if (isViewing) {
      intensity = 2.0 + Math.sin(time * 4) * 0.4 // 增强脉冲效果
    }
    
    glowIntensityRef.current = intensity
    
    // 闪烁颜色动画 - 根据风险值动态调整颜色
    const pulse = Math.sin(time * getPulseParams.speed) * 0.5 + 0.5 // 0 到 1 之间
    const currentColor = new Color().lerpColors(
      getPulseParams.baseColor,
      getPulseParams.brightColor,
      pulse * getPulseParams.intensity
    )
    
    // 增强材质颜色和透明度 - 提高发光亮度
    if (materialRefs.current.outer) {
      materialRefs.current.outer.color.copy(currentColor)
      // 大幅提高外层光晕的亮度和透明度
      materialRefs.current.outer.opacity = (isViewing ? 0.7 : isSelected ? 0.6 : 0.5) * intensity
    }
    if (materialRefs.current.middle) {
      materialRefs.current.middle.color.copy(currentColor)
      // 提高中层光晕的亮度
      materialRefs.current.middle.opacity = (isViewing ? 1.0 : isSelected ? 0.95 : 0.9) * Math.min(intensity, 1.3)
    }
    
    // 更新光环效果（如果正在查看）
    if (isViewing && ringRef.current && materialRefs.current.ring) {
      const ringScale = 1.0 + Math.sin(time * 3) * 0.3
      ringRef.current.scale.setScalar(ringScale)
      materialRefs.current.ring.color.copy(currentColor)
      materialRefs.current.ring.opacity = 0.8 + Math.sin(time * 3) * 0.3
    }
    
    // 更新标签（如果正在查看）
    if (isViewing && labelRef.current) {
      labelRef.current.lookAt(camera.position)
      const normalVec = basePosition.clone().normalize()
      const labelOffset = normalVec.multiplyScalar(0.05)
      labelRef.current.position.copy(basePosition.clone().add(labelOffset))
    }
  })

  return (
    <group ref={groupRef}>
      {/* 最外层大光晕 - 增强发光效果 */}
      <mesh 
        position={[0, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <sphereGeometry args={[isViewing ? 0.025 : isSelected ? 0.020 : 0.016, 16, 16]} />
        <meshBasicMaterial
          ref={(ref) => { if (ref) materialRefs.current.outer = ref }}
          color={airport.color}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* 中层光晕 - 增强亮度 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[isViewing ? 0.015 : isSelected ? 0.012 : 0.010, 16, 16]} />
        <meshBasicMaterial
          ref={(ref) => { if (ref) materialRefs.current.middle = ref }}
          color={airport.color}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* 内层亮点 - 增强亮度 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[isViewing ? 0.008 : isSelected ? 0.006 : 0.005, 8, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1.0}
        />
      </mesh>
      {/* 正在查看时的光环效果 */}
      {isViewing && (
        <group ref={ringRef}>
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[0.015, 0.025, 32]} />
            <meshBasicMaterial
              ref={(ref) => { if (ref) materialRefs.current.ring = ref }}
              color={airport.color}
              transparent
              opacity={0.6}
              side={DoubleSide}
            />
          </mesh>
        </group>
      )}
      {/* 正在查看时的机场名称标签 */}
      {isViewing && (
        <group ref={labelRef}>
          <Text
            color="#ffffff"
            fontSize={0.015}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.002}
            outlineColor="#000000"
            maxWidth={0.15}
            renderOrder={100}
          >
            {airport.code}
          </Text>
        </group>
      )}
    </group>
  )
}


