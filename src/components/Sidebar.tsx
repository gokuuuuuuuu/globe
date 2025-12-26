import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useAppStore, type RiskZone } from '../store/useAppStore'
import { AIRPORTS, FLIGHTS, calculateRiskFromEnvironmentRisk, type Airport, type Flight, getRiskColor } from '../data/flightData'
import { PERSONS, TEAMS, getPersonById, getTeamById } from '../data/personData'
import collapseIcon from '../assets/collapse.png'
import airlineIcon from '../assets/airline.png'
import airportIcon from '../assets/airport.png'
import personIcon from '../assets/person.png'
import rightBoxIcon from '../assets/rightBox.png'
import rightBoxActiveIcon from '../assets/rightBox_active.png'
import iconInputArrow from '../assets/input_arrow.png'
import iconInputHighlights from '../assets/input_ highlights.png'
import viewIcon from '../assets/view.png'
import airLogoIcon from '../assets/airLogo.png'
import planeIcon from '../assets/plane.png'
import closeIcon from '../assets/close.png'
import typeIcon from '../assets/type.png'
import radarIcon from '../assets/radar_icon.png'
import personCardBg from '../assets/personBg.png'
import teamCardIcon from '../assets/team.png'
import personRowIcon from '../assets/person_icon.png'
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

// 风险值转换为数字用于排序（已注释，未使用）
// function parseRiskValue(riskValue: string): number {
//   // 解析 "X.Y" 格式的风险值字符串为数字
//   const num = parseFloat(riskValue)
//   return isNaN(num) ? 0 : num
// }

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
    highlightedAirportId,
    setHighlightedAirportId,
    highlightedFlightRouteId,
    setHighlightedFlightRouteId,
  } = useAppStore()
  
  // 本地状态：从tab进入时，默认展开所有机队
  const [isFromTab, setIsFromTab] = useState(false)
  // 整个sidebar内容收起状态
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)

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

    // 按风险值从大到小排序（使用 environmentRisk 数字值）
    filtered.sort((a, b) => b.environmentRisk - a.environmentRisk)
    
    return filtered
  }, [searchQuery, riskZones])

  // 处理View按钮点击（只触发镜头跟随，不进入下一级）
  const handleViewButtonClick = (airport: AirportData, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // 阻止事件冒泡到卡片
    }
    setTargetAirportId(airport.id) // 只触发镜头跟随
    setHighlightedAirportId(airport.id) // 设置高亮状态
  }

  // 处理卡片点击（进入下一级）
  const handleViewClick = (airport: AirportData) => {
    setSelectedAirportForAirline(airport.id)
    setViewingAirportId(airport.id) // 设置正在查看的机场，用于在globe上显示该机场的所有航线
    setHighlightedAirportId(null) // 清除高亮状态
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

  // 处理航线 View 按钮点击（只触发镜头跟随，不进入下一级）
  const handleFlightViewButtonClick = (flight: Flight, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // 阻止事件冒泡到卡片
    }
    
    // 根据起降机场生成航线ID（格式：起飞机场-降落机场-航班ID，与GlobeView保持一致）
    // 需要从机场代码映射到机场ID
    const fromAirport = AIRPORTS.find(a => a.code === flight.fromAirport)
    const toAirport = AIRPORTS.find(a => a.code === flight.toAirport)
    
    // 如果两个机场都在 AIRPORTS 中，则触发 zoom in
    if (fromAirport && toAirport) {
      // 使用与GlobeView相同的ID格式：${fromAirport.id}-${toAirport.id}-${flight.id}
      const routeId = `${fromAirport.id}-${toAirport.id}-${flight.id}`
      setTargetFlightRouteId(routeId) // 只触发镜头跟随
      setHighlightedFlightRouteId(flight.id) // 设置高亮状态
    }
  }

  // 处理航线卡片点击（进入下一级）
  const handleFlightViewClick = (flight: Flight) => {
    // 先设置选中的航班ID，用于显示详情面板
    setSelectedFlightRouteId(flight.id)
    // 清除viewingAirportId，确保只显示当前选中的航线
    setViewingAirportId(null)
    setHighlightedFlightRouteId(null) // 清除高亮状态
    
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
    setHighlightedFlightRouteId(null) // 清除高亮状态
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

      // 状态过滤：如果没有任何状态被选中，则不显示任何航班
      const matchesStatus = flightStatuses.length > 0 && flightStatuses.includes(flight.status)

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

  // 获取状态字体颜色
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case '未起飞': return '#AFD7FF'
      case '巡航中': return '#B5C9FF'
      case '已落地': return '#FFFFFF'
      default: return '#FFFFFF'
    }
  }

  // 根据风险值数字获取颜色
  const getRiskValueColorFromNumber = (riskValue: number) => {
    if (riskValue >= 7) return '#ef4444' // 高风险 - 红色
    if (riskValue >= 5) return '#f97316' // 中风险 - 橙色
    if (riskValue >= 1) return '#eab308' // 低风险 - 黄色
    return '#22c55e' // 极低风险 - 绿色
  }

  // 根据风险值数字获取风险等级文字
  const getRiskLevelText = (riskValue: number | string): string => {
    const num = typeof riskValue === 'string' ? parseFloat(riskValue) : riskValue
    if (isNaN(num)) return '低风险'
    if (num >= 7) return '高风险'
    if (num >= 5) return '中风险'
    if (num >= 1) return '低风险'
    return '低风险'
  }

  // 根据风险区间获取风险等级文字
  const getRiskLevelTextFromZone = (riskZone: RiskZone): string => {
    switch (riskZone) {
      case 'red': return '高风险'
      case 'orange': return '中风险'
      case 'yellow': return '低风险'
      case 'green': return '低风险'
      default: return '低风险'
    }
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
    if (riskValue >= 5) return 'rgba(255, 111, 0, 0.12)' // 中风险 - 橙色
    if (riskValue >= 1) return 'rgba(255, 193, 7, 0.12)' // 低风险 - 黄色
    return 'rgba(76, 175, 80, 0.12)' // 极低风险 - 绿色
  }

  // 根据风险值数字获取hover背景颜色（用于航班卡片）
  const getFlightRiskHoverBackgroundColor = (riskValue: number) => {
    if (riskValue >= 7) return 'rgba(255, 23, 68, 0.2)' // 高风险 - 红色
    if (riskValue >= 5) return 'rgba(255, 111, 0, 0.2)' // 中风险 - 橙色
    if (riskValue >= 1) return 'rgba(255, 193, 7, 0.2)' // 低风险 - 黄色
    return 'rgba(76, 175, 80, 0.2)' // 极低风险 - 绿色
  }

  // 根据风险值数字获取风险区间（用于航班卡片高亮）
  const getFlightRiskZone = (riskValue: number): RiskZone => {
    if (riskValue >= 7) return 'red'
    if (riskValue >= 5) return 'orange'
    if (riskValue >= 1) return 'yellow'
    return 'green'
  }

  return (
    <div className="sidebar">
      {/* 登录状态 */}
      <div className="sidebar-header">
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
          onClick={() => {
            setSidebarTab('airport')
            setHighlightedAirportId(null) // 切换tab时清除高亮
            setHighlightedFlightRouteId(null) // 切换tab时清除航班高亮
          }}
        >
          <img src={rightBoxIcon} alt="box" className="tab-box-bg" />
          <img src={rightBoxActiveIcon} alt="box active" className="tab-box-bg-active" />
          <img src={airportIcon} alt="airport" className="tab-icon" />
          <span className="tab-label">Airport</span>
        </button>
        <button
          className={`sidebar-tab ${sidebarTab === 'airline' ? 'active' : ''}`}
          onClick={() => {
            setSidebarTab('airline')
            setHighlightedAirportId(null) // 切换tab时清除高亮
            setHighlightedFlightRouteId(null) // 切换tab时清除航班高亮
          }}
        >
          <img src={rightBoxIcon} alt="box" className="tab-box-bg" />
          <img src={rightBoxActiveIcon} alt="box active" className="tab-box-bg-active" />
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
            setHighlightedAirportId(null) // 切换tab时清除高亮
            setHighlightedFlightRouteId(null) // 切换tab时清除航班高亮
          }}
        >
          <img src={rightBoxIcon} alt="box" className="tab-box-bg" />
          <img src={rightBoxActiveIcon} alt="box active" className="tab-box-bg-active" />
          <img src={personIcon} alt="person" className="tab-icon" />
          <span className="tab-label">Person</span>
        </button>
      </div>

      {/* 搜索框 */}
      <div className="sidebar-search">
        <div className="filter-input-wrapper">
          <img src={iconInputHighlights} alt="highlights" className="filter-input-highlights" />
          <input
            type="text"
            className="filter-input"
            placeholder={`type to search ${sidebarTab}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <img src={iconInputArrow} alt="arrow" className="filter-input-arrow" />
        </div>
      </div>

      {/* 风险区间（仅airport tab显示） */}
      {sidebarTab === 'airport' && (
        <div className="sidebar-risk-zones-horizontal">
          <span className="risk-zones-label">风险区间:</span>
          <div className="risk-zones-checkboxes-horizontal">
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={riskZones.includes('red')}
                onChange={() => handleRiskZoneToggle('red')}
                className="risk-zone-checkbox-input red"
              />
              <span className="risk-zone-label-horizontal">红色</span>
            </label>
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={riskZones.includes('orange')}
                onChange={() => handleRiskZoneToggle('orange')}
                className="risk-zone-checkbox-input orange"
              />
              <span className="risk-zone-label-horizontal">橙色</span>
            </label>
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={riskZones.includes('yellow')}
                onChange={() => handleRiskZoneToggle('yellow')}
                className="risk-zone-checkbox-input yellow"
              />
              <span className="risk-zone-label-horizontal">黄色</span>
            </label>
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={riskZones.includes('green')}
                onChange={() => handleRiskZoneToggle('green')}
                className="risk-zone-checkbox-input green"
              />
              <span className="risk-zone-label-horizontal">绿色</span>
            </label>
          </div>
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
              <img src={closeIcon} alt="close" className="close-icon" />
            </button>
          </div>
          <div className="selected-airport-info">
            <div className="selected-airport-left">
            <div className="selected-airport-name">
              {selectedAirport.nameZh} {selectedAirport.code}
            </div>
            <div className="selected-airport-stats">
              <span>执飞单位 {selectedAirport.operatorCount}</span>
              <span>航班 {selectedAirport.flightCount}</span>
            </div>
            </div>
            <div className="selected-airport-right">
              <div 
                className="selected-airport-risk-value"
                style={{ color: getRiskValueColor(selectedAirport.riskZone) }}
              >
                {getRiskLevelTextFromZone(selectedAirport.riskZone)}
              </div>
            <button 
              className="selected-airport-view-btn"
              onClick={() => {
                if (selectedAirport) {
                  setTargetAirportId(selectedAirport.id)
                }
              }}
            >
                <img src={viewIcon} alt="view" className="view-icon" />
            </button>
            </div>
          </div>
        </div>
      )}

      {/* 状态筛选（仅airline tab显示，且未选中航线时显示） */}
      {sidebarTab === 'airline' && !selectedFlightRouteId && (
        <div className="sidebar-risk-zones-horizontal">
          <span className="risk-zones-label">状态:</span>
          <div className="risk-zones-checkboxes-horizontal">
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={flightStatuses.includes('未起飞')}
                onChange={() => handleFlightStatusToggle('未起飞')}
                className="risk-zone-checkbox-input"
              />
              <span className="risk-zone-label-horizontal">未起飞</span>
            </label>
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={flightStatuses.includes('巡航中')}
                onChange={() => handleFlightStatusToggle('巡航中')}
                className="risk-zone-checkbox-input"
              />
              <span className="risk-zone-label-horizontal">巡航中</span>
            </label>
            <label className="risk-zone-checkbox-horizontal">
              <input
                type="checkbox"
                checked={flightStatuses.includes('已落地')}
                onChange={() => handleFlightStatusToggle('已落地')}
                className="risk-zone-checkbox-input"
              />
              <span className="risk-zone-label-horizontal">已落地</span>
            </label>
          </div>
        </div>
      )}

      {/* 列表内容 */}
      <div className="sidebar-content">
        {sidebarTab === 'airport' && (
          <div className="sidebar-list">
            <div style={{ fontSize: '0.85rem', color: '#fff',textAlign: 'right'}}>预测风险</div>
            {filteredAirports.map((airport) => {
              const riskBgColor = getRiskBackgroundColor(airport.riskZone)
              const riskHoverBgColor = getRiskHoverBackgroundColor(airport.riskZone)
              const riskBorderColor = getRiskValueColor(airport.riskZone) + '40' // 25%透明度的边框
              const isHighlighted = highlightedAirportId === airport.id
              
              return (
              <div 
                key={airport.id} 
                className={`sidebar-item ${isHighlighted ? `highlighted highlighted-${airport.riskZone}` : ''}`}
                style={{ 
                  background: riskBgColor,
                  borderColor: riskBorderColor,
                  cursor: 'pointer',
                }}
                onClick={() => handleViewClick(airport)}
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
                    {getRiskLevelTextFromZone(airport.riskZone)}
                  </div>
                  <button
                    className="item-view-button"
                    onClick={(e) => handleViewButtonClick(airport, e)}
                    style={{ backgroundImage: `url(${viewIcon})` }}
                  />
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
                    <img src={closeIcon} alt="close" className="close-icon" />
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
                        <div className="flight-number">
                          <img src={airLogoIcon} alt="airline logo" className="flight-airline-logo" />
                          {selectedFlight.flightNumber}
                        </div>
                        <div 
                          className="flight-status-badge flight-status-badge-header" 
                          style={{ 
                            backgroundImage: `url(${typeIcon})`,
                            color: getStatusTextColor(selectedFlight.status)
                          }}
                        >
                          {selectedFlight.status}
                        </div>
                      </div>
                      <div className="flight-item-body">
                        <div className="flight-departure">
                          <div className="flight-time-info">
                            <span className="flight-time-label">预飞 {selectedFlight.scheduledDeparture}</span>
                            <span className="flight-time-value">计飞 {selectedFlight.estimatedDeparture}</span>
                          </div>
                        </div>
                        <div className="flight-status-section">
                            <div className="flight-route">
                              <img src={planeIcon} alt="plane" className="flight-route-plane" />
                              <div className="flight-route-airports">
                              <span className="flight-route-from">{selectedFlight.fromAirportZh}</span>
                              <span className="flight-route-to">{selectedFlight.toAirportZh}</span>
                            </div>
                            </div>
                        </div>
                        <div className="flight-arrival">
                          <div className="flight-time-info">
                            <span className="flight-time-label">{selectedFlight.scheduledArrival} 预到</span>
                            <span className="flight-time-value">{selectedFlight.estimatedArrival} 计到</span>
                          </div>
                        </div>
                      </div>
                      <div className="flight-item-footer">
                        <div className="flight-risk-values">
                        <span className="flight-risk-value">
                            人<span style={{ color: getRiskValueColorFromNumber(selectedFlight.humanRisk) }}>{getRiskLevelText(selectedFlight.humanRisk)}</span>
                        </span>
                        <span className="flight-risk-value">
                            机<span style={{ color: getRiskValueColorFromNumber(selectedFlight.machineRisk) }}>{getRiskLevelText(selectedFlight.machineRisk)}</span>
                        </span>
                        <span className="flight-risk-value">
                            环<span style={{ color: getRiskValueColorFromNumber(selectedFlight.environmentRisk) }}>{selectedFlight.riskLevel || getRiskLevelText(selectedFlight.environmentRisk)}</span>
                        </span>
                        </div>
                        <button 
                          className="flight-view-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFlightViewButtonClick(selectedFlight, e)
                          }}
                        >
                          <img src={viewIcon} alt="view" className="view-icon" />
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* 基本信息 */}
                <div className="detail-basic-info-wrapper">
                  <div className="detail-section-title">
                    <img src={radarIcon} alt="radar" className="detail-section-title-icon" />
                    <span>基本信息</span>
                  </div>
                  
                  {/* 蓝色方块 - 基本信息内容 */}
                  <div className="detail-basic-info-box">
                    {/* 上部分 */}
                    <div className="detail-basic-info-part">
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
                    </div>

                    {/* 虚线分隔 */}
                    <div className="detail-basic-info-divider"></div>

                    {/* 中部分 - 机组成员 */}
                    <div className="detail-basic-info-part">
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
                                  {person.riskValue !== undefined && (
                                    <span 
                                      className="detail-crew-risk"
                                      style={{ color: getRiskValueColorFromNumber(person.riskValue) }}
                                    >
                                      ({person.riskValue.toFixed(1)})
                                    </span>
                                  )}
                                  <span className="detail-crew-role">{member.role}</span>
                                  <span className="detail-crew-id">{person.pfId}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 虚线分隔 */}
                    {(selectedFlight.dispatcher || selectedFlight.alternateAirport) && (
                      <div className="detail-basic-info-divider"></div>
                    )}

                    {/* 下部分 */}
                    <div className="detail-basic-info-part">
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
                    </div>
                  </div>

                  {/* 风险值 - 独立方块 */}
                  <div className="detail-risk-section-box">
                    <div className="detail-subsection-title">
                      <span>风险值</span>
                    </div>
                    <div className="detail-risk-values-inline">
                      {/* 第一行：人、机、环、滑出 */}
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
                          {selectedFlight.riskLevel || getRiskLevelText(selectedFlight.environmentRisk)}
                        </span>
                      </div>
                      {selectedFlight.riskValues && (
                        <div className="detail-risk-value-item">
                          <span className="detail-risk-label">滑出</span>
                          <span className="detail-risk-number" style={{ color: getRiskValueColorFromNumber(selectedFlight.riskValues.taxiOut) }}>
                            {selectedFlight.riskValues.taxiOut.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* 分隔线 */}
                    {selectedFlight.riskValues && (
                      <div className="detail-risk-divider"></div>
                    )}
                    {/* 第二行：起飞、巡航、着陆、滑入 */}
                    {selectedFlight.riskValues && (
                      <div className="detail-risk-values-inline">
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
                      </div>
                    )}
                  </div>

                  {/* 预测风险 - 独立方块 */}
                  {selectedFlight.predictedRisks && selectedFlight.predictedRisks.length > 0 && (
                    <div className="detail-risk-section-box">
                      <div className="detail-subsection-title">
                        <span>预测风险</span>
                      </div>
                      <div className="detail-predicted-risks-inline">
                        {selectedFlight.predictedRisks
                          .filter((risk) => {
                            // 如果riskTypes为空，显示所有；否则只显示在riskTypes中的
                            if (riskTypes.length === 0) return true
                            return riskTypes.includes(risk.type)
                          })
                          .map((risk, idx) => {
                            const riskColor = risk.severity === 'red' ? '#ef4444' : risk.severity === 'orange' ? '#f97316' : '#eab308'
                            return (
                              <div 
                                key={idx} 
                                className="detail-predicted-item-inline"
                                style={{ 
                                  color: riskColor,
                                  borderColor: riskColor
                                }}
                              >
                                {risk.type}
                              </div>
                            )
                          })}
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
                    const riskZone = getFlightRiskZone(maxRisk)
                    const isHighlighted = highlightedFlightRouteId === flight.id
                    
                    return (
                      <div 
                        key={flight.id} 
                        className={`sidebar-flight-item ${isHighlighted ? `highlighted highlighted-${riskZone}` : ''}`}
                        style={{ 
                          background: riskBgColor,
                          borderColor: riskBorderColor,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleFlightViewClick(flight)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = riskHoverBgColor
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = riskBgColor
                        }}
                      >
                        <div className="flight-item-header">
                          <div className="flight-number">
                            <img src={airLogoIcon} alt="airline logo" className="flight-airline-logo" />
                            {flight.flightNumber}
                          </div>
                          <div 
                            className="flight-status-badge flight-status-badge-header" 
                            style={{ 
                              backgroundImage: `url(${typeIcon})`,
                              color: getStatusTextColor(flight.status)
                            }}
                          >
                            {flight.status}
                          </div>
                        </div>
                        <div className="flight-item-body">
                          <div className="flight-departure">
                            <div className="flight-time-info">
                              <span className="flight-time-label">预飞 {flight.scheduledDeparture}</span>
                              <span className="flight-time-value">计飞 {flight.estimatedDeparture}</span>
                            </div>
                          </div>
                          <div className="flight-status-section">
                              <div className="flight-route">
                              <img src={planeIcon} alt="plane" className="flight-route-plane" />
                              <div className="flight-route-airports">
                                <span className="flight-route-from">{flight.fromAirportZh}</span>
                                <span className="flight-route-to">{flight.toAirportZh}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flight-arrival">
                            <div className="flight-time-info">
                              <span className="flight-time-label">{flight.scheduledArrival} 预到</span>
                              <span className="flight-time-value">{flight.estimatedArrival} 计到</span>
                            </div>
                          </div>
                        </div>
                        <div className="flight-item-footer">
                          <div className="flight-risk-values">
                          <span className="flight-risk-value">
                              人<span style={{ color: getRiskValueColorFromNumber(flight.humanRisk) }}>{getRiskLevelText(flight.humanRisk)}</span>
                          </span>
                          <span className="flight-risk-value">
                              机<span style={{ color: getRiskValueColorFromNumber(flight.machineRisk) }}>{getRiskLevelText(flight.machineRisk)}</span>
                          </span>
                          <span className="flight-risk-value">
                              环<span style={{ color: getRiskValueColorFromNumber(flight.environmentRisk) }}>{flight.riskLevel || getRiskLevelText(flight.environmentRisk)}</span>
                          </span>
                          </div>
                          <button 
                            className="flight-view-button"
                            onClick={(e) => handleFlightViewButtonClick(flight, e)}
                          >
                            <img src={viewIcon} alt="view" className="view-icon" />
                          </button>
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
                    <img src={closeIcon} alt="close" className="close-icon" />
                  </button>
                </div>
                {(() => {
                  const person = PERSONS.find(p => p.id === selectedPersonId)
                  if (!person) return <div className="sidebar-empty">人员不存在</div>
                  
                  return (
                    <>
                      <div className="person-detail-card">
                        <div className="person-detail-card-overlay" />
                        <div className="person-detail-header">
                          <div className="person-detail-avatar">
                            <img src={personRowIcon} alt="person" className="person-detail-avatar-img" />
                          </div>
                          <div className="person-detail-header-info">
                            <div className="person-detail-header-name">{person.name}</div>
                            <div className="person-detail-header-meta">
                              <span className="person-detail-meta-label">PF工号:</span>
                              <span className="person-detail-meta-value">{person.pfId}</span>
                            </div>
                            <div className="person-detail-header-meta">
                              <span className="person-detail-meta-label">PF技术等级:</span>
                              <span className="person-detail-meta-value">{person.pfTechnology}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 基本信息 */}
                      <div className="person-basic-info">
                        <div className="person-basic-title">
                          <img src={radarIcon} alt="radar" className="person-basic-title-icon" />
                          <span>基本信息</span>
                        </div>
                        <div className="person-basic-card">
                          <div className="person-basic-item">
                            <span className="person-basic-label">年龄:</span>
                            <span className="person-basic-value">
                              {person.age !== undefined ? `${person.age}岁` : '--'}
                            </span>
                          </div>
                          <div className="person-basic-item">
                            <span className="person-basic-label">飞行年限:</span>
                            <span className="person-basic-value">
                              {person.flightYears !== undefined ? `${person.flightYears}年` : '--'}
                            </span>
                          </div>
                          <div className="person-basic-item">
                            <span className="person-basic-label">总飞行时长:</span>
                            <span className="person-basic-value">
                              {person.totalFlightHours !== undefined ? `${person.totalFlightHours.toLocaleString()}小时` : '--'}
                            </span>
                          </div>
                          <div className="person-basic-item">
                            <span className="person-basic-label">近90天飞行时长:</span>
                            <span className="person-basic-value">
                              {person.recent90DaysFlightHours !== undefined ? `${person.recent90DaysFlightHours}小时` : '--'}
                            </span>
                          </div>
                          <div className="person-basic-item">
                            <span className="person-basic-label">已认证机型:</span>
                            <span className="person-basic-value">
                              {person.certifiedAircraftTypes && person.certifiedAircraftTypes.length > 0
                                ? person.certifiedAircraftTypes.join('/')
                                : '--'}
                            </span>
                          </div>
                          <div className="person-basic-item">
                            <span className="person-basic-label">当前执飞机型:</span>
                            <span className="person-basic-value">
                              {person.currentAircraftType || '--'}
                            </span>
                          </div>
                          <div className="person-basic-item">
                            <span className="person-basic-label">风险值评估:</span>
                            <span 
                              className="person-basic-value person-basic-risk"
                              style={{ color: person.riskValue !== undefined ? getRiskValueColorFromNumber(person.riskValue) : '#f97316' }}
                            >
                              {person.riskValue !== undefined ? person.riskValue.toFixed(1) : '--'}
                            </span>
                          </div>
                        </div>
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
                    <div 
                      key={team.id} 
                      className={`team-card ${isExpanded ? 'team-card-selected' : ''}`}
                      style={isExpanded ? { backgroundImage: `url(${personCardBg})` } : {}}
                    >
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
                        <img src={teamCardIcon} alt="team" className="team-card-icon-img" />
                        <div className="team-card-name">{team.name}</div>
                        <div className="team-card-toggle">{isExpanded ? '▼' : '▶'}</div>
                      </div>

                      {/* 折叠时的概要信息 */}
                      {!isExpanded && (
                        <div className="team-card-collapsed">
                          <div className="team-summary-row">
                            <span className="team-summary-label">分队长</span>
                            <span 
                              className="team-summary-value"
                              style={{ color: team.leader.riskValue !== undefined ? getRiskColor(team.leader.riskValue) : '#cbd5e1' }}
                            >
                              {team.leader.name}
                            </span>
                          </div>
                          <div className="team-summary-row">
                            <span className="team-summary-label">成员</span>
                            <span className="team-summary-value">
                              {team.members.map((member, idx) => (
                                <span 
                                  key={idx}
                                  className="team-summary-member"
                                  style={{ color: member.riskValue !== undefined ? getRiskColor(member.riskValue) : '#cbd5e1' }}
                                >
                                  {member.name}{idx !== team.members.length - 1 ? '、' : ''}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 展开后的人员列表 */}
                      {isExpanded && (
                        <div className="team-card-content">
                          {/* 分队长 */}
                          <div 
                            className="person-row"
                            onClick={() => {
                              setSelectedPersonId(team.leader.id)
                              setIsFromTab(false)
                            }}
                          >
                            <div className="person-row-avatar">
                              <img src={personRowIcon} alt="person" className="person-row-avatar-img" />
                            </div>
                            <div className="person-row-main">
                              <div className="person-row-name">
                                <span className="person-row-name-text">{team.leader.name}</span>
                                {team.leader.riskValue !== undefined && (
                                  <span 
                                    className="person-row-risk"
                                    style={{ color: getRiskColor(team.leader.riskValue) }}
                                  >
                                    ({team.leader.riskValue.toFixed(1)})
                                  </span>
                                )}
                              </div>
                              <div className="person-row-meta person-row-meta-column">
                                <div className="person-row-meta-line">
                                  <span className="person-row-meta-label">PF技术等级:</span>
                                  <span className="person-row-meta-value">{team.leader.pfTechnology}</span>
                                </div>
                                <div className="person-row-meta-line">
                                  <span className="person-row-meta-label">PF:</span>
                                  <span className="person-row-meta-value">{team.leader.pfId}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 成员列表 */}
                          {team.members.map((member, idx) => (
                            <div 
                              key={idx} 
                              className="person-row"
                              onClick={() => {
                                setSelectedPersonId(member.id)
                                setIsFromTab(false)
                              }}
                            >
                              <div className="person-row-avatar">
                                <img src={personRowIcon} alt="person" className="person-row-avatar-img" />
                              </div>
                              <div className="person-row-main">
                                <div className="person-row-name">
                                  <span className="person-row-name-text">{member.name}</span>
                                  {member.riskValue !== undefined && (
                                    <span 
                                      className="person-row-risk"
                                      style={{ color: getRiskColor(member.riskValue) }}
                                    >
                                      ({member.riskValue.toFixed(1)})
                                    </span>
                                  )}
                                </div>
                                <div className="person-row-meta person-row-meta-column">
                                  <div className="person-row-meta-line">
                                    <span className="person-row-meta-label">PF技术等级:</span>
                                    <span className="person-row-meta-value">{member.pfTechnology}</span>
                                  </div>
                                  <div className="person-row-meta-line">
                                    <span className="person-row-meta-label">PF:</span>
                                    <span className="person-row-meta-value">{member.pfId}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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

