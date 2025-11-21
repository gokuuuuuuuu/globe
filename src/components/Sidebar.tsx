import {  useMemo } from 'react'
import { useAppStore, type RiskZone } from '../store/useAppStore'
import './Sidebar.css'

// 机场数据接口
interface AirportData {
  id: string
  name: string
  nameZh: string
  code: string
  operatorCount: number // 放飞单位
  flightCount: number // 航班数
  riskValue: string // 风险值，如 "7-9"
  riskZone: RiskZone // 风险区间
  lat: number
  lon: number
}

// 机场中文名称映射
const AIRPORT_NAMES_ZH: Record<string, string> = {
  'PEK': '北京・首都',
  'PVG': '上海・浦东',
  'CAN': '广州・白云',
  'JFK': '纽约・肯尼迪',
  'LAX': '洛杉矶',
  'ORD': '芝加哥・奥黑尔',
  'LHR': '伦敦・希思罗',
  'LGW': '伦敦・盖特威克',
  'DXB': '迪拜',
  'SYD': '悉尼',
  'MEL': '墨尔本',
  'NRT': '东京・成田',
  'HND': '东京・羽田',
  'FRA': '法兰克福',
  'MUC': '慕尼黑',
  'CDG': '巴黎・戴高乐',
  'SIN': '新加坡・樟宜',
  'ICN': '首尔・仁川',
  'BKK': '曼谷・素万那普',
}

// 根据环境风险值生成风险值字符串和风险区间
function calculateRiskFromEnvironmentRisk(envRisk: number): { riskValue: string; riskZone: RiskZone } {
  // 将环境风险值转换为字符串格式
  const riskValue = envRisk.toFixed(1)
  
  // 根据新的风险值分类标准确定风险区间
  // 7-10为高风险(red), 5-7为高中风险(orange), 2-5为中风险(yellow), 0-2为低风险(green)
  let riskZone: RiskZone
  if (envRisk >= 7) {
    riskZone = 'red'
  } else if (envRisk >= 5) {
    riskZone = 'orange'
  } else if (envRisk >= 2) {
    riskZone = 'yellow'
  } else {
    riskZone = 'green'
  }
  
  return { riskValue, riskZone }
}

// 从GlobeView导入的DEMO_AIRPORTS数据（简化版本，实际应该共享数据源）
// 这里使用模拟数据，但ID和坐标与GlobeView中的DEMO_AIRPORTS匹配
const MOCK_AIRPORTS: AirportData[] = [
  { id: 'PEK', name: 'Beijing Capital', nameZh: AIRPORT_NAMES_ZH['PEK'] || '北京', code: 'PEK', operatorCount: 12, flightCount: 856, ...calculateRiskFromEnvironmentRisk(3.2), lat: 40.0799, lon: 116.6031 },
  { id: 'PVG', name: 'Shanghai Pudong', nameZh: AIRPORT_NAMES_ZH['PVG'] || '上海', code: 'PVG', operatorCount: 15, flightCount: 1024, ...calculateRiskFromEnvironmentRisk(3.5), lat: 31.1434, lon: 121.8052 },
  { id: 'CAN', name: 'Guangzhou Baiyun', nameZh: AIRPORT_NAMES_ZH['CAN'] || '广州', code: 'CAN', operatorCount: 10, flightCount: 678, ...calculateRiskFromEnvironmentRisk(2.8), lat: 23.3924, lon: 113.2988 },
  { id: 'JFK', name: 'New York JFK', nameZh: AIRPORT_NAMES_ZH['JFK'] || '纽约', code: 'JFK', operatorCount: 18, flightCount: 1245, ...calculateRiskFromEnvironmentRisk(4.1), lat: 40.6413, lon: -73.7781 },
  { id: 'LAX', name: 'Los Angeles', nameZh: AIRPORT_NAMES_ZH['LAX'] || '洛杉矶', code: 'LAX', operatorCount: 20, flightCount: 1456, ...calculateRiskFromEnvironmentRisk(4.3), lat: 33.9425, lon: -118.4081 },
  { id: 'ORD', name: 'Chicago O\'Hare', nameZh: AIRPORT_NAMES_ZH['ORD'] || '芝加哥', code: 'ORD', operatorCount: 16, flightCount: 1123, ...calculateRiskFromEnvironmentRisk(3.9), lat: 41.9786, lon: -87.9048 },
  { id: 'LHR', name: 'London Heathrow', nameZh: AIRPORT_NAMES_ZH['LHR'] || '伦敦', code: 'LHR', operatorCount: 14, flightCount: 987, ...calculateRiskFromEnvironmentRisk(3.7), lat: 51.4706, lon: -0.4619 },
  { id: 'LGW', name: 'London Gatwick', nameZh: AIRPORT_NAMES_ZH['LGW'] || '伦敦', code: 'LGW', operatorCount: 8, flightCount: 456, ...calculateRiskFromEnvironmentRisk(2.5), lat: 51.1537, lon: -0.1821 },
  { id: 'DXB', name: 'Dubai International', nameZh: AIRPORT_NAMES_ZH['DXB'] || '迪拜', code: 'DXB', operatorCount: 22, flightCount: 1567, ...calculateRiskFromEnvironmentRisk(4.5), lat: 25.2532, lon: 55.3657 },
  { id: 'SYD', name: 'Sydney Kingsford', nameZh: AIRPORT_NAMES_ZH['SYD'] || '悉尼', code: 'SYD', operatorCount: 11, flightCount: 723, ...calculateRiskFromEnvironmentRisk(3.0), lat: -33.9399, lon: 151.1753 },
  { id: 'MEL', name: 'Melbourne', nameZh: AIRPORT_NAMES_ZH['MEL'] || '墨尔本', code: 'MEL', operatorCount: 9, flightCount: 567, ...calculateRiskFromEnvironmentRisk(2.7), lat: -37.6733, lon: 144.8433 },
  { id: 'NRT', name: 'Tokyo Narita', nameZh: AIRPORT_NAMES_ZH['NRT'] || '东京', code: 'NRT', operatorCount: 13, flightCount: 892, ...calculateRiskFromEnvironmentRisk(3.4), lat: 35.7720, lon: 140.3929 },
  { id: 'HND', name: 'Tokyo Haneda', nameZh: AIRPORT_NAMES_ZH['HND'] || '东京', code: 'HND', operatorCount: 12, flightCount: 834, ...calculateRiskFromEnvironmentRisk(3.3), lat: 35.5494, lon: 139.7798 },
  { id: 'FRA', name: 'Frankfurt', nameZh: AIRPORT_NAMES_ZH['FRA'] || '法兰克福', code: 'FRA', operatorCount: 17, flightCount: 1098, ...calculateRiskFromEnvironmentRisk(3.8), lat: 50.0379, lon: 8.5622 },
  { id: 'MUC', name: 'Munich', nameZh: AIRPORT_NAMES_ZH['MUC'] || '慕尼黑', code: 'MUC', operatorCount: 10, flightCount: 645, ...calculateRiskFromEnvironmentRisk(2.9), lat: 48.3538, lon: 11.7861 },
  { id: 'CDG', name: 'Paris Charles de Gaulle', nameZh: AIRPORT_NAMES_ZH['CDG'] || '巴黎', code: 'CDG', operatorCount: 19, flightCount: 1234, ...calculateRiskFromEnvironmentRisk(4.0), lat: 49.0097, lon: 2.5479 },
  { id: 'SIN', name: 'Singapore Changi', nameZh: AIRPORT_NAMES_ZH['SIN'] || '新加坡', code: 'SIN', operatorCount: 21, flightCount: 1345, ...calculateRiskFromEnvironmentRisk(4.2), lat: 1.3644, lon: 103.9915 },
  { id: 'ICN', name: 'Seoul Incheon', nameZh: AIRPORT_NAMES_ZH['ICN'] || '首尔', code: 'ICN', operatorCount: 15, flightCount: 956, ...calculateRiskFromEnvironmentRisk(3.6), lat: 37.4602, lon: 126.4407 },
  { id: 'BKK', name: 'Bangkok Suvarnabhumi', nameZh: AIRPORT_NAMES_ZH['BKK'] || '曼谷', code: 'BKK', operatorCount: 12, flightCount: 789, ...calculateRiskFromEnvironmentRisk(3.1), lat: 13.6811, lon: 100.7475 },
]

// 模拟航班数据
const MOCK_FLIGHTS: FlightData[] = [
  { id: '1', flightNumber: 'MU5862', fromAirport: 'WTS', fromAirportZh: '五台山', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '17:05', estimatedDeparture: '17:05', scheduledArrival: '22:50', estimatedArrival: '22:50', status: '未起飞', humanRisk: 1.9, machineRisk: 1.9, environmentRisk: 7.9, airportId: 'PVG' },
  { id: '2', flightNumber: 'MU5862', fromAirport: 'WTS', fromAirportZh: '五台山', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '17:05', estimatedDeparture: '17:05', scheduledArrival: '22:50', estimatedArrival: '22:50', status: '未起飞', humanRisk: 1.9, machineRisk: 1.9, environmentRisk: 7.9, airportId: 'PVG' },
  { id: '3', flightNumber: 'MU5862', fromAirport: 'WTS', fromAirportZh: '五台山', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '17:05', estimatedDeparture: '17:05', scheduledArrival: '22:50', estimatedArrival: '22:50', status: '巡航中', humanRisk: 1.9, machineRisk: 1.9, environmentRisk: 7.9, airportId: 'PVG' },
  { id: '4', flightNumber: 'MU5862', fromAirport: 'WTS', fromAirportZh: '五台山', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '17:05', estimatedDeparture: '17:05', scheduledArrival: '22:50', estimatedArrival: '22:50', status: '巡航中', humanRisk: 1.9, machineRisk: 1.9, environmentRisk: 7.9, airportId: 'PVG' },
  { id: '5', flightNumber: 'MU5862', fromAirport: 'WTS', fromAirportZh: '五台山', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '17:05', estimatedDeparture: '17:05', scheduledArrival: '22:50', estimatedArrival: '22:50', status: '已落地', humanRisk: 1.9, machineRisk: 1.9, environmentRisk: 7.9, airportId: 'PVG' },
  { id: '6', flightNumber: 'MU5862', fromAirport: 'WTS', fromAirportZh: '五台山', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '17:05', estimatedDeparture: '17:05', scheduledArrival: '22:50', estimatedArrival: '22:50', status: '已落地', humanRisk: 1.9, machineRisk: 1.9, environmentRisk: 7.9, airportId: 'PVG' },
  // 添加一些其他机场的航班
  { id: '7', flightNumber: 'CA1234', fromAirport: 'PEK', fromAirportZh: '北京首都', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '10:00', estimatedDeparture: '10:00', scheduledArrival: '12:30', estimatedArrival: '12:30', status: '巡航中', humanRisk: 2.1, machineRisk: 2.0, environmentRisk: 6.5, airportId: 'PEK' },
  { id: '8', flightNumber: 'CZ5678', fromAirport: 'CAN', fromAirportZh: '广州白云', toAirport: 'PVG', toAirportZh: '上海浦东', scheduledDeparture: '14:20', estimatedDeparture: '14:20', scheduledArrival: '16:45', estimatedArrival: '16:45', status: '未起飞', humanRisk: 1.8, machineRisk: 1.9, environmentRisk: 7.2, airportId: 'CAN' },
]

// 航班数据接口
interface FlightData {
  id: string
  flightNumber: string
  fromAirport: string
  fromAirportZh: string
  toAirport: string
  toAirportZh: string
  scheduledDeparture: string // 预飞时间
  estimatedDeparture: string // 计飞时间
  scheduledArrival: string // 预到时间
  estimatedArrival: string // 计划到达时间
  status: '未起飞' | '巡航中' | '已落地'
  humanRisk: number // 人风险值
  machineRisk: number // 机风险值
  environmentRisk: number // 环风险值
  airportId?: string // 关联的机场ID
}

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
  } = useAppStore()

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
    setSidebarTab('airline')
  }

  // 取消选中机场
  const handleDeselectAirport = () => {
    setSelectedAirportForAirline(null)
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
          onClick={() => setSidebarTab('person')}
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

      {/* 状态筛选（仅airline tab显示） */}
      {sidebarTab === 'airline' && (
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
          <div className="sidebar-list">
            {filteredFlights.length === 0 ? (
              <div className="sidebar-empty">暂无航班数据</div>
            ) : (
              filteredFlights.map((flight) => (
                <div key={flight.id} className="sidebar-flight-item">
                  <div className="flight-item-header">
                    <div className="flight-number">{flight.flightNumber}</div>
                    <button className="flight-view-button">
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
        {sidebarTab === 'person' && (
          <div className="sidebar-list">
            <div className="sidebar-empty">人员数据待实现</div>
          </div>
        )}
      </div>
    </div>
  )
}

