import request from "./request";

/** 工作台总览（总量卡片 + 风险分布 + 紧急告警 + 风险队列；不含地图） */
export function getDashboardOverview() {
  return request.get("/api/v1/dashboard/overview");
}
