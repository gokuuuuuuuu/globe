import request from "./request";

// ============ 共用子类型 ============

export interface AirportTrendPoint {
  date: string;
  value: number;
}

export interface RiskDriver {
  name: string;
  count: number;
}

export interface MajorRiskType {
  name: string;
  category: string;
  count: number;
}

export interface EnvironmentAlert {
  level: string;
  code: string;
  text: string;
}

// ============ 列表 /airports ============

export interface AirportListItem {
  rank: number;
  id: number;
  code: string;
  iataCode: string | null;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lon: number | null;
  totalFlightCount: number;
  highRiskFlightCount: number;
  highRiskFlightRatio: number;
  topRisk: string | null;
  riskLevel: string;
  riskDrivers: RiskDriver[];
  trend: AirportTrendPoint[];
}

export interface AirportListResult {
  items: AirportListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AirportListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// ============ 基础信息 /airports/{code} ============
// 注意：真实接口返回的基础信息包含完整聚合数据

export interface AirportBasicInfo {
  id: number;
  code: string;
  iataCode: string | null;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lon: number | null;
}

export interface AirportSummary {
  riskLevel: string;
  totalFlightCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  highRiskRatio: number;
  mediumRiskRatio: number;
  majorRiskTypes: MajorRiskType[];
  environmentSummary: string;
}

export interface AirportEnvironment {
  windSpeedKt: number;
  visibilityKm: number;
  cloudBaseM: number;
  alerts: EnvironmentAlert[];
}

export interface AirportDetailAggregate {
  // 顶层扁平字段
  id: number;
  code: string;
  iataCode: string | null;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lon: number | null;
  totalFlightCount: number;
  highRiskFlightCount: number;
  highRiskFlightRatio: number;
  mediumRiskFlightCount: number;
  mediumRiskFlightRatio: number;
  topRisk: string | null;
  riskLevel: string;
  riskDrivers: RiskDriver[];
  // 嵌套结构
  airport: AirportBasicInfo;
  window: {
    startDate: string;
    endDate: string;
  };
  summary: AirportSummary;
  byDirection: {
    departure: { high: number; medium: number; low: number };
    arrival: { high: number; medium: number; low: number };
  };
  byTimeBucket: {
    label: string;
    high: number;
    medium: number;
    low: number;
  }[];
  byRiskType: {
    type: string;
    red: number;
    yellow: number;
    green: number;
  }[];
  environment: AirportEnvironment;
}

export interface AirportDetailParams {
  startDate?: string;
  endDate?: string;
}

// ============ 机场航班 /airports/{code}/flights ============

export interface AirportFlightItem {
  id: number;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  actualDepartureTime: string | null;
  actualArrivalTime: string | null;
  delayMinutes: number | null;
  delayReason: string | null;
  status: string;
  riskLevel: string;
  riskTags: string | null;
  departureAirport: { code: string; name: string } | null;
  arrivalAirport: { code: string; name: string } | null;
}

export interface AirportFlightsResult {
  items: AirportFlightItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AirportFlightsParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  riskLevel?: string;
}

// ============ API 函数 ============

export function getAirportList(params?: AirportListParams) {
  return request.get<AirportListResult>("/api/v1/airports", { params });
}

export function getAirportDetail(code: string) {
  return request.get<AirportDetailAggregate>(`/api/v1/airports/${code}`);
}

/** 机场详情聚合 — /detail 已废弃，改用 /airports/{code} */
export function getAirportDetailAggregate(
  code: string,
  _params?: AirportDetailParams,
) {
  return request.get<AirportDetailAggregate>(`/api/v1/airports/${code}`);
}

export function getAirportFlights(code: string, params?: AirportFlightsParams) {
  return request.get<AirportFlightsResult>(`/api/v1/airports/${code}/flights`, {
    params,
  });
}
