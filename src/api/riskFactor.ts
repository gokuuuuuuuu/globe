import request from "./request";

export interface RiskFactorListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  name?: string;
  importance?: "LOW" | "MEDIUM" | "HIGH";
  source?: "MODEL_OUTPUT" | "MANUAL";
}

export interface RuleItemDto {
  condition: string;
  action: string;
}

export interface CreateRiskFactorDto {
  code?: string;
  name: string;
  category: string;
  importance?: "LOW" | "MEDIUM" | "HIGH";
  source?: "MODEL_OUTPUT" | "MANUAL";
  score?: number;
  rules?: RuleItemDto[];
}

export interface UpdateRiskFactorDto {
  name?: string;
  category?: string;
  importance?: "LOW" | "MEDIUM" | "HIGH";
  source?: "MODEL_OUTPUT" | "MANUAL";
  score?: number;
}

export function getRiskFactorList(params?: RiskFactorListParams) {
  return request.get("/api/v1/risk-factors", { params });
}

export function getRiskFactorCategories() {
  return request.get("/api/v1/risk-factors/categories");
}

export function getRiskFactorDetail(id: number) {
  return request.get(`/api/v1/risk-factors/${id}`);
}

export function createRiskFactor(data: CreateRiskFactorDto) {
  return request.post("/api/v1/risk-factors", data);
}

export function updateRiskFactor(id: number, data: UpdateRiskFactorDto) {
  return request.put(`/api/v1/risk-factors/${id}`, data);
}

export function deleteRiskFactor(id: number) {
  return request.delete(`/api/v1/risk-factors/${id}`);
}

export function replaceRiskFactorRules(id: number, rules: RuleItemDto[]) {
  return request.put(`/api/v1/risk-factors/${id}/rules`, { rules });
}
