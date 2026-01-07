// 从CSV读取metar报文数据的辅助函数
// 由于FLIGHTS数据量大，采用运行时匹配的方式

interface MetarMap {
  [key: string]: string // key格式: "航班号_起飞机场_降落机场"
}

let metarCache: MetarMap | null = null

// 从CSV读取metar数据并缓存
async function loadMetarData(): Promise<MetarMap> {
  if (metarCache) {
    return metarCache
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
    const flightNumIdx = headers.findIndex(h => h.includes('航班号'))
    const metarIdx = headers.findIndex(h => h.includes('降落metar报文'))
    const fromAirportIdx = headers.findIndex(h => h.includes('起飞机场三字码'))
    const toAirportIdx = headers.findIndex(h => h.includes('降落机场三字码'))

    if (flightNumIdx === -1 || metarIdx === -1 || fromAirportIdx === -1 || toAirportIdx === -1) {
      console.warn('无法找到CSV中的必要列')
      return {}
    }

    const metarMap: MetarMap = {}

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

      if (row.length <= Math.max(flightNumIdx, metarIdx, fromAirportIdx, toAirportIdx)) {
        continue
      }

      const flightNum = row[flightNumIdx]?.trim()
      const metar = row[metarIdx]?.trim()
      const fromAirport = row[fromAirportIdx]?.trim()
      const toAirport = row[toAirportIdx]?.trim()

      if (flightNum && metar && metar !== 'nan' && fromAirport && toAirport) {
        const key = `${flightNum}_${fromAirport}_${toAirport}`
        if (!metarMap[key] || metarMap[key] === 'nan') {
          metarMap[key] = metar
        }
      }
    }

    metarCache = metarMap
    return metarMap
  } catch (error) {
    console.error('加载metar数据失败:', error)
    return {}
  }
}

// 根据航班信息获取metar报文
export async function getMetarReport(
  flightNumber: string,
  fromAirport: string,
  toAirport: string
): Promise<string | undefined> {
  const metarMap = await loadMetarData()
  const key = `${flightNumber}_${fromAirport}_${toAirport}`
  return metarMap[key]
}

// 预加载metar数据（可选，用于提前加载）
export function preloadMetarData(): void {
  loadMetarData().catch(err => {
    console.error('预加载metar数据失败:', err)
  })
}
