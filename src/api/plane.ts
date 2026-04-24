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
