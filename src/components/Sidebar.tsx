import {  useMemo, useState, useEffect, useRef } from 'react'
import { useAppStore, type RiskZone } from '../store/useAppStore'
import { AIRPORTS, FLIGHTS, calculateRiskFromEnvironmentRisk, type Airport, type Flight, getRiskColor } from '../data/flightData'
import { PERSONS, TEAMS, getPersonById, getTeamById } from '../data/personData'
import collapseIcon from '../assets/collapse.png'
import airlineIcon from '../assets/airline.png'
import airportIcon from '../assets/airport.png'
import personIcon from '../assets/person.png'
import './Sidebar.css'

// 扩展机场数据接口，添加风险值相关字段（用于Sidebar显示）
interface AirportData extends Airport {
  riskValue: string // 风险值，如 "7.9"
  riskZone: RiskZone // 风险区间
}

// 将统一数据源转换为Sidebar需要的格式
const MOCK_AIRPORTS: AirportData[] = AIRPORTS.map(airport => {
  const { riskValue, riskZone } = calculateRiskFromEnvironmentRisk(airport.environmentRisk)
  return {
    ...airport,
    riskValue,
    riskZone,
  }
})

// 使用统一的航班数据
const MOCK_FLIGHTS: Flight[] = FLIGHTS

// 风险值转换为数字用于排序
function parseRiskValue(riskValue: string): number {
  // 解析 "X.Y" 格式的风险值字符串为数字
  const num = parseFloat(riskValue)
  return isNaN(num) ? 0 : num
}

// 根据风险值确定风险区间
// function getRiskZone(riskValue: string): RiskZone {
//   const num = parseRiskValue(riskValue)
//   if (num >= 70) return 'red'
//   if (num >= 60) return 'orange'
//   if (num >= 40) return 'yellow'
//   return 'green'
// }

export function Sidebar() {
  const {
    sidebarTab,
    setSidebarTab,
    searchQuery,
    setSearchQuery,
    riskZones,
    setRiskZones,
    setTargetAirportId,
    selectedAirportForAirline,
    setSelectedAirportForAirline,
    flightStatuses,
    setFlightStatuses,
    selectedFlightRouteId,
    setSelectedFlightRouteId,
    setTargetFlightRouteId,
    riskTypes,
    setViewingAirportId,
    selectedPersonId,
    setSelectedPersonId,
    expandedTeamIds,
    setExpandedTeamIds,
  } = useAppStore()
  
  // 本地状态：从tab进入时，默认展开所有机队
  const [isFromTab, setIsFromTab] = useState(false)
  // 整个sidebar内容收起状态
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)
  // 筛选部分折叠状态，默认折叠
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)

  // 处理风险区间切换
  const handleRiskZoneToggle = (zone: RiskZone) => {
    if (riskZones.includes(zone)) {
      setRiskZones(riskZones.filter(z => z !== zone))
    } else {
      setRiskZones([...riskZones, zone])
    }
  }

  // 过滤和排序机场数据
  const filteredAirports = useMemo(() => {
    const filtered = MOCK_AIRPORTS.filter(airport => {
      // 搜索过滤
      const matchesSearch = !searchQuery || 
        airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        airport.nameZh.includes(searchQuery) ||
        airport.code.toLowerCase().includes(searchQuery.toLowerCase())
      
      // 风险区间过滤
      const matchesRiskZone = riskZones.includes(airport.riskZone)
      
      return matchesSearch && matchesRiskZone
    })

    // 按风险值从大到小排序
    filtered.sort((a, b) => parseRiskValue(b.riskValue) - parseRiskValue(a.riskValue))
    
    return filtered
  }, [searchQuery, riskZones])

  // 处理View按钮点击（从airport进入airline）
  const handleViewClick = (airport: AirportData) => {
    setTargetAirportId(airport.id)
    setSelectedAirportForAirline(airport.id)
    setViewingAirportId(airport.id) // 设置正在查看的机场，用于在globe上显示该机场的所有航线
    setSidebarTab('airline')
  }

  // 取消选中机场
  const handleDeselectAirport = () => {
    setSelectedAirportForAirline(null)
    setViewingAirportId(null) // 清除正在查看的机场
  }

  // 处理航班状态切换
  const handleFlightStatusToggle = (status: string) => {
    if (flightStatuses.includes(status)) {
      setFlightStatuses(flightStatuses.filter(s => s !== status))
    } else {
      setFlightStatuses([...flightStatuses, status])
    }
  }

  // 获取当前选中的机场信息
  const selectedAirport = useMemo(() => {
    if (!selectedAirportForAirline) return null
    return MOCK_AIRPORTS.find(a => a.id === selectedAirportForAirline) || null
  }, [selectedAirportForAirline])

  // 处理航线 View 按钮点击
  const handleFlightViewClick = (flight: Flight) => {
    // 先设置选中的航班ID，用于显示详情面板
    setSelectedFlightRouteId(flight.id)
    // 清除viewingAirportId，确保只显示当前选中的航线
    setViewingAirportId(null)
    
    // 根据起降机场生成航线ID（格式：起飞机场-降落机场-航班ID，与GlobeView保持一致）
    // 需要从机场代码映射到机场ID
    const fromAirport = AIRPORTS.find(a => a.code === flight.fromAirport)
    const toAirport = AIRPORTS.find(a => a.code === flight.toAirport)
    
    // 如果两个机场都在 AIRPORTS 中，则触发 zoom in
    if (fromAirport && toAirport) {
      // 使用与GlobeView相同的ID格式：${fromAirport.id}-${toAirport.id}-${flight.id}
      const routeId = `${fromAirport.id}-${toAirport.id}-${flight.id}`
      setTargetFlightRouteId(routeId) // 触发zoom in
    }
    // 如果机场不在列表中，仍然显示详情面板，只是不进行 zoom in
  }

  // 处理取消选中航线
  const handleDeselectFlight = () => {
    setSelectedFlightRouteId(null)
    setTargetFlightRouteId(null)
    // 如果取消选中航线，但还有选中的机场，则恢复显示该机场的所有航线
    if (selectedAirportForAirline) {
      setViewingAirportId(selectedAirportForAirline)
    }
  }

  // 获取当前选中的航线信息
  const selectedFlight = useMemo(() => {
    if (!selectedFlightRouteId) return null
    return MOCK_FLIGHTS.find(f => f.id === selectedFlightRouteId) || null
  }, [selectedFlightRouteId])

  // 过滤和排序航班数据
  const filteredFlights = useMemo(() => {
    const filtered = MOCK_FLIGHTS.filter(flight => {
      // 如果选中了机场，只显示该机场的航班
      if (selectedAirportForAirline) {
        if (flight.airportId !== selectedAirportForAirline) {
          return false
        }
      }

      // 搜索过滤
      const matchesSearch = !searchQuery || 
        flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flight.fromAirportZh.includes(searchQuery) ||
        flight.toAirportZh.includes(searchQuery)

      // 状态过滤
      const matchesStatus = flightStatuses.length === 0 || flightStatuses.includes(flight.status)

      return matchesSearch && matchesStatus
    })

    // 按风险值倒序排序（取人、机、环中的最高值）
    return [...filtered].sort((a, b) => {
      const maxRiskA = Math.max(a.humanRisk, a.machineRisk, a.environmentRisk)
      const maxRiskB = Math.max(b.humanRisk, b.machineRisk, b.environmentRisk)
      return maxRiskB - maxRiskA // 倒序：从高到低
    })
  }, [searchQuery, flightStatuses, selectedAirportForAirline])

  // 过滤机队和人员数据（用于person tab）
  const filteredTeams = useMemo(() => {
    if (!searchQuery) {
      return TEAMS
    }

    const query = searchQuery.toLowerCase()
    
    return TEAMS.filter(team => {
      // 检查机队名称是否匹配
      const teamNameMatches = team.name.toLowerCase().includes(query)
      
      // 检查分队长是否匹配
      const leaderPerson = getPersonById(team.leader.id) || team.leader
      const leaderMatches = 
        leaderPerson.name.includes(searchQuery) ||
        leaderPerson.pfId.toLowerCase().includes(query) ||
        leaderPerson.pfTechnology.includes(searchQuery)
      
      // 检查成员是否匹配
      const memberMatches = team.members.some(member => {
        const memberPerson = getPersonById(member.id) || member
        return (
          memberPerson.name.includes(searchQuery) ||
          memberPerson.pfId.toLowerCase().includes(query) ||
          memberPerson.pfTechnology.includes(searchQuery)
        )
      })
      
      return teamNameMatches || leaderMatches || memberMatches
    })
  }, [searchQuery])

  // 使用 ref 跟踪上一次的搜索查询和匹配结果，避免无限循环
  const prevSearchQueryRef = useRef<string>('')
  const prevFilteredTeamsLengthRef = useRef<number>(0)
  const expandedTeamIdsRef = useRef<string[]>(expandedTeamIds)
  
  // 同步 expandedTeamIds 到 ref（不触发更新）
  useEffect(() => {
    expandedTeamIdsRef.current = expandedTeamIds
  }, [expandedTeamIds])
  
  // 当有搜索查询时，自动展开匹配的机队（仅在person tab）
  useEffect(() => {
    // 只在 searchQuery 或 filteredTeams 真正变化时才执行
    const searchQueryChanged = prevSearchQueryRef.current !== searchQuery
    const filteredTeamsChanged = prevFilteredTeamsLengthRef.current !== filteredTeams.length
    
    if (!searchQueryChanged && !filteredTeamsChanged) {
      return
    }
    
    prevSearchQueryRef.current = searchQuery
    prevFilteredTeamsLengthRef.current = filteredTeams.length
    
    if (sidebarTab === 'person' && searchQuery) {
      const matchingTeamIds = filteredTeams.map(team => team.id)
      // 使用 ref 中的值，而不是直接从 props 读取
      const currentExpanded = expandedTeamIdsRef.current
      // 检查哪些匹配的机队还没有展开
      const needToExpand = matchingTeamIds.filter(id => !currentExpanded.includes(id))
      
      if (needToExpand.length > 0) {
        // 只添加需要展开的机队，保留已展开的
        const combined = [...new Set([...currentExpanded, ...needToExpand])]
        setExpandedTeamIds(combined)
      }
    } else if (sidebarTab === 'person' && !searchQuery && !isFromTab) {
      // 如果清空搜索且不是从tab进入的，折叠所有机队
      setExpandedTeamIds([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filteredTeams, sidebarTab, isFromTab])

  // 获取状态按钮颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '未起飞': return '#3b82f6' // 蓝色
      case '巡航中': return '#22c55e' // 绿色
      case '已落地': return '#94a3b8' // 灰色
      default: return '#94a3b8'
    }
  }

  // 根据风险值数字获取颜色
  const getRiskValueColorFromNumber = (riskValue: number) => {
    if (riskValue >= 7) return '#ef4444' // 高风险 - 红色
    if (riskValue >= 5) return '#f97316' // 高中风险 - 橙色
    if (riskValue >= 2) return '#eab308' // 中风险 - 黄色
    return '#22c55e' // 低风险 - 绿色
  }

  // 获取风险值的颜色（根据风险区间）
  const getRiskValueColor = (riskZone: RiskZone) => {
    switch (riskZone) {
      case 'red': return '#ef4444'
      case 'orange': return '#f97316'
      case 'yellow': return '#eab308'
      case 'green': return '#22c55e'
      default: return '#94a3b8'
    }
  }

  // 获取风险值对应的背景颜色（半透明，符合项目风格）
  // 使用与getRiskColor相同的颜色值，但降低透明度
  const getRiskBackgroundColor = (riskZone: RiskZone) => {
    switch (riskZone) {
      case 'red': return 'rgba(255, 23, 68, 0.12)' // #ff1744 半透明，符合项目深色风格
      case 'orange': return 'rgba(255, 111, 0, 0.12)' // #ff6f00 半透明
      case 'yellow': return 'rgba(255, 193, 7, 0.12)' // #ffc107 半透明
      case 'green': return 'rgba(76, 175, 80, 0.12)' // #4caf50 半透明
      default: return 'rgba(30, 41, 59, 0.6)' // 默认背景色
    }
  }

  // 获取风险值对应的hover背景颜色（更亮一些）
  const getRiskHoverBackgroundColor = (riskZone: RiskZone) => {
    switch (riskZone) {
      case 'red': return 'rgba(255, 23, 68, 0.2)' // hover时更明显
      case 'orange': return 'rgba(255, 111, 0, 0.2)'
      case 'yellow': return 'rgba(255, 193, 7, 0.2)'
      case 'green': return 'rgba(76, 175, 80, 0.2)'
      default: return 'rgba(30, 41, 59, 0.8)' // 默认hover背景色
    }
  }

  // 根据风险值数字获取背景颜色（用于航班卡片）
  const getFlightRiskBackgroundColor = (riskValue: number) => {
    if (riskValue >= 7) return 'rgba(255, 23, 68, 0.12)' // 高风险 - 红色
    if (riskValue >= 5) return 'rgba(255, 111, 0, 0.12)' // 高中风险 - 橙色
    if (riskValue >= 2) return 'rgba(255, 193, 7, 0.12)' // 中风险 - 黄色
    return 'rgba(76, 175, 80, 0.12)' // 低风险 - 绿色
  }

  // 根据风险值数字获取hover背景颜色（用于航班卡片）
  const getFlightRiskHoverBackgroundColor = (riskValue: number) => {
    if (riskValue >= 7) return 'rgba(255, 23, 68, 0.2)' // 高风险 - 红色
    if (riskValue >= 5) return 'rgba(255, 111, 0, 0.2)' // 高中风险 - 橙色
    if (riskValue >= 2) return 'rgba(255, 193, 7, 0.2)' // 中风险 - 黄色
    return 'rgba(76, 175, 80, 0.2)' // 低风险 - 绿色
  }

  return (
    <div className="sidebar">
      {/* 登录状态 */}
      <div className="sidebar-header">
        <div className="login-status">
          <span className="login-user">admin</span> <span className="login-role">(高级管理)</span>
        </div>
        <img 
          src={collapseIcon} 
          alt="collapse" 
          className={`collapse-icon collapse-clickable ${isContentCollapsed ? 'rotated' : ''}`}
          onClick={() => setIsContentCollapsed(!isContentCollapsed)}
          title={isContentCollapsed ? '展开侧边栏' : '收起侧边栏'}
        />
      </div>

      {/* Tabs和内容区域 - 可收起 */}
      <div className={`sidebar-content-wrapper ${isContentCollapsed ? 'collapsed' : ''}`}>
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${sidebarTab === 'airport' ? 'active' : ''}`}
          onClick={() => setSidebarTab('airport')}
        >
          <img src={airportIcon} alt="airport" className="tab-icon" />
          <span className="tab-label">Airport</span>
        </button>
        <button
          className={`sidebar-tab ${sidebarTab === 'airline' ? 'active' : ''}`}
          onClick={() => setSidebarTab('airline')}
        >
          <img src={airlineIcon} alt="airline" className="tab-icon" />
          <span className="tab-label">Airline</span>
        </button>
        <button
          className={`sidebar-tab ${sidebarTab === 'person' ? 'active' : ''}`}
          onClick={() => {
            setSidebarTab('person')
            setIsFromTab(true) // 从tab进入，默认展开所有机队
            setSelectedPersonId(null) // 清除选中的人员
            setExpandedTeamIds([]) // 默认折叠所有机队
          }}
        >
          <img src={personIcon} alt="person" className="tab-icon" />
          <span className="tab-label">Person</span>
        </button>
      </div>

      {/* 搜索框 */}
      {/* 搜索框 */}
      <div className="sidebar-search">
        <input
          type="text"
          className="search-input"
          placeholder={`type to search ${sidebarTab}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">▼</span>
      </div>

      {/* 风险区间（仅airport tab显示，可折叠） */}
      {sidebarTab === 'airport' && (
        <div className="sidebar-filter-section">
          <div 
            className="filter-section-header"
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
          >
            <span className="filter-section-title">风险区间</span>
            <span className={`filter-section-toggle ${isFilterCollapsed ? 'collapsed' : ''}`}>▼</span>
          </div>
          {!isFilterCollapsed && (
            <div className="filter-section-content">
              <div className="risk-zones-checkboxes">
                <label className="risk-zone-checkbox">
                  <input
                    type="checkbox"
                    checked={riskZones.includes('red')}
                    onChange={() => handleRiskZoneToggle('red')}
                  />
                  <span className="risk-zone-color red"></span>
                  <span className="risk-zone-label">红色</span>
                </label>
                <label className="risk-zone-checkbox">
                  <input
                    type="checkbox"
                    checked={riskZones.includes('orange')}
                    onChange={() => handleRiskZoneToggle('orange')}
                  />
                  <span className="risk-zone-color orange"></span>
                  <span className="risk-zone-label">橙色</span>
                </label>
                <label className="risk-zone-checkbox">
                  <input
                    type="checkbox"
                    checked={riskZones.includes('yellow')}
                    onChange={() => handleRiskZoneToggle('yellow')}
                  />
                  <span className="risk-zone-color yellow"></span>
                  <span className="risk-zone-label">黄色</span>
                </label>
                <label className="risk-zone-checkbox">
                  <input
                    type="checkbox"
                    checked={riskZones.includes('green')}
                    onChange={() => handleRiskZoneToggle('green')}
                  />
                  <span className="risk-zone-color green"></span>
                  <span className="risk-zone-label">绿色</span>
                </label>
              </div>
              <div className="risk-zones-high-risk">最高环境风险值</div>
            </div>
          )}
        </div>
      )}

      {/* 数据提示（仅airline tab显示） */}
      {sidebarTab === 'airline' && (
        <div className="sidebar-data-hint">
          数据仅显示未来18小时内航班
        </div>
      )}

      {/* 当前选中机场信息（仅airline tab且从airport进入时显示） */}
      {sidebarTab === 'airline' && selectedAirport && (
        <div className="sidebar-selected-airport">
          <div className="selected-airport-header">
            <div className="selected-airport-title">当前选中:</div>
            <button className="deselect-airport-btn" onClick={handleDeselectAirport}>
              取消选中
            </button>
          </div>
          <div className="selected-airport-info">
            <div className="selected-airport-name">
              {selectedAirport.nameZh} {selectedAirport.code}
            </div>
            <div className="selected-airport-stats">
              <span>执飞单位 {selectedAirport.operatorCount}</span>
              <span>航班 {selectedAirport.flightCount}</span>
            </div>
            <button className="selected-airport-view-btn">
              <span>View</span>
            </button>
          </div>
        </div>
      )}

      {/* 状态筛选（仅airline tab显示，且未选中航线时显示，可折叠） */}
      {sidebarTab === 'airline' && !selectedFlightRouteId && (
        <div className="sidebar-filter-section">
          <div 
            className="filter-section-header"
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
          >
            <span className="filter-section-title">状态</span>
            <span className={`filter-section-toggle ${isFilterCollapsed ? 'collapsed' : ''}`}>▼</span>
          </div>
          {!isFilterCollapsed && (
            <div className="filter-section-content">
              <div className="flight-statuses-checkboxes">
                <label className="flight-status-checkbox">
                  <input
                    type="checkbox"
                    checked={flightStatuses.includes('未起飞')}
                    onChange={() => handleFlightStatusToggle('未起飞')}
                  />
                  <span className="flight-status-label">未起飞</span>
                </label>
                <label className="flight-status-checkbox">
                  <input
                    type="checkbox"
                    checked={flightStatuses.includes('巡航中')}
                    onChange={() => handleFlightStatusToggle('巡航中')}
                  />
                  <span className="flight-status-label">巡航中</span>
                </label>
                <label className="flight-status-checkbox">
                  <input
                    type="checkbox"
                    checked={flightStatuses.includes('已落地')}
                    onChange={() => handleFlightStatusToggle('已落地')}
                  />
                  <span className="flight-status-label">已落地</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 列表内容 */}
      <div className="sidebar-content">
        {sidebarTab === 'airport' && (
          <div className="sidebar-list">
            {filteredAirports.map((airport) => {
              const riskBgColor = getRiskBackgroundColor(airport.riskZone)
              const riskHoverBgColor = getRiskHoverBackgroundColor(airport.riskZone)
              const riskBorderColor = getRiskValueColor(airport.riskZone) + '40' // 25%透明度的边框
              
              return (
              <div 
                key={airport.id} 
                className="sidebar-item"
                style={{ 
                  background: riskBgColor,
                  borderColor: riskBorderColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = riskHoverBgColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = riskBgColor
                }}
              >
                <div className="item-left">
                  <div className="item-title">
                    {airport.nameZh} {airport.code}
                  </div>
                  <div className="item-info">
                    <span className="item-info-item">执飞单位: {airport.operatorCount}</span>
                    <span className="item-info-item">航班数: {airport.flightCount}</span>
                  </div>
                </div>
                <div className="item-right">
                  <div
                    className="item-risk-value"
                    style={{ color: getRiskValueColor(airport.riskZone) }}
                  >
                    {airport.riskValue}
                  </div>
                  <button
                    className="item-view-button"
                    onClick={() => handleViewClick(airport)}
                  >
                    <span className="view-icon">▶</span>
                    <span>View</span>
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        )}
        {sidebarTab === 'airline' && (
          <>
            {selectedFlight ? (
              // 显示详情面板
              <div className="flight-detail-content">
                {/* 当前选中标题 */}
                <div className="detail-selected-header">
                  <div className="detail-selected-title">当前选中:</div>
                  <button className="detail-deselect-btn" onClick={handleDeselectFlight}>
                    取消选中
                  </button>
                </div>
                {/* 当前选中航线卡片 - 使用与列表一致的样式 */}
                {(() => {
                  // 取人、机、环三个风险值中最高的风险值
                  const maxRisk = Math.max(selectedFlight.humanRisk, selectedFlight.machineRisk, selectedFlight.environmentRisk)
                  const riskBgColor = getFlightRiskBackgroundColor(maxRisk)
                  const riskHoverBgColor = getFlightRiskHoverBackgroundColor(maxRisk)
                  const riskBorderColor = getRiskValueColorFromNumber(maxRisk) + '40' // 25%透明度的边框
                  
                  return (
                    <div 
                      className="sidebar-flight-item"
                      style={{ 
                        background: riskBgColor,
                        borderColor: riskBorderColor,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = riskHoverBgColor
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = riskBgColor
                      }}
                    >
                      <div className="flight-item-header">
                        <div className="flight-number">{selectedFlight.flightNumber}</div>
                        <button className="flight-view-button">
                          <span>View</span>
                        </button>
                      </div>
                      <div className="flight-item-body">
                        <div className="flight-departure">
                          <div className="flight-time-info">
                            <span className="flight-time-label">预飞 {selectedFlight.scheduledDeparture}</span>
                            <span className="flight-time-value">计飞 {selectedFlight.estimatedDeparture} {selectedFlight.fromAirportZh}</span>
                          </div>
                        </div>
                        <div className="flight-status-section">
                          <div className="flight-status-badge" style={{ backgroundColor: getStatusColor(selectedFlight.status) }}>
                            {selectedFlight.status}
                          </div>
                          {(selectedFlight.status === '巡航中' || selectedFlight.status === '未起飞') && (
                            <div className="flight-route">
                              <span className="flight-route-from">{selectedFlight.fromAirportZh}</span>
                              <span className="flight-route-arrow">→</span>
                              <span className="flight-route-to">{selectedFlight.toAirportZh}</span>
                            </div>
                          )}
                        </div>
                        <div className="flight-arrival">
                          <div className="flight-time-info">
                            <span className="flight-time-label">{selectedFlight.scheduledArrival} 预到</span>
                            <span className="flight-time-value">{selectedFlight.estimatedArrival} 计到 {selectedFlight.toAirportZh}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flight-item-footer">
                        <span className="flight-risk-value">
                          人 <span style={{ color: getRiskValueColorFromNumber(selectedFlight.humanRisk) }}>{selectedFlight.humanRisk.toFixed(1)}</span>
                        </span>
                        <span className="flight-risk-value">
                          机 <span style={{ color: getRiskValueColorFromNumber(selectedFlight.machineRisk) }}>{selectedFlight.machineRisk.toFixed(1)}</span>
                        </span>
                        <span className="flight-risk-value">
                          环 <span style={{ color: getRiskValueColorFromNumber(selectedFlight.environmentRisk) }}>{selectedFlight.environmentRisk.toFixed(1)}</span>
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* 基本信息 */}
                <div className="detail-basic-info">
                  <div className="detail-section-title">基本信息</div>
                  
                  {/* 机号、大机型、机型 */}
                  <div className="detail-info-row">
                    {selectedFlight.aircraftNumber && (
                      <div className="detail-info-item">
                        <span className="detail-info-label">机号</span>
                        <span className="detail-info-value">{selectedFlight.aircraftNumber}</span>
                      </div>
                    )}
                    {selectedFlight.largeAircraftType && (
                      <div className="detail-info-item">
                        <span className="detail-info-label">大机型</span>
                        <span className="detail-info-value">{selectedFlight.largeAircraftType}</span>
                      </div>
                    )}
                    {selectedFlight.aircraftType && (
                      <div className="detail-info-item">
                        <span className="detail-info-label">机型</span>
                        <span className="detail-info-value">{selectedFlight.aircraftType}</span>
                      </div>
                    )}
                  </div>

                  {/* PF工号、PF技术、执飞单位 */}
                  <div className="detail-info-row">
                    {(() => {
                      // 从crewMembers中获取PF人员信息（通常是第一个成员，role为'Tb'）
                      const pfMember = selectedFlight.crewMembers?.find(m => m.role === 'Tb') || selectedFlight.crewMembers?.[0]
                      const pfPerson = pfMember ? getPersonById(pfMember.personId) : null
                      
                      // 优先使用person数据中的信息，如果没有则使用航班数据中的
                      const pfId = pfPerson?.pfId || selectedFlight.pfId
                      const pfTechnology = pfPerson?.pfTechnology || selectedFlight.pfTechnology
                      
                      return (
                        <>
                          {pfId && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">PF工号</span>
                              <span className="detail-info-value">{pfId}</span>
                            </div>
                          )}
                          {pfTechnology && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">PF技术</span>
                              <span className="detail-info-value">{pfTechnology}</span>
                            </div>
                          )}
                          {selectedFlight.operatingUnit && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">执飞单位</span>
                              <span className="detail-info-value">{selectedFlight.operatingUnit}</span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* 机组成员 - 列展示 */}
                  {selectedFlight.crewMembers && selectedFlight.crewMembers.length > 0 && (
                    <div className="detail-info-row detail-crew-row">
                      <span className="detail-info-label detail-crew-title">机组成员</span>
                      <div className="detail-crew-list">
                        {selectedFlight.crewMembers.map((member, idx) => {
                          // 从person数据中获取完整的人员信息
                          const person = getPersonById(member.personId)
                          if (!person) return null
                          
                          return (
                            <div 
                              key={idx} 
                              className={`detail-crew-member ${idx === 1 ? 'detail-crew-highlight' : ''} detail-crew-clickable`}
                              onClick={() => {
                                // 跳转到person tab
                                setSidebarTab('person')
                                setIsFromTab(false) // 从人员点击进入，不是从tab进入
                                
                                // 找到该人员所属的机队并展开
                                if (person.teamId) {
                                  const team = getTeamById(person.teamId)
                                  if (team) {
                                    // 展开该人员所属的机队
                                    setExpandedTeamIds([team.id])
                                    // 不选中人员，显示机队信息
                                    setSelectedPersonId(null)
                                  } else {
                                    // 如果找不到机队，则选中该人员
                                    setSelectedPersonId(person.id)
                                    setExpandedTeamIds([])
                                  }
                                } else {
                                  // 如果人员没有teamId，则选中该人员
                                  setSelectedPersonId(person.id)
                                  setExpandedTeamIds([])
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <span className="detail-crew-name">{person.name}</span>
                              <span className="detail-crew-role">{member.role}</span>
                              <span className="detail-crew-id">{person.pfId}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 放行签派员 */}
                  {selectedFlight.dispatcher && (
                    <div className="detail-info-row">
                      <div className="detail-info-item">
                        <span className="detail-info-label">放行签派员</span>
                        <span className="detail-info-value">{selectedFlight.dispatcher}</span>
                      </div>
                    </div>
                  )}

                  {/* 备降机场 */}
                  {selectedFlight.alternateAirport && (
                    <div className="detail-info-row">
                      <div className="detail-info-item">
                        <span className="detail-info-label">备降机场</span>
                        <span className="detail-info-value">{selectedFlight.alternateAirport}</span>
                      </div>
                    </div>
                  )}

                  {/* 风险值 */}
                  <div className="detail-info-section">
                    <div className="detail-subsection-title">风险值</div>
                    <div className="detail-risk-values-inline">
                      <div className="detail-risk-value-item">
                        <span className="detail-risk-label">人</span>
                        <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.humanRisk) }}>
                          {selectedFlight.humanRisk.toFixed(2)}
                        </span>
                      </div>
                      <div className="detail-risk-value-item">
                        <span className="detail-risk-label">机</span>
                        <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.machineRisk) }}>
                          {selectedFlight.machineRisk.toFixed(2)}
                        </span>
                      </div>
                      <div className="detail-risk-value-item">
                        <span className="detail-risk-label">环</span>
                        <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.environmentRisk) }}>
                          {selectedFlight.environmentRisk.toFixed(2)}
                        </span>
                      </div>
                      {selectedFlight.riskValues && (
                        <>
                          <div className="detail-risk-value-item">
                            <span className="detail-risk-label">滑出</span>
                            <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.riskValues.taxiOut) }}>
                              {selectedFlight.riskValues.taxiOut.toFixed(2)}
                            </span>
                          </div>
                          <div className="detail-risk-value-item">
                            <span className="detail-risk-label">起飞</span>
                            <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.riskValues.takeoff) }}>
                              {selectedFlight.riskValues.takeoff.toFixed(2)}
                            </span>
                          </div>
                          <div className="detail-risk-value-item">
                            <span className="detail-risk-label">巡航</span>
                            <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.riskValues.cruise) }}>
                              {selectedFlight.riskValues.cruise.toFixed(2)}
                            </span>
                          </div>
                          <div className="detail-risk-value-item">
                            <span className="detail-risk-label">着陆</span>
                            <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.riskValues.landing) }}>
                              {selectedFlight.riskValues.landing.toFixed(2)}
                            </span>
                          </div>
                          <div className="detail-risk-value-item">
                            <span className="detail-risk-label">滑入</span>
                            <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.riskValues.taxiIn) }}>
                              {selectedFlight.riskValues.taxiIn.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 预测风险 - 根据左侧sidebar的风险类型筛选显示 */}
                  {selectedFlight.predictedRisks && selectedFlight.predictedRisks.length > 0 && (
                    <div className="detail-info-section">
                      <div className="detail-subsection-title">预测风险</div>
                      <div className="detail-predicted-risks-inline">
                        {selectedFlight.predictedRisks
                          .filter((risk) => {
                            // 如果riskTypes为空，显示所有；否则只显示在riskTypes中的
                            if (riskTypes.length === 0) return true
                            return riskTypes.includes(risk.type)
                          })
                          .map((risk, idx) => (
                            <div 
                              key={idx} 
                              className="detail-predicted-item-inline"
                              style={{ 
                                color: risk.severity === 'red' ? '#ef4444' : risk.severity === 'orange' ? '#f97316' : '#eab308'
                              }}
                            >
                              {risk.type}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 显示航班列表
              <div className="sidebar-list">
                {filteredFlights.length === 0 ? (
                  <div className="sidebar-empty">暂无航班数据</div>
                ) : (
                  filteredFlights.map((flight) => {
                    // 取人、机、环三个风险值中最高的风险值
                    const maxRisk = Math.max(flight.humanRisk, flight.machineRisk, flight.environmentRisk)
                    const riskBgColor = getFlightRiskBackgroundColor(maxRisk)
                    const riskHoverBgColor = getFlightRiskHoverBackgroundColor(maxRisk)
                    const riskBorderColor = getRiskValueColorFromNumber(maxRisk) + '40' // 25%透明度的边框
                    
                    return (
                      <div 
                        key={flight.id} 
                        className="sidebar-flight-item"
                        style={{ 
                          background: riskBgColor,
                          borderColor: riskBorderColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = riskHoverBgColor
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = riskBgColor
                        }}
                      >
                        <div className="flight-item-header">
                          <div className="flight-number">{flight.flightNumber}</div>
                          <button 
                            className="flight-view-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFlightViewClick(flight)
                            }}
                          >
                            <span>View</span>
                          </button>
                        </div>
                        <div className="flight-item-body">
                          <div className="flight-departure">
                            <div className="flight-time-info">
                              <span className="flight-time-label">预飞 {flight.scheduledDeparture}</span>
                              <span className="flight-time-value">计飞 {flight.estimatedDeparture}</span>
                            </div>
                          </div>
                          <div className="flight-status-section">
                            <div className="flight-status-badge" style={{ backgroundColor: getStatusColor(flight.status) }}>
                              {flight.status}
                            </div>
                            {(flight.status === '巡航中' || flight.status === '未起飞') && (
                              <div className="flight-route">
                                <span className="flight-route-from">{flight.fromAirportZh}</span>
                                <span className="flight-route-arrow">→</span>
                                <span className="flight-route-to">{flight.toAirportZh}</span>
                              </div>
                            )}
                          </div>
                          <div className="flight-arrival">
                            <div className="flight-time-info">
                              <span className="flight-time-label">{flight.scheduledArrival} 预到</span>
                              <span className="flight-time-value">{flight.estimatedArrival} 计到</span>
                            </div>
                          </div>
                        </div>
                        <div className="flight-item-footer">
                          <span className="flight-risk-value">
                            人 <span style={{ color: getRiskValueColorFromNumber(flight.humanRisk) }}>{flight.humanRisk.toFixed(1)}</span>
                          </span>
                          <span className="flight-risk-value">
                            机 <span style={{ color: getRiskValueColorFromNumber(flight.machineRisk) }}>{flight.machineRisk.toFixed(1)}</span>
                          </span>
                          <span className="flight-risk-value">
                            环 <span style={{ color: getRiskValueColorFromNumber(flight.environmentRisk) }}>{flight.environmentRisk.toFixed(1)}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
        {sidebarTab === 'person' && (
          <div className="sidebar-list">
            {selectedPersonId ? (
              // 显示选中的人员详情
              <div className="person-detail-content">
                <div className="detail-selected-header">
                  <div className="detail-selected-title">当前选中:</div>
                  <button 
                    className="detail-deselect-btn" 
                    onClick={() => {
                      setSelectedPersonId(null)
                      // 取消选中后，如果是从tab进入的，展开所有机队；否则折叠所有机队
                      if (isFromTab) {
                        setExpandedTeamIds(TEAMS.map(t => t.id))
                      } else {
                        setExpandedTeamIds([])
                      }
                    }}
                  >
                    取消选中
                  </button>
                </div>
                {(() => {
                  const person = PERSONS.find(p => p.id === selectedPersonId)
                  if (!person) return <div className="sidebar-empty">人员不存在</div>
                  
                  return (
                    <>
                      <div className="person-detail-card">
                        <div className="person-detail-icon">👤</div>
                        <div className="person-detail-name">{person.name}</div>
                        <div className="person-detail-info">
                          <div className="person-detail-item">
                            <span className="person-detail-label">PF工号</span>
                            <span className="person-detail-value">{person.pfId}</span>
                          </div>
                          <div className="person-detail-item">
                            <span className="person-detail-label">PF技术等级</span>
                            <span className="person-detail-value">{person.pfTechnology}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 基本信息 */}
                      <div className="detail-basic-info">
                        <div className="detail-section-title">基本信息</div>
                        
                        <div className="detail-info-row">
                          {person.age !== undefined && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">年龄</span>
                              <span className="detail-info-value">{person.age}岁</span>
                            </div>
                          )}
                          {person.flightYears !== undefined && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">飞行年限</span>
                              <span className="detail-info-value">{person.flightYears}年</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="detail-info-row">
                          {person.totalFlightHours !== undefined && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">总飞行时长</span>
                              <span className="detail-info-value">{person.totalFlightHours.toLocaleString()}小时</span>
                            </div>
                          )}
                          {person.recent90DaysFlightHours !== undefined && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">近90天飞行时长</span>
                              <span className="detail-info-value">{person.recent90DaysFlightHours}小时</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="detail-info-row">
                          {person.certifiedAircraftTypes && person.certifiedAircraftTypes.length > 0 && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">已认证机型</span>
                              <span className="detail-info-value">{person.certifiedAircraftTypes.join('/')}</span>
                            </div>
                          )}
                          {person.currentAircraftType && (
                            <div className="detail-info-item">
                              <span className="detail-info-label">当前执飞机型</span>
                              <span className="detail-info-value">{person.currentAircraftType}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 风险值评估 */}
                        {person.riskValue !== undefined && (
                          <div className="detail-info-section">
                            <div className="detail-subsection-title">风险值评估</div>
                            <div className="detail-risk-values-inline">
                              <div className="detail-risk-value-item">
                                <span className="detail-risk-label">风险值</span>
                                <span 
                                  className="detail-risk-number" 
                                  style={{ color: getRiskValueColorFromNumber(person.riskValue) }}
                                >
                                  {person.riskValue.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              // 显示所有机队列表
              <>
                <div className="sidebar-data-hint">
                  数据仅包含近10小时内有飞航班
                </div>
                {filteredTeams.length === 0 ? (
                  <div className="sidebar-empty">未找到匹配的机队或人员</div>
                ) : (
                  filteredTeams.map(team => {
                  const isExpanded = expandedTeamIds.includes(team.id)
                  return (
                    <div key={team.id} className="team-card">
                      <div 
                        className="team-card-header"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedTeamIds(expandedTeamIds.filter(id => id !== team.id))
                          } else {
                            setExpandedTeamIds([...expandedTeamIds, team.id])
                          }
                        }}
                      >
                        <div className="team-card-icon">👥</div>
                        <div className="team-card-name">{team.name}</div>
                        <div className="team-card-toggle">{isExpanded ? '▼' : '▶'}</div>
                      </div>
                      {/* 折叠时显示分队长和成员 */}
                      {!isExpanded && (
                        <div className="team-card-collapsed">
                          <div className="team-leader">
                            <span className="team-leader-label">分队长</span>
                            <span 
                              className="team-leader-name"
                              style={{ 
                                color: team.leader.riskValue !== undefined 
                                  ? getRiskColor(team.leader.riskValue) 
                                  : '#cbd5e1' 
                              }}
                            >
                              {team.leader.name}
                            </span>
                          </div>
                          <div className="team-members">
                            <span className="team-members-label">成员</span>
                            <div className="team-members-list">
                              {team.members.map((member, idx) => (
                                <span 
                                  key={idx} 
                                  className="team-member-name"
                                  style={{ 
                                    color: member.riskValue !== undefined 
                                      ? getRiskColor(member.riskValue) 
                                      : '#cbd5e1' 
                                  }}
                                >
                                  {member.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 展开时详细展示每一位的PF技术等级和PF工号 */}
                      {isExpanded && (
                        <div className="team-card-content">
                          <div className="team-members-detail">
                            <span className="team-members-label">分队长</span>
                            <div className="team-members-detail-list">
                              {(() => {
                                const leaderPerson = getPersonById(team.leader.id) || team.leader
                                return (
                                  <div 
                                    className="team-member-detail-card"
                                    onClick={() => {
                                      setSelectedPersonId(team.leader.id)
                                      setIsFromTab(false)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <div className="team-member-detail-name">
                                      {leaderPerson.name}
                                      {leaderPerson.riskValue !== undefined && (
                                        <span
                                          className="team-member-risk"
                                          style={{ color: getRiskColor(leaderPerson.riskValue) }}
                                        >
                                          {' '}({leaderPerson.riskValue.toFixed(1)})
                                        </span>
                                      )}
                                    </div>
                                    <div className="team-member-detail-info">
                                      <div className="team-member-detail-item">
                                        <span className="team-member-detail-label">PF技术等级</span>
                                        <span className="team-member-detail-value">{leaderPerson.pfTechnology}</span>
                                      </div>
                                      <div className="team-member-detail-item">
                                        <span className="team-member-detail-label">PF工号</span>
                                        <span className="team-member-detail-value">{leaderPerson.pfId}</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="team-members-detail">
                            <span className="team-members-label">成员</span>
                            <div className="team-members-detail-list">
                              {team.members.map((member, idx) => (
                                <div 
                                  key={idx} 
                                  className="team-member-detail-card"
                                  onClick={() => {
                                    setSelectedPersonId(member.id)
                                    setIsFromTab(false)
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="team-member-detail-name">
                                    {member.name}
                                    {member.riskValue !== undefined && (
                                      <span
                                        className="team-member-risk"
                                        style={{ color: getRiskColor(member.riskValue) }}
                                      >
                                        {' '}({member.riskValue.toFixed(1)})
                                      </span>
                                    )}
                                  </div>
                                  <div className="team-member-detail-info">
                                    <div className="team-member-detail-item">
                                      <span className="team-member-detail-label">PF技术等级</span>
                                      <span className="team-member-detail-value">{member.pfTechnology}</span>
                                    </div>
                                    <div className="team-member-detail-item">
                                      <span className="team-member-detail-label">PF工号</span>
                                      <span className="team-member-detail-value">{member.pfId}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                  })
                )}
              </>
            )}
          </div>
        )}
      </div>
      </div>
      {/* 结束sidebar-content-wrapper */}

    </div>
  )
}

