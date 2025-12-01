// 人员数据

// 人员接口
export interface Person {
  id: string
  name: string
  pfId: string // PF工号
  pfTechnology: string // PF技术等级
  teamId?: string // 所属机队ID
  riskValue?: number // 风险值（环境风险）
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
  { id: 'P001', name: '李四', pfId: '20001', pfTechnology: '教员', teamId: 'T001', riskValue: 6.5 },
  { id: 'P002', name: '张强', pfId: '20002', pfTechnology: '教员', teamId: 'T001', riskValue: 5.8 },
  { id: 'P003', name: '王五', pfId: '20003', pfTechnology: '第一副驾驶', teamId: 'T001', riskValue: 4.2 },
  { id: 'P004', name: '赵六', pfId: '20004', pfTechnology: '第二副驾驶', teamId: 'T001', riskValue: 3.5 },
  { id: 'P005', name: '张三', pfId: '20005', pfTechnology: '机长', teamId: 'T001', riskValue: 7.2 },
  { id: 'P006', name: '刘七', pfId: '20006', pfTechnology: '第一副驾驶', teamId: 'T002', riskValue: 5.5 },
  { id: 'P007', name: '陈八', pfId: '20007', pfTechnology: '第二副驾驶', teamId: 'T002', riskValue: 3.8 },
  { id: 'P008', name: '周九', pfId: '20008', pfTechnology: '第二副驾驶', teamId: 'T002', riskValue: 2.9 },
  // 国际航线人员
  { id: 'P009', name: '孙十', pfId: '20009', pfTechnology: '机长', teamId: 'T001', riskValue: 1.8 },
  { id: 'P010', name: '吴十一', pfId: '20010', pfTechnology: '机长', teamId: 'T001', riskValue: 1.5 },
  { id: 'P011', name: '郑十二', pfId: '20011', pfTechnology: '第一副驾驶', teamId: 'T001', riskValue: 1.2 },
  { id: 'P012', name: '王十三', pfId: '20012', pfTechnology: '第二副驾驶', teamId: 'T001', riskValue: 1.0 },
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
