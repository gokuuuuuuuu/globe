// 从CSV读取机场编码数据（三字码和四字码）的辅助函数

interface AirportCodeMap {
  [key: string]: {
    code3: string // 三字码
    code4: string // 四字码
  }
}

let airportCodeCache: AirportCodeMap | null = null

// 从CSV读取机场编码数据并缓存
async function loadAirportCodeData(): Promise<AirportCodeMap> {
  if (airportCodeCache) {
    return airportCodeCache
  }

  try {
    const response = await fetch('/data.csv')
    const text = await response.text()
    const lines = text.split('\n')
    
    if (lines.length < 2) {
      return {}
    }

    // 解析CSV头部
    const headers = lines[0].split(',')
    const fromCode3Idx = headers.findIndex(h => h.includes('起飞机场三字码'))
    const fromCode4Idx = headers.findIndex(h => h.includes('起飞机场四字码'))
    const toCode3Idx = headers.findIndex(h => h.includes('降落机场三字码'))
    const toCode4Idx = headers.findIndex(h => h.includes('降落机场四字码'))

    if (fromCode3Idx === -1 || fromCode4Idx === -1 || toCode3Idx === -1 || toCode4Idx === -1) {
      console.warn('无法找到CSV中的机场编码列')
      return {}
    }

    const codeMap: AirportCodeMap = {}

    // 解析CSV数据（处理引号内的逗号）
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // 简单的CSV解析（处理引号）
      const row: string[] = []
      let current = ''
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current)
          current = ''
        } else {
          current += char
        }
      }
      row.push(current) // 最后一个字段

      if (row.length <= Math.max(fromCode3Idx, fromCode4Idx, toCode3Idx, toCode4Idx)) {
        continue
      }

      // 处理起飞机场编码
      const fromCode3 = row[fromCode3Idx]?.trim()
      const fromCode4 = row[fromCode4Idx]?.trim()
      if (fromCode3 && fromCode4 && fromCode3 !== 'nan' && fromCode4 !== 'nan') {
        if (!codeMap[fromCode3]) {
          codeMap[fromCode3] = { code3: fromCode3, code4: fromCode4 }
        }
      }

      // 处理降落机场编码
      const toCode3 = row[toCode3Idx]?.trim()
      const toCode4 = row[toCode4Idx]?.trim()
      if (toCode3 && toCode4 && toCode3 !== 'nan' && toCode4 !== 'nan') {
        if (!codeMap[toCode3]) {
          codeMap[toCode3] = { code3: toCode3, code4: toCode4 }
        }
      }
    }

    airportCodeCache = codeMap
    return codeMap
  } catch (error) {
    console.error('加载机场编码数据失败:', error)
    return {}
  }
}

// 根据三字码获取机场编码信息
export async function getAirportCodes(code3: string): Promise<{ code3: string; code4: string } | null> {
  const codeMap = await loadAirportCodeData()
  return codeMap[code3] || null
}

// 批量更新航班的机场编码信息
export async function enrichFlightWithAirportCodes(flight: any): Promise<any> {
  const codeMap = await loadAirportCodeData()
  
  // 更新起飞机场编码
  if (flight.fromAirport && codeMap[flight.fromAirport]) {
    flight.fromAirportCode3 = codeMap[flight.fromAirport].code3
    flight.fromAirportCode4 = codeMap[flight.fromAirport].code4
  }
  
  // 更新降落机场编码
  if (flight.toAirport && codeMap[flight.toAirport]) {
    flight.toAirportCode3 = codeMap[flight.toAirport].code3
    flight.toAirportCode4 = codeMap[flight.toAirport].code4
  }
  
  return flight
}

// 预加载机场编码数据
export function preloadAirportCodeData(): void {
  loadAirportCodeData().catch(err => {
    console.error('预加载机场编码数据失败:', err)
  })
}
