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
}))


