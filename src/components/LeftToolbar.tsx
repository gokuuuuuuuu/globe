import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import collapseIcon from '../assets/collapse.png'
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
    autoRotate,
    setAutoRotate,
  } = useAppStore()

  const [isCollapsed, setIsCollapsed] = useState(false)
  // 整个左侧sidebar收起状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // 筛选部分折叠状态，默认折叠
  const [isFlightFilterCollapsed, setIsFlightFilterCollapsed] = useState(true)
  const [isRiskTypeFilterCollapsed, setIsRiskTypeFilterCollapsed] = useState(true)

  // 视图切换处理（在globe、map、airport-stacks之间循环切换）
  const handleViewSwitch = () => {
    if (view === 'globe') {
      setView('map')
    } else if (view === 'map') {
      setView('airport-stacks')
    } else {
      // airport-stacks 或其他视图，切换到globe
      setView('globe')
    }
  }

  // 获取视图图标
  const getViewIcon = () => {
    if (view === 'globe') {
      return '🌍' // 3D地图
    } else if (view === 'map') {
      return '🗺️' // 平面地图
    } else if (view === 'airport-stacks') {
      return '📊' // 风险柱状图
    }
    return '🌍'
  }

  // 获取视图标题
  const getViewTitle = () => {
    if (view === 'globe') {
      return '切换到平面地图'
    } else if (view === 'map') {
      return '切换到风险柱状图'
    } else if (view === 'airport-stacks') {
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
      {/* 收起按钮区域 - 始终显示 */}
      <div className="toolbar-top-collapse-header">
        <img 
          src={collapseIcon} 
          alt="collapse" 
          className={`collapse-icon collapse-clickable ${isSidebarCollapsed ? 'rotated' : ''}`}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        />
      </div>

      {/* 工具栏和内容区域 - 可收起 */}
      <div className={`toolbar-content-wrapper ${isSidebarCollapsed ? 'collapsed' : ''}`}>
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
                className={`toolbar-icon ${view === 'globe' || view === 'map' || view === 'airport-stacks' ? 'active' : ''}`}
                onClick={handleViewSwitch}
                title={getViewTitle()}
              >
                {getViewIcon()}
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
              <button
                className={`toolbar-icon ${autoRotate ? 'active' : ''}`}
                onClick={() => setAutoRotate(!autoRotate)}
                title={autoRotate ? '关闭地球自转' : '开启地球自转'}
              >
                🔄
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

      {/* 筛选区域 */}
      <div className="toolbar-content">
          {/* 航班信息筛选（可折叠） */}
          <div className="filter-section">
            <div 
              className="filter-section-header"
              onClick={() => setIsFlightFilterCollapsed(!isFlightFilterCollapsed)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className="filter-section-title">航班信息筛选</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="filter-reset-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResetFlightFilters()
                  }}
                >
                  重置
                </button>
                <span className={`filter-section-toggle ${isFlightFilterCollapsed ? 'collapsed' : ''}`}>▼</span>
              </div>
            </div>
            {!isFlightFilterCollapsed && (
              <div className="filter-section-content">
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
            )}
          </div>

          {/* 风险类型筛选（可折叠） */}
          <div className="filter-section">
            <div 
              className="filter-section-header"
              onClick={() => setIsRiskTypeFilterCollapsed(!isRiskTypeFilterCollapsed)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className="filter-section-title">风险类型筛选</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="filter-reset-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResetRiskTypes()
                  }}
                >
                  重置
                </button>
                <span className={`filter-section-toggle ${isRiskTypeFilterCollapsed ? 'collapsed' : ''}`}>▼</span>
              </div>
            </div>
            {!isRiskTypeFilterCollapsed && (
              <div className="filter-section-content">
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
            )}
          </div>
        </div>
      </div>
      {/* 结束toolbar-content-wrapper */}
    </div>
  )
}

