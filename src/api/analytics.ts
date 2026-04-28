import request from "./request";

// ============ 航班统计 ============

export interface FlightAnalytics {
  kpis: {
    totalFlights: number;
    highRiskFlights: number;
    mediumRiskFlights: number;
    avgRiskScore: number;
  };
  monthlyTrend: {
    label: string;
    total: number;
    high: number;
    medium: number;
    low: number;
  }[];
  riskDistribution: { high: number; medium: number; low: number };
  statusDistribution: Record<string, number>;
  topRiskTypes: { name: string; count: number }[];
}

// ============ 人员统计 ============

export interface PersonnelAnalytics {
  kpis: {
    totalPilots: number;
    highRiskPersonnel: number;
    mediumRiskPersonnel: number;
    trainingCompletionRatePct: number;
  };
  monthlyTrend: { label: string; high: number; medium: number; low: number }[];
  riskDistribution: { high: number; medium: number; low: number };
  byUnit: { unit: string; totalCount: number; highRiskCount: number }[];
  topHumanFactors: { name: string; count: number }[];
}

// ============ 机场统计 ============

export interface AirportAnalytics {
  kpis: {
    airportTotal: number;
    totalFlights: number;
    avgDelayMin: number;
    onTimeRatePct: number;
  };
  topAirportsOnTimeTrend: {
    airport: string;
    series: { label: string; value: number }[];
  }[];
  passengerThroughput: { airport: string; valueMillion: number }[];
  delayRanking: {
    rank: number;
    code: string;
    city: string;
    delayCount: number;
    avgDelayMin: number;
  }[];
  groundServiceEfficiency: { name: string; pct: number }[];
  airportMatrix: {
    code: string;
    totalFlights: number;
    avgDelayMin: number;
    onTimeRatePct: number;
  }[];
}

// ============ 飞机统计 ============

export interface PlaneAnalytics {
  kpis: {
    fleetSize: number;
    highRiskPlanes: number;
    avgAgeYears: number;
    maintenanceCompletionRatePct: number;
  };
  monthlyTrend: { label: string; high: number; medium: number; low: number }[];
  modelDistribution: { model: string; count: number }[];
  maintenanceTrend: { label: string; scheduled: number; unplanned: number }[];
  topFailureTypes: { name: string; count: number }[];
}

// ============ API 函数 ============

export function getFlightAnalytics() {
  return request.get<FlightAnalytics>("/api/v1/analytics/flights");
}

export function getPersonnelAnalytics() {
  return request.get<PersonnelAnalytics>("/api/v1/analytics/personnel");
}

export function getPlaneAnalytics() {
  return request.get<PlaneAnalytics>("/api/v1/analytics/planes");
}

export function getAirportAnalytics() {
  return request.get<AirportAnalytics>("/api/v1/analytics/airports");
}

export function exportAnalytics(
  type: "flights" | "personnel" | "airports" | "planes" = "flights",
) {
  return request.get("/api/v1/analytics/export", {
    params: { type },
    responseType: "blob",
  });
}
