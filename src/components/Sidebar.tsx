import {  useMemo, useState } from 'react'
import { useAppStore, type RiskZone } from '../store/useAppStore'
import { AIRPORTS, FLIGHTS, calculateRiskFromEnvironmentRisk, type Airport, type Flight } from '../data/flightData'
import { PERSONS, TEAMS, getPersonById, getTeamById } from '../data/personData'
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

    // 按时间排序（预飞时间）
    return [...filtered].sort((a, b) => {
      const timeA = a.scheduledDeparture.replace(':', '')
      const timeB = b.scheduledDeparture.replace(':', '')
      return parseInt(timeA) - parseInt(timeB)
    })
  }, [searchQuery, flightStatuses, selectedAirportForAirline])

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

  return (
    <div className="sidebar">
      {/* 登录状态 */}
      <div className="sidebar-header">
        <div className="login-status">
          登录状态: <span className="login-user">admin</span> <span className="login-role">(高级管理)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${sidebarTab === 'airport' ? 'active' : ''}`}
          onClick={() => setSidebarTab('airport')}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Airport</span>
        </button>
        <button
          className={`sidebar-tab ${sidebarTab === 'airline' ? 'active' : ''}`}
          onClick={() => setSidebarTab('airline')}
        >
          <span className="tab-icon">✈️</span>
          <span className="tab-label">Airline</span>
        </button>
        <button
          className={`sidebar-tab ${sidebarTab === 'person' ? 'active' : ''}`}
          onClick={() => {
            setSidebarTab('person')
            setIsFromTab(true) // 从tab进入，默认展开所有机队
            setSelectedPersonId(null) // 清除选中的人员
            setExpandedTeamIds(TEAMS.map(t => t.id)) // 展开所有机队
          }}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-label">Person</span>
        </button>
      </div>

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

      {/* 风险区间（仅airport tab显示） */}
      {sidebarTab === 'airport' && (
        <div className="sidebar-risk-zones">
          <div className="risk-zones-label">风险区间</div>
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

      {/* 状态筛选（仅airline tab显示，且未选中航线时显示） */}
      {sidebarTab === 'airline' && !selectedFlightRouteId && (
        <div className="sidebar-flight-statuses">
          <div className="flight-statuses-label">状态</div>
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

      {/* 列表内容 */}
      <div className="sidebar-content">
        {sidebarTab === 'airport' && (
          <div className="sidebar-list">
            {filteredAirports.map((airport) => (
              <div key={airport.id} className="sidebar-item">
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
            ))}
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
                <div className="sidebar-flight-item">
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
                  filteredFlights.map((flight) => (
                    <div key={flight.id} className="sidebar-flight-item">
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
                  ))
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
                    <div className="person-detail-card">
                      <div className="person-detail-icon">👤</div>
                      <div className="person-detail-name">{person.name}</div>
                      <div className="person-detail-info">
                        <div className="person-detail-item">
                          <span className="person-detail-label">PF技术等级</span>
                          <span className="person-detail-value">{person.pfTechnology}</span>
                        </div>
                        <div className="person-detail-item">
                          <span className="person-detail-label">PF工号</span>
                          <span className="person-detail-value">{person.pfId}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              // 显示所有机队列表
              <>
                <div className="sidebar-data-hint">
                  数据仅包含近10小时内有飞航班
                </div>
                {TEAMS.map(team => {
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
                            <span className="team-leader-name">{team.leader.name}</span>
                          </div>
                          <div className="team-members">
                            <span className="team-members-label">成员</span>
                            <div className="team-members-list">
                              {team.members.map((member, idx) => (
                                <span key={idx} className="team-member-name">{member.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 展开时详细展示每一位的PF技术等级和PF工号 */}
                      {isExpanded && (
                        <div className="team-card-content">
                          <div className="team-leader-detail">
                            <div className="team-leader-header">
                              <span className="team-leader-label">分队长</span>
                              <span className="team-leader-name">{team.leader.name}</span>
                            </div>
                            <div className="team-leader-info">
                              <div className="team-member-detail-item">
                                <span className="team-member-detail-label">PF技术等级</span>
                                <span className="team-member-detail-value">{team.leader.pfTechnology}</span>
                              </div>
                              <div className="team-member-detail-item">
                                <span className="team-member-detail-label">PF工号</span>
                                <span className="team-member-detail-value">{team.leader.pfId}</span>
                              </div>
                            </div>
                          </div>
                          <div className="team-members-detail">
                            <span className="team-members-label">成员</span>
                            <div className="team-members-detail-list">
                              {team.members.map((member, idx) => (
                                <div key={idx} className="team-member-detail-card">
                                  <div className="team-member-detail-name">{member.name}</div>
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
                })}
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

