import request from "./request";

// ============ 共用子类型 ============

export interface PlaneRef {
  registration: string;
  model: string;
}

export interface PersonRef {
  empNo: string;
  name: string;
}

export interface AirportRef {
  code: string;
  name: string;
}

// ============ 列表 ============

export interface FlightListParams {
  page?: number;
  pageSize?: number;
  flightNo?: string;
  planeRegistration?: string;
  departureAirportId?: number;
  arrivalAirportId?: number;
  aircraftModel?: string;
  aircraftCategory?: string;
  operatingUnit?: string;
  riskLevel?: string;
  status?: string;
  riskType?: string;
  governanceStatus?: string;
}

export interface FlightListItem {
  id: number;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  actualDepartureTime: string | null;
  actualArrivalTime: string | null;
  delayMinutes: number | null;
  delayReason: string | null;
  status: string;
  riskLevel: string;
  humanFactorScore: number;
  aircraftFactorScore: number;
  environmentFactorScore: number;
  riskTags: string[] | null;
  governanceStatus: string;
  operatingUnit: string;
  plane: PlaneRef | null;
  pf: PersonRef | null;
  pm: PersonRef | null;
  departureAirport: AirportRef | null;
  arrivalAirport: AirportRef | null;
}

export interface FlightListResult {
  items: FlightListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ filter-options ============

export interface FlightFilterOptions {
  airportRemote: boolean;
  airportEndpoint: string;
  aircraftModels: string[];
  operatingUnits: string[];
  riskLevels: string[];
  statuses: string[];
  governanceStatuses: string[];
}

export interface FlightFilterAirport {
  id: number;
  code: string;
  iataCode: string | null;
  name: string;
  city: string | null;
  country: string | null;
  totalFlightCount: number;
  value: number;
  label: string;
}

// ============ 详情 /flights/{id} ============

export interface FactorContributionItem {
  name: string;
  score: number;
  color: string;
}

export interface FactorContributions {
  human: FactorContributionItem[];
  aircraft: FactorContributionItem[];
  environment: FactorContributionItem[];
  composite: FactorContributionItem[];
}

export interface RiskEvent {
  id: number;
  name: string;
  risk: string;
  priority: string;
  priorityColor: string;
  summary: string;
  cause: string;
  suggestion: string;
  action: string;
}

export interface PhaseRisk {
  name: string;
  riskScore: number;
  weight: string;
  bars: number[];
  barColors: string[];
  tags: string[];
}

export interface FlightDetailData extends FlightListItem {
  predictionWindowMinutes: number | null;
  majorRiskAlert: string | null;
  takeoffRiskScore: number | null;
  takeoffRiskWeight: number | null;
  takeoffRiskTags: string | null;
  cruiseRiskScore: number | null;
  cruiseRiskWeight: number | null;
  cruiseRiskTags: string | null;
  landingRiskScore: number | null;
  landingRiskWeight: number | null;
  landingRiskTags: string | null;
  factorContributions: FactorContributions | null;
  riskEvents: RiskEvent[];
  phaseRisks: PhaseRisk[];
}

// ============ 报告 /flights/{id}/report ============

export interface FlightReportFacts {
  flightNo: string;
  date: string;
  aircraft: PlaneRef;
  pf: PersonRef | null;
  pm: PersonRef | null;
  route: {
    departure: AirportRef;
    arrival: AirportRef;
  };
  schedule: {
    scheduledDeparture: string;
    scheduledArrival: string;
    actualDeparture: string | null;
    actualArrival: string | null;
    delayMinutes: number | null;
    delayReason: string | null;
  };
  status: string;
  overallRisk: string;
  overallScore: number;
  reportGeneratedAt: string;
}

export interface FlightReportConclusion {
  totalRisk: string;
  riskScore: number;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  intro: string;
}

export interface FlightReportPhase {
  phase: string;
  level: string;
  score: number;
  keyEvents: { name: string; riskScore: number }[];
}

export interface FlightReportMajorRisk {
  name: string;
  severity: string;
  description: string;
  recommendedAction: string;
}

export interface FlightReportHumanFactor {
  score: number;
  subMetrics: {
    name: string;
    rating: string;
    narrative: string;
    colorCode: string;
  }[];
}

export interface FlightReportAircraftFactor {
  score: number;
  systems: {
    name: string;
    status: string;
    colorCode: string;
  }[];
  maintenanceLogSummary: string;
  phaseRiskMatrix: {
    phase: string;
    systems: Record<string, string>;
  }[];
}

export interface FlightReportEnvironmentFactor {
  score: number;
  weatherCondition: string;
  airTrafficDensity: string;
  airmanityRange: string;
  keyAnalysis: {
    system: string;
    narrative: string;
  }[];
}

export interface FlightReportData {
  // 结构化数据
  facts: FlightReportFacts;
  conclusion: FlightReportConclusion;
  phaseAnalysis: FlightReportPhase[];
  majorRisks: FlightReportMajorRisk[];
  humanFactorData: FlightReportHumanFactor;
  aircraftFactorData: FlightReportAircraftFactor;
  environmentFactorData: FlightReportEnvironmentFactor;
  factorExplanations: { name: string; desc: string }[];
  evidenceSources: { name: string; desc: string }[];
  // HTML 富文本（备用渲染）
  compositeConclusion?: string;
  majorRiskDetail?: string;
  humanFactorAnalysis?: string;
  aircraftFactorAnalysis?: string;
  environmentalFactorAnalysis?: string;
  factorExplanation?: string;
  evidenceChain?: string;
  evidenceAppendix?: string;
  // 顶层摘要
  flightInfo?: {
    flightId: number;
    flightNo: string;
    date: string;
    aircraft: string;
    aircraftModel: string;
    pilot: string;
    pf: string;
    pm: string;
    route: string;
    status: string;
    summary: string;
  };
  compositeRisk?: {
    summary: string;
    overallRisk: string;
    riskScore: string;
    introduction: string;
    severityDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  reportGeneratedAt?: string;
}

// ============ 重大风险详情 /flights/{id}/major-risk-detail ============

export interface MajorRiskCauseNode {
  name: string;
  score: number;
  riskLevel: string;
  description: string;
}

export interface FlightMajorRiskDetailData {
  id: string;
  flightId: number;
  flightNo: string;
  title: string;
  riskLevel: string;
  priority: string;
  identifiedAt: string;
  status: string;
  route: {
    departureAirport: AirportRef;
    arrivalAirport: AirportRef;
    aircraft: PlaneRef;
  };
  causeChain: {
    categories: {
      category: string;
      nodes: MajorRiskCauseNode[];
    }[];
  };
  relatedPhases: {
    phase: string;
    active: boolean;
    riskLevel: string;
  }[];
  mitigationActions: {
    action: string;
    ownerDepartment: string;
    priority: string;
    dueDate: string;
    status: string;
  }[];
  similarCases: {
    caseId: string;
    summary: string;
    date: string;
    outcome: string;
  }[];
}

// ============ 因子解释 /flights/{id}/factor-explanations/{factorId} ============

export interface FlightFactorExplanationData {
  id: string;
  name: string;
  dimension: string;
  contribution: number;
  riskLevel: string;
  description: string;
  flightId: number;
  flightNo: string;
  lastAnalyzedAt: string;
  analysisMethod: string;
  rules: {
    condition: string;
    result: string;
  }[];
  modelFeatures: {
    name: string;
    description: string;
    currentValue: number;
    threshold: string;
  }[];
  contributionTrend: {
    label: string;
    value: number;
    threshold: number;
  }[];
  peerComparison: {
    bucket: number;
    sampleCount: number;
    thisFlight: number | null;
  }[];
  relatedFlights: {
    flightNo: string;
    date: string;
    route: string;
    factorScore: number;
    status: string;
  }[];
  relatedObjects: {
    objectId: string;
    type: string;
    relation: string;
  }[];
  relatedRules: {
    name: string;
    description: string;
  }[];
}

// ============ 证据链 /flights/{id}/evidence-chain ============

export interface EvidenceItem {
  id: string;
  title: string;
  summary: string;
  severity: string;
  sourceType: string;
  verified: boolean;
  timestamp: string;
  relation: string;
  addedBy: string;
  rawSourceUrl: string | null;
  relatedRules: string[];
  auditLog: { at: string; actor: string; action: string }[];
}

export interface FlightEvidenceChainData {
  assessment: {
    id: string;
    flightId: number;
    flightNo: string;
    subject: string;
    date: string;
    createdBy: string;
    lastUpdatedBy: string;
    status: string;
    riskLevel: string;
  };
  severityDistribution: {
    red: number;
    yellow: number;
    green: number;
  };
  items: EvidenceItem[];
  download: {
    fileName: string;
    contentType: string;
  };
}

export interface FlightEvidenceExportData {
  fileName: string;
  contentType: string;
  url?: string;
  size?: number;
}

// ============ API 函数 ============

export function getFlightList(params?: FlightListParams) {
  return request.get<FlightListResult>("/api/v1/flights", { params });
}

export function getFlightDetail(id: number) {
  return request.get<FlightDetailData>(`/api/v1/flights/${id}`);
}

export function getFlightFilterOptions() {
  return request.get<FlightFilterOptions>("/api/v1/flights/filter-options");
}

export function searchFlightAirports(keyword: string) {
  return request.get<{ items: FlightFilterAirport[]; total: number }>(
    "/api/v1/flights/filter-options/airports",
    { params: { keyword } },
  );
}

export function exportFlights(params?: FlightListParams) {
  return request.get("/api/v1/flights/export", {
    params,
    responseType: "blob",
  });
}

export function getFlightReport(id: number) {
  return request.get<FlightReportData>(`/api/v1/flights/${id}/report`);
}

export function getFlightEvidenceChain(id: number) {
  return request.get<FlightEvidenceChainData>(
    `/api/v1/flights/${id}/evidence-chain`,
  );
}

export function exportFlightEvidenceChain(id: number) {
  return request.get<FlightEvidenceExportData>(
    `/api/v1/flights/${id}/evidence-chain/export`,
  );
}

export function getFlightFactorExplanation(id: number, factorId: string) {
  return request.get<FlightFactorExplanationData>(
    `/api/v1/flights/${id}/factor-explanations/${factorId}`,
  );
}

export function getFlightMajorRiskDetail(id: number) {
  return request.get<FlightMajorRiskDetailData>(
    `/api/v1/flights/${id}/major-risk-detail`,
  );
}

// ============ 事实详情 /flights/{id}/fact-detail ============

export interface FactDetailChart {
  id: string;
  title: string;
  chartType: string;
  xField: string;
  yFields: string[];
  unit: string;
  points: Record<string, number | string>[];
}

export interface FactDetailBlock {
  type: "paragraph" | "table" | "list" | "chart";
  text?: string;
  title?: string;
  columns?: string[];
  rows?: Record<string, string>[];
  items?: string[];
  chart?: FactDetailChart;
}

export interface FactDetailSection {
  id: string;
  title: string;
  blocks: FactDetailBlock[];
}

export interface FlightFactDetail {
  id: number;
  flightId: number;
  flightNo: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: FactDetailSection[];
  charts: FactDetailChart[];
}

export function getFlightFactDetail(id: number) {
  return request.get<FlightFactDetail>(`/api/v1/flights/${id}/fact-detail`);
}
