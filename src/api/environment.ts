import request from "./request";

export interface EnvironmentAirportsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  riskLevel?: string;
}

/** 环主题机场环境总览（卡片 + 搜索/风险筛选） */
export function getEnvironmentAirports(params?: EnvironmentAirportsParams) {
  return request.get("/api/v1/environment/airports", { params });
}

/** 环主题机场环境详情（天气摘要 + 告警 + METAR/TAF + 通告；不含地图） */
export function getEnvironmentAirportDetail(code: string) {
  return request.get(`/api/v1/environment/airports/${code}`);
}

/** 气象报文详情 */
export function getEnvironmentMessage(id: number) {
  return request.get(`/api/v1/environment/messages/${id}`);
}

/** 天气/运行通告详情 */
export function getEnvironmentNotice(id: number) {
  return request.get(`/api/v1/environment/notices/${id}`);
}
