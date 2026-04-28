import request from "./request";

// ============ 列表 /planes ============

export interface PlaneListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface PlaneListItem {
  id: number;
  registration: string;
  model: string;
  category: string;
  aircraftCategory: string;
  operatingUnit: string;
  ageYears: number;
  totalFlightHours: number;
  airworthinessStatus: string;
  riskLevel: string;
  riskScore: number;
  highRiskFlightCount: number;
}

export interface PlaneListResult {
  items: PlaneListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ 基础信息 /planes/{registration} ============
// 注意：basic 和 detail 返回结构完全相同

export interface PlaneFactorScore {
  name: string;
  score: number;
}

export interface PlaneSubFactor {
  name: string;
  score: number;
  value: number;
  range: { max: number; min: number };
}

export interface PlaneRelatedFlight {
  id: number;
  flightNo: string;
  flightNumber: string;
  departureTime: string;
  route: string;
  riskLevel: string;
}

export interface PlaneMaintenanceEvent {
  id: number;
  date: string;
  eventDate: string;
  kind: string;
  eventType: string;
  title: string;
  severity: string;
  description: string;
}

export interface PlaneRecurringAnomaly {
  name: string;
  count: number;
  severity: string;
}

export interface PlaneDetailData {
  // 顶层扁平字段
  id: number;
  registration: string;
  model: string;
  category: string;
  aircraftCategory: string;
  operatingUnit: string;
  ageYears: number;
  totalFlightHours: number;
  airworthinessStatus: string;
  riskLevel: string;
  riskScore: number;
  highRiskFlightCount: number;
  currentLocation: string;
  // 嵌套 plane 对象（与顶层字段相同）
  plane: PlaneListItem & { currentLocation: string };
  // 因子得分
  factorScores: PlaneFactorScore[];
  primaryFactor: PlaneFactorScore;
  factorScore: {
    trend: string;
    overall: number;
    subFactors: PlaneSubFactor[];
  };
  topFactors: { name: string; score: number; value: number }[];
  // 相关航班
  relatedFlights: PlaneRelatedFlight[];
  relatedRiskFlights: {
    total: number;
    byLevel: { high: number; medium: number; low: number };
    monthlyTrend: {
      label: string;
      high: number;
      medium: number;
      low: number;
    }[];
  };
  // 异常汇总
  abnormalSummary: { count: number; latest: string };
  recurringAnomalies: PlaneRecurringAnomaly[];
  // 维修信息
  maintenance: { lastCheckAt: string; nextCheckAt: string };
  recentEvents: PlaneMaintenanceEvent[];
  recentMaintenanceEvents: PlaneMaintenanceEvent[];
}

// ============ API 函数 ============

export function getPlaneList(params?: PlaneListParams) {
  return request.get<PlaneListResult>("/api/v1/planes", { params });
}

export function getPlaneDetail(registration: string) {
  return request.get<PlaneDetailData>(`/api/v1/planes/${registration}`);
}

export function getPlaneDetailPage(registration: string) {
  return request.get<PlaneDetailData>(`/api/v1/planes/${registration}/detail`);
}
