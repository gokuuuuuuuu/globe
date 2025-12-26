import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 CSV 文件
const csvPath = path.join(__dirname, '../public/data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// 解析 CSV（简单解析，假设没有复杂的引号嵌套）
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

// 找到各列的索引
const headerMap = {};
headers.forEach((h, i) => {
  headerMap[h.trim()] = i;
});

// 风险等级到数字的映射（用于颜色计算）
function riskLevelToNumber(riskLevel) {
  if (riskLevel === '高风险') return 7;
  if (riskLevel === '中风险') return 5;
  if (riskLevel === '低风险') return 1;
  return 1; // 默认低风险
}

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
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// 处理数据
const flights = [];
const airports = new Map(); // 用于聚合机场数据

// 从第二行开始处理（跳过表头）
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const row = parseCSVLine(line);
  
  // 只处理 2024-07-25 的数据
  const flightDate = row[headerMap['航班日期']];
  if (flightDate !== '2024-07-25') continue;
  
  // 提取字段
  const flightNumber = row[headerMap['航班号']] || '';
  const departureTime = row[headerMap['起飞时间']] || '';
  const arrivalTime = row[headerMap['降落时间']] || '';
  const aircraftNumber = row[headerMap['机号']] || '';
  const aircraftType = row[headerMap['机型']] || '';
  const largeAircraftType = row[headerMap['大机型']] || '';
  const pfId = row[headerMap['PF工号']] || '';
  const pfTechnology = row[headerMap['PF技术等级']] || '';
  const operatingUnit = row[headerMap['执飞单位名称']] || '';
  const fromAirportCode3 = row[headerMap['起飞机场三字码']] || '';
  const fromAirportCode4 = row[headerMap['起飞机场四字码']] || '';
  const toAirportCode3 = row[headerMap['降落机场三字码']] || '';
  const toAirportCode4 = row[headerMap['降落机场四字码']] || '';
  const toAirportLon = parseFloat(row[headerMap['机场经度']]) || 0;
  const toAirportLat = parseFloat(row[headerMap['机场纬度']]) || 0;
  const fromAirportLon = parseFloat(row[headerMap['起飞机场经度']]) || 0;
  const fromAirportLat = parseFloat(row[headerMap['起飞机场纬度']]) || 0;
  const toAirportName = row[headerMap['降落机场名称']] || '';
  const riskLevel = row[headerMap['风险等级']] || '低风险';
  
  // 使用三字码作为机场代码
  const fromAirport = fromAirportCode3;
  const toAirport = toAirportCode3;
  
  if (!fromAirport || !toAirport) continue;
  
  // 生成航班 ID
  const flightId = `FL${String(flights.length + 1).padStart(4, '0')}`;
  
  // 解析时间
  const parseTime = (timeStr) => {
    if (!timeStr) return '';
    // 格式: 2024-07-25 11:55:00
    const match = timeStr.match(/(\d{2}):(\d{2}):\d{2}/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return '';
  };
  
  const scheduledDeparture = parseTime(departureTime);
  const scheduledArrival = parseTime(arrivalTime);
  
  // 判断状态（简化处理，根据当前时间判断）
  const now = new Date();
  const depTime = new Date(departureTime);
  const arrTime = new Date(arrivalTime);
  let status = '未起飞';
  if (now > arrTime) {
    status = '已落地';
  } else if (now > depTime) {
    status = '巡航中';
  }
  
  // 风险值：将风险等级转换为数字
  const environmentRisk = riskLevelToNumber(riskLevel);
  // 人风险和机风险暂时使用默认值（CSV 中没有这些字段）
  const humanRisk = 2;
  const machineRisk = 2;
  
  // 创建航班对象
  const flight = {
    id: flightId,
    flightNumber: flightNumber,
    fromAirport: fromAirport,
    fromAirportZh: fromAirport, // 暂时使用代码，后续可以从机场名称映射
    toAirport: toAirport,
    toAirportZh: toAirportName || toAirport,
    scheduledDeparture: scheduledDeparture,
    estimatedDeparture: scheduledDeparture,
    scheduledArrival: scheduledArrival,
    estimatedArrival: scheduledArrival,
    status: status,
    humanRisk: humanRisk,
    machineRisk: machineRisk,
    environmentRisk: environmentRisk,
    riskLevel: riskLevel, // 保留风险等级文字
    airportId: fromAirport,
    aircraftNumber: aircraftNumber,
    aircraftType: aircraftType,
    largeAircraftType: largeAircraftType,
    pfId: pfId,
    pfTechnology: pfTechnology,
    operatingUnit: operatingUnit,
  };
  
  flights.push(flight);
  
  // 聚合机场数据
  // 起飞机场
  if (!airports.has(fromAirport)) {
    airports.set(fromAirport, {
      id: fromAirport,
      code: fromAirport,
      lat: fromAirportLat,
      lon: fromAirportLon,
      name: fromAirport,
      nameZh: fromAirport,
      flightCount: 0,
      operatorCount: new Set(),
      riskLevels: [],
    });
  }
  const fromAirportData = airports.get(fromAirport);
  fromAirportData.flightCount++;
  if (operatingUnit) {
    fromAirportData.operatorCount.add(operatingUnit);
  }
  fromAirportData.riskLevels.push(riskLevel);
  
  // 降落机场
  if (!airports.has(toAirport)) {
    airports.set(toAirport, {
      id: toAirport,
      code: toAirport,
      lat: toAirportLat,
      lon: toAirportLon,
      name: toAirport,
      nameZh: toAirportName || toAirport,
      flightCount: 0,
      operatorCount: new Set(),
      riskLevels: [],
    });
  }
  const toAirportData = airports.get(toAirport);
  toAirportData.flightCount++;
  if (operatingUnit) {
    toAirportData.operatorCount.add(operatingUnit);
  }
  toAirportData.riskLevels.push(riskLevel);
}

// 计算机场的环境风险值（取到达和起飞航线中风险最高的）
function calculateAirportRisk(riskLevels) {
  if (riskLevels.length === 0) return 1;
  
  // 将风险等级转换为数字，取最高值
  let maxRisk = 1; // 默认低风险
  
  riskLevels.forEach(level => {
    const riskValue = riskLevelToNumber(level);
    if (riskValue > maxRisk) {
      maxRisk = riskValue;
    }
  });
  
  return maxRisk;
}

// 生成机场数据
const airportList = Array.from(airports.values()).map(airport => {
  const environmentRisk = calculateAirportRisk(airport.riskLevels);
  return {
    id: airport.id,
    name: `${airport.name} Airport`,
    nameZh: airport.nameZh,
    code: airport.code,
    lat: airport.lat,
    lon: airport.lon,
    color: getRiskColor(environmentRisk),
    countryCode: 'CN', // 默认中国
    operatorCount: airport.operatorCount.size,
    flightCount: airport.flightCount,
    environmentRisk: environmentRisk,
  };
});

// 风险颜色函数（复制自原文件）
function getRiskColor(environmentRisk) {
  if (environmentRisk >= 7) {
    return '#ff1744'; // 高风险 - 鲜艳红色
  } else if (environmentRisk >= 5) {
    return '#ff6f00'; // 中风险 - 鲜艳橙色
  } else if (environmentRisk >= 1) {
    return '#4caf50'; // 低风险 - 鲜艳绿色
  } else {
    return '#4caf50'; // 极低风险 - 鲜艳绿色
  }
}

// 转义字符串中的特殊字符（用于生成 TypeScript 代码）
function escapeString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')  // 先转义反斜杠
    .replace(/'/g, "\\'")    // 转义单引号
    .replace(/\n/g, '\\n')   // 转义换行符
    .replace(/\r/g, '\\r')   // 转义回车符
    .replace(/\t/g, '\\t');  // 转义制表符
}

// 生成 TypeScript 文件内容
const outputPath = path.join(__dirname, '../src/data/flightDataFromCSV.ts');

const fileContent = `// 统一的数据源：机场和航线信息
// 数据来源：data.csv (2024-07-25)
// 自动生成，请勿手动编辑

// 机场中文名称映射（从 CSV 数据中提取）
export const AIRPORT_NAMES_ZH: Record<string, string> = {
${airportList.map(airport => `  '${airport.code}': '${escapeString(airport.nameZh)}',`).join('\n')}
}

// 根据环境风险值获取对应的亮色
export function getRiskColor(environmentRisk: number): string {
  if (environmentRisk >= 7) {
    return '#ff1744' // 高风险 - 鲜艳红色（Material Design Red A400）
  } else if (environmentRisk >= 5) {
    return '#ff6f00' // 中风险 - 鲜艳橙色（Material Design Deep Orange A700）
  } else if (environmentRisk >= 1) {
    return '#4caf50' // 低风险 - 鲜艳绿色（Material Design Green 500）
  } else {
    return '#4caf50' // 极低风险 - 鲜艳绿色（Material Design Green 500）
  }
}

// 根据机的风险值获取对应的亮色
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
  environmentRisk: number // 环风险值（数字，用于颜色计算）
  riskLevel: string // 风险等级（文字：高风险、中风险、低风险）
  airportId?: string // 关联的机场ID（用于筛选）
  // 详细信息
  aircraftNumber?: string // 机号
  aircraftType?: string // 机型
  largeAircraftType?: string // 大机型
  pfId?: string // PF工号
  pfTechnology?: string // PF技术
  operatingUnit?: string // 执飞单位
  crewMembers?: Array<{ personId: string; role: string }> // 机组成员
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
${airportList.map(airport => `  { id: '${airport.id}', name: '${escapeString(airport.name)}', nameZh: '${escapeString(airport.nameZh)}', code: '${airport.code}', lat: ${airport.lat}, lon: ${airport.lon}, color: getRiskColor(${airport.environmentRisk}), countryCode: '${airport.countryCode}', operatorCount: ${airport.operatorCount}, flightCount: ${airport.flightCount}, environmentRisk: ${airport.environmentRisk} },`).join('\n')}
]

// 统一航班数据
export const FLIGHTS: Flight[] = [
${flights.map(flight => `  { 
    id: '${escapeString(flight.id)}', 
    flightNumber: '${escapeString(flight.flightNumber)}', 
    fromAirport: '${escapeString(flight.fromAirport)}', 
    fromAirportZh: '${escapeString(flight.fromAirportZh)}', 
    toAirport: '${escapeString(flight.toAirport)}', 
    toAirportZh: '${escapeString(flight.toAirportZh)}', 
    scheduledDeparture: '${escapeString(flight.scheduledDeparture)}', 
    estimatedDeparture: '${escapeString(flight.estimatedDeparture)}', 
    scheduledArrival: '${escapeString(flight.scheduledArrival)}', 
    estimatedArrival: '${escapeString(flight.estimatedArrival)}', 
    status: '${escapeString(flight.status)}', 
    humanRisk: ${flight.humanRisk}, 
    machineRisk: ${flight.machineRisk}, 
    environmentRisk: ${flight.environmentRisk}, 
    riskLevel: '${escapeString(flight.riskLevel)}',
    airportId: '${escapeString(flight.airportId)}',
    aircraftNumber: '${escapeString(flight.aircraftNumber)}',
    aircraftType: '${escapeString(flight.aircraftType)}',
    largeAircraftType: '${escapeString(flight.largeAircraftType)}',
    pfId: '${escapeString(flight.pfId)}',
    pfTechnology: '${escapeString(flight.pfTechnology)}',
    operatingUnit: '${escapeString(flight.operatingUnit)}',
  },`).join('\n')}
]

// 根据环境风险值计算风险区间和风险值（用于显示）
export function calculateRiskFromEnvironmentRisk(environmentRisk: number): { riskValue: string; riskZone: 'red' | 'orange' | 'yellow' | 'green' } {
  if (environmentRisk >= 7) {
    return { riskValue: '高风险', riskZone: 'red' }
  } else if (environmentRisk >= 5) {
    return { riskValue: '中风险', riskZone: 'orange' }
  } else if (environmentRisk >= 1) {
    return { riskValue: '低风险', riskZone: 'green' }
  } else {
    return { riskValue: '低风险', riskZone: 'green' }
  }
}

// 根据机场代码获取机场信息
export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find(airport => airport.code === code || airport.id === code)
}

// 省份机场映射（用于按省份过滤航线）
// 格式: { 'CN-省份名': ['机场代码1', '机场代码2', ...] }
export const PROVINCE_AIRPORTS: Record<string, string[]> = {
  // 根据实际数据动态生成（当前为空，可根据需要添加）
}
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');

console.log(`处理完成！`);
console.log(`- 航班数量: ${flights.length}`);
console.log(`- 机场数量: ${airportList.length}`);
console.log(`- 输出文件: ${outputPath}`);

