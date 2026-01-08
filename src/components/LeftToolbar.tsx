// @ts-nocheck
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import collapseIcon from '../assets/collapse.png'
import boxIcon from '../assets/box.png'
import boxActiveIcon from '../assets/box_active.png'
import icon3d from '../assets/3d.png'
import icon2d from '../assets/2d.png'
import iconBar from '../assets/bar.png'
import iconLabel from '../assets/label.png'
import iconWind from '../assets/wind.png'
import iconTemperature from '../assets/temperature.png'
import iconPrecipitation from '../assets/precipitation.png'
import iconFog from '../assets/fog.png'
import iconMoisture from '../assets/moisture.png'
import iconLightning from '../assets/lightning.png'
import iconCAT from '../assets/CAT.png'
import iconVisibility from '../assets/visibility.png'
import iconWrench from '../assets/wrench.png'
import iconArrow from '../assets/collapse_tool.png'
import iconRadar from '../assets/radar_icon.png'
import iconArrowDown from '../assets/arrow_down.png'
import iconInputArrow from '../assets/input_arrow.png'
import iconReset from '../assets/reset.png'
import iconInputHighlights from '../assets/input_ highlights.png'
import iconRotation from '../assets/rotation.png'
import './LeftToolbar.css'

// 风险类型列表
const RISK_TYPES = [
  '冲偏出跑道',
  '可控飞行撞地',
  '跑道入侵',
  '飞行失控',
  '空中相撞',
  '重要系统故障',
  '鸟击',
  '重着陆',
  '不稳定进近',
  '擦机尾',
  '其他',
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
    showPrecipitationLayer,
    setShowPrecipitationLayer,
    showFogLayer,
    setShowFogLayer,
    showMoistureLayer,
    setShowMoistureLayer,
    showLightningLayer,
    setShowLightningLayer,
    showCATLayer,
    setShowCATLayer,
    showVisibilityLayer,
    setShowVisibilityLayer,
    flightFilters,
    setFlightFilters,
    riskTypes,
    setRiskTypes,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    autoRotate,
    setAutoRotate,
  } = useAppStore()

  const [isCollapsed, setIsCollapsed] = useState(false)
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

  // 获取视图图标 - 根据当前视图返回对应图标
  const getViewIcon = () => {
    if (view === 'globe') {
      return icon3d
    } else if (view === 'map') {
      return icon2d
    } else if (view === 'airport-stacks') {
      return iconBar
    }
    return icon3d
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
      {/* 收起按钮 - 位于工具栏上方 */}
      <div className="toolbar-collapse-header" style={{ padding: '12px 0px 0px 16px' }}>
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
          <div className="toolbar-collapse-container">
            <button
              className="toolbar-collapse-btn-collapsed"
              onClick={() => setIsCollapsed(false)}
              title="展开工具栏"
            >
              <img src={boxIcon} alt="box" className="toolbar-box-bg" />
              <img src={iconWrench} alt="wrench" className="toolbar-wrench-icon" />
            </button>
            <button
              className="toolbar-arrow-btn-collapsed"
              onClick={() => setIsCollapsed(false)}
              title="展开工具栏"
            >
              <img src={iconArrow} alt="arrow" className="toolbar-arrow-icon-collapsed" />
            </button>
          </div>
        ) : (
          <>
            <div className="toolbar-icons">
              <button
                className={`toolbar-icon-box ${view === 'globe' || view === 'map' || view === 'airport-stacks' ? 'active' : ''}`}
                onClick={handleViewSwitch}
                title={getViewTitle()}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={getViewIcon()} alt="3d" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showLabels ? 'active' : ''}`}
                onClick={() => setShowLabels(!showLabels)}
                title={showLabels ? '隐藏标签' : '显示标签'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconLabel} alt="label" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showWindLayer ? 'active' : ''}`}
                onClick={() => setShowWindLayer(!showWindLayer)}
                title={showWindLayer ? '隐藏风图层' : '显示风图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconWind} alt="wind" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showTemperatureLayer ? 'active' : ''}`}
                onClick={() => setShowTemperatureLayer(!showTemperatureLayer)}
                title={showTemperatureLayer ? '隐藏温度图层' : '显示温度图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconTemperature} alt="temperature" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showPrecipitationLayer ? 'active' : ''}`}
                onClick={() => setShowPrecipitationLayer(!showPrecipitationLayer)}
                title={showPrecipitationLayer ? '隐藏降水图层' : '显示降水图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconPrecipitation} alt="precipitation" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showFogLayer ? 'active' : ''}`}
                onClick={() => setShowFogLayer(!showFogLayer)}
                title={showFogLayer ? '隐藏雾图层' : '显示雾图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconFog} alt="fog" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showMoistureLayer ? 'active' : ''}`}
                onClick={() => setShowMoistureLayer(!showMoistureLayer)}
                title={showMoistureLayer ? '隐藏水汽通量图层' : '显示水汽通量图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconMoisture} alt="moisture" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showLightningLayer ? 'active' : ''}`}
                onClick={() => setShowLightningLayer(!showLightningLayer)}
                title={showLightningLayer ? '隐藏雷电图层' : '显示雷电图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconLightning} alt="lightning" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showCATLayer ? 'active' : ''}`}
                onClick={() => setShowCATLayer(!showCATLayer)}
                title={showCATLayer ? '隐藏颠簸区图层' : '显示颠簸区图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconCAT} alt="CAT" className="toolbar-icon-img" />
              </button>
              <button
                className={`toolbar-icon-box ${showVisibilityLayer ? 'active' : ''}`}
                onClick={() => setShowVisibilityLayer(!showVisibilityLayer)}
                title={showVisibilityLayer ? '隐藏能见度图层' : '显示能见度图层'}
              >
                <img src={boxIcon} alt="box" className="toolbar-box-bg" />
                <img src={boxActiveIcon} alt="box active" className="toolbar-box-bg-active" />
                <img src={iconVisibility} alt="visibility" className="toolbar-icon-img" />
              </button>
            </div>
            <button
              className="toolbar-collapse-btn"
              onClick={() => setIsCollapsed(true)}
              title="折叠工具栏"
            >
              <img src={iconArrow} alt="arrow" className="toolbar-collapse-icon" />
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
              <div className="filter-section-title-wrapper">
                <img src={iconRadar} alt="radar" className="filter-section-icon" />
                <h3 className="filter-section-title">航班信息筛选</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  className="filter-reset-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResetFlightFilters()
                  }}
                >
                  <img src={iconReset} alt="reset" className="filter-reset-icon" />
                </button>
                <img 
                  src={iconArrowDown} 
                  alt="toggle" 
                  className={`filter-section-toggle-icon ${isFlightFilterCollapsed ? 'collapsed' : ''}`}
                />
              </div>
            </div>
            {!isFlightFilterCollapsed && (
              <div className="filter-section-content">
                <div className="filter-inputs">
              <div className="filter-input-group">
                <label className="filter-label">航班号</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.flightNumber}
                    onChange={(e) => setFlightFilters({ flightNumber: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">机号</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.aircraftNumber}
                    onChange={(e) => setFlightFilters({ aircraftNumber: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">大机型</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.largeAircraftType}
                    onChange={(e) => setFlightFilters({ largeAircraftType: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">机型</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.aircraftType}
                    onChange={(e) => setFlightFilters({ aircraftType: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">PF技术</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.pfTechnology}
                    onChange={(e) => setFlightFilters({ pfTechnology: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">执飞单位</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.operatingUnit}
                    onChange={(e) => setFlightFilters({ operatingUnit: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">起飞机场</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.departureAirport}
                    onChange={(e) => setFlightFilters({ departureAirport: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
                </div>
              </div>
              <div className="filter-input-group">
                <label className="filter-label">降落机场</label>
                <div className="filter-input-wrapper">
                  <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="please input"
                    value={flightFilters.arrivalAirport}
                    onChange={(e) => setFlightFilters({ arrivalAirport: e.target.value })}
                  />
                  <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
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
              <div className="filter-section-title-wrapper">
                <img src={iconRadar} alt="radar" className="filter-section-icon" />
                <h3 className="filter-section-title">风险类型筛选</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="filter-reset-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResetRiskTypes()
                  }}
                >
                  <img src={iconReset} alt="reset" className="filter-reset-icon" />
                </button>
                <img 
                  src={iconArrowDown} 
                  alt="toggle" 
                  className={`filter-section-toggle-icon ${isRiskTypeFilterCollapsed ? 'collapsed' : ''}`}
                />
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
      
      {/* 地球自转控制按钮 - 位于工具栏底部 */}
      {view === 'globe' && (
        <button
          className="globe-rotation-btn"
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? '停止自转' : '开始自转'}
        >
          <img 
            src={iconRotation} 
            alt="rotation" 
            className={`globe-rotation-icon ${autoRotate ? 'rotating' : ''}`}
          />
        </button>
      )}
    </div>
  )
}

