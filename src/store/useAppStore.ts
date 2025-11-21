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
  environmentRisk: number // 环风险值
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
  // 工具栏状态
  showLabels: boolean
  setShowLabels: (show: boolean) => void
  showWindLayer: boolean
  setShowWindLayer: (show: boolean) => void
  showTemperatureLayer: boolean
  setShowTemperatureLayer: (show: boolean) => void
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
  riskZones: ['red', 'orange', 'yellow', 'green'],
  setRiskZones: (zones) => set({ riskZones: zones }),
  // Zoom到机场
  targetAirportId: null,
  setTargetAirportId: (id) => set({ targetAirportId: id }),
  // 当前正在查看的机场
  viewingAirportId: null,
  setViewingAirportId: (id) => set({ viewingAirportId: id }),
  // 工具栏状态
  showLabels: true,
  setShowLabels: (show) => set({ showLabels: show }),
  showWindLayer: false,
  setShowWindLayer: (show) => set({ showWindLayer: show }),
  showTemperatureLayer: false,
  setShowTemperatureLayer: (show) => set({ showTemperatureLayer: show }),
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
  flightStatuses: ['未起飞', '巡航中'],
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
}))


