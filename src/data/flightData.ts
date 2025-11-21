// 统一的数据源：机场和航线信息

// 机场中文名称映射
export const AIRPORT_NAMES_ZH: Record<string, string> = {
  'PEK': '北京・首都',
  'PVG': '上海・浦东',
  'CAN': '广州・白云',
  'WTS': '五台山',
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

// 统一机场数据接口
export interface Airport {
  id: string
  name: string
  nameZh: string
  code: string
  lat: number
  lon: number
  color: string
  countryCode: string // 国家代码
  operatorCount: number // 执飞单位数量
  flightCount: number // 航班数量
  environmentRisk: number // 环境风险值（数字）
}

// 统一航班数据接口
export interface Flight {
  id: string
  flightNumber: string
  fromAirport: string // 起飞机场代码
  fromAirportZh: string // 起飞机场中文名
  toAirport: string // 降落机场代码
  toAirportZh: string // 降落机场中文名
  scheduledDeparture: string // 预飞时间
  estimatedDeparture: string // 计飞时间
  scheduledArrival: string // 预到时间
  estimatedArrival: string // 计到时间
  status: '未起飞' | '巡航中' | '已落地'
  humanRisk: number // 人风险值
  machineRisk: number // 机风险值
  environmentRisk: number // 环风险值
  airportId?: string // 关联的机场ID（用于筛选）
  // 详细信息
  aircraftNumber?: string // 机号
  aircraftType?: string // 机型
  largeAircraftType?: string // 大机型
  pfId?: string // PF工号
  pfTechnology?: string // PF技术
  operatingUnit?: string // 执飞单位
  crewMembers?: Array<{ personId: string; role: string }> // 机组成员（引用person数据中的人员ID）
  dispatcher?: string // 放行签派员
  alternateAirport?: string // 备降机场
  // 各阶段风险值
  riskValues?: {
    taxiOut: number // 滑出
    takeoff: number // 起飞
    cruise: number // 巡航
    landing: number // 着陆
    taxiIn: number // 滑入
  }
  // 预测风险
  predictedRisks?: Array<{ type: string; severity: 'red' | 'orange' | 'yellow' }> // 预测风险
}

// 统一机场数据
export const AIRPORTS: Airport[] = [
  // 中国
  { id: 'PEK', name: 'Beijing Capital', nameZh: AIRPORT_NAMES_ZH['PEK'] || '北京', code: 'PEK', lat: 40.0799, lon: 116.6031, color: '#22d3ee', countryCode: 'CN', operatorCount: 12, flightCount: 856, environmentRisk: 3.2 },
  { id: 'PVG', name: 'Shanghai Pudong', nameZh: AIRPORT_NAMES_ZH['PVG'] || '上海', code: 'PVG', lat: 31.1434, lon: 121.8052, color: '#22d3ee', countryCode: 'CN', operatorCount: 15, flightCount: 1024, environmentRisk: 3.5 },
  { id: 'CAN', name: 'Guangzhou Baiyun', nameZh: AIRPORT_NAMES_ZH['CAN'] || '广州', code: 'CAN', lat: 23.3924, lon: 113.2988, color: '#22d3ee', countryCode: 'CN', operatorCount: 10, flightCount: 678, environmentRisk: 2.8 },
  { id: 'WTS', name: 'Wutai Mountain', nameZh: AIRPORT_NAMES_ZH['WTS'] || '五台山', code: 'WTS', lat: 38.7244, lon: 113.2556, color: '#22d3ee', countryCode: 'CN', operatorCount: 8, flightCount: 234, environmentRisk: 2.5 },
  // 美国
  { id: 'JFK', name: 'New York JFK', nameZh: AIRPORT_NAMES_ZH['JFK'] || '纽约', code: 'JFK', lat: 40.6413, lon: -73.7781, color: '#f472b6', countryCode: 'US', operatorCount: 18, flightCount: 1245, environmentRisk: 4.1 },
  { id: 'LAX', name: 'Los Angeles', nameZh: AIRPORT_NAMES_ZH['LAX'] || '洛杉矶', code: 'LAX', lat: 33.9425, lon: -118.4081, color: '#f472b6', countryCode: 'US', operatorCount: 20, flightCount: 1456, environmentRisk: 4.3 },
  { id: 'ORD', name: 'Chicago O\'Hare', nameZh: AIRPORT_NAMES_ZH['ORD'] || '芝加哥', code: 'ORD', lat: 41.9786, lon: -87.9048, color: '#f472b6', countryCode: 'US', operatorCount: 16, flightCount: 1123, environmentRisk: 3.9 },
  // 英国
  { id: 'LHR', name: 'London Heathrow', nameZh: AIRPORT_NAMES_ZH['LHR'] || '伦敦', code: 'LHR', lat: 51.4706, lon: -0.4619, color: '#facc15', countryCode: 'GB', operatorCount: 14, flightCount: 987, environmentRisk: 3.7 },
  { id: 'LGW', name: 'London Gatwick', nameZh: AIRPORT_NAMES_ZH['LGW'] || '伦敦', code: 'LGW', lat: 51.1537, lon: -0.1821, color: '#facc15', countryCode: 'GB', operatorCount: 8, flightCount: 456, environmentRisk: 2.5 },
  // 阿联酋
  { id: 'DXB', name: 'Dubai International', nameZh: AIRPORT_NAMES_ZH['DXB'] || '迪拜', code: 'DXB', lat: 25.2532, lon: 55.3657, color: '#fb7185', countryCode: 'AE', operatorCount: 22, flightCount: 1567, environmentRisk: 4.5 },
  // 澳大利亚
  { id: 'SYD', name: 'Sydney Kingsford', nameZh: AIRPORT_NAMES_ZH['SYD'] || '悉尼', code: 'SYD', lat: -33.9399, lon: 151.1753, color: '#34d399', countryCode: 'AU', operatorCount: 11, flightCount: 723, environmentRisk: 3.0 },
  { id: 'MEL', name: 'Melbourne', nameZh: AIRPORT_NAMES_ZH['MEL'] || '墨尔本', code: 'MEL', lat: -37.6733, lon: 144.8433, color: '#34d399', countryCode: 'AU', operatorCount: 9, flightCount: 567, environmentRisk: 2.7 },
  // 日本
  { id: 'NRT', name: 'Tokyo Narita', nameZh: AIRPORT_NAMES_ZH['NRT'] || '东京', code: 'NRT', lat: 35.7720, lon: 140.3929, color: '#a78bfa', countryCode: 'JP', operatorCount: 13, flightCount: 892, environmentRisk: 3.4 },
  { id: 'HND', name: 'Tokyo Haneda', nameZh: AIRPORT_NAMES_ZH['HND'] || '东京', code: 'HND', lat: 35.5494, lon: 139.7798, color: '#a78bfa', countryCode: 'JP', operatorCount: 12, flightCount: 834, environmentRisk: 3.3 },
  // 德国
  { id: 'FRA', name: 'Frankfurt', nameZh: AIRPORT_NAMES_ZH['FRA'] || '法兰克福', code: 'FRA', lat: 50.0379, lon: 8.5622, color: '#60a5fa', countryCode: 'DE', operatorCount: 17, flightCount: 1098, environmentRisk: 3.8 },
  { id: 'MUC', name: 'Munich', nameZh: AIRPORT_NAMES_ZH['MUC'] || '慕尼黑', code: 'MUC', lat: 48.3538, lon: 11.7861, color: '#60a5fa', countryCode: 'DE', operatorCount: 10, flightCount: 645, environmentRisk: 2.9 },
  // 法国
  { id: 'CDG', name: 'Paris Charles de Gaulle', nameZh: AIRPORT_NAMES_ZH['CDG'] || '巴黎', code: 'CDG', lat: 49.0097, lon: 2.5479, color: '#fbbf24', countryCode: 'FR', operatorCount: 19, flightCount: 1234, environmentRisk: 4.0 },
  // 新加坡
  { id: 'SIN', name: 'Singapore Changi', nameZh: AIRPORT_NAMES_ZH['SIN'] || '新加坡', code: 'SIN', lat: 1.3644, lon: 103.9915, color: '#10b981', countryCode: 'SG', operatorCount: 21, flightCount: 1345, environmentRisk: 4.2 },
  // 韩国
  { id: 'ICN', name: 'Seoul Incheon', nameZh: AIRPORT_NAMES_ZH['ICN'] || '首尔', code: 'ICN', lat: 37.4602, lon: 126.4407, color: '#ec4899', countryCode: 'KR', operatorCount: 15, flightCount: 956, environmentRisk: 3.6 },
  // 泰国
  { id: 'BKK', name: 'Bangkok Suvarnabhumi', nameZh: AIRPORT_NAMES_ZH['BKK'] || '曼谷', code: 'BKK', lat: 13.6811, lon: 100.7475, color: '#f59e0b', countryCode: 'TH', operatorCount: 12, flightCount: 789, environmentRisk: 3.1 },
]

// 统一航班数据
export const FLIGHTS: Flight[] = [
  { 
    id: '1', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '22:50', 
    estimatedArrival: '22:50', 
    status: '未起飞', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'PVG',
    aircraftNumber: 'B-3089',
    aircraftType: 'A319',
    largeAircraftType: '窄体机',
    pfId: '20001',
    pfTechnology: '教员', // 对应P001（李四）的pfTechnology
    operatingUnit: '上海',
    crewMembers: [
      { personId: 'P001', role: 'Tb' }, // 李四
      { personId: 'P002', role: 'F5' }, // 张强
      { personId: 'P004', role: 'S2' }  // 赵六
    ],
    dispatcher: '方逸',
    alternateAirport: '太原ZBYN',
    riskValues: {
      taxiOut: 0.56,
      takeoff: 0.56,
      cruise: 0.11,
      landing: 0.56,
      taxiIn: 0.12
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' },
      { type: '重着陆', severity: 'red' },
      { type: '报机窝', severity: 'yellow' }
    ]
  },
  { 
    id: '2', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '22:50', 
    estimatedArrival: '22:50', 
    status: '未起飞', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'PVG',
    aircraftNumber: 'B-3089',
    aircraftType: 'A319',
    largeAircraftType: '窄体机',
    pfId: '20001',
    pfTechnology: '教员', // 对应P001（李四）的pfTechnology
    operatingUnit: '上海',
    crewMembers: [
      { personId: 'P001', role: 'Tb' }, // 李四
      { personId: 'P002', role: 'F5' }, // 张强
      { personId: 'P004', role: 'S2' }  // 赵六
    ],
    dispatcher: '方逸',
    alternateAirport: '太原ZBYN',
    riskValues: {
      taxiOut: 0.56,
      takeoff: 0.56,
      cruise: 0.11,
      landing: 0.56,
      taxiIn: 0.12
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' },
      { type: '重着陆', severity: 'red' }
    ]
  },
  { 
    id: '3', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '22:50', 
    estimatedArrival: '22:50', 
    status: '巡航中', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'PVG',
    aircraftNumber: 'B-3089',
    aircraftType: 'A319',
    largeAircraftType: '窄体机',
    pfId: '20001',
    pfTechnology: '教员', // 对应P001（李四）的pfTechnology
    operatingUnit: '上海',
    crewMembers: [
      { personId: 'P001', role: 'Tb' }, // 李四
      { personId: 'P002', role: 'F5' }, // 张强
      { personId: 'P004', role: 'S2' }  // 赵六
    ],
    dispatcher: '方逸',
    alternateAirport: '太原ZBYN',
    riskValues: {
      taxiOut: 0.56,
      takeoff: 0.56,
      cruise: 0.11,
      landing: 0.56,
      taxiIn: 0.12
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' },
      { type: '重着陆', severity: 'red' }
    ]
  },
  { 
    id: '4', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '22:50', 
    estimatedArrival: '22:50', 
    status: '巡航中', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'PVG',
    aircraftNumber: 'B-3089',
    aircraftType: 'A319',
    largeAircraftType: '窄体机',
    pfId: '20001',
    pfTechnology: '教员', // 对应P001（李四）的pfTechnology
    operatingUnit: '上海',
    crewMembers: [
      { personId: 'P001', role: 'Tb' }, // 李四
      { personId: 'P002', role: 'F5' }, // 张强
      { personId: 'P004', role: 'S2' }  // 赵六
    ],
    dispatcher: '方逸',
    alternateAirport: '太原ZBYN',
    riskValues: {
      taxiOut: 0.56,
      takeoff: 0.56,
      cruise: 0.11,
      landing: 0.56,
      taxiIn: 0.12
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' }
    ]
  },
  { 
    id: '5', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '22:50', 
    estimatedArrival: '22:50', 
    status: '已落地', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'PVG' 
  },
  { 
    id: '6', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '22:50', 
    estimatedArrival: '22:50', 
    status: '已落地', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'PVG' 
  },
  // 添加一些其他机场的航班
  { 
    id: '7', 
    flightNumber: 'CA1234', 
    fromAirport: 'PEK', 
    fromAirportZh: '北京首都', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '10:00', 
    estimatedDeparture: '10:00', 
    scheduledArrival: '12:30', 
    estimatedArrival: '12:30', 
    status: '巡航中', 
    humanRisk: 2.1, 
    machineRisk: 2.0, 
    environmentRisk: 6.5, 
    airportId: 'PEK',
    aircraftNumber: 'B-1234',
    aircraftType: 'A320',
    largeAircraftType: '窄体机',
    // pfId和pfTechnology将从person数据中获取（通过crewMembers中的PF人员）
    // 这里保留作为fallback，但实际应该从person数据中获取
    pfId: '20002', // 对应P003（王五）的pfId
    pfTechnology: '第一副驾驶', // 对应P003（王五）的pfTechnology
    operatingUnit: '北京',
    crewMembers: [
      { personId: 'P001', role: 'Tb' }, // 李四
      { personId: 'P003', role: 'F5' }, // 王五
      { personId: 'P004', role: 'S2' }  // 赵六
    ],
    dispatcher: '陈华',
    alternateAirport: '济南ZSTN',
    riskValues: {
      taxiOut: 0.45,
      takeoff: 0.50,
      cruise: 0.15,
      landing: 0.48,
      taxiIn: 0.10
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' }
    ]
  },
  { 
    id: '8', 
    flightNumber: 'CZ5678', 
    fromAirport: 'CAN', 
    fromAirportZh: '广州白云', 
    toAirport: 'PVG', 
    toAirportZh: '上海浦东', 
    scheduledDeparture: '14:20', 
    estimatedDeparture: '14:20', 
    scheduledArrival: '16:45', 
    estimatedArrival: '16:45', 
    status: '未起飞', 
    humanRisk: 1.8, 
    machineRisk: 1.9, 
    environmentRisk: 7.2, 
    airportId: 'CAN' 
  },
]

// 根据环境风险值生成风险值字符串和风险区间
export function calculateRiskFromEnvironmentRisk(envRisk: number): { riskValue: string; riskZone: 'red' | 'orange' | 'yellow' | 'green' } {
  // 将环境风险值转换为字符串格式
  const riskValue = envRisk.toFixed(1)
  
  // 根据新的风险值分类标准确定风险区间
  // 7-10为高风险(red), 5-7为高中风险(orange), 2-5为中风险(yellow), 0-2为低风险(green)
  let riskZone: 'red' | 'orange' | 'yellow' | 'green'
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

// 根据机场代码查找机场
export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find(a => a.code === code)
}

// 根据机场ID查找机场
export function getAirportById(id: string): Airport | undefined {
  return AIRPORTS.find(a => a.id === id)
}

