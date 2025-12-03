// 人员数据

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
  { 
    id: 'P001', 
    name: '李四', 
    pfId: '20001', 
    pfTechnology: '教员', 
    teamId: 'T001', 
    riskValue: 6.5,
    age: 38,
    flightYears: 12,
    totalFlightHours: 12000,
    recent90DaysFlightHours: 720,
    certifiedAircraftTypes: ['A320', 'A330'],
    currentAircraftType: 'A320-200'
  },
  { 
    id: 'P002', 
    name: '张强', 
    pfId: '20002', 
    pfTechnology: '教员', 
    teamId: 'T001', 
    riskValue: 5.8,
    age: 42,
    flightYears: 15,
    totalFlightHours: 15000,
    recent90DaysFlightHours: 680,
    certifiedAircraftTypes: ['A320', 'A330', 'B737'],
    currentAircraftType: 'A330-300'
  },
  { 
    id: 'P003', 
    name: '王五', 
    pfId: '20003', 
    pfTechnology: '第一副驾驶', 
    teamId: 'T001', 
    riskValue: 4.2,
    age: 32,
    flightYears: 8,
    totalFlightHours: 6000,
    recent90DaysFlightHours: 550,
    certifiedAircraftTypes: ['A320'],
    currentAircraftType: 'A320-200'
  },
  { 
    id: 'P004', 
    name: '赵六', 
    pfId: '20004', 
    pfTechnology: '第二副驾驶', 
    teamId: 'T001', 
    riskValue: 3.5,
    age: 28,
    flightYears: 5,
    totalFlightHours: 3500,
    recent90DaysFlightHours: 420,
    certifiedAircraftTypes: ['A320'],
    currentAircraftType: 'A320-200'
  },
  { 
    id: 'P005', 
    name: '张三', 
    pfId: '000012', 
    pfTechnology: '教员', 
    teamId: 'T001', 
    riskValue: 4.3,
    age: 34,
    flightYears: 9,
    totalFlightHours: 8500,
    recent90DaysFlightHours: 650,
    certifiedAircraftTypes: ['A320', 'A330'],
    currentAircraftType: 'A320-200'
  },
  { 
    id: 'P006', 
    name: '刘七', 
    pfId: '20006', 
    pfTechnology: '第一副驾驶', 
    teamId: 'T002', 
    riskValue: 5.5,
    age: 30,
    flightYears: 7,
    totalFlightHours: 5000,
    recent90DaysFlightHours: 480,
    certifiedAircraftTypes: ['A320'],
    currentAircraftType: 'A320-200'
  },
  { 
    id: 'P007', 
    name: '陈八', 
    pfId: '20007', 
    pfTechnology: '第二副驾驶', 
    teamId: 'T002', 
    riskValue: 3.8,
    age: 26,
    flightYears: 4,
    totalFlightHours: 2800,
    recent90DaysFlightHours: 380,
    certifiedAircraftTypes: ['A320'],
    currentAircraftType: 'A320-200'
  },
  { 
    id: 'P008', 
    name: '周九', 
    pfId: '20008', 
    pfTechnology: '第二副驾驶', 
    teamId: 'T002', 
    riskValue: 2.9,
    age: 25,
    flightYears: 3,
    totalFlightHours: 2000,
    recent90DaysFlightHours: 320,
    certifiedAircraftTypes: ['A320'],
    currentAircraftType: 'A320-200'
  },
  // 国际航线人员
  { 
    id: 'P009', 
    name: '孙十', 
    pfId: '20009', 
    pfTechnology: '机长', 
    teamId: 'T001', 
    riskValue: 1.8,
    age: 40,
    flightYears: 14,
    totalFlightHours: 14000,
    recent90DaysFlightHours: 600,
    certifiedAircraftTypes: ['A330', 'B777'],
    currentAircraftType: 'A330-300'
  },
  { 
    id: 'P010', 
    name: '吴十一', 
    pfId: '20010', 
    pfTechnology: '机长', 
    teamId: 'T001', 
    riskValue: 1.5,
    age: 36,
    flightYears: 11,
    totalFlightHours: 11000,
    recent90DaysFlightHours: 580,
    certifiedAircraftTypes: ['A320', 'A330'],
    currentAircraftType: 'A330-300'
  },
  { 
    id: 'P011', 
    name: '郑十二', 
    pfId: '20011', 
    pfTechnology: '第一副驾驶', 
    teamId: 'T001', 
    riskValue: 1.2,
    age: 29,
    flightYears: 6,
    totalFlightHours: 4500,
    recent90DaysFlightHours: 400,
    certifiedAircraftTypes: ['A330'],
    currentAircraftType: 'A330-300'
  },
  { 
    id: 'P012', 
    name: '王十三', 
    pfId: '20012', 
    pfTechnology: '第二副驾驶', 
    teamId: 'T001', 
    riskValue: 1.0,
    age: 24,
    flightYears: 2,
    totalFlightHours: 1500,
    recent90DaysFlightHours: 280,
    certifiedAircraftTypes: ['A330'],
    currentAircraftType: 'A330-300'
  },
]

// 机队数据
export const TEAMS: Team[] = [
  {
    id: 'T001',
    name: 'PF0001机队',
    leader: PERSONS.find(p => p.id === 'P005') || { id: 'P005', name: '张三', pfId: '20005', pfTechnology: '机长', teamId: 'T001' },
    members: PERSONS.filter(p => p.teamId === 'T001')
  },
  {
    id: 'T002',
    name: 'PF0002机队',
    leader: PERSONS.find(p => p.id === 'P005') || { id: 'P005', name: '张三', pfId: '20005', pfTechnology: '机长', teamId: 'T002' },
    members: PERSONS.filter(p => p.teamId === 'T002')
  },
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
