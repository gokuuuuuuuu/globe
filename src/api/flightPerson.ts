import request from "./request";

// ============ 列表 /flight-persons ============

export interface FlightPersonListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  flightUnit?: string;
  aircraftType?: string;
  team?: string;
  squadron?: string;
  techGrade?: string;
  riskLevel?: string;
  startDate?: string;
  endDate?: string;
}

export interface FlightPersonListItem {
  id: number;
  empNo: string;
  name: string;
  unit: string | null;
  flightUnit: string | null;
  aircraftType: string | null;
  team: string | null;
  squadron: string | null;
  techGrade: string | null;
  riskLevel: string;
  humanFactorTags: string | null;
  highRiskFlightCount: number;
}

export interface FlightPersonListResult {
  items: FlightPersonListItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    totalCount: number;
    highRiskCount: number;
    avgRiskScore: number;
  };
}

// ============ filter-options ============

export interface FlightPersonFilterOptions {
  flightUnits: string[];
  aircraftTypes: string[];
  teams: string[];
  squadrons: string[];
  techGrades: string[];
}

// ============ 基础信息 /flight-persons/{empNo} ============

export interface FlightPersonDetail {
  id: number;
  empNo: string;
  name: string;
  unit: string | null;
  flightUnit: string | null;
  aircraftType: string | null;
  team: string | null;
  squadron: string | null;
  techGrade: string | null;
  riskLevel: string;
  humanFactorTags: string | null;
  highRiskFlightCount: number;
  riskScore: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 头部摘要 /flight-persons/{empNo}/overview ============

export interface FlightPersonOverview {
  empNo: string;
  name: string;
  aircraftType: string | null;
  techGrade: string | null;
  unit: string | null;
  squadron: string | null;
  riskLevel: string;
  riskGrade: number;
  riskGradeLabel: string;
  riskTrend: string;
  humanFactorScore: number;
  humanFactorScoreMax: number;
  highRiskFlightCount90d: number;
}

// ============ Tab1 风险档案 /flight-persons/{empNo}/risk-profile ============

export interface FlightPersonRiskProfile {
  range: string;
  trend: {
    series: { label: string; overall: number; humanFactor: number }[];
  };
  contributors: { name: string; value: number }[];
  mainIndicators: {
    label?: string;
    name?: string;
    severity?: string;
    status?: string;
    description?: string;
  }[];
  peerComparison: {
    series: {
      label: string;
      self: number;
      squadronAvg: number;
      fleetAvg: number;
    }[];
  };
}

// ============ Tab2 机队对比 /flight-persons/{empNo}/fleet-comparison ============

export interface FlightPersonFleetComparison {
  range: string;
  trend: {
    series: { label: string; self: number; fleetAvg: number }[];
  };
  radar: {
    axes: string[];
    self: number[];
    fleetAvg: number[];
  };
}

// ============ Tab3 历史航班 /flight-persons/{empNo}/flights ============

export interface FlightPersonFlightItem {
  id: number;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  riskLevel: string;
  plane: { registration: string; model: string } | null;
  departureAirport: { code: string; name: string } | null;
  arrivalAirport: { code: string; name: string } | null;
}

export interface FlightPersonFlightsParams {
  page?: number;
  pageSize?: number;
  riskLevel?: string;
  startDate?: string;
  endDate?: string;
}

// ============ Tab4 训练数据 /flight-persons/{empNo}/training ============

export interface FlightPersonTraining {
  competencies: {
    code: string;
    name: string;
    score: number;
  }[];
  recommendations: {
    code: string;
    name: string;
    title: string;
    priority: string;
    description: string;
  }[];
}

// ============ Tab5 中队月报 /flight-persons/{empNo}/squadron-monthly-report ============

export interface FlightPersonSquadronReport {
  month: string;
  squadron: string | null;
  owner: {
    empNo: string;
    name: string;
    aircraftType: string | null;
    techGrade: string | null;
  };
  summary: {
    riskLevel: string;
    riskScore: number;
    trend: string;
    conclusion: string;
  };
  riskDistribution: { label: string; count: number }[];
  topFactors: { name: string; count: number; changePct: number }[];
  trainingFocus: {
    subject: string;
    completionRatePct: number;
    status: string;
  }[];
  recommendedActions: string[];
}

// ============ API 函数 ============

export function getFlightPersonList(params?: FlightPersonListParams) {
  return request.get<FlightPersonListResult>("/api/v1/flight-persons", {
    params,
  });
}

export function getFlightPersonDetail(empNo: string) {
  return request.get<FlightPersonDetail>(`/api/v1/flight-persons/${empNo}`);
}

export function getFlightPersonFilterOptions() {
  return request.get<FlightPersonFilterOptions>(
    "/api/v1/flight-persons/filter-options",
  );
}

export function exportFlightPersons(params?: FlightPersonListParams) {
  return request.get("/api/v1/flight-persons/export", {
    params,
    responseType: "blob",
  });
}

export function getFlightPersonOverview(empNo: string) {
  return request.get<FlightPersonOverview>(
    `/api/v1/flight-persons/${empNo}/overview`,
  );
}

export function getFlightPersonRiskProfile(
  empNo: string,
  params?: { range?: string },
) {
  return request.get<FlightPersonRiskProfile>(
    `/api/v1/flight-persons/${empNo}/risk-profile`,
    { params },
  );
}

export function getFlightPersonFleetComparison(
  empNo: string,
  params?: { range?: string },
) {
  return request.get<FlightPersonFleetComparison>(
    `/api/v1/flight-persons/${empNo}/fleet-comparison`,
    { params },
  );
}

export function getFlightPersonFlights(
  empNo: string,
  params?: FlightPersonFlightsParams,
) {
  return request.get(`/api/v1/flight-persons/${empNo}/flights`, { params });
}

export function getFlightPersonTraining(empNo: string) {
  return request.get<FlightPersonTraining>(
    `/api/v1/flight-persons/${empNo}/training`,
  );
}

export function getFlightPersonSquadronReport(empNo: string) {
  return request.get<FlightPersonSquadronReport>(
    `/api/v1/flight-persons/${empNo}/squadron-monthly-report`,
  );
}
