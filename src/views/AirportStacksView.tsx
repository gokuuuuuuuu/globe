import { OrbitControls, Line, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { Vector3 } from 'three'
import { useAppStore } from '../store/useAppStore'
import type { WorldData } from '../types'
import { latLonToPlane } from '../utils/geo'
import { AIRPORTS, FLIGHTS } from '../data/flightData'

const MAP_SCALE = 6
const BAR_SIZE = 0.025 // 缩小横截面，使立柱更细
const BAR_SEGMENTS = 32 // 增加分段数，使圆柱体更平滑圆润

interface AirportStacksViewProps {
  world: WorldData
}

interface StackItem {
  airportId: string
  airportName: string
  position: [number, number, number]
  totalRisk: number
  humanRisk: number
  machineRisk: number
  environmentRisk: number
  countryCode: string
}

// 国家代码标准化函数
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

export function AirportStacksView({ world }: AirportStacksViewProps) {
  const { selectedCountry, setSelectedCountry, setHoveredCountry } = useAppStore()

  // 计算每个机场的风险值（聚合该机场所有航班的风险值）
  const stacks = useMemo<StackItem[]>(() => {
    const items: StackItem[] = []
    
    AIRPORTS.forEach(airport => {
      // 找到所有与该机场相关的航班（起飞机场或降落机场）
      const relatedFlights = FLIGHTS.filter(flight => 
        flight.fromAirport === airport.code || flight.toAirport === airport.code
      )
      
      // 如果没有相关航班，使用机场的环境风险值作为默认值
      let totalHumanRisk = 0
      let totalMachineRisk = 0
      let totalEnvironmentRisk = airport.environmentRisk || 0
      
      if (relatedFlights.length > 0) {
        // 聚合风险值：计算平均值
        totalHumanRisk = relatedFlights.reduce((sum, f) => sum + f.humanRisk, 0) / relatedFlights.length
        totalMachineRisk = relatedFlights.reduce((sum, f) => sum + f.machineRisk, 0) / relatedFlights.length
        totalEnvironmentRisk = relatedFlights.reduce((sum, f) => sum + f.environmentRisk, 0) / relatedFlights.length
      } else {
        // 如果没有航班，使用默认风险值（基于环境风险）
        totalHumanRisk = (airport.environmentRisk || 0) * 0.3
        totalMachineRisk = (airport.environmentRisk || 0) * 0.3
        totalEnvironmentRisk = airport.environmentRisk || 0
      }
      
      // 总风险值 = 三种风险值的总和
      const totalRisk = totalHumanRisk + totalMachineRisk + totalEnvironmentRisk
      
      // 确保至少有一个最小风险值，以便显示
      if (totalRisk <= 0) {
        totalHumanRisk = 0.5
        totalMachineRisk = 0.5
        totalEnvironmentRisk = 1.0
      }
      
      const point = latLonToPlane(airport.lat, airport.lon, MAP_SCALE)
      const x = point.x
      const z = -point.y
      
      items.push({
        airportId: airport.id,
        airportName: airport.nameZh || airport.name,
        position: [x, 0, z],
        totalRisk: totalHumanRisk + totalMachineRisk + totalEnvironmentRisk,
        humanRisk: totalHumanRisk,
        machineRisk: totalMachineRisk,
        environmentRisk: totalEnvironmentRisk,
        countryCode: airport.countryCode,
      })
    })
    
    return items.sort((a, b) => b.totalRisk - a.totalRisk)
  }, [])

  const maxTotalRisk = stacks[0]?.totalRisk ?? 1

  // 风险类型颜色定义（优化后的颜色，更柔和且美观）
  const humanRiskColor = '#60a5fa' // 柔和蓝色 - 人风险
  const machineRiskColor = '#f472b6' // 柔和粉色 - 机风险
  const environmentRiskColor = '#22d3ee' // 柔和青色 - 环境风险
  
  // 高光颜色（用于选中状态）
  const humanRiskHighlight = '#93c5fd'
  const machineRiskHighlight = '#f9a8d4'
  const environmentRiskHighlight = '#67e8f9'

  return (
    <div className="view-root">
      <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 12, 6]} intensity={1.2} />
        <directionalLight position={[-10, 8, -6]} intensity={0.5} />
        <pointLight position={[0, 10, 0]} intensity={0.4} />
        <spotLight position={[0, 15, 0]} angle={0.3} penumbra={0.5} intensity={0.3} />
        
        {/* 背景地图 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[MAP_SCALE * 3.8, MAP_SCALE * 1.9, 1, 1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.1} />
        </mesh>
        
        {/* 绘制世界地图轮廓（简化版，仅显示线条） */}
        {world.features.map((feature, featureIndex) => {
          const { geometry } = feature
          const processPolygon = (rings: number[][][]) => {
            if (!rings.length) return []
            return rings.map((ring) => {
              const points = ring.map(([lon, lat]) => {
                const point = latLonToPlane(lat, lon, MAP_SCALE)
                return new Vector3(point.x, 0.01, -point.y)
              })
              return points
            })
          }
          
          let allRings: Vector3[][] = []
          if (geometry.type === 'Polygon') {
            allRings = processPolygon(geometry.coordinates as number[][][])
          } else if (geometry.type === 'MultiPolygon') {
            ;(geometry.coordinates as number[][][][]).forEach((polygon) => {
              allRings.push(...processPolygon(polygon as number[][][]))
            })
          }
          
          return allRings.map((ring, ringIndex) => {
            if (ring.length < 2) return null
            // 确保闭合
            const closedRing = ring[0].equals(ring[ring.length - 1]) 
              ? ring 
              : [...ring, ring[0]]
            return (
              <Line
                key={`${featureIndex}-${ringIndex}`}
                points={closedRing}
                color="#4a5568"
                lineWidth={0.8}
                transparent
                opacity={0.4}
              />
            )
          })
        })}
        
        {/* 机场风险值堆叠柱状图 */}
        {stacks.map(({ airportId, airportName, position, totalRisk, humanRisk, machineRisk, environmentRisk, countryCode }) => {
          const normalizedSelectedCountry = selectedCountry ? normalizeCountryCode(selectedCountry) : null
          const normalizedAirportCountry = normalizeCountryCode(countryCode)
          const isSelected = normalizedSelectedCountry === normalizedAirportCountry
          
          // 计算柱状图高度（归一化）
          const heightScale = Math.max(totalRisk / maxTotalRisk, 0.15)
          const baseHeight = heightScale * 3 // 增加最大高度，使柱状图更明显
          
          // 计算各段的高度比例
          const humanHeight = (humanRisk / totalRisk) * baseHeight
          const machineHeight = (machineRisk / totalRisk) * baseHeight
          const environmentHeight = (environmentRisk / totalRisk) * baseHeight
          
          // 计算各段的Y位置（堆叠）
          const humanY = humanHeight / 2
          const machineY = humanHeight + machineHeight / 2
          const environmentY = humanHeight + machineHeight + environmentHeight / 2
          
          // 选中时的美化效果
          const emissiveIntensity = isSelected ? 0.6 : 0.15
          const metalness = isSelected ? 0.8 : 0.5
          const roughness = isSelected ? 0.1 : 0.3
          const scale = isSelected ? 1.2 : 1.0
          
          return (
            <group key={airportId} position={[position[0], 0, position[2]]} scale={[scale, scale, scale]}>
              {/* 人风险段（底部）- 使用圆柱体实现圆角效果 */}
              {humanHeight > 0.01 && (
                <mesh
                  position={[0, humanY, 0]}
                  onPointerOver={(event) => {
                    event.stopPropagation()
                    setHoveredCountry(normalizedAirportCountry)
                  }}
                  onPointerOut={(event) => {
                    event.stopPropagation()
                    setHoveredCountry(null)
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    setSelectedCountry(normalizedAirportCountry)
                  }}
                >
                  <cylinderGeometry args={[BAR_SIZE, BAR_SIZE, humanHeight, BAR_SEGMENTS]} />
                  <meshStandardMaterial
                    color={isSelected ? humanRiskHighlight : humanRiskColor}
                    emissive={humanRiskColor}
                    emissiveIntensity={emissiveIntensity}
                    metalness={metalness}
                    roughness={roughness}
                  />
                </mesh>
              )}
              
              {/* 机风险段（中间） */}
              {machineHeight > 0.01 && (
                <mesh
                  position={[0, machineY, 0]}
                  onPointerOver={(event) => {
                    event.stopPropagation()
                    setHoveredCountry(normalizedAirportCountry)
                  }}
                  onPointerOut={(event) => {
                    event.stopPropagation()
                    setHoveredCountry(null)
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    setSelectedCountry(normalizedAirportCountry)
                  }}
                >
                  <cylinderGeometry args={[BAR_SIZE, BAR_SIZE, machineHeight, BAR_SEGMENTS]} />
                  <meshStandardMaterial
                    color={isSelected ? machineRiskHighlight : machineRiskColor}
                    emissive={machineRiskColor}
                    emissiveIntensity={emissiveIntensity}
                    metalness={metalness}
                    roughness={roughness}
                  />
                </mesh>
              )}
              
              {/* 环境风险段（顶部） */}
              {environmentHeight > 0.01 && (
                <mesh
                  position={[0, environmentY, 0]}
                  onPointerOver={(event) => {
                    event.stopPropagation()
                    setHoveredCountry(normalizedAirportCountry)
                  }}
                  onPointerOut={(event) => {
                    event.stopPropagation()
                    setHoveredCountry(null)
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    setSelectedCountry(normalizedAirportCountry)
                  }}
                >
                  <cylinderGeometry args={[BAR_SIZE, BAR_SIZE, environmentHeight, BAR_SEGMENTS]} />
                  <meshStandardMaterial
                    color={isSelected ? environmentRiskHighlight : environmentRiskColor}
                    emissive={environmentRiskColor}
                    emissiveIntensity={emissiveIntensity}
                    metalness={metalness}
                    roughness={roughness}
                  />
                </mesh>
              )}
              
              {/* 添加顶部圆角高光（美化效果） */}
              {environmentHeight > 0.01 && (
                <mesh position={[0, environmentY + environmentHeight / 2, 0]}>
                  <sphereGeometry args={[BAR_SIZE * 0.95, BAR_SEGMENTS / 2, BAR_SEGMENTS / 2]} />
                  <meshStandardMaterial
                    color={isSelected ? environmentRiskHighlight : environmentRiskColor}
                    emissive={isSelected ? environmentRiskHighlight : environmentRiskColor}
                    emissiveIntensity={isSelected ? 0.9 : 0.4}
                    metalness={isSelected ? 0.95 : 0.7}
                    roughness={0.05}
                  />
                </mesh>
              )}
              
              {/* 添加底部圆角（美化效果） */}
              {humanHeight > 0.01 && (
                <mesh position={[0, humanY - humanHeight / 2, 0]}>
                  <sphereGeometry args={[BAR_SIZE * 0.95, BAR_SEGMENTS / 2, BAR_SEGMENTS / 2]} />
                  <meshStandardMaterial
                    color={isSelected ? humanRiskHighlight : humanRiskColor}
                    emissive={isSelected ? humanRiskHighlight : humanRiskColor}
                    emissiveIntensity={isSelected ? 0.7 : 0.3}
                    metalness={isSelected ? 0.9 : 0.6}
                    roughness={0.1}
                  />
                </mesh>
              )}
              
              {/* 机场名标签 - 显示在风险柱旁边，使用小字体 */}
              {airportName && (
                <Text
                  position={[BAR_SIZE * 2.5, baseHeight + 0.3, 0]}
                  fontSize={0.08}
                  color={isSelected ? "#ffffff" : "#a0a0a0"}
                  anchorX="left"
                  anchorY="middle"
                  outlineWidth={0.01}
                  outlineColor="#000000"
                  maxWidth={0.5}
                >
                  {airportName}
                </Text>
              )}
            </group>
          )
        })}
        
        <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={20} />
      </Canvas>
    </div>
  )
}

export default AirportStacksView

