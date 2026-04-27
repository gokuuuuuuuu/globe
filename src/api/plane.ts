import request from "./request";

export interface PlaneListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export function getPlaneList(params?: PlaneListParams) {
  return request.get("/api/v1/planes", { params });
}

export function getPlaneDetail(registration: string) {
  return request.get(`/api/v1/planes/${registration}`);
}

/** 飞机详情页（因子得分 + 首要因子 + 相关航班 + 异常汇总 + 维修信息 + 近期维修事件） */
export function getPlaneDetailPage(registration: string) {
  return request.get(`/api/v1/planes/${registration}/detail`);
}
