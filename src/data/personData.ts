// 人员数据

// 人员接口
export interface Person {
  id: string
  name: string
  pfId: string // PF工号
  pfTechnology: string // PF技术等级
  teamId?: string // 所属机队ID
}

// 机队接口
export interface Team {
  id: string
  name: string // 机队名称，如 "PF0001机队"
  leader: Person // 分队长
  members: Person[] // 成员列表
}

// 人员数据
export const PERSONS: Person[] = [
  { id: 'P001', name: '李四', pfId: '20001', pfTechnology: '教员', teamId: 'T001' },
  { id: 'P002', name: '张强', pfId: '20001', pfTechnology: '教员', teamId: 'T001' },
  { id: 'P003', name: '王五', pfId: '20002', pfTechnology: '第一副驾驶', teamId: 'T001' },
  { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T001' },
  { id: 'P005', name: '张三', pfId: '20004', pfTechnology: '机长', teamId: 'T001' },
  { id: 'P006', name: '李四', pfId: '20001', pfTechnology: '第一副驾驶', teamId: 'T002' },
  { id: 'P007', name: '王五', pfId: '20002', pfTechnology: '第二副驾驶', teamId: 'T002' },
  { id: 'P008', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T002' },
]

// 机队数据
export const TEAMS: Team[] = [
  {
    id: 'T001',
    name: 'PF0001机队',
    leader: { id: 'P005', name: '张三', pfId: '20004', pfTechnology: '机长', teamId: 'T001' },
    members: [
      { id: 'P001', name: '李四', pfId: '20001', pfTechnology: '教员', teamId: 'T001' },
      { id: 'P002', name: '张强', pfId: '20001', pfTechnology: '教员', teamId: 'T001' },
      { id: 'P003', name: '王五', pfId: '20002', pfTechnology: '第一副驾驶', teamId: 'T001' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T001' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T001' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T001' },
      { id: 'P001', name: '李四', pfId: '20001', pfTechnology: '教员', teamId: 'T001' },
      { id: 'P003', name: '王五', pfId: '20002', pfTechnology: '第一副驾驶', teamId: 'T001' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T001' },
    ]
  },
  {
    id: 'T002',
    name: 'PF0002机队',
    leader: { id: 'P005', name: '张三', pfId: '20004', pfTechnology: '机长', teamId: 'T002' },
    members: [
      { id: 'P001', name: '李四', pfId: '20001', pfTechnology: '教员', teamId: 'T002' },
      { id: 'P002', name: '张强', pfId: '20001', pfTechnology: '教员', teamId: 'T002' },
      { id: 'P003', name: '王五', pfId: '20002', pfTechnology: '第一副驾驶', teamId: 'T002' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T002' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T002' },
      { id: 'P004', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T002' },
      { id: 'P006', name: '李四', pfId: '20001', pfTechnology: '第一副驾驶', teamId: 'T002' },
      { id: 'P007', name: '王五', pfId: '20002', pfTechnology: '第二副驾驶', teamId: 'T002' },
      { id: 'P008', name: '赵六', pfId: '20003', pfTechnology: '第二副驾驶', teamId: 'T002' },
    ]
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
