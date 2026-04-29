import request from "./request";

// ============ 列表 /environment/airports ============

export interface EnvironmentAirportsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  riskLevel?: string;
}

export interface EnvironmentKeyMetrics {
  temperatureC: number;
  windSpeedKmh: number;
  windSpeedKt: number;
  windDirection: string;
  visibilityKm: number;
  cloudBaseM: number;
  humidityPct: number;
}

export interface EnvironmentAirportItem {
  id: number;
  code: string;
  iataCode: string | null;
  icaoCode: string;
  name: string;
  nameZh: string;
  city: string | null;
  country: string | null;
  totalFlightCount: number;
  flightCount: number;
  personCount: number;
  operatorCount: number;
  riskScore: number;
  environmentRisk: number;
  riskLevel: string;
  latestObservedAt: string;
  keyMetrics: EnvironmentKeyMetrics;
}

export interface EnvironmentAirportListResult {
  items: EnvironmentAirportItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ 详情 /environment/airports/{code} ============

export interface EnvironmentSnapshot {
  observedAt: string;
  temperatureC: number;
  windSpeedKmh: number;
  windSpeedKt: number;
  windDirection: string;
  visibilityKm: number;
  cloudBaseM: number;
  humidityPct: number;
  riskScore: number;
  riskLevel: string;
  airQualityLevel: string;
  precipitationLevel: string;
  extremeEventLevel: string;
  weatherCondition: string;
  precipitationProbabilityPct: number;
  precipitationTrend: number;
  summary: string;
  temperatureTrend: {
    temp: number;
    time: string;
    label: string;
    condition: string;
    temperatureC: number;
  }[];
}

export interface EnvironmentAlert {
  title: string;
  riskLevel: string;
  scope: string;
  runway: string;
  occurredAt: string;
  message: string;
}

export interface EnvironmentRiskFactor {
  name: string;
  status: string;
  color: string;
}

export interface EnvironmentMetarMessage {
  id: number;
  messageNo: string;
  messageType: string;
  observedAt: string;
  runway: string;
  rawText: string;
  translatedText: string;
}

export interface EnvironmentNoticeItem {
  id: number;
  title: string;
  airportCode: string | null;
  effectiveAt: string;
  expiresAt: string;
  source: string;
  affectedAirports: string[];
  radiusKm: number;
  weatherTypes: string[];
  content: string;
}

export interface EnvironmentAirportDetail {
  airport: {
    id: number;
    code: string;
    iataCode: string | null;
    name: string;
    city: string | null;
    country: string | null;
  };
  snapshot: EnvironmentSnapshot;
  alerts: EnvironmentAlert[];
  overallRisk: {
    score: number;
    level: string;
    factors: EnvironmentRiskFactor[];
  };
  riskSummary: {
    score: number;
    riskLevel: string;
    airQuality: string;
    precipitation: string;
    extremeEvent: string;
  };
  keyFactors: {
    temperature: number;
    temperatureC: number;
    wind: { speed: number; direction: string };
    windSpeedKmh: number;
    windSpeedKt: number;
    windDirection: string;
    visibility: number;
    visibilityKm: number;
    humidity: number;
    humidityPct: number;
    cloudBaseM: number;
  };
  weatherSummary: {
    condition: string;
    precipitationProbabilityPct: number;
    precipitationTrend: number;
    temperatureC: number;
    visibilityKm: number;
    cloudBaseM: number;
    windSpeedKmh: number;
    windDirection: string;
    extremeEvent: string;
  };
  tempTrendData: {
    time: string;
    label: string;
    temp: number;
    temperatureC: number;
    condition: string;
  }[];
  temperatureTrend: {
    time: string;
    label: string;
    temp: number;
    temperatureC: number;
    condition: string;
  }[];
  hourlyForecast: { time: string; icon: string; temp: string }[];
  tempSparkline: number[];
  visSparkline: number[];
  humSparkline: number[];
  metarMessages: EnvironmentMetarMessage[];
  notices: EnvironmentNoticeItem[];
  weatherProvider: { name: string };
}

// ============ 逐小时天气预报 ============

export interface HourlyForecastItem {
  fxTime: string;
  temp: string;
  icon: string;
  text: string;
  wind360: string;
  windDir: string;
  windScale: string;
  windSpeed: string;
  humidity: string;
  precip: string;
  pressure: string;
  cloud: string;
  dew: string;
}

// ============ API 函数 ============

export function getEnvironmentAirports(params?: EnvironmentAirportsParams) {
  return request.get<EnvironmentAirportListResult>(
    "/api/v1/environment/airports",
    { params },
  );
}

export function getEnvironmentAirportDetail(code: string) {
  return request.get<EnvironmentAirportDetail>(
    `/api/v1/environment/airports/${code}`,
  );
}

/** @deprecated 接口已移除，报文数据在详情的 metarMessages 中 */
export function getEnvironmentMessage(id: number) {
  return request.get<EnvironmentMetarMessage>(
    `/api/v1/environment/messages/${id}`,
  );
}

/** @deprecated 接口已移除，通告数据在详情的 notices 中 */
export function getEnvironmentNotice(id: number) {
  return request.get<EnvironmentNoticeItem>(
    `/api/v1/environment/notices/${id}`,
  );
}

/** 机场逐小时天气预报（和风天气 QWeather） */
export function getEnvironmentHourlyForecast(
  code: string,
  params?: { hours?: "24h" | "72h" | "168h"; lang?: string; unit?: "m" | "i" },
) {
  return request.get<{ hourly: HourlyForecastItem[] }>(
    `/api/v1/environment/airports/${code}/hourly-forecast`,
    { params },
  );
}
