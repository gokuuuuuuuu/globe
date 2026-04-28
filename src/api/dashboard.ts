import request from "./request";

/** 风险队列中的航班 */
export interface RiskQueueFlight {
  id: number;
  flightNo: string;
  route: string;
  planeRegistration: string;
  aircraftModel: string;
  status: string;
  riskLevel: string;
  riskScore: number;
  riskTags: string[];
  departureTime: string;
}

/** 工作台总览返回 */
export interface DashboardOverview {
  summary: {
    flightTotal: number;
    airportTotal: number;
    personTotal: number;
  };
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  statusDistribution: Record<string, number>;
  urgentAlert: RiskQueueFlight | null;
  riskQueue: RiskQueueFlight[];
  playbackWindow: {
    defaultHours: number;
    optionsHours: number[];
    startAt: string;
    endAt: string;
  };
}

/** 工作台总览（总量卡片 + 风险分布 + 紧急告警 + 风险队列；不含地图） */
export function getDashboardOverview() {
  return request.get<DashboardOverview>("/api/v1/dashboard/overview");
}
