import request from "./request";

/** 航班统计（月度趋势 + 风险等级分布 + 状态分布 + 风险类型 TOP5） */
export function getFlightAnalytics() {
  return request.get("/api/v1/analytics/flights");
}

/** 人员统计（月度趋势 + 风险等级分布 + 各单位高风险数 + 人为因素 TOP5） */
export function getPersonnelAnalytics() {
  return request.get("/api/v1/analytics/personnel");
}

/** 飞机统计（月度趋势 + 机型分布 + 维护趋势 + 关键故障 TOP5） */
export function getPlaneAnalytics() {
  return request.get("/api/v1/analytics/planes");
}

/** 机场统计（准点率趋势 + 旅客吞吐量 + 延误排名 + 地面服务效率 + 表现矩阵） */
export function getAirportAnalytics() {
  return request.get("/api/v1/analytics/airports");
}
