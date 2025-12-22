import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 CSV 文件
const csvPath = path.join(__dirname, '../public/data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// 解析 CSV 行（处理引号内的逗号）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 获取表头
const header = parseCSVLine(lines[0]);
const headerMap = {};
header.forEach((col, index) => {
  headerMap[col] = index;
});

// 过滤 2024-07-25 的数据
const targetDate = '2024-07-25';
const filteredRows = [];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const row = parseCSVLine(lines[i]);
  const flightDate = row[headerMap['航班日期']];
  if (flightDate === targetDate) {
    filteredRows.push(row);
  }
}

console.log(`找到 ${filteredRows.length} 条 ${targetDate} 的数据`);

// 机场名称映射（从机场名称中提取中文名）
function extractChineseName(airportName) {
  // 尝试从机场名称中提取中文名
  // 例如: "Guangzhou Baiyun International Airport" -> "广州・白云"
  const nameMap = {
    'Guangzhou Baiyun': '广州・白云',
    'Shanghai Pudong': '上海・浦东',
    'Beijing Capital': '北京・首都',
    'Beijing Daxing': '北京・大兴',
    'Shenzhen Bao\'an': '深圳・宝安',
    'Chengdu Shuangliu': '成都・双流',
    'Xi\'an Xianyang': '西安・咸阳',
    'Kunming Changshui': '昆明・长水',
    'Tokyo Narita': '东京・成田',
    'Singapore Changi': '新加坡・樟宜',
    'Dubai International': '迪拜',
    'London Heathrow': '伦敦・希思罗',
  };
  
  for (const [key, value] of Object.entries(nameMap)) {
    if (airportName.includes(key)) {
      return value;
    }
  }
  
  // 如果没有匹配，尝试从机场名称中提取
  return airportName.split(' ')[0] || airportName;
}

// 生成航班数据
const flights = [];
const airports = new Map(); // 用于收集机场信息
const persons = new Map(); // 用于收集人员信息

filteredRows.forEach((row, index) => {
  const flightNumber = row[headerMap['航班号']] || '';
  const departureTime = row[headerMap['起飞时间']] || '';
  const arrivalTime = row[headerMap['降落时间']] || '';
  const aircraftNumber = row[headerMap['机号']] || '';
  const aircraftType = row[headerMap['机型']] || '';
  const largeAircraftType = row[headerMap['大机型']] || '';
  const pfId = row[headerMap['PF工号']] || '';
  const pfTechnology = row[headerMap['PF技术等级']] || '';
  const operatingUnit = row[headerMap['执飞单位名称']] || '';
  const fromAirportCode = row[headerMap['起飞机场三字码']] || '';
  const toAirportCode = row[headerMap['降落机场三字码']] || '';
  const fromAirportLat = parseFloat(row[headerMap['起飞机场纬度']]) || 0;
  const fromAirportLon = parseFloat(row[headerMap['起飞机场经度']]) || 0;
  const toAirportLat = parseFloat(row[headerMap['机场纬度']]) || 0;
  const toAirportLon = parseFloat(row[headerMap['机场经度']]) || 0;
  const toAirportName = row[headerMap['降落机场名称']] || '';
  const riskLevel = row[headerMap['风险等级']] || '低风险';
  
  // 计算风险值（从风险等级转换）
  let environmentRisk = 2.0; // 默认低风险
  if (riskLevel === '高风险') {
    environmentRisk = 7.5;
  } else if (riskLevel === '中风险') {
    environmentRisk = 5.5;
  } else if (riskLevel === '低风险') {
    environmentRisk = 2.5;
  }
  
  // 生成航班 ID
  const flightId = `FL${String(index + 1).padStart(4, '0')}`;
  
  // 解析时间
  const parseTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // 确定航班状态
  let status = '未起飞';
  const now = new Date();
  const depTime = new Date(departureTime);
  const arrTime = new Date(arrivalTime);
  if (now > arrTime) {
    status = '已落地';
  } else if (now > depTime) {
    status = '巡航中';
  }
  
  // 从机场代码生成中文名称（简化处理）
  const getAirportZhName = (code) => {
    return code || '未知机场';
  };
  
  // 生成航班对象
  const flight = {
    id: flightId,
    flightNumber: flightNumber,
    fromAirport: fromAirportCode,
    fromAirportZh: getAirportZhName(fromAirportCode),
    toAirport: toAirportCode,
    toAirportZh: extractChineseName(toAirportName) || getAirportZhName(toAirportCode),
    scheduledDeparture: parseTime(departureTime),
    estimatedDeparture: parseTime(departureTime),
    scheduledArrival: parseTime(arrivalTime),
    estimatedArrival: parseTime(arrivalTime),
    status: status,
    humanRisk: 2.0, // 默认值，CSV中没有对应字段
    machineRisk: 2.0, // 默认值，CSV中没有对应字段
    environmentRisk: environmentRisk,
    airportId: fromAirportCode,
    aircraftNumber: aircraftNumber,
    aircraftType: aircraftType,
    largeAircraftType: largeAircraftType,
    pfId: pfId,
    pfTechnology: pfTechnology,
    operatingUnit: operatingUnit,
  };
  
  flights.push(flight);
  
  // 收集机场信息
  if (fromAirportCode && !airports.has(fromAirportCode)) {
    airports.set(fromAirportCode, {
      code: fromAirportCode,
      lat: fromAirportLat,
      lon: fromAirportLon,
      name: `${fromAirportCode} Airport`, // 使用代码作为名称
    });
  }
  if (toAirportCode && !airports.has(toAirportCode)) {
    airports.set(toAirportCode, {
      code: toAirportCode,
      lat: toAirportLat,
      lon: toAirportLon,
      name: toAirportName || `${toAirportCode} Airport`,
    });
  }
  
  // 收集人员信息
  if (pfId && !persons.has(pfId)) {
    const teamName = row[headerMap['PF机队名称']] || '';
    persons.set(pfId, {
      pfId: pfId,
      pfTechnology: pfTechnology,
      teamName: teamName,
      operatingUnit: operatingUnit,
    });
  }
});

console.log(`生成了 ${flights.length} 条航班数据`);
console.log(`收集了 ${airports.size} 个机场`);
console.log(`收集了 ${persons.size} 个人员`);

// 生成 flightData.ts
const flightDataContent = `// 统一的数据源：机场和航线信息
// 数据来源：data.csv (2024-07-25)

// 机场中文名称映射
export const AIRPORT_NAMES_ZH: Record<string, string> = {
${Array.from(airports.values()).map(airport => {
  const name = extractChineseName(airport.name);
  return `  '${airport.code}': '${name}',`;
}).join('\n')}
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
${Array.from(airports.values()).map((airport, index) => {
  // 计算该机场的航班数量和环境风险
  const airportFlights = flights.filter(f => f.fromAirport === airport.code || f.toAirport === airport.code);
  const flightCount = airportFlights.length;
  const avgRisk = airportFlights.length > 0 
    ? airportFlights.reduce((sum, f) => sum + f.environmentRisk, 0) / airportFlights.length 
    : 2.5;
  const operatorCount = new Set(airportFlights.map(f => f.operatingUnit)).size;
  
  const nameZh = extractChineseName(airport.name);
  const countryCode = airport.code.length === 3 ? 'CN' : 'XX'; // 简化处理
  
  return `  { id: '${airport.code}', name: '${airport.name}', nameZh: '${nameZh}', code: '${airport.code}', lat: ${airport.lat}, lon: ${airport.lon}, color: getRiskColor(${avgRisk.toFixed(1)}), countryCode: '${countryCode}', operatorCount: ${operatorCount}, flightCount: ${flightCount}, environmentRisk: ${avgRisk.toFixed(1)} },`;
}).join('\n')}
]

// 省份与机场的映射（仅针对当前示例中的中国机场）
export const PROVINCE_AIRPORTS: Record<string, string[]> = {
  // 根据实际数据动态生成
}

// 统一航班数据
export const FLIGHTS: Flight[] = [
${flights.map(flight => {
  return `  { 
    id: '${flight.id}', 
    flightNumber: '${flight.flightNumber}', 
    fromAirport: '${flight.fromAirport}', 
    fromAirportZh: '${flight.fromAirportZh}', 
    toAirport: '${flight.toAirport}', 
    toAirportZh: '${flight.toAirportZh}', 
    scheduledDeparture: '${flight.scheduledDeparture}', 
    estimatedDeparture: '${flight.estimatedDeparture}', 
    scheduledArrival: '${flight.scheduledArrival}', 
    estimatedArrival: '${flight.estimatedArrival}', 
    status: '${flight.status}', 
    humanRisk: ${flight.humanRisk}, 
    machineRisk: ${flight.machineRisk}, 
    environmentRisk: ${flight.environmentRisk}, 
    airportId: '${flight.airportId || flight.fromAirport}',
    aircraftNumber: '${flight.aircraftNumber}',
    aircraftType: '${flight.aircraftType}',
    largeAircraftType: '${flight.largeAircraftType}',
    pfId: '${flight.pfId}',
    pfTechnology: '${flight.pfTechnology}',
    operatingUnit: '${flight.operatingUnit}',
  },`;
}).join('\n')}
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
`;

// 生成 personData.ts
const personDataContent = `// 人员数据
// 数据来源：data.csv (2024-07-25)

// 人员接口
export interface Person {
  id: string
  name: string
  pfId: string // PF工号
  pfTechnology: string // PF技术等级
  teamId?: string // 所属机队ID
  riskValue?: number // 风险值（环境风险）
  age?: number // 年龄
  flightYears?: number // 飞行年限
  totalFlightHours?: number // 总飞行时长（小时）
  recent90DaysFlightHours?: number // 近90天飞行时长（小时）
  certifiedAircraftTypes?: string[] // 已认证机型
  currentAircraftType?: string // 当前执飞机型
}

// 机队接口
export interface Team {
  id: string
  name: string // 机队名称，如 "PF0001机队"
  leader: Person // 分队长
  members: Person[] // 成员列表
}

// 人员数据
// 注意：pfId 是 PF工号，不同人员可能有相同的 pfId（表示同一人不同角色）
// 但每个 Person 的 id 是唯一的
export const PERSONS: Person[] = [
${Array.from(persons.entries()).map(([pfId, person], index) => {
  const personId = `P${String(index + 1).padStart(4, '0')}`;
  const teamId = person.teamName ? `T${String(index + 1).padStart(3, '0')}` : undefined;
  
  return `  { 
    id: '${personId}', 
    name: '人员${index + 1}', 
    pfId: '${pfId}', 
    pfTechnology: '${person.pfTechnology}', 
    ${teamId ? `teamId: '${teamId}', ` : ''}
    riskValue: 2.5,
  },`;
}).join('\n')}
]

// 机队数据
export const TEAMS: Team[] = [
  // 根据实际数据动态生成
]

// 根据人员ID查找人员
export function getPersonById(id: string): Person | undefined {
  return PERSONS.find(p => p.id === id)
}

// 根据人员名称查找人员
export function getPersonByName(name: string): Person | undefined {
  return PERSONS.find(p => p.name === name)
}

// 根据机队ID查找机队
export function getTeamById(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id)
}

// 根据PF工号查找人员（用于统一航班数据中的pfId）
export function getPersonByPfId(pfId: string): Person | undefined {
  return PERSONS.find(p => p.pfId === pfId)
}
`;

// 写入文件
const flightDataPath = path.join(__dirname, '../src/data/flightData.ts');
const personDataPath = path.join(__dirname, '../src/data/personData.ts');

fs.writeFileSync(flightDataPath, flightDataContent, 'utf-8');
fs.writeFileSync(personDataPath, personDataContent, 'utf-8');

console.log(`已生成 ${flightDataPath}`);
console.log(`已生成 ${personDataPath}`);

