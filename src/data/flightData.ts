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
  'SZX': '深圳・宝安',
  'CTU': '成都・双流',
  'XIY': '西安・咸阳',
  'KMG': '昆明・长水',
}

// 根据环境风险值获取对应的亮色（使用更鲜艳的荧光色）
export function getRiskColor(environmentRisk: number): string {
  if (environmentRisk >= 7) {
    return '#ff1744' // 高风险 - 鲜艳红色（Material Design Red A400）
  } else if (environmentRisk >= 5) {
    return '#ff6f00' // 中风险 - 鲜艳橙色（Material Design Deep Orange A700）
  } else if (environmentRisk >= 2) {
    return '#ffc107' // 低风险 - 鲜艳黄色（Material Design Amber A700）
  } else {
    return '#4caf50' // 极低风险 - 鲜艳绿色（Material Design Green 500）
  }
}

// 根据机的风险值获取对应的亮色（使用更鲜艳的荧光色）
export function getMachineRiskColor(machineRisk: number): string {
  if (machineRisk >= 7) {
    return '#ff1744' // 高风险 - 鲜艳红色（Material Design Red A400）
  } else if (machineRisk >= 5) {
    return '#ff6f00' // 中风险 - 鲜艳橙色（Material Design Deep Orange A700）
  } else if (machineRisk >= 2) {
    return '#ffc107' // 低风险 - 鲜艳黄色（Material Design Amber A700）
  } else {
    return '#4caf50' // 极低风险 - 鲜艳绿色（Material Design Green 500）
  }
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
// 风险等级分类：
// - 高风险(red): environmentRisk >= 7
// - 中风险(orange): 5 <= environmentRisk < 7
// - 低风险(yellow): 2 <= environmentRisk < 5
// - 极低风险(green): environmentRisk < 2
export const AIRPORTS: Airport[] = [
  // ========== 高风险机场 (2个) ==========
  { id: 'PVG', name: 'Shanghai Pudong', nameZh: AIRPORT_NAMES_ZH['PVG'] || '上海・浦东', code: 'PVG', lat: 31.1434, lon: 121.8052, color: getRiskColor(7.8), countryCode: 'CN', operatorCount: 15, flightCount: 1024, environmentRisk: 7.8 }, // 高风险
  { id: 'PEK', name: 'Beijing Capital', nameZh: AIRPORT_NAMES_ZH['PEK'] || '北京・首都', code: 'PEK', lat: 40.0799, lon: 116.6031, color: getRiskColor(7.5), countryCode: 'CN', operatorCount: 12, flightCount: 856, environmentRisk: 7.5 }, // 高风险
  
  // ========== 中风险机场 (3个) ==========
  { id: 'CAN', name: 'Guangzhou Baiyun', nameZh: AIRPORT_NAMES_ZH['CAN'] || '广州・白云', code: 'CAN', lat: 23.3924, lon: 113.2988, color: getRiskColor(5.8), countryCode: 'CN', operatorCount: 10, flightCount: 678, environmentRisk: 5.8 }, // 中风险
  { id: 'SZX', name: 'Shenzhen Bao\'an', nameZh: '深圳・宝安', code: 'SZX', lat: 22.6392, lon: 113.8106, color: getRiskColor(5.5), countryCode: 'CN', operatorCount: 11, flightCount: 723, environmentRisk: 5.5 }, // 中风险
  { id: 'CTU', name: 'Chengdu Shuangliu', nameZh: '成都・双流', code: 'CTU', lat: 30.5785, lon: 103.9471, color: getRiskColor(5.2), countryCode: 'CN', operatorCount: 9, flightCount: 567, environmentRisk: 5.2 }, // 中风险
  
  // ========== 低风险机场 (3个) ==========
  { id: 'WTS', name: 'Wutai Mountain', nameZh: AIRPORT_NAMES_ZH['WTS'] || '五台山', code: 'WTS', lat: 38.7244, lon: 113.2556, color: getRiskColor(3.8), countryCode: 'CN', operatorCount: 8, flightCount: 234, environmentRisk: 3.8 }, // 低风险
  { id: 'XIY', name: 'Xi\'an Xianyang', nameZh: '西安・咸阳', code: 'XIY', lat: 34.4471, lon: 108.7516, color: getRiskColor(3.2), countryCode: 'CN', operatorCount: 7, flightCount: 345, environmentRisk: 3.2 }, // 低风险
  { id: 'KMG', name: 'Kunming Changshui', nameZh: '昆明・长水', code: 'KMG', lat: 25.1019, lon: 102.9292, color: getRiskColor(2.8), countryCode: 'CN', operatorCount: 6, flightCount: 289, environmentRisk: 2.8 }, // 低风险
  
  // ========== 国外机场（用于国外航线） ==========
  { id: 'NRT', name: 'Tokyo Narita', nameZh: AIRPORT_NAMES_ZH['NRT'] || '东京・成田', code: 'NRT', lat: 35.7720, lon: 140.3929, color: getRiskColor(3.4), countryCode: 'JP', operatorCount: 13, flightCount: 893, environmentRisk: 3.4 }, // 增加1条（FL006）
  { id: 'SIN', name: 'Singapore Changi', nameZh: AIRPORT_NAMES_ZH['SIN'] || '新加坡・樟宜', code: 'SIN', lat: 1.3644, lon: 103.9915, color: getRiskColor(4.2), countryCode: 'SG', operatorCount: 21, flightCount: 1347, environmentRisk: 4.2 }, // 增加2条（FL006, FL007）
  { id: 'DXB', name: 'Dubai International', nameZh: AIRPORT_NAMES_ZH['DXB'] || '迪拜', code: 'DXB', lat: 25.2532, lon: 55.3657, color: getRiskColor(1.5), countryCode: 'AE', operatorCount: 8, flightCount: 457, environmentRisk: 1.5 }, // 极低风险（绿色），增加1条（FL007）
  { id: 'LHR', name: 'London Heathrow', nameZh: AIRPORT_NAMES_ZH['LHR'] || '伦敦・希思罗', code: 'LHR', lat: 51.4700, lon: -0.4543, color: getRiskColor(1.8), countryCode: 'GB', operatorCount: 10, flightCount: 678, environmentRisk: 1.8 }, // 极低风险（绿色）
]

// 统一航班数据
// 包含：3条国内航线 + 2条国外航线 + 2条国外到国外航线（绿色风险）
export const FLIGHTS: Flight[] = [
  // ========== 国内航线 (3条) ==========
  // 国内航线1: 北京 -> 上海
  { 
    id: 'FL001', 
    flightNumber: 'CA1234', 
    fromAirport: 'PEK', 
    fromAirportZh: '北京・首都', 
    toAirport: 'PVG', 
    toAirportZh: '上海・浦东', 
    scheduledDeparture: '08:30', 
    estimatedDeparture: '08:30', 
    scheduledArrival: '10:45', 
    estimatedArrival: '10:45', 
    status: '巡航中', 
    humanRisk: 2.1, 
    machineRisk: 2.0, 
    environmentRisk: 6.5, 
    airportId: 'PEK',
    aircraftNumber: 'B-1234',
    aircraftType: 'A320',
    largeAircraftType: '窄体机',
    pfId: '20001',
    pfTechnology: '教员',
    operatingUnit: '北京',
    crewMembers: [
      { personId: 'P001', role: 'Tb' },
      { personId: 'P003', role: 'F5' },
      { personId: 'P004', role: 'S2' }
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
  // 国内航线2: 广州 -> 上海
  { 
    id: 'FL002', 
    flightNumber: 'CZ5678', 
    fromAirport: 'CAN', 
    fromAirportZh: '广州・白云', 
    toAirport: 'PVG', 
    toAirportZh: '上海・浦东', 
    scheduledDeparture: '14:20', 
    estimatedDeparture: '14:20', 
    scheduledArrival: '16:45', 
    estimatedArrival: '16:45', 
    status: '未起飞', 
    humanRisk: 1.8, 
    machineRisk: 1.9, 
    environmentRisk: 7.2, 
    airportId: 'CAN',
    aircraftNumber: 'B-5678',
    aircraftType: 'A321',
    largeAircraftType: '窄体机',
    pfId: '20003',
    pfTechnology: '第一副驾驶',
    operatingUnit: '广州',
    crewMembers: [
      { personId: 'P002', role: 'Tb' },
      { personId: 'P003', role: 'F5' },
      { personId: 'P004', role: 'S2' }
    ],
    dispatcher: '李明',
    alternateAirport: '杭州ZSHC',
    riskValues: {
      taxiOut: 0.42,
      takeoff: 0.48,
      cruise: 0.12,
      landing: 0.45,
      taxiIn: 0.08
    },
    predictedRisks: [
      { type: '重着陆', severity: 'orange' }
    ]
  },
  // 国内航线3: 五台山 -> 上海
  { 
    id: 'FL003', 
    flightNumber: 'MU5862', 
    fromAirport: 'WTS', 
    fromAirportZh: '五台山', 
    toAirport: 'PVG', 
    toAirportZh: '上海・浦东', 
    scheduledDeparture: '17:05', 
    estimatedDeparture: '17:05', 
    scheduledArrival: '19:20', 
    estimatedArrival: '19:20', 
    status: '未起飞', 
    humanRisk: 1.9, 
    machineRisk: 1.9, 
    environmentRisk: 7.9, 
    airportId: 'WTS',
    aircraftNumber: 'B-3089',
    aircraftType: 'A319',
    largeAircraftType: '窄体机',
    pfId: '20001',
    pfTechnology: '教员',
    operatingUnit: '上海',
    crewMembers: [
      { personId: 'P001', role: 'Tb' },
      { personId: 'P002', role: 'F5' },
      { personId: 'P004', role: 'S2' }
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
  
  // ========== 国外航线 (2条) ==========
  // 国外航线1: 北京 -> 东京
  { 
    id: 'FL004', 
    flightNumber: 'CA925', 
    fromAirport: 'PEK', 
    fromAirportZh: '北京・首都', 
    toAirport: 'NRT', 
    toAirportZh: '东京・成田', 
    scheduledDeparture: '09:00', 
    estimatedDeparture: '09:00', 
    scheduledArrival: '13:30', 
    estimatedArrival: '13:30', 
    status: '巡航中', 
    humanRisk: 2.5, 
    machineRisk: 2.3, 
    environmentRisk: 6.8, 
    airportId: 'PEK',
    aircraftNumber: 'B-7890',
    aircraftType: 'B777',
    largeAircraftType: '宽体机',
    pfId: '20005',
    pfTechnology: '机长',
    operatingUnit: '北京',
    crewMembers: [
      { personId: 'P005', role: 'Tb' },
      { personId: 'P001', role: 'F5' },
      { personId: 'P003', role: 'S2' }
    ],
    dispatcher: '张伟',
    alternateAirport: '大阪KIX',
    riskValues: {
      taxiOut: 0.50,
      takeoff: 0.55,
      cruise: 0.20,
      landing: 0.52,
      taxiIn: 0.12
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' },
      { type: '风切变', severity: 'orange' }
    ]
  },
  // 国外航线2: 上海 -> 新加坡
  { 
    id: 'FL005', 
    flightNumber: 'MU567', 
    fromAirport: 'PVG', 
    fromAirportZh: '上海・浦东', 
    toAirport: 'SIN', 
    toAirportZh: '新加坡・樟宜', 
    scheduledDeparture: '11:20', 
    estimatedDeparture: '11:20', 
    scheduledArrival: '16:45', 
    estimatedArrival: '16:45', 
    status: '巡航中', 
    humanRisk: 2.2, 
    machineRisk: 2.1, 
    environmentRisk: 7.1, 
    airportId: 'PVG',
    aircraftNumber: 'B-3456',
    aircraftType: 'A330',
    largeAircraftType: '宽体机',
    pfId: '20001',
    pfTechnology: '教员',
    operatingUnit: '上海',
    crewMembers: [
      { personId: 'P001', role: 'Tb' },
      { personId: 'P002', role: 'F5' },
      { personId: 'P004', role: 'S2' }
    ],
    dispatcher: '王芳',
    alternateAirport: '吉隆坡KUL',
    riskValues: {
      taxiOut: 0.48,
      takeoff: 0.52,
      cruise: 0.18,
      landing: 0.50,
      taxiIn: 0.10
    },
    predictedRisks: [
      { type: '不稳定进近', severity: 'yellow' }
    ]
  },
  
  // ========== 国外到国外航线 (2条，绿色风险) ==========
  // 国外到国外航线1: 东京 -> 新加坡
  { 
    id: 'FL006', 
    flightNumber: 'JL701', 
    fromAirport: 'NRT', 
    fromAirportZh: '东京・成田', 
    toAirport: 'SIN', 
    toAirportZh: '新加坡・樟宜', 
    scheduledDeparture: '10:00', 
    estimatedDeparture: '10:00', 
    scheduledArrival: '15:30', 
    estimatedArrival: '15:30', 
    status: '巡航中', 
    humanRisk: 1.2, 
    machineRisk: 1.1, 
    environmentRisk: 1.5, // 绿色风险
    airportId: 'NRT',
    aircraftNumber: 'B-9012',
    aircraftType: 'B787',
    largeAircraftType: '宽体机',
    pfId: '20009',
    pfTechnology: '机长',
    operatingUnit: '国际',
    crewMembers: [
      { personId: 'P009', role: 'Tb' },
      { personId: 'P010', role: 'F5' },
      { personId: 'P011', role: 'S2' }
    ],
    dispatcher: '国际调度',
    alternateAirport: '吉隆坡KUL',
    riskValues: {
      taxiOut: 0.25,
      takeoff: 0.28,
      cruise: 0.08,
      landing: 0.26,
      taxiIn: 0.05
    },
    predictedRisks: []
  },
  // 国外到国外航线2: 新加坡 -> 迪拜
  { 
    id: 'FL007', 
    flightNumber: 'EK405', 
    fromAirport: 'SIN', 
    fromAirportZh: '新加坡・樟宜', 
    toAirport: 'DXB', 
    toAirportZh: '迪拜', 
    scheduledDeparture: '14:30', 
    estimatedDeparture: '14:30', 
    scheduledArrival: '18:45', 
    estimatedArrival: '18:45', 
    status: '巡航中', 
    humanRisk: 1.0, 
    machineRisk: 0.9, 
    environmentRisk: 1.2, // 绿色风险
    airportId: 'SIN',
    aircraftNumber: 'B-7891',
    aircraftType: 'A380',
    largeAircraftType: '宽体机',
    pfId: '20010',
    pfTechnology: '机长',
    operatingUnit: '国际',
    crewMembers: [
      { personId: 'P010', role: 'Tb' },
      { personId: 'P011', role: 'F5' },
      { personId: 'P012', role: 'S2' }
    ],
    dispatcher: '国际调度',
    alternateAirport: '多哈DOH',
    riskValues: {
      taxiOut: 0.22,
      takeoff: 0.25,
      cruise: 0.06,
      landing: 0.24,
      taxiIn: 0.04
    },
    predictedRisks: []
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