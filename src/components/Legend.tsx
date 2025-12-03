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

