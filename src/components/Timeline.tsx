// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import './Timeline.css'

export function Timeline() {
  const {
    timelineTimeRange,
    setTimelineTimeRange,
    timelineCurrentTime,
    setTimelineCurrentTime,
    timelineIsPlaying,
    setTimelineIsPlaying,
  } = useAppStore()

  const timelineRef = useRef<HTMLDivElement>(null)
  const [hoveredTime, setHoveredTime] = useState<Date | null>(null)

  // 计算时间刻度和起始时间（基于当前系统时区时间向前取整到最近的刻度）
  // 起始时间按当前系统时区时间为准，向前推一个刻度（取整到最近的刻度点）
  // 注意：使用 2024-07-25 作为基准日期，以匹配航班数据
  const { startTime, ticks, tickInterval, endTime } = useMemo(() => {
    // 获取当前系统时区时间
    const now = new Date()
    // 使用 2024-07-25 作为基准日期，但时间部分使用当前系统时区时间
    const baseDate = '2024-07-25'
    const currentTime = new Date(`${baseDate}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}+08:00`)
    
    let startTime: Date
    let tickInterval: number // 分钟

    // 根据时间范围计算起始时间和刻度间隔
    // 起始时间：当前时间向前取整到最近的刻度点
    if (timelineTimeRange === 4) {
      // 4小时：以30分钟为一个刻度
      // 例如：10:15 → 10:00（向前取整到30分钟刻度）
      tickInterval = 30
      startTime = new Date(currentTime)
      startTime.setMinutes(Math.floor(startTime.getMinutes() / 30) * 30, 0, 0)
    } else if (timelineTimeRange === 10) {
      // 10小时：以1小时为一个刻度
      // 例如：10:15 → 10:00（向前取整到整点）
      tickInterval = 60
      startTime = new Date(currentTime)
      startTime.setMinutes(0, 0, 0)
    } else if (timelineTimeRange === 18) {
      // 18小时：以1.5h（90分钟）为一个刻度
      tickInterval = 90
      startTime = new Date(currentTime)
      // 计算到当天00:00的总分钟数
      const totalMinutes = startTime.getHours() * 60 + startTime.getMinutes()
      // 向前取整到最近的90分钟刻度
      const roundedMinutes = Math.floor(totalMinutes / 90) * 90
      startTime.setHours(Math.floor(roundedMinutes / 60), roundedMinutes % 60, 0, 0)
    } else {
      // 24小时：以2h（120分钟）为一个刻度
      tickInterval = 120
      startTime = new Date(currentTime)
      // 计算到当天00:00的总分钟数
      const totalMinutes = startTime.getHours() * 60 + startTime.getMinutes()
      // 向前取整到最近的120分钟刻度
      const roundedMinutes = Math.floor(totalMinutes / 120) * 120
      startTime.setHours(Math.floor(roundedMinutes / 60), roundedMinutes % 60, 0, 0)
    }

    // 计算结束时间：起始时间 + 时间范围
    const endTime = new Date(startTime.getTime() + timelineTimeRange * 60 * 60 * 1000)
    
    // 生成刻度
    const ticks: Date[] = []
    let currentTick = new Date(startTime)

    while (currentTick <= endTime) {
      ticks.push(new Date(currentTick))
      const nextTick = new Date(currentTick.getTime() + tickInterval * 60 * 1000)
      // 如果下一个刻度会超过结束时间，但距离结束时间很近（小于一个刻度间隔），也添加结束时间作为最后一个刻度
      if (nextTick > endTime && (endTime.getTime() - currentTick.getTime()) < tickInterval * 60 * 1000 * 0.8) {
        // 确保最后一个刻度是结束时间
        if (ticks[ticks.length - 1].getTime() !== endTime.getTime()) {
          ticks.push(new Date(endTime))
        }
        break
      }
      currentTick = nextTick
    }
    
    // 确保最后一个刻度是结束时间（如果还没有的话）
    if (ticks.length > 0 && ticks[ticks.length - 1].getTime() !== endTime.getTime()) {
      ticks.push(new Date(endTime))
    }

    return { startTime, ticks, tickInterval, endTime }
  }, [timelineTimeRange])

  // 当时间范围改变时，将当前时间设置为系统时区时间（转换为 2024-07-25 的日期）
  useEffect(() => {
    const now = new Date()
    // 使用 2024-07-25 作为基准日期，但时间部分使用当前系统时区时间
    const baseDate = '2024-07-25'
    const currentTime = new Date(`${baseDate}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}+08:00`)
    
    // 由于起始时间是基于系统时区时间计算的，当前时间应该在范围内
    // 将当前时间设置为系统时区时间（在 2024-07-25 上），确保时间轴以当前时刻为基准
    if (currentTime >= startTime && currentTime <= endTime) {
      setTimelineCurrentTime(new Date(currentTime))
    } else {
      // 如果当前时间不在范围内（理论上不应该发生），使用起始时间
      setTimelineCurrentTime(new Date(startTime))
    }
  }, [startTime, endTime, setTimelineCurrentTime])

  // 播放功能：平滑移动，按最小刻度间隔的速度
  useEffect(() => {
    if (!timelineIsPlaying) return

    let animationFrameId: number
    let lastTimestamp: number | null = null
    
    // 计算每毫秒应该移动的时间（毫秒）
    // 例如：30分钟 = 1800000毫秒，在1000毫秒内完成，所以每毫秒移动1800毫秒
    const timePerMs = (tickInterval * 60 * 1000) / 1000 // 1秒完成一个刻度间隔

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp
      }

      const deltaTime = timestamp - lastTimestamp
      lastTimestamp = timestamp

      const state = useAppStore.getState()
      const prevTime = state.timelineCurrentTime
      const timeToAdd = deltaTime * timePerMs
      const nextTime = new Date(prevTime.getTime() + timeToAdd)

      // 如果超过结束时间，停止播放并设置为结束时间
      if (nextTime > endTime) {
        setTimelineCurrentTime(new Date(endTime))
        setTimelineIsPlaying(false)
        return
      }

      setTimelineCurrentTime(nextTime)
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [timelineIsPlaying, tickInterval, endTime, setTimelineCurrentTime, setTimelineIsPlaying])

  // 格式化时间显示（跨天显示+1）
  const formatTime = (date: Date, baseDate?: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    let result = `${hours}:${minutes}`
    
    // 如果提供了基准日期，检查是否跨天
    if (baseDate) {
      // 获取基准日期的年月日
      const baseYear = baseDate.getFullYear()
      const baseMonth = baseDate.getMonth()
      const baseDay = baseDate.getDate()
      
      // 获取目标日期的年月日
      const dateYear = date.getFullYear()
      const dateMonth = date.getMonth()
      const dateDay = date.getDate()
      
      // 如果目标日期比基准日期晚（跨天、跨月或跨年），显示+1
      if (
        dateYear > baseYear ||
        (dateYear === baseYear && dateMonth > baseMonth) ||
        (dateYear === baseYear && dateMonth === baseMonth && dateDay > baseDay)
      ) {
        result += ' (+1)'
      }
    }
    
    return result
  }

  // 格式化日期和时间显示
  const formatDateTime = (date: Date): string => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    const time = formatTime(date)
    return `${month}月${day}日${weekday}: ${time} GMT+8`
  }

  // 计算时间在时间轴上的位置（0-1）
  const getTimePosition = (time: Date): number => {
    const totalDuration = endTime.getTime() - startTime.getTime()
    const elapsed = time.getTime() - startTime.getTime()
    return Math.max(0, Math.min(1, elapsed / totalDuration))
  }

  // 处理时间轴点击
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const ratio = x / width

    const totalDuration = endTime.getTime() - startTime.getTime()
    const targetTime = new Date(startTime.getTime() + ratio * totalDuration)
    setTimelineCurrentTime(targetTime)
    setTimelineIsPlaying(false) // 点击时停止播放
  }

  // 处理鼠标移动（显示悬停时间）
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const ratio = Math.max(0, Math.min(1, x / width))

    const totalDuration = endTime.getTime() - startTime.getTime()
    const hoverTime = new Date(startTime.getTime() + ratio * totalDuration)
    setHoveredTime(hoverTime)
  }

  const handleTimelineMouseLeave = () => {
    setHoveredTime(null)
  }

  // 切换播放状态
  const togglePlay = () => {
    setTimelineIsPlaying(!timelineIsPlaying)
  }

  const currentPosition = getTimePosition(timelineCurrentTime)

  return (
    <div className="timeline-container">
      {/* 标题 - 位于背景图外最上方 */}
      <div className="timeline-range-title">航线动态展示</div>
      
      {/* 时间范围选择面板 - 在背景图内 */}
      <div className="timeline-range-panel">
        <div className="timeline-range-section">
          <div className="timeline-range-label">时间范围</div>
          <div className="timeline-range-options">
            <label className="timeline-range-option">
              <input
                type="radio"
                name="timeRange"
                value="4"
                checked={timelineTimeRange === 4}
                onChange={() => setTimelineTimeRange(4)}
              />
              <span>4小时</span>
            </label>
            <label className="timeline-range-option">
              <input
                type="radio"
                name="timeRange"
                value="10"
                checked={timelineTimeRange === 10}
                onChange={() => setTimelineTimeRange(10)}
              />
              <span>10小时</span>
            </label>
            <label className="timeline-range-option">
              <input
                type="radio"
                name="timeRange"
                value="18"
                checked={timelineTimeRange === 18}
                onChange={() => setTimelineTimeRange(18)}
              />
              <span>18小时</span>
            </label>
            <label className="timeline-range-option">
              <input
                type="radio"
                name="timeRange"
                value="24"
                checked={timelineTimeRange === 24}
                onChange={() => setTimelineTimeRange(24)}
              />
              <span>24小时</span>
            </label>
          </div>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="timeline-wrapper">
        {/* 播放按钮 */}
        <button
          className={`timeline-play-button ${timelineIsPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          title={timelineIsPlaying ? '暂停' : '播放'}
        >
          {timelineIsPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 时间轴主体 */}
        <div
          ref={timelineRef}
          className="timeline-track"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
        >
          {/* 时间轴背景线（未走过的部分 - 暗色） */}
          <div className="timeline-line" />
          {/* 时间轴已走过的部分（高亮） */}
          <div 
            className="timeline-line-progress" 
            style={{ width: `${currentPosition * 100}%` }}
          />

          {/* 刻度标记 */}
          {ticks.map((tick, index) => {
            const position = getTimePosition(tick)
            const isFirst = index === 0
            const isLast = index === ticks.length - 1
            const isPassed = position <= currentPosition
            return (
              <div
                key={index}
                className={`timeline-tick ${isFirst ? 'timeline-tick-first' : ''} ${isLast ? 'timeline-tick-last' : ''}`}
                style={{ 
                  left: isFirst ? '0' : isLast ? 'auto' : `${position * 100}%`,
                  right: isLast ? '0' : undefined
                }}
              >
                <div 
                  className="timeline-tick-mark" 
                  style={{ 
                    background: isPassed ? '#D5E1FF' : 'rgba(213, 225, 255, 0.3)',
                    opacity: isPassed ? 1 : 0.5
                  }} 
                />
                <div 
                  className="timeline-tick-label"
                  style={{
                    color: isPassed ? '#D5E1FF' : 'rgba(213, 225, 255, 0.5)'
                  }}
                >
                  {formatTime(tick, startTime)}
                </div>
              </div>
            )
          })}

          {/* 当前时间指示器 */}
          <div
            className="timeline-indicator"
            style={{ left: `${currentPosition * 100}%` }}
          >
            <div className="timeline-indicator-dot" />
            {/* 日期和时间标签 - 显示在圆点上方，固定显示当前时间 */}
            <div className="timeline-date-label">
              {formatDateTime(timelineCurrentTime)}
            </div>
          </div>

          {/* 悬停时间指示器 */}
          {hoveredTime && (
            <div
              className="timeline-hover-indicator"
              style={{ left: `${getTimePosition(hoveredTime) * 100}%` }}
            >
              <div className="timeline-hover-tooltip">
                {formatTime(hoveredTime)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
