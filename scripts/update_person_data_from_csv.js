import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 CSV 文件
const csvPath = path.join(__dirname, '../public/data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

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
const lines = csvContent.split('\n');
const header = parseCSVLine(lines[0]);
const headerMap = {};
header.forEach((col, index) => {
  headerMap[col] = index;
});

// 建立 机队名称 -> PF工号 的映射
// 规则：每个机队使用第一个出现的PF工号，因为同一机队的工号应该一致
const teamToPfIdMap = new Map(); // Map<机队名称, PF工号>

// 过滤 2024-07-25 的数据
const targetDate = '2024-07-25';

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const row = parseCSVLine(lines[i]);
  const flightDate = row[headerMap['航班日期']];
  
  if (flightDate === targetDate) {
    const teamName = row[headerMap['PF机队名称']] || '';
    const pfId = row[headerMap['PF工号']] || '';
    
    // 清理机队名称（去掉可能的空格和特殊字符）
    const cleanTeamName = teamName.trim();
    
    if (cleanTeamName && pfId && cleanTeamName !== 'nan' && pfId !== 'nan') {
      // 如果这个机队还没有映射，建立映射
      if (!teamToPfIdMap.has(cleanTeamName)) {
        // 去掉0x前缀，直接显示数字部分
        let cleanPfId = pfId.trim();
        // 如果有0x或0X前缀，去掉它
        if (cleanPfId.toLowerCase().startsWith('0x')) {
          cleanPfId = cleanPfId.substring(2);
        }
        teamToPfIdMap.set(cleanTeamName, cleanPfId);
      }
    }
  }
}

console.log(`从 CSV 中提取了 ${teamToPfIdMap.size} 个机队的PF工号映射`);

// 读取 personData.ts 文件
const personDataPath = path.join(__dirname, '../src/data/personData.ts');
let personDataContent = fs.readFileSync(personDataPath, 'utf-8');

// 1. 移除 generatePfId 函数（如果存在）
const generatePfIdRegex = /\/\/ 随机生成PF工号.*?\nfunction generatePfId[^}]*\}[^}]*\}\n/s;
personDataContent = personDataContent.replace(generatePfIdRegex, '');

// 2. 更新或创建 CSV_TEAM_TO_PFID_MAP 映射
// 先检查是否已存在 CSV_TEAM_PERSONS_DATA，如果有则替换
const csvTeamPersonsDataRegex = /\/\/ 从CSV中提取的PF工号.*?const CSV_TEAM_PERSONS_DATA:[\s\S]*?\n\}\n/;
// 匹配所有CSV_TEAM_TO_PFID_MAP定义（可能有多个重复的）
const csvTeamToPfIdRegex = /\/\/ 从CSV中提取的机队名称到PF工号的映射[\s\S]*?const CSV_TEAM_TO_PFID_MAP:[\s\S]*?\n\}[^}]*?\n/g;

// 生成新的映射数据结构：机队名称 -> PF工号
const teamPfIdMapping = Array.from(teamToPfIdMap.entries())
  .map(([teamName, pfId]) => `  '${teamName}': '${pfId}'`)
  .join(',\n');

const newMapping = `// 从CSV中提取的机队名称到PF工号的映射
// 规则：每个机队的所有成员使用相同的PF工号（从data.csv中提取）
const CSV_TEAM_TO_PFID_MAP: Record<string, string> = {
${teamPfIdMapping}
}
`;

// 先删除所有旧的 CSV_TEAM_PERSONS_DATA
if (csvTeamPersonsDataRegex.test(personDataContent)) {
  personDataContent = personDataContent.replace(csvTeamPersonsDataRegex, '');
}

// 删除所有旧的 CSV_TEAM_TO_PFID_MAP 定义（可能有多个重复的）
const matches = personDataContent.match(csvTeamToPfIdRegex);
if (matches) {
  matches.forEach(match => {
    personDataContent = personDataContent.replace(match, '');
  });
}

// 在 CSV_TEAM_NAMES 之后插入新的映射
const csvTeamNamesEnd = personDataContent.indexOf(']', personDataContent.indexOf('const CSV_TEAM_NAMES')) + 1;
if (csvTeamNamesEnd > 0) {
  const insertPos = personDataContent.indexOf('\n', csvTeamNamesEnd) + 1;
  personDataContent = personDataContent.slice(0, insertPos) + '\n' + newMapping + '\n' + personDataContent.slice(insertPos);
}

// 3. 更新 generateTeams 函数，使用新的映射方式
// 使用正则表达式匹配整个函数（更可靠）
const generateTeamsRegex = /function generateTeams\(\): Team\[\] \{[\s\S]*?\n  return teams\n\}/;
if (generateTeamsRegex.test(personDataContent)) {
  // 生成新的 generateTeams 函数
  const newGenerateTeamsFunction = `function generateTeams(): Team[] {
  const teams: Team[] = []
  let personIdCounter = 10000 // 从P10000开始，避免与现有数据冲突
  
  CSV_TEAM_NAMES.forEach((teamName) => {
    // 生成机队ID（如 "T94.0"）
    const teamId = \`T\${teamName.replace('队', '')}\`
    
    // 从CSV映射中获取该机队的PF工号（所有成员使用相同的PF工号）
    // 如果没有映射，使用随机数字（直接显示数字，不添加0x前缀）
    const teamPfId = CSV_TEAM_TO_PFID_MAP[teamName] || \`\${1000 + Math.floor(Math.random() * 9000)}\`
    
    // 生成机队成员（3-8人）
    const memberCount = 3 + Math.floor(Math.random() * 6)
    const teamPersons: Array<{pfId: string, tech: string}> = []
    
    for (let i = 0; i < memberCount; i++) {
      const rand = Math.random()
      let tech: string
      if (rand < 0.2) {
        tech = '教员'
      } else if (rand < 0.5) {
        tech = '机长'
      } else {
        tech = '第一副驾驶'
      }
      
      // 所有成员使用相同的PF工号（从CSV中提取的）
      teamPersons.push({pfId: teamPfId, tech})
    }
    
    // 选择分队长：优先选择教员，然后机长
    teamPersons.sort((a, b) => {
      const priorityA = a.tech === '教员' ? 3 : a.tech === '机长' ? 2 : 1
      const priorityB = b.tech === '教员' ? 3 : b.tech === '机长' ? 2 : 1
      return priorityB - priorityA
    })
    
    const leaderData = teamPersons[0]
    const membersData = teamPersons.slice(1)
    
    // 生成分队长
    const leaderAge = generateAge(leaderData.tech)
    const leaderFlightYears = generateFlightYears(leaderData.tech)
    const leaderTotalHours = generateTotalFlightHours(leaderData.tech, leaderFlightYears)
    const leaderCertifiedTypes = generateCertifiedAircraftTypes(leaderData.tech)
    
    const leader: Person = {
      id: \`P\${personIdCounter++}\`,
      name: generateRandomName(),
      pfId: leaderData.pfId,
      pfTechnology: leaderData.tech,
      teamId: teamId,
      riskValue: generateRiskValue(leaderData.tech),
      age: leaderAge,
      flightYears: leaderFlightYears,
      totalFlightHours: leaderTotalHours,
      recent90DaysFlightHours: generateRecent90DaysHours(),
      certifiedAircraftTypes: leaderCertifiedTypes,
      currentAircraftType: generateCurrentAircraftType(leaderCertifiedTypes),
    }
    
    // 生成其他成员（所有成员使用相同的PF工号）
    const members: Person[] = membersData.map((memberData) => {
      const memberAge = generateAge(memberData.tech)
      const memberFlightYears = generateFlightYears(memberData.tech)
      const memberTotalHours = generateTotalFlightHours(memberData.tech, memberFlightYears)
      const memberCertifiedTypes = generateCertifiedAircraftTypes(memberData.tech)
      
      return {
        id: \`P\${personIdCounter++}\`,
        name: generateRandomName(),
        pfId: memberData.pfId, // 使用相同的PF工号（从CSV中提取）
        pfTechnology: memberData.tech,
        teamId: teamId,
        riskValue: generateRiskValue(memberData.tech),
        age: memberAge,
        flightYears: memberFlightYears,
        totalFlightHours: memberTotalHours,
        recent90DaysFlightHours: generateRecent90DaysHours(),
        certifiedAircraftTypes: memberCertifiedTypes,
        currentAircraftType: generateCurrentAircraftType(memberCertifiedTypes),
      }
    })
    
    teams.push({
      id: teamId,
      name: teamName,
      leader: leader,
      members: members,
    })
  })
  
  // 按机队名称排序（数字排序）
  teams.sort((a, b) => {
    const numA = parseFloat(a.name.replace('队', ''))
    const numB = parseFloat(b.name.replace('队', ''))
    return numA - numB
  })
  
  return teams
}`;
  
  // 替换旧的函数
  personDataContent = personDataContent.replace(generateTeamsRegex, newGenerateTeamsFunction);
}

// 写入文件
fs.writeFileSync(personDataPath, personDataContent, 'utf-8');

console.log(`已更新 ${personDataPath}`);
console.log(`- 移除了 generatePfId 函数`);
console.log(`- 更新了机队到PF工号的映射（共 ${teamToPfIdMap.size} 个机队）`);
console.log(`- 更新了 generateTeams 函数，确保同一机队的所有成员使用相同的PF工号`);
