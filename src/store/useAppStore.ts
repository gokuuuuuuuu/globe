import { create } from 'zustand'
import type { ViewMode } from '../types'

interface AirportHoverInfo {
  airportId: string
  airportName: string
  operatorCount: number // 执飞单位数量
  flightCount: number // 航班数量
  environmentRisk: number // 环境风险值
}

interface FlightRouteHoverInfo {
  flightNumber: string // 航班号
  fromAirport: string // 起飞机场
  toAirport: string // 降落机场
  status: string // 状态
  scheduledDeparture: string // 预飞时间
  scheduledArrival: string // 预到时间
  humanRisk: number // 人风险值
  machineRisk: number // 机风险值
  environmentRisk: number // 环风险值（数字，用于颜色计算）
  riskLevel?: string // 风险等级（文字：高风险、中风险、低风险）
}

export type SidebarTab = 'airport' | 'airline' | 'person'
export type RiskZone = 'red' | 'orange' | 'yellow' | 'green'

interface AppState {
  view: ViewMode
  setView: (view: ViewMode) => void
  selectedCountry: string | null
  setSelectedCountry: (code: string | null) => void
  hoveredCountry: string | null
  setHoveredCountry: (code: string | null) => void
  hoveredAirport: AirportHoverInfo | null
  setHoveredAirport: (info: AirportHoverInfo | null) => void
  hoveredFlightRoute: FlightRouteHoverInfo | null
  setHoveredFlightRoute: (info: FlightRouteHoverInfo | null) => void
  tooltipPosition: { x: number; y: number } | null
  setTooltipPosition: (pos: { x: number; y: number } | null) => void
  // 侧边栏状态
  sidebarTab: SidebarTab
  setSidebarTab: (tab: SidebarTab) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  riskZones: RiskZone[]
  setRiskZones: (zones: RiskZone[]) => void
  // Zoom到机场
  targetAirportId: string | null
  setTargetAirportId: (id: string | null) => void
  // 当前正在查看的机场（用于显示高亮效果）
  viewingAirportId: string | null
  setViewingAirportId: (id: string | null) => void
  // 当前高亮的机场（用于卡片高亮显示）
  highlightedAirportId: string | null
  setHighlightedAirportId: (id: string | null) => void
  // 当前高亮的航班（用于卡片高亮显示）
  highlightedFlightRouteId: string | null
  setHighlightedFlightRouteId: (id: string | null) => void
  // 工具栏状态
  showLabels: boolean
  setShowLabels: (show: boolean) => void
  showWindLayer: boolean
  setShowWindLayer: (show: boolean) => void
  showTemperatureLayer: boolean
  setShowTemperatureLayer: (show: boolean) => void
  showPrecipitationLayer: boolean
  setShowPrecipitationLayer: (show: boolean) => void
  showFogLayer: boolean
  setShowFogLayer: (show: boolean) => void
  showMoistureLayer: boolean
  setShowMoistureLayer: (show: boolean) => void
  showLightningLayer: boolean
  setShowLightningLayer: (show: boolean) => void
  showCATLayer: boolean
  setShowCATLayer: (show: boolean) => void
  showVisibilityLayer: boolean
  setShowVisibilityLayer: (show: boolean) => void
  // 航班筛选条件
  flightFilters: {
    flightNumber: string
    aircraftNumber: string
    largeAircraftType: string
    aircraftType: string
    pfTechnology: string
    operatingUnit: string
    departureAirport: string
    arrivalAirport: string
  }
  setFlightFilters: (filters: Partial<AppState['flightFilters']>) => void
  // 风险类型筛选
  riskTypes: string[]
  setRiskTypes: (types: string[]) => void
  // 当前选中的机场（用于airline tab）
  selectedAirportForAirline: string | null
  setSelectedAirportForAirline: (id: string | null) => void
  // 航班状态筛选
  flightStatuses: string[]
  setFlightStatuses: (statuses: string[]) => void
  // 当前选中的航线（用于显示详情）
  selectedFlightRouteId: string | null
  setSelectedFlightRouteId: (id: string | null) => void
  // Zoom到航线
  targetFlightRouteId: string | null
  setTargetFlightRouteId: (id: string | null) => void
  // 当前正在查看的航线（用于显示高亮效果）
  viewingFlightRouteId: string | null
  setViewingFlightRouteId: (id: string | null) => void
  // 当前选中的人员（用于person tab）
  selectedPersonId: string | null
  setSelectedPersonId: (id: string | null) => void
  // 展开的机队ID列表（用于person tab）
  expandedTeamIds: string[]
  setExpandedTeamIds: (ids: string[]) => void
  // 地球自动旋转控制
  autoRotate: boolean
  setAutoRotate: (enabled: boolean) => void
  // 侧边栏收起状态
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  // 偏好设置
  airportCodeFormat: 'three' | 'four' // 机场编码格式：三字码或四字码
  setAirportCodeFormat: (format: 'three' | 'four') => void
  // 偏好设置菜单显示状态
  showPreferencesMenu: boolean
  setShowPreferencesMenu: (show: boolean) => void
  // 时间轴相关状态
  timelineTimeRange: 4 | 10 | 18 | 24 // 时间范围（小时）
  setTimelineTimeRange: (range: 4 | 10 | 18 | 24) => void
  timelineCurrentTime: Date // 当前时间轴显示的时间
  setTimelineCurrentTime: (time: Date) => void
  timelineIsPlaying: boolean // 是否正在播放
  setTimelineIsPlaying: (playing: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'globe',
  setView: (view) => set({ view }),
  selectedCountry: null,
  setSelectedCountry: (code) => set({ selectedCountry: code }),
  hoveredCountry: null,
  setHoveredCountry: (code) => set({ hoveredCountry: code }),
  hoveredAirport: null,
  setHoveredAirport: (info) => set({ hoveredAirport: info }),
  hoveredFlightRoute: null,
  setHoveredFlightRoute: (info) => set({ hoveredFlightRoute: info }),
  tooltipPosition: null,
  setTooltipPosition: (pos) => set({ tooltipPosition: pos }),
  // 侧边栏状态
  sidebarTab: 'airport',
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  riskZones: ['red', 'orange', 'yellow', 'green'], // 默认选中所有风险区间
  setRiskZones: (zones) => set({ riskZones: zones }),
  // Zoom到机场
  targetAirportId: null,
  setTargetAirportId: (id) => set({ targetAirportId: id }),
  // 当前正在查看的机场
  viewingAirportId: null,
  setViewingAirportId: (id) => set({ viewingAirportId: id }),
  // 当前高亮的机场（用于卡片高亮显示）
  highlightedAirportId: null,
  setHighlightedAirportId: (id) => set({ highlightedAirportId: id }),
  // 当前高亮的航班（用于卡片高亮显示）
  highlightedFlightRouteId: null,
  setHighlightedFlightRouteId: (id) => set({ highlightedFlightRouteId: id }),
  // 工具栏状态
  showLabels: true,
  setShowLabels: (show) => set({ showLabels: show }),
  showWindLayer: false,
  setShowWindLayer: (show) => set({ showWindLayer: show }),
  showTemperatureLayer: false,
  setShowTemperatureLayer: (show) => set({ showTemperatureLayer: show }),
  showPrecipitationLayer: false,
  setShowPrecipitationLayer: (show) => set({ showPrecipitationLayer: show }),
  showFogLayer: false,
  setShowFogLayer: (show) => set({ showFogLayer: show }),
  showMoistureLayer: false,
  setShowMoistureLayer: (show) => set({ showMoistureLayer: show }),
  showLightningLayer: false,
  setShowLightningLayer: (show) => set({ showLightningLayer: show }),
  showCATLayer: false,
  setShowCATLayer: (show) => set({ showCATLayer: show }),
  showVisibilityLayer: false,
  setShowVisibilityLayer: (show) => set({ showVisibilityLayer: show }),
  // 航班筛选条件
  flightFilters: {
    flightNumber: '',
    aircraftNumber: '',
    largeAircraftType: '',
    aircraftType: '',
    pfTechnology: '',
    operatingUnit: '',
    departureAirport: '',
    arrivalAirport: '',
  },
  setFlightFilters: (filters) => set((state) => ({
    flightFilters: { ...state.flightFilters, ...filters }
  })),
  // 风险类型筛选
  riskTypes: [],
  setRiskTypes: (types) => set({ riskTypes: types }),
  // 当前选中的机场（用于airline tab）
  selectedAirportForAirline: null,
  setSelectedAirportForAirline: (id) => set({ selectedAirportForAirline: id }),
  // 航班状态筛选
  flightStatuses: ['未起飞', '巡航中', '已落地'], // 默认选中所有状态
  setFlightStatuses: (statuses) => set({ flightStatuses: statuses }),
  // 当前选中的航线
  selectedFlightRouteId: null,
  setSelectedFlightRouteId: (id) => set({ selectedFlightRouteId: id }),
  // Zoom到航线
  targetFlightRouteId: null,
  setTargetFlightRouteId: (id) => set({ targetFlightRouteId: id }),
  // 当前正在查看的航线
  viewingFlightRouteId: null,
  setViewingFlightRouteId: (id) => set({ viewingFlightRouteId: id }),
  // 当前选中的人员
  selectedPersonId: null,
  setSelectedPersonId: (id) => set({ selectedPersonId: id }),
  // 展开的机队ID列表
  expandedTeamIds: [],
  setExpandedTeamIds: (ids) => set({ expandedTeamIds: ids }),
  // 地球自动旋转控制（默认关闭）
  autoRotate: false,
  setAutoRotate: (enabled) => set({ autoRotate: enabled }),
  // 侧边栏收起状态（默认展开）
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  // 偏好设置（默认四字码）
  airportCodeFormat: 'four',
  setAirportCodeFormat: (format) => set({ airportCodeFormat: format }),
  // 偏好设置菜单显示状态
  showPreferencesMenu: false,
  setShowPreferencesMenu: (show) => set({ showPreferencesMenu: show }),
  // 时间轴相关状态
  timelineTimeRange: 10, // 默认10小时
  setTimelineTimeRange: (range) => set({ timelineTimeRange: range }),
  timelineCurrentTime: new Date('2024-07-25T00:00:00+08:00'), // 默认2024-07-25 00:00
  setTimelineCurrentTime: (time) => set({ timelineCurrentTime: time }),
  timelineIsPlaying: false, // 默认不播放
  setTimelineIsPlaying: (playing) => set({ timelineIsPlaying: playing }),
}))


