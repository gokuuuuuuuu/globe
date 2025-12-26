import { useEffect, useRef, useState } from 'react'
import './Legend.css'

// 通用拖拽 Hook，用于让图例可拖拽
function useDraggableLegend(disabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)
  const offsetRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (disabled) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current || !offsetRef.current) return
      const { clientX, clientY } = event
      const x = clientX - offsetRef.current.x
      const y = clientY - offsetRef.current.y
      setPosition({ x, y })
    }

    const handleMouseUp = () => {
      draggingRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [disabled])

  const handleMouseDown = (event: React.MouseEvent) => {
    if (disabled) return
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    draggingRef.current = true
    offsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    // 初始化位置为当前 DOM 位置
    setPosition({ x: rect.left, y: rect.top })
  }

  const style = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined

  return { ref, handleMouseDown, style }
}

interface WindLegendProps {
  visible: boolean
}

export function WindLegend({ visible }: WindLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  const windLevels = [
    { speed: '< 2', color: 'rgb(38, 128, 204)', label: '微风' },
    { speed: '2-6', color: 'rgb(89, 179, 153)', label: '轻风' },
    { speed: '6-12', color: 'rgb(230, 204, 77)', label: '中风' },
    { speed: '> 12', color: 'rgb(230, 89, 51)', label: '强风' },
  ]

  return (
    <div ref={ref} className="legend-container wind-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">💨</span>
        <span className="legend-title">风速图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {windLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: level.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{level.speed} m/s</span>
              <span className="legend-description">{level.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-footer">
        <span className="legend-unit">单位：米/秒 (m/s)</span>
      </div>
    </div>
  )
}

interface TemperatureLegendProps {
  visible: boolean
  minTemp?: number
  maxTemp?: number
}

export function TemperatureLegend({ visible, minTemp = -40, maxTemp = 50 }: TemperatureLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 温度颜色映射（与 TemperatureLayer 中的颜色对应）
  const tempLevels = [
    { temp: '< -30', color: 'rgb(0, 0, 64)', label: '极冷' },
    { temp: '-30 ~ -20', color: 'rgb(20, 38, 128)', label: '很冷' },
    { temp: '-20 ~ -10', color: 'rgb(38, 89, 166)', label: '冷' },
    { temp: '-10 ~ 0', color: 'rgb(51, 128, 179)', label: '寒冷' },
    { temp: '0 ~ 10', color: 'rgb(64, 153, 179)', label: '凉爽' },
    { temp: '10 ~ 15', color: 'rgb(51, 166, 115)', label: '温和' },
    { temp: '15 ~ 20', color: 'rgb(89, 179, 77)', label: '温暖' },
    { temp: '20 ~ 25', color: 'rgb(153, 191, 64)', label: '较热' },
    { temp: '25 ~ 30', color: 'rgb(191, 179, 51)', label: '热' },
    { temp: '30 ~ 35', color: 'rgb(204, 128, 38)', label: '很热' },
    { temp: '35 ~ 40', color: 'rgb(191, 89, 51)', label: '极热' },
    { temp: '> 40', color: 'rgb(153, 51, 51)', label: '酷热' },
  ]

  return (
    <div ref={ref} className="legend-container temperature-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">🌡️</span>
        <span className="legend-title">温度图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {tempLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: level.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{level.temp}°C</span>
              <span className="legend-description">{level.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-footer">
        <span className="legend-unit">范围：{minTemp}°C ~ {maxTemp}°C</span>
      </div>
    </div>
  )
}

interface PrecipitationLegendProps {
  visible: boolean
}

export function PrecipitationLegend({ visible }: PrecipitationLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 降水类型（与 PrecipitationLayer 着色器中的颜色对应）
  const precipitationTypes = [
    { 
      type: '雨', 
      color: 'rgb(31, 97, 217)', // vec3(0.12, 0.38, 0.85) 转换为 0-255
      description: '降雨',
    },
    { 
      type: '雪', 
      color: 'rgb(235, 242, 255)', // vec3(0.92, 0.95, 1.0) 转换为 0-255
      description: '降雪',
    },
    { 
      type: '冻雨', 
      color: 'rgb(191, 115, 230)', // vec3(0.75, 0.45, 0.9) 转换为 0-255
      description: '冻雨',
    },
  ]

  return (
    <div ref={ref} className="legend-container precipitation-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">🌧️</span>
        <span className="legend-title">降水图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {precipitationTypes.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: item.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{item.type}</span>
              <span className="legend-description">{item.description}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-footer">
        <span className="legend-unit">根据温度自动区分降水类型</span>
      </div>
    </div>
  )
}

interface FogLegendProps {
  visible: boolean
}

export function FogLegend({ visible }: FogLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 雾的类型（根据露点差判定）
  const fogTypes = [
    { 
      type: '浓雾', 
      condition: '≤ 0.5°C',
      color: 'rgba(242, 242, 247, 0.95)', // 白色/灰白色，高不透明度
      description: '露点差 ≤ 0.5°C',
    },
    { 
      type: '薄雾', 
      condition: '0.5 ~ 2°C',
      color: 'rgba(242, 242, 247, 0.6)', // 白色/灰白色，中等不透明度
      description: '露点差 0.5 ~ 2°C',
    },
    { 
      type: '无雾', 
      condition: '> 2°C',
      color: 'transparent',
      description: '露点差 > 2°C',
    },
  ]

  return (
    <div ref={ref} className="legend-container fog-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">🌫️</span>
        <span className="legend-title">雾图层图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {fogTypes.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ 
                backgroundColor: item.color,
                border: item.color === 'transparent' ? '1px solid rgba(200, 200, 200, 0.5)' : 'none'
              }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{item.type}</span>
              <span className="legend-description">{item.description}</span>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  )
}

interface MoistureLegendProps {
  visible: boolean
}

export function MoistureLegend({ visible }: MoistureLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 水汽通量强度等级
  const moistureLevels = [
    { 
      intensity: '低', 
      color: 'rgb(26, 77, 153)', // 深蓝
      description: '速度 × 湿度 < 10',
    },
    { 
      intensity: '中', 
      color: 'rgb(51, 128, 204)', // 蓝色
      description: '速度 × 湿度 10-20',
    },
    { 
      intensity: '高', 
      color: 'rgb(77, 179, 230)', // 浅蓝
      description: '速度 × 湿度 20-40',
    },
    { 
      intensity: '极高', 
      color: 'rgb(128, 230, 255)', // 亮青
      description: '速度 × 湿度 > 40',
    },
  ]

  return (
    <div ref={ref} className="legend-container moisture-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">💧</span>
        <span className="legend-title">水汽通量图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {moistureLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: level.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{level.intensity}</span>
              <span className="legend-description">{level.description}</span>
            </div>
          </div>
        ))}
      </div>
   
    </div>
  )
}

interface LightningLegendProps {
  visible: boolean
}

export function LightningLegend({ visible }: LightningLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 雷电强度等级
  const lightningLevels = [
    { 
      intensity: '低', 
      color: 'rgb(255, 230, 77)', // 黄色
      description: '概率 0.4-0.6',
    },
    { 
      intensity: '中', 
      color: 'rgb(255, 243, 128)', // 亮黄
      description: '概率 0.6-0.8',
    },
    { 
      intensity: '高', 
      color: 'rgb(255, 255, 179)', // 淡黄
      description: '概率 0.8-0.9',
    },
    { 
      intensity: '极高', 
      color: 'rgb(255, 255, 255)', // 白色
      description: '概率 > 0.9',
    },
  ]

  return (
    <div ref={ref} className="legend-container lightning-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">⚡</span>
        <span className="legend-title">雷电图层图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {lightningLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: level.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{level.intensity}</span>
              <span className="legend-description">{level.description}</span>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  )
}

interface CATLegendProps {
  visible: boolean
}

export function CATLegend({ visible }: CATLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 颠簸强度等级（与 CATLayer 着色器中的颜色对应）
  const catLevels = [
    { 
      intensity: '无颠簸', 
      color: 'rgb(0, 153, 51)', // 绿色
      description: '指数 0.0-0.17',
    },
    { 
      intensity: '轻微', 
      color: 'rgb(77, 179, 77)', // 浅绿
      description: '指数 0.17-0.33',
    },
    { 
      intensity: '轻度', 
      color: 'rgb(153, 204, 51)', // 黄绿
      description: '指数 0.33-0.5',
    },
    { 
      intensity: '中度', 
      color: 'rgb(230, 204, 26)', // 黄色
      description: '指数 0.5-0.67',
    },
    { 
      intensity: '中强', 
      color: 'rgb(242, 153, 26)', // 橙黄
      description: '指数 0.67-0.83',
    },
    { 
      intensity: '强', 
      color: 'rgb(230, 77, 26)', // 橙色
      description: '指数 0.83-0.92',
    },
    { 
      intensity: '极强', 
      color: 'rgb(204, 26, 26)', // 红色
      description: '指数 > 0.92',
    },
  ]

  return (
    <div ref={ref} className="legend-container cat-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">🌪️</span>
        <span className="legend-title">颠簸区图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {catLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: level.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{level.intensity}</span>
              <span className="legend-description">{level.description}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-footer">
        <span className="legend-unit">基于风切变、垂直扰动和温度稳定度计算</span>
      </div>
    </div>
  )
}

interface VisibilityLegendProps {
  visible: boolean
}

export function VisibilityLegend({ visible }: VisibilityLegendProps) {
  const { ref, handleMouseDown, style } = useDraggableLegend(!visible)

  if (!visible) return null

  // 能见度风险等级（与 VisibilityLayer 着色器中的颜色对应）
  const visibilityLevels = [
    { 
      risk: '良好', 
      color: 'rgb(51, 153, 153)', // 青色 (0.2, 0.6, 0.6)
      description: '指数 0.0-0.4',
    },
    { 
      risk: '一般', 
      color: 'rgb(128, 191, 191)', // 浅青色
      description: '指数 0.4-0.6',
    },
    { 
      risk: '较差', 
      color: 'rgb(179, 217, 217)', // 更浅青色
      description: '指数 0.6-0.75',
    },
    { 
      risk: '差', 
      color: 'rgb(217, 230, 230)', // 灰白色
      description: '指数 0.75-0.9',
    },
    { 
      risk: '很差', 
      color: 'rgb(230, 230, 230)', // 白色 (0.9, 0.9, 0.9)
      description: '指数 > 0.9',
    },
  ]

  return (
    <div ref={ref} className="legend-container visibility-legend" style={style}>
      <div className="legend-header" onMouseDown={handleMouseDown}>
        <span className="legend-icon">👁️</span>
        <span className="legend-title">能见度图例</span>
        <span className="legend-drag-hint">
          <span className="legend-drag-icon">⋮⋮</span>
          拖拽
        </span>
      </div>
      <div className="legend-content">
        {visibilityLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color-bar" 
              style={{ backgroundColor: level.color }}
            />
            <div className="legend-label-group">
              <span className="legend-value">{level.risk}</span>
              <span className="legend-description">{level.description}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-footer">
        <span className="legend-unit">基于饱和因子、湿度和风速计算</span>
      </div>
    </div>
  )
}

