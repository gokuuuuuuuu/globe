// @ts-nocheck
import radarIcon from '../assets/radar_icon.png'
import './RadarChart.css'
import type { Person } from '../data/personData'

interface RadarChartData {
  flightDuration: number // 航班飞行时长 (h)
  pfTechLevel: number // PF技术等级 (转换为数值: 教员=3, 机长=2, 第一副驾驶=1)
  sameAirportLandings: number // 执飞同机型此前在同机场降落次数 (次)
  sameAircraftTypeHours: number // 执飞同机型此前累计飞行时长 (h)
}

// 将PF技术等级转换为数值
function techLevelToNumber(tech: string): number {
  if (tech === '教员') return 3
  if (tech === '机长') return 2
  if (tech === '第一副驾驶') return 1
  return 1
}

  // 计算雷达图数据
function calculateRadarData(person: Person, allPersons: Person[]): { person: RadarChartData, average: RadarChartData } {
  // 人员数据
  const personData: RadarChartData = {
    flightDuration: person.recent90DaysFlightHours || 0,
    pfTechLevel: techLevelToNumber(person.pfTechnology || '第一副驾驶'),
    sameAirportLandings: Math.max(0, Math.floor((person.recent90DaysFlightHours || 0) / 2.5)), // 估算：每2.5小时一次降落
    sameAircraftTypeHours: person.totalFlightHours ? Math.max(0, Math.floor(person.totalFlightHours * 0.7)) : 0, // 估算：70%是同机型
  }

  // 计算平均值
  const validPersons = allPersons.filter(p => 
    p.recent90DaysFlightHours !== undefined && 
    p.totalFlightHours !== undefined &&
    p.pfTechnology
  )
  
  if (validPersons.length === 0) {
    // 如果没有数据，使用默认平均值
    const averageData: RadarChartData = {
      flightDuration: 180,
      pfTechLevel: 2,
      sameAirportLandings: 72,
      sameAircraftTypeHours: 5000,
    }
    return { person: personData, average: averageData }
  }

  const avgFlightDuration = validPersons.reduce((sum, p) => sum + (p.recent90DaysFlightHours || 0), 0) / validPersons.length
  const avgTechLevel = validPersons.reduce((sum, p) => sum + techLevelToNumber(p.pfTechnology || '第一副驾驶'), 0) / validPersons.length
  const avgLandings = validPersons.reduce((sum, p) => sum + Math.floor((p.recent90DaysFlightHours || 0) / 2.5), 0) / validPersons.length
  const avgSameAircraftHours = validPersons.reduce((sum, p) => sum + (p.totalFlightHours ? Math.floor(p.totalFlightHours * 0.7) : 0), 0) / validPersons.length

  const averageData: RadarChartData = {
    flightDuration: Math.round(avgFlightDuration),
    pfTechLevel: avgTechLevel,
    sameAirportLandings: Math.round(avgLandings),
    sameAircraftTypeHours: Math.round(avgSameAircraftHours),
  }

  return { person: personData, average: averageData }
}

export function RadarChart({ person, allPersons }: { person: Person, allPersons: Person[] }) {
  const { person: personData, average: averageData } = calculateRadarData(person, allPersons)

  // 计算每个维度的最大值（用于归一化）
  const maxValues = {
    flightDuration: Math.max(personData.flightDuration, averageData.flightDuration, 250),
    pfTechLevel: 3, // 最大值为3（教员）
    sameAirportLandings: Math.max(personData.sameAirportLandings, averageData.sameAirportLandings, 100),
    sameAircraftTypeHours: Math.max(personData.sameAircraftTypeHours, averageData.sameAircraftTypeHours, 10000),
  }

  // 归一化数据到0-1范围
  const normalize = (value: number, max: number) => Math.min(value / max, 1)

  const personNormalized = {
    flightDuration: normalize(personData.flightDuration, maxValues.flightDuration),
    pfTechLevel: normalize(personData.pfTechLevel, maxValues.pfTechLevel),
    sameAirportLandings: normalize(personData.sameAirportLandings, maxValues.sameAirportLandings),
    sameAircraftTypeHours: normalize(personData.sameAircraftTypeHours, maxValues.sameAircraftTypeHours),
  }

  const averageNormalized = {
    flightDuration: normalize(averageData.flightDuration, maxValues.flightDuration),
    pfTechLevel: normalize(averageData.pfTechLevel, maxValues.pfTechLevel),
    sameAirportLandings: normalize(averageData.sameAirportLandings, maxValues.sameAirportLandings),
    sameAircraftTypeHours: normalize(averageData.sameAircraftTypeHours, maxValues.sameAircraftTypeHours),
  }

  // 雷达图配置 - 增大SVG尺寸以容纳标签
  const svgWidth = 500
  const svgHeight = 500
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2
  const radius = 140 // 减小半径，为标签留出空间
  const labelOffset = 30 // 标签距离轴端点的距离
  const axes = [
    { label: '航班飞行时长 (h)', angle: -90, index: 'flightDuration' }, // 顶部
    { label: 'PF技术等级', angle: 0, index: 'pfTechLevel' }, // 右侧
    { label: '执飞同机型此前在同机场降落次数 (次)', angle: 90, index: 'sameAirportLandings' }, // 底部
    { label: '执飞同机型此前累计飞行时长 (h)', angle: 180, index: 'sameAircraftTypeHours' }, // 左侧
  ]

  // 将角度转换为弧度
  const toRadians = (angle: number) => (angle * Math.PI) / 180

  // 计算点的坐标
  const getPoint = (angle: number, distance: number) => {
    const rad = toRadians(angle)
    return {
      x: centerX + distance * Math.cos(rad),
      y: centerY + distance * Math.sin(rad),
    }
  }

  // 生成多边形路径
  const generatePath = (data: typeof personNormalized) => {
    const points = axes.map(axis => {
      const value = data[axis.index as keyof typeof data]
      return getPoint(axis.angle, radius * value)
    })
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }

  const personPath = generatePath(personNormalized)
  const averagePath = generatePath(averageNormalized)

  return (
    <div className="radar-chart-container">
      <div className="radar-chart-title">
        <img src={radarIcon} alt="radar" className="radar-chart-title-icon" />
        <span>能力雷达图</span>
      </div>
      <div className="radar-chart-wrapper">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="radar-chart-svg">
          {/* 背景网格 */}
          {[0.25, 0.5, 0.75, 1].map((scale, i) => (
            <g key={i}>
              <polygon
                points={axes.map(axis => {
                  const p = getPoint(axis.angle, radius * scale)
                  return `${p.x},${p.y}`
                }).join(' ')}
                fill="none"
                stroke="rgba(203, 213, 225, 0.2)"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* 坐标轴 */}
          {axes.map((axis, i) => {
            const endPoint = getPoint(axis.angle, radius)
            const labelPoint = getPoint(axis.angle, radius + labelOffset)
            
            // 根据角度确定文本对齐方式
            let textAnchor: 'start' | 'middle' | 'end' = 'middle'
            let dominantBaseline: 'auto' | 'middle' | 'hanging' = 'middle'
            let dx = 0
            let dy = 0
            
            if (axis.angle === -90) {
              // 顶部
              textAnchor = 'middle'
              dominantBaseline = 'auto'
              dy = -8
            } else if (axis.angle === 0) {
              // 右侧
              textAnchor = 'start'
              dominantBaseline = 'middle'
              dx = 8
            } else if (axis.angle === 90) {
              // 底部
              textAnchor = 'middle'
              dominantBaseline = 'hanging'
              dy = 8
            } else if (axis.angle === 180) {
              // 左侧
              textAnchor = 'end'
              dominantBaseline = 'middle'
              dx = -8
            }
            
            // 处理长文本，智能分行
            const splitLabel = (text: string): string[] => {
              // 根据标点符号和长度智能分行
              if (text.length <= 12) {
                return [text]
              }
            
              // 尝试在括号、逗号等位置分行
              const splitPoints = ['(', '（', '同', '此前', '累计']
              for (const point of splitPoints) {
                const index = text.indexOf(point)
                if (index > 6 && index < text.length - 6) {
                  return [text.substring(0, index), text.substring(index)]
                }
              }
              
              // 如果找不到合适的分割点，按长度分行
              const mid = Math.ceil(text.length / 2)
              return [text.substring(0, mid), text.substring(mid)]
            }
            
            const labelLines = splitLabel(axis.label)
            const isMultiLine = labelLines.length > 1
            
            return (
              <g key={i}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke="rgba(203, 213, 225, 0.3)"
                  strokeWidth="1"
                />
                {/* 标签 */}
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={textAnchor as 'start' | 'middle' | 'end'}
                  dominantBaseline={dominantBaseline as 'auto' | 'middle' | 'hanging'}
                  className="radar-axis-label"
                  dx={dx}
                  dy={dy}
                >
                  {isMultiLine ? (
                    // 多行标签
                    labelLines.map((line, lineIndex) => (
                      <tspan 
                        key={lineIndex}
                        x={labelPoint.x} 
                        dy={lineIndex === 0 ? (dy === 0 ? -8 : 0) : 22}
                      >
                        {line}
                      </tspan>
                    ))
                  ) : (
                    axis.label
                  )}
                </text>
              </g>
            )
          })}

          {/* 平均值多边形 */}
          <path
            d={averagePath}
            fill="rgba(34, 197, 94, 0.2)"
            stroke="rgba(34, 197, 94, 0.8)"
            strokeWidth="2"
            className="radar-average-polygon"
          />

          {/* 人员多边形 */}
          <path
            d={personPath}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="rgba(239, 68, 68, 0.8)"
            strokeWidth="2"
            className="radar-person-polygon"
          />

          {/* 数据点 */}
          {axes.map((axis, i) => {
            const personValue = personNormalized[axis.index as keyof typeof personNormalized]
            const averageValue = averageNormalized[axis.index as keyof typeof averageNormalized]
            const personPoint = getPoint(axis.angle, radius * personValue)
            const averagePoint = getPoint(axis.angle, radius * averageValue)

            return (
              <g key={i}>
                {/* 平均值点 */}
                <circle
                  cx={averagePoint.x}
                  cy={averagePoint.y}
                  r="4"
                  fill="rgba(34, 197, 94, 1)"
                  className="radar-average-point"
                />
                {/* 人员点 */}
                <circle
                  cx={personPoint.x}
                  cy={personPoint.y}
                  r="4"
                  fill="rgba(239, 68, 68, 1)"
                  className="radar-person-point"
                />
              </g>
            )
          })}
        </svg>

        {/* 图例 */}
        <div className="radar-chart-legend">
          <div className="radar-legend-item">
            <div className="radar-legend-color" style={{ backgroundColor: 'rgba(239, 68, 68, 1)' }}></div>
            <span className="radar-legend-label">此人</span>
          </div>
          <div className="radar-legend-item">
            <div className="radar-legend-color" style={{ backgroundColor: 'rgba(34, 197, 94, 1)' }}></div>
            <span className="radar-legend-label">平均值</span>
          </div>
        </div>
      </div>
    </div>
  )
}

