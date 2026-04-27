import request from "./request";

export interface FlightListParams {
  page?: number;
  pageSize?: number;
  flightNo?: string;
  planeRegistration?: string;
  departureAirportId?: number;
  arrivalAirportId?: number;
  aircraftModel?: string;
  operatingUnit?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  status?: "SCHEDULED" | "CRUISING" | "LANDED";
  riskType?: string;
  governanceStatus?: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}

export function getFlightList(params?: FlightListParams) {
  return request.get("/api/v1/flights", { params });
}

export function getFlightDetail(id: number) {
  return request.get(`/api/v1/flights/${id}`);
}

export function getFlightFilterOptions() {
  return request.get("/api/v1/flights/filter-options");
}

export function exportFlights(params?: FlightListParams) {
  return request.get("/api/v1/flights/export", {
    params,
    responseType: "blob",
  });
}

/** 航班报告页（航班事实 + 综合结论 + 七阶段 + 重大风险 + 人机环分析 + 因子解释 + 证据链） */
export function getFlightReport(id: number) {
  return request.get(`/api/v1/flights/${id}/report`);
}
