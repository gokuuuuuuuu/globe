import request from "./request";

export interface FlightPersonListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  flightUnit?: string;
  aircraftType?: string;
  team?: string;
  squadron?: string;
  techGrade?: string;
  riskLevel?: "高" | "中" | "低";
  startDate?: string;
  endDate?: string;
}

export function getFlightPersonList(params?: FlightPersonListParams) {
  return request.get("/api/v1/flight-persons", { params });
}

export function getFlightPersonDetail(empNo: string) {
  return request.get(`/api/v1/flight-persons/${empNo}`);
}

export function getFlightPersonFilterOptions() {
  return request.get("/api/v1/flight-persons/filter-options");
}

export function exportFlightPersons(params?: FlightPersonListParams) {
  return request.get("/api/v1/flight-persons/export", {
    params,
    responseType: "blob",
  });
}

export type RiskRange = "1m" | "3m" | "6m";

export interface FlightPersonFlightsParams {
  page?: number;
  pageSize?: number;
  riskLevel?: "低" | "中" | "高";
  startDate?: string;
  endDate?: string;
}

// 人员详情 - 头部摘要（所有 Tab 共享）
export function getFlightPersonOverview(empNo: string) {
  return request.get(`/api/v1/flight-persons/${empNo}/overview`);
}

// Tab 1 风险档案（趋势 + 贡献因素 + 主要指标 + 同类对比）
export function getFlightPersonRiskProfile(
  empNo: string,
  params?: { range?: RiskRange },
) {
  return request.get(`/api/v1/flight-persons/${empNo}/risk-profile`, {
    params,
  });
}

// Tab 2 个人与机队对比（折线 + 6 轴雷达图）
export function getFlightPersonFleetComparison(
  empNo: string,
  params?: { range?: RiskRange },
) {
  return request.get(`/api/v1/flight-persons/${empNo}/fleet-comparison`, {
    params,
  });
}

// Tab 3 历史航班
export function getFlightPersonFlights(
  empNo: string,
  params?: FlightPersonFlightsParams,
) {
  return request.get(`/api/v1/flight-persons/${empNo}/flights`, { params });
}

// Tab 4 训练数据（9 维能力评估 + 训练科目推荐）
export function getFlightPersonTraining(empNo: string) {
  return request.get(`/api/v1/flight-persons/${empNo}/training`);
}
