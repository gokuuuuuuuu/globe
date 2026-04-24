import request from "./request";

export interface AirportListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export function getAirportList(params?: AirportListParams) {
  return request.get("/api/v1/airports", { params });
}

export function getAirportDetail(code: string) {
  return request.get(`/api/v1/airports/${code}`);
}
