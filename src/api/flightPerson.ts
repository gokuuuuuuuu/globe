import request from "./request";

export interface FlightPersonListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  flightUnit?: string;
  aircraftType?: string;
  team?: string;
  squadron?: string;
  techGrade?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  startDate?: string;
  endDate?: string;
}

export function getFlightPersonList(params?: FlightPersonListParams) {
  return request.get("/api/v1/flight-persons", { params });
}

export function getFlightPersonDetail(empNo: string) {
  return request.get(`/api/v1/flight-persons/${empNo}`);
}

export function getFlightPersonFilterOptions() {
  return request.get("/api/v1/flight-persons/filter-options");
}

export function exportFlightPersons(params?: FlightPersonListParams) {
  return request.get("/api/v1/flight-persons/export", {
    params,
    responseType: "blob",
  });
}
