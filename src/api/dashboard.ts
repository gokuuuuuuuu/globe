import request from "./request";

// ============ 风险事件预览 ============

export interface RiskEventPreview {
  id: number;
  name: string;
  priority: string;
}

// ============ 风险队列/紧急告警中的航班 ============

export interface RiskQueueFlight {
  id: number;
  alertNo: string;
  flightNo: string;
  route: string;
  aircraftModel: string;
  planeRegistration: string;
  status: string;
  riskLevel: string;
  riskColor: string;
  riskScore: number;
  riskScore10: number;
  riskScorePercent: number;
  riskTags: string[];
  primaryRisk: string;
  alertCount: number;
  urgency: string;
  departureTime: string;
  arrivalTime: string;
  riskEventPreview: RiskEventPreview[];
  rank: number;
}

// ============ 风险卡片 ============

export interface RiskCard {
  key: string;
  label: string;
  count: number;
  color: string;
  delta: number;
  direction: string;
  deltaLabel: string;
}

// ============ 地图航班点位 ============

export interface MapFlightPoint {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MapFlightItem {
  id: number;
  alertNo: string;
  flightNo: string;
  route: string;
  aircraftModel: string;
  planeRegistration: string;
  status: string;
  riskLevel: string;
  riskColor: string;
  riskScore: number;
  riskScore10: number;
  riskScorePercent: number;
  riskTags: string[];
  primaryRisk: string;
  alertCount: number;
  urgency: string;
  departureTime: string;
  arrivalTime: string;
  riskEventPreview: RiskEventPreview[];
  progress: number;
  from: MapFlightPoint;
  to: MapFlightPoint;
  current: { longitude: number; latitude: number };
  path: MapFlightPoint[];
}

export interface MapFlightsData {
  risk: string;
  total: number;
  window: {
    defaultHours: number;
    optionsHours: number[];
    startAt: string;
    endAt: string;
    currentAt: string;
    ticks: string[];
  };
  items: MapFlightItem[];
}

// ============ 机场/人员队列项（tab=airports/personnel 时返回） ============

export interface RiskQueueAirport {
  id: number;
  code: string;
  iataCode: string | null;
  name: string;
  city: string | null;
  country: string | null;
  title: string;
  subtitle: string;
  route: string;
  riskLevel: string;
  riskColor: string;
  riskScore: number;
  riskScore10: number;
  riskScorePercent: number;
  primaryRisk: string;
  alertCount: number;
  urgency: string;
  flightTotal: number;
  personTotal: number;
  updatedAt: string;
  rank: number;
}

export interface RiskQueuePerson {
  id: number;
  empNo: string;
  name: string;
  title: string;
  subtitle: string;
  unit: string | null;
  flightUnit: string | null;
  aircraftType: string | null;
  team: string | null;
  squadron: string | null;
  techGrade: string | null;
  riskLevel: string;
  riskColor: string;
  riskScore: number;
  riskScore10: number;
  riskScorePercent: number;
  riskTags: string[];
  primaryRisk: string;
  alertCount: number;
  urgency: string;
  flightTotal: number;
  flightHours: number;
  highRiskFlightCount: number;
  updatedAt: string;
  rank: number;
}

// ============ 工作台总览 ============

export type DashboardTab = "flights" | "airports" | "personnel";

export interface DashboardOverviewParams {
  tab?: DashboardTab;
  risk?: "all" | "red" | "yellow";
  hours?: number;
  queueLimit?: number;
}

export interface DashboardOverview {
  activeTab: DashboardTab;
  summary: {
    flightTotal: number;
    airportTotal: number;
    personTotal: number;
    planeTotal: number;
    highRiskFlightTotal: number;
    mediumRiskFlightTotal: number;
    activeAlertTotal: number;
  };
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  riskCards: RiskCard[];
  statusDistribution: Record<string, number>;
  urgentAlert: (RiskQueueFlight | RiskQueueAirport | RiskQueuePerson) | null;
  riskQueue: (RiskQueueFlight | RiskQueueAirport | RiskQueuePerson)[];
  playbackWindow: {
    defaultHours: number;
    optionsHours: number[];
    startAt: string;
    endAt: string;
    currentAt: string;
    ticks: string[];
  };
  mapFlights: MapFlightsData & { endpoint: string };
}

// ============ API 函数 ============

/** 工作台总览（总量卡片 + 风险分布 + 紧急告警 + 风险队列 + 地图点位摘要） */
export function getDashboardOverview(params?: DashboardOverviewParams) {
  return request.get<DashboardOverview>("/api/v1/dashboard/overview", {
    params,
  });
}

/** 工作台综合分析 */
export function getDashboardAnalysis() {
  return request.get<DashboardAnalysis>("/api/v1/dashboard/analysis");
}

export interface DashboardAnalysis {
  generatedAt: string;
  window: { hours: number; startAt: string; endAt: string };
  summary: {
    totalFlights: number;
    totalAirports: number;
    totalPersonnel: number;
    totalPlanes: number;
    redRiskFlights: number;
    yellowRiskFlights: number;
    greenRiskFlights: number;
    highRiskAirports: number;
    highRiskPersonnel: number;
  };
  statCards: {
    key: string;
    label: string;
    value: number;
    valueText: string;
    change?: string;
    color?: string;
    trend?: string;
  }[];
  charts: {
    riskForecastData: {
      time: string;
      high: number;
      medium: number;
      low: number;
    }[];
    divisionData: {
      name: string;
      high: number;
      medium: number;
      low: number;
      total: number;
    }[];
    squadronData: {
      name: string;
      high: number;
      medium: number;
      low: number;
      total: number;
    }[];
    highRiskTrendData: { day: string; value: number }[];
    airportData: {
      code: string;
      fullName: string;
      topRisk: string;
      red: number;
      yellow: number;
      green: number;
      total: number;
    }[];
    aircraftTypeData: {
      name: string;
      red: number;
      yellow: number;
      green: number;
      total: number;
    }[];
    riskTypeData: { name: string; count: number; value: number }[];
  };
  tables: {
    humanFactorData: {
      factor: string;
      topN: number;
      risk: number;
      riskPercent: number;
    }[];
    aircraftFactorData: {
      factor: string;
      topN: number;
      risk: number;
      riskPercent: number;
    }[];
    envFactorData: {
      factor: string;
      topN: number;
      risk: number;
      riskPercent: number;
    }[];
    compositeData: {
      cause: string;
      topN: number;
      risk: number;
      riskPercent: number;
    }[];
  };
}

/** 工作台地图航班点位/航线（按回放窗口与风险等级筛选） */
export function getDashboardMapFlights(params?: {
  tab?: DashboardTab;
  risk?: string;
  hours?: number;
  limit?: number;
}) {
  return request.get<MapFlightsData>("/api/v1/dashboard/map-flights", {
    params,
  });
}
