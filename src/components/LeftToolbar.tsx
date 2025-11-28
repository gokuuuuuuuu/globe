import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import './LeftToolbar.css'

// 风险类型列表
const RISK_TYPES = [
  '冲偏出跑道',
  '地面损伤',
  '跑道外接地',
  '空中冲突',
  '擦机尾',
  '空中失控',
  '擦发动机',
  '空中损伤',
  '擦翼尖',
  '可控飞行撞地',
  '重着陆',
  '其他',
  '不稳定进近',
]

export function LeftToolbar() {
  const {
    view,
    setView,
    showLabels,
    setShowLabels,
    showWindLayer,
    setShowWindLayer,
    showTemperatureLayer,
    setShowTemperatureLayer,
    flightFilters,
    setFlightFilters,
    riskTypes,
    setRiskTypes,
  } = useAppStore()

  const [isCollapsed, setIsCollapsed] = useState(false)

  // 地图切换处理（在globe和map之间切换）
  const handleMapSwitch = () => {
    if (view === 'globe') {
      setView('map')
    } else if (view === 'map') {
      setView('globe')
    } else {
      // 如果当前是其他视图，切换到globe
      setView('globe')
    }
  }

  // 切换到机场风险柱状图
  const handleAirportStacksSwitch = () => {
    if (view === 'airport-stacks') {
      setView('globe')
    } else {
      setView('airport-stacks')
    }
  }

  // 获取地图图标
  const getMapIcon = () => {
    if (view === 'globe') {
      return '🌍' // 3D地图
    } else if (view === 'map') {
      return '🗺️' // 平面地图
    }
    return '🌍'
  }

  // 获取地图标题
  const getMapTitle = () => {
    if (view === 'globe') {
      return '切换到平面地图'
    } else if (view === 'map') {
      return '切换到3D地图'
    }
    return '切换到3D地图'
  }

  // 风险类型切换
  const handleRiskTypeToggle = (type: string) => {
    if (riskTypes.includes(type)) {
      setRiskTypes(riskTypes.filter(t => t !== type))
    } else {
      setRiskTypes([...riskTypes, type])
    }
  }

  // 重置航班筛选
  const handleResetFlightFilters = () => {
    setFlightFilters({
      flightNumber: '',
      aircraftNumber: '',
      largeAircraftType: '',
      aircraftType: '',
      pfTechnology: '',
      operatingUnit: '',
      departureAirport: '',
      arrivalAirport: '',
    })
  }

  // 重置风险类型筛选
  const handleResetRiskTypes = () => {
    setRiskTypes([])
  }

  return (
    <div className="left-toolbar">
      {/* 可折叠工具栏 */}
      <div className={`toolbar-header ${isCollapsed ? 'collapsed' : ''}`}>
        {isCollapsed ? (
          <button
            className="toolbar-collapse-btn-collapsed"
            onClick={() => setIsCollapsed(false)}
            title="展开工具栏"
          >
            <span className="toolbar-wrench-icon">🔧</span>
            <span className="toolbar-arrow-icon">▶</span>
          </button>
        ) : (
          <>
            <div className="toolbar-icons">
              <button
                className={`toolbar-icon ${view === 'globe' || view === 'map' ? 'active' : ''}`}
                onClick={handleMapSwitch}
                title={getMapTitle()}
              >
                {getMapIcon()}
              </button>
              <button
                className={`toolbar-icon ${view === 'airport-stacks' ? 'active' : ''}`}
                onClick={handleAirportStacksSwitch}
                title={view === 'airport-stacks' ? '切换到3D地图' : '切换到机场风险柱状图'}
              >
                📊
              </button>
              <button
                className={`toolbar-icon ${showLabels ? 'active' : ''}`}
                onClick={() => setShowLabels(!showLabels)}
                title={showLabels ? '隐藏标签' : '显示标签'}
              >
                🏷️
              </button>
              <button
                className={`toolbar-icon ${showWindLayer ? 'active' : ''}`}
                onClick={() => setShowWindLayer(!showWindLayer)}
                title={showWindLayer ? '隐藏风图层' : '显示风图层'}
              >
                💨
              </button>
              <button
                className={`toolbar-icon ${showTemperatureLayer ? 'active' : ''}`}
                onClick={() => setShowTemperatureLayer(!showTemperatureLayer)}
                title={showTemperatureLayer ? '隐藏温度图层' : '显示温度图层'}
              >
                🌡️
              </button>
            </div>
            <button
              className="toolbar-collapse-btn"
              onClick={() => setIsCollapsed(true)}
              title="折叠工具栏"
            >
              ◀
            </button>
          </>
        )}
      </div>

      {/* 筛选区域始终显示 */}
      <div className="toolbar-content">
          {/* 航班信息筛选 */}
          <div className="filter-section">
            <div className="filter-section-header">
              <h3 className="filter-section-title">航班信息筛选</h3>
              <button className="filter-reset-btn" onClick={handleResetFlightFilters}>
                重置
              </button>
            </div>
            <div className="filter-inputs">
              <div className="filter-input-group">
                <label className="filter-label">航班号</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.flightNumber}
                    onChange={(e) => setFlightFilters({ flightNumber: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">机号</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.aircraftNumber}
                    onChange={(e) => setFlightFilters({ aircraftNumber: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">大机型</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.largeAircraftType}
                    onChange={(e) => setFlightFilters({ largeAircraftType: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">机型</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.aircraftType}
                    onChange={(e) => setFlightFilters({ aircraftType: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">PF技术</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.pfTechnology}
                    onChange={(e) => setFlightFilters({ pfTechnology: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">执飞单位</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.operatingUnit}
                    onChange={(e) => setFlightFilters({ operatingUnit: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">起飞机场</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.departureAirport}
                    onChange={(e) => setFlightFilters({ departureAirport: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">降落机场</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.arrivalAirport}
                    onChange={(e) => setFlightFilters({ arrivalAirport: e.target.value })}
                  />
                  <span className="filter-input-arrow">▼</span>
                </div>
              </div>
            </div>
          </div>

          {/* 风险类型筛选 */}
          <div className="filter-section">
            <div className="filter-section-header">
              <h3 className="filter-section-title">风险类型筛选</h3>
              <button className="filter-reset-btn" onClick={handleResetRiskTypes}>
                重置
              </button>
            </div>
            <div className="risk-types-grid">
              {RISK_TYPES.map((type) => (
                <label key={type} className="risk-type-checkbox">
                  <input
                    type="checkbox"
                    checked={riskTypes.includes(type)}
                    onChange={() => handleRiskTypeToggle(type)}
                  />
                  <span className="risk-type-label">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
    </div>
  )
}

