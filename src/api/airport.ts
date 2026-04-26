import request from "./request";

export interface AirportListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export interface AirportDetailParams {
  startDate?: string;
  endDate?: string;
}

export interface AirportFlightsParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  riskLevel?: "低" | "中" | "高";
}

// 机场排名 + 摘要卡片
export function getAirportList(params?: AirportListParams) {
  return request.get("/api/v1/airports", { params });
}

// 机场基础信息（按 ICAO 代码）
export function getAirportDetail(code: string) {
  return request.get(`/api/v1/airports/${code}`);
}

// 机场详情页聚合（顶部摘要 + 进出港 / 时段 / 风险类型 / 环境 4 张卡片）
export function getAirportDetailAggregate(
  code: string,
  params?: AirportDetailParams,
) {
  return request.get(`/api/v1/airports/${code}/detail`, { params });
}

// 机场相关航班列表（起飞或降落机场为当前机场）
export function getAirportFlights(code: string, params?: AirportFlightsParams) {
  return request.get(`/api/v1/airports/${code}/flights`, { params });
}
