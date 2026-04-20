// @ts-nocheck
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FLIGHTS,
  // calculateRiskFromEnvironmentRisk,
  getIcaoCode,
} from "../data/flightData";
import { AIRPORT_LIST } from "../data/airportList";
import type { Flight } from "../data/flightData";
import { useLanguage } from "../i18n/useLanguage";
import { useAuthStore, isFullDataAccess } from "../store/useAuthStore";
import { downloadCSV } from "../utils/exportUtils";
import "./FlightListPage.css";

const PAGE_SIZE = 15;

// Extract unique values from flight data for filter dropdowns
function getUniqueValues(key: keyof Flight): string[] {
  const set = new Set<string>();
  FLIGHTS.forEach((f) => {
    const v = f[key];
    if (v && typeof v === "string") set.add(v);
  });
  return Array.from(set).sort();
}

const ALL_DEPARTURE_AIRPORTS = (() => {
  const set = new Set<string>();
  FLIGHTS.forEach((f) => {
    const code = f.fromAirportCode4 || getIcaoCode(f.fromAirport);
    if (code) set.add(code);
  });
  return Array.from(set).sort();
})();
const ALL_ARRIVAL_AIRPORTS = (() => {
  const set = new Set<string>();
  FLIGHTS.forEach((f) => {
    const code = f.toAirportCode4 || getIcaoCode(f.toAirport);
    if (code) set.add(code);
  });
  return Array.from(set).sort();
})();
const ALL_OPERATING_UNITS = getUniqueValues("operatingUnit");
const ALL_AIRCRAFT_TYPES = getUniqueValues("aircraftType");

// 飞行单位列表
const FLIGHT_UNITS = [
  "中货航",
  "云南",
  "西北",
  "中联航",
  "山东",
  "山西",
  "武汉",
  "北京",
  "江苏",
  "飞行总队",
  "厦门",
  "江西",
  "浙江",
  "四川",
  "上航",
  "甘肃",
  "安徽",
  "广东",
];

// 大机型筛选
const MAJOR_AIRCRAFT_TYPES = [
  "A320",
  "A330",
  "A350",
  "B737",
  "B777",
  "B787",
  "ARJ21",
  "C919",
];

// 机型明细映射
const AIRCRAFT_TYPE_DETAILS: Record<string, string[]> = {
  A320: ["A319", "A320", "A320-NEO", "A321", "A321-NEO"],
  A330: ["A330-200", "A330-300"],
  A350: ["A350-900"],
  B737: ["B737-700", "B737-800", "B737-MAX"],
  B777: ["B777-300ER", "B777F"],
  B787: ["B787-9"],
  ARJ21: ["ARJ21-700ER"],
  C919: ["C919"],
};

// 所有机型明细
const ALL_AIRCRAFT_TYPE_DETAILS = Object.values(AIRCRAFT_TYPE_DETAILS).flat();

// 主要风险类型
const RISK_TYPE_OPTIONS = [
  "冲/偏出跑道",
  "可控飞行撞地",
  "擦机尾/擦翼尖/擦发动机",
  "空中失控",
  "空中冲突",
  "空中损伤",
  "地面损伤",
  "跑道入侵",
  "鸟击",
  "重着陆",
  "不稳定进近",
  "重要系统故障",
];

const RISK_LEVELS = ["High Risk", "Medium Risk", "Low Risk"];
const FLIGHT_STATUSES = ["未起飞", "巡航中", "已落地"];

// Map Chinese risk level to English display
function riskLevelToEn(riskLevel: string): string {
  if (riskLevel === "高风险") return "High Risk";
  if (riskLevel === "中风险") return "Medium Risk";
  return "Low Risk";
}

// Get risk tags from flight data
function getRiskTags(flight: Flight): string[] {
  const tags: string[] = [];
  if (flight.predictedRisks && flight.predictedRisks.length > 0) {
    flight.predictedRisks.forEach((r) => {
      if (!tags.includes(r.type)) tags.push(r.type);
    });
  }
  if (flight.environmentRisk >= 7) tags.push("Severe Weather");
  if (flight.machineRisk >= 5) tags.push("Engine Fault");
  if (flight.humanRisk >= 5) tags.push("Pilot Fatigue");
  // deduplicate
  return [...new Set(tags)].length ? [...new Set(tags)] : ["—"];
}

// Get all unique risk tag types
const ALL_RISK_TYPES = (() => {
  const set = new Set<string>();
  FLIGHTS.forEach((f) => {
    getRiskTags(f).forEach((t) => {
      if (t !== "—") set.add(t);
    });
  });
  return Array.from(set).sort();
})();

// Governance status derived from composite risk
function getGovernanceStatus(flight: Flight): string {
  const composite =
    flight.humanRisk + flight.machineRisk + flight.environmentRisk;
  if (composite > 180) return "Not Addressed";
  if (composite > 100) return "In Progress";
  return "Closed";
}

const GOVERNANCE_STATUSES = ["Not Addressed", "In Progress", "Closed"];

function getCompositeRiskLabel(flight: Flight): string {
  return riskLevelToEn(flight.riskLevel);
}

function riskLabelClass(label: string): string {
  if (label === "High Risk") return "fl-risk-high";
  if (label === "Medium Risk") return "fl-risk-medium";
  return "fl-risk-low";
}

function govStatusClass(status: string): string {
  if (status === "Not Addressed") return "fl-gov-not";
  if (status === "In Progress") return "fl-gov-progress";
  return "fl-gov-closed";
}

function scoreColorClass(score: number): string {
  if (score >= 70) return "fl-score-red";
  if (score >= 40) return "fl-score-yellow";
  return "fl-score-green";
}

// Mock PF/PM names for display
const PF_NAMES = [
  "张伟",
  "李强",
  "王军",
  "刘洋",
  "陈鹏",
  "赵明",
  "孙磊",
  "周涛",
  "吴刚",
  "郑辉",
];
const PM_NAMES = [
  "黄勇",
  "林峰",
  "何斌",
  "马超",
  "朱健",
  "胡波",
  "高远",
  "罗翔",
  "谢宏",
  "唐杰",
];
function getMockPF(flight: Flight): string {
  const hash = flight.id ? flight.id.charCodeAt(flight.id.length - 1) : 0;
  return PF_NAMES[hash % PF_NAMES.length];
}
function getMockPM(flight: Flight): string {
  const hash = flight.id ? flight.id.charCodeAt(0) : 0;
  return PM_NAMES[hash % PM_NAMES.length];
}

// Add airline code prefix to flight number for display
const AIRLINE_CODES = [
  "MU",
  "FM",
  "KN",
  "MU",
  "MU",
  "FM",
  "MU",
  "KN",
  "FM",
  "MU",
];
function getDisplayFlightNumber(flight: Flight): string {
  // Use a deterministic index based on flight id hash
  const hash = flight.id ? flight.id.charCodeAt(flight.id.length - 1) : 0;
  const code = AIRLINE_CODES[hash % AIRLINE_CODES.length];
  // If flightNumber already starts with letters, return as-is
  if (/^[A-Z]{2}/.test(flight.flightNumber)) return flight.flightNumber;
  return `${code}${flight.flightNumber}`;
}

// Translate risk tag at render time
function translateRiskTag(
  tag: string,
  t: (zh: string, en: string) => string,
): string {
  const map: Record<string, [string, string]> = {
    "Severe Weather": ["恶劣天气", "Severe Weather"],
    "Engine Fault": ["发动机故障", "Engine Fault"],
    "Pilot Fatigue": ["飞行员疲劳", "Pilot Fatigue"],
    "Mechanical Issue": ["机械问题", "Mechanical Issue"],
    "Communication Error": ["通信错误", "Communication Error"],
    "Bad Weather": ["恶劣天气", "Bad Weather"],
  };
  const entry = map[tag];
  if (entry) return t(entry[0], entry[1]);
  return tag;
}

// Translate risk level at render time
function translateRiskLevel(
  level: string,
  t: (zh: string, en: string) => string,
): string {
  if (level === "High Risk") return t("高风险", "High Risk");
  if (level === "Medium Risk") return t("中风险", "Medium Risk");
  return t("低风险", "Low Risk");
}

// Translate governance status at render time
function translateGovStatus(
  status: string,
  t: (zh: string, en: string) => string,
): string {
  if (status === "Not Addressed") return t("未处置", "Not Addressed");
  if (status === "In Progress") return t("处置中", "In Progress");
  return t("已关闭", "Closed");
}

// Translate flight status at render time
function translateFlightStatus(
  status: string,
  t: (zh: string, en: string) => string,
): string {
  if (status === "未起飞") return t("未起飞", "Not Departed");
  if (status === "巡航中") return t("巡航中", "Cruising");
  return t("已落地", "Landed");
}

export function FlightListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const fullAccess = isFullDataAccess(authUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (pageOrFn: number | ((prev: number) => number)) => {
    const newPage = typeof pageOrFn === "function" ? pageOrFn(page) : pageOrFn;
    const sp = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      sp.delete("page");
    } else {
      sp.set("page", String(newPage));
    }
    setSearchParams(sp, { replace: true });
  };
  // Filters
  const [flightNumberFilter, setFlightNumberFilter] = useState("");
  const [aircraftNumberFilter, setAircraftNumberFilter] = useState("");
  const [departureFilter, setDepartureFilter] = useState("");
  const [arrivalFilter, setArrivalFilter] = useState("");
  const [operatingUnitFilter, setOperatingUnitFilter] = useState("");
  const [aircraftTypeFilter, setAircraftTypeFilter] = useState("");
  const [majorAircraftTypeFilter, setMajorAircraftTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("");
  const [riskTypeFilter, setRiskTypeFilter] = useState("");

  // Read URL params to pre-fill filters
  useEffect(() => {
    const risk = searchParams.get("risk");
    if (risk === "high") setRiskLevelFilter("High Risk");
    const aircraft = searchParams.get("aircraft");
    if (aircraft) setAircraftNumberFilter(aircraft);
  }, [searchParams]);

  const [airportPopover, setAirportPopover] = useState<{
    code: string;
    x: number;
    y: number;
  } | null>(null);

  // 根据角色过滤基础数据集
  const baseFlights = useMemo(() => {
    if (fullAccess) return FLIGHTS;
    const userUnit = authUser?.unit;
    if (!userUnit) return FLIGHTS;
    return FLIGHTS.filter((f) => {
      const unit = f.operatingUnit === "上海" ? "飞行总队" : f.operatingUnit;
      return unit === userUnit;
    });
  }, [fullAccess, authUser?.unit]);

  // Filtered data
  const filteredFlights = useMemo(() => {
    return baseFlights
      .filter((f) => {
        // Flight number filter
        if (
          flightNumberFilter &&
          !f.flightNumber
            .toLowerCase()
            .includes(flightNumberFilter.toLowerCase())
        )
          return false;

        // Aircraft number filter
        if (
          aircraftNumberFilter &&
          !(f.aircraftNumber || "")
            .toLowerCase()
            .includes(aircraftNumberFilter.toLowerCase())
        )
          return false;

        // Departure airport filter (ICAO 4-letter code)
        if (
          departureFilter &&
          (f.fromAirportCode4 || getIcaoCode(f.fromAirport)) !== departureFilter
        )
          return false;

        // Arrival airport filter (ICAO 4-letter code)
        if (
          arrivalFilter &&
          (f.toAirportCode4 || getIcaoCode(f.toAirport)) !== arrivalFilter
        )
          return false;

        // 飞行单位 filter（"上海"视为"飞行总队"）
        if (operatingUnitFilter) {
          const unit =
            f.operatingUnit === "上海" ? "飞行总队" : f.operatingUnit;
          if (unit !== operatingUnitFilter) return false;
        }

        // 大机型 filter
        if (majorAircraftTypeFilter) {
          const details = AIRCRAFT_TYPE_DETAILS[majorAircraftTypeFilter] || [];
          if (
            !details.some(
              (d) =>
                (f.aircraftType || "").includes(d) ||
                d.includes(f.aircraftType || ""),
            )
          )
            return false;
        }

        // Aircraft type filter
        if (aircraftTypeFilter && f.aircraftType !== aircraftTypeFilter)
          return false;

        // Flight status filter
        if (statusFilter && f.status !== statusFilter) return false;

        // Risk level filter
        if (riskLevelFilter && getCompositeRiskLabel(f) !== riskLevelFilter)
          return false;

        // Risk type filter
        if (riskTypeFilter && !getRiskTags(f).includes(riskTypeFilter))
          return false;

        return true;
      })
      .sort(
        (a, b) =>
          b.humanRisk +
          b.machineRisk +
          b.environmentRisk -
          (a.humanRisk + a.machineRisk + a.environmentRisk),
      );
  }, [
    flightNumberFilter,
    aircraftNumberFilter,
    departureFilter,
    arrivalFilter,
    operatingUnitFilter,
    aircraftTypeFilter,
    majorAircraftTypeFilter,
    statusFilter,
    riskLevelFilter,
    riskTypeFilter,
    baseFlights,
  ]);

  const totalPages = Math.ceil(filteredFlights.length / PAGE_SIZE);
  const pageFlights = filteredFlights.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleSearch = () => setPage(1);
  const handleReset = () => {
    setFlightNumberFilter("");
    setAircraftNumberFilter("");
    setDepartureFilter("");
    setArrivalFilter("");
    setOperatingUnitFilter("");
    setAircraftTypeFilter("");
    setMajorAircraftTypeFilter("");
    setStatusFilter([]);
    setRiskLevelFilter([]);
    setRiskTypeFilter([]);
    setPage(1);
  };

  const closeAllDropdowns = () => {
    setAirportPopover(null);
  };

  return (
    <div className="fl-root" onClick={closeAllDropdowns}>
      {/* Breadcrumb */}
      <div className="fl-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="fl-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/risk-monitoring/flights")}
        >
          {t("航班", "Flights")}
        </span>
        <span className="fl-breadcrumb-sep">&gt;</span>
        <span className="fl-breadcrumb-active">
          {t("航班列表", "Flight List")}
        </span>
      </div>

      {/* Page Header */}
      <div className="fl-page-header">
        <div className="fl-page-title">
          <h1>{t("航班列表", "Flight List")}</h1>
          <span className="fl-flight-count">
            {filteredFlights.length} {t("航班", "flights")}
          </span>
        </div>
        <div className="fl-page-actions">
          <button
            className="fl-action-btn"
            onClick={() => {
              const headers = [
                t("航班号", "Flight Number"),
                t("机尾号", "Tail Number"),
                t("机型", "Aircraft Type"),
                "PF",
                "PM",
                t("出发", "Departure"),
                t("到达", "Arrival"),
                t("起飞时间", "Departure Time"),
                t("降落时间", "Arrival Time"),
                t("状态", "Status"),
                t("综合风险等级", "Composite Risk Level"),
                t("人为因素评分", "Human Factor Score"),
                t("飞机因素评分", "Aircraft Factor Score"),
                t("环境因素评分", "Environmental Factor Score"),
                t("主要风险标签", "Major Risk Tags"),
              ];
              const rows = filteredFlights.map((f) => [
                getDisplayFlightNumber(f),
                f.aircraftNumber || "",
                f.aircraftType || "",
                getMockPF(f),
                getMockPM(f),
                f.fromAirportCode4 ||
                  getIcaoCode(f.fromAirport) ||
                  f.fromAirport,
                f.toAirportCode4 || getIcaoCode(f.toAirport) || f.toAirport,
                f.scheduledDeparture || f.actualDeparture || "",
                f.scheduledArrival || f.actualArrival || "",
                f.status,
                getCompositeRiskLabel(f),
                f.humanRisk,
                f.machineRisk,
                f.environmentRisk,
                getRiskTags(f).join("; "),
              ]);
              downloadCSV(t("航班列表", "flight_list"), headers, rows);
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("导出", "Export")}
          </button>
          {/* <button className="fl-action-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {t("保存筛选", "Save Filters")}
          </button>
          <button className="fl-action-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {t("列设置", "Column Settings")}
          </button> */}
        </div>
      </div>

      {/* Filters */}
      <div className="fl-filters">
        <div className="fl-filter-row">
          <div className="fl-filter-item">
            <label>{t("航班号", "Flight Number")}</label>
            <input
              className="fl-input"
              placeholder={t("输入航班号...", "Enter flight number...")}
              value={flightNumberFilter}
              onChange={(e) => setFlightNumberFilter(e.target.value)}
            />
          </div>
          <div className="fl-filter-item">
            <label>{t("机号", "Aircraft Number")}</label>
            <input
              className="fl-input"
              placeholder={t("输入机号...", "Enter aircraft number...")}
              value={aircraftNumberFilter}
              onChange={(e) => setAircraftNumberFilter(e.target.value)}
            />
          </div>
          <div className="fl-filter-item">
            <label>{t("出发机场", "Departure Airport")}</label>
            <select
              className="fl-select"
              value={departureFilter}
              onChange={(e) => setDepartureFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {AIRPORT_LIST.map((a) => (
                <option key={a.icao} value={a.icao}>
                  {a.icao} - {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("到达机场", "Arrival Airport")}</label>
            <select
              className="fl-select"
              value={arrivalFilter}
              onChange={(e) => setArrivalFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {AIRPORT_LIST.map((a) => (
                <option key={a.icao} value={a.icao}>
                  {a.icao} - {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("大机型", "Major Aircraft Type")}</label>
            <select
              className="fl-select"
              value={majorAircraftTypeFilter}
              onChange={(e) => {
                setMajorAircraftTypeFilter(e.target.value);
                setAircraftTypeFilter("");
              }}
            >
              <option value="">{t("全部", "All")}</option>
              {MAJOR_AIRCRAFT_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("机型", "Aircraft Type")}</label>
            <select
              className="fl-select"
              value={aircraftTypeFilter}
              onChange={(e) => setAircraftTypeFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {(majorAircraftTypeFilter
                ? AIRCRAFT_TYPE_DETAILS[majorAircraftTypeFilter] || []
                : ALL_AIRCRAFT_TYPE_DETAILS
              ).map((at) => (
                <option key={at} value={at}>
                  {at}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("飞行单位", "Flight Unit")}</label>
            <select
              className="fl-select"
              value={operatingUnitFilter}
              onChange={(e) => setOperatingUnitFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {FLIGHT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fl-filter-row">
          {/* Risk Level */}
          <div className="fl-filter-item">
            <label>{t("风险等级", "Risk Level")}</label>
            <select
              className="fl-select"
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {translateRiskLevel(r, t)}
                </option>
              ))}
            </select>
          </div>

          {/* Flight Status */}
          <div className="fl-filter-item">
            <label>{t("航班状态", "Flight Status")}</label>
            <select
              className="fl-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {FLIGHT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {translateFlightStatus(s, t)}
                </option>
              ))}
            </select>
          </div>

          {/* Major Risk Type */}
          <div className="fl-filter-item">
            <label>{t("主要风险类型", "Major Risk Type")}</label>
            <select
              className="fl-select"
              value={riskTypeFilter}
              onChange={(e) => setRiskTypeFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {RISK_TYPE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="fl-filter-actions">
            <button className="fl-btn-search" onClick={handleSearch}>
              {t("搜索", "Search")}
            </button>
            <button className="fl-btn-reset" onClick={handleReset}>
              {t("重置", "Reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="fl-table-wrapper">
        <table className="fl-table">
          <thead>
            <tr>
              <th>{t("航班号", "Flight Number")}</th>
              <th>{t("机尾号 / 机型", "Aircraft Tail / Type")}</th>
              <th>PF</th>
              <th>PM</th>
              <th>{t("出发", "Departure")}</th>
              <th>{t("到达", "Arrival")}</th>
              <th>{t("起飞时间", "Departure Time")}</th>
              <th>{t("降落时间", "Arrival Time")}</th>
              <th>{t("状态", "Status")}</th>
              <th>{t("综合风险等级", "Composite Risk Level")}</th>
              <th>{t("人为因素评分", "Human Factor Score")}</th>
              <th>{t("飞机因素评分", "Aircraft Factor Score")}</th>
              <th>{t("环境因素评分", "Environmental Factor Score")}</th>
              <th>{t("主要风险标签", "Major Risk Tags")}</th>
              <th style={{ minWidth: 100 }}>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageFlights.map((flight) => {
              const riskLabel = getCompositeRiskLabel(flight);
              const govStatus = getGovernanceStatus(flight);
              const tags = getRiskTags(flight);
              return (
                <tr
                  key={flight.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/risk-monitoring/flight-detail?id=${flight.id}`)
                  }
                >
                  <td className="fl-td-flight-no">
                    {getDisplayFlightNumber(flight)}
                  </td>
                  <td>
                    <span
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/aircraft-topic/aircraft-detail?tail=${flight.aircraftNumber || ""}`,
                        );
                      }}
                    >
                      {flight.aircraftNumber || "—"}
                    </span>
                    {" / "}
                    {flight.aircraftType || "—"}
                  </td>
                  <td>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/personnel-center/personnel-detail?id=p-0`);
                      }}
                    >
                      {getMockPF(flight)}
                    </span>
                  </td>
                  <td>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/personnel-center/personnel-detail?id=p-1`);
                      }}
                    >
                      {getMockPM(flight)}
                    </span>
                  </td>
                  <td style={{ position: "relative" }}>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      data-tip={flight.fromAirportZh || flight.fromAirport}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/environment-topic/environment-detail?code=${flight.fromAirport}`,
                        );
                      }}
                    >
                      {flight.fromAirportCode4 ||
                        getIcaoCode(flight.fromAirport)}
                    </span>
                  </td>
                  <td style={{ position: "relative" }}>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      data-tip={flight.toAirportZh || flight.toAirport}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/environment-topic/environment-detail?code=${flight.toAirport}`,
                        );
                      }}
                    >
                      {flight.toAirportCode4 || getIcaoCode(flight.toAirport)}
                    </span>
                  </td>
                  <td>
                    {flight.scheduledDeparture || flight.actualDeparture || "—"}
                  </td>
                  <td>
                    {flight.scheduledArrival || flight.actualArrival || "—"}
                  </td>
                  <td>
                    <span
                      className={`fl-status-badge fl-status-${flight.status === "已落地" ? "landed" : flight.status === "巡航中" ? "cruise" : "pending"}`}
                    >
                      {translateFlightStatus(flight.status, t)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-risk-badge ${riskLabelClass(riskLabel)}`}
                    >
                      {translateRiskLevel(riskLabel, t)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.humanRisk)}`}
                    >
                      {flight.humanRisk}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.machineRisk)}`}
                    >
                      {flight.machineRisk}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.environmentRisk)}`}
                    >
                      {flight.environmentRisk}
                    </span>
                  </td>
                  <td>
                    <div className="fl-tags">
                      {tags.map((tag, i) => (
                        <span key={i} className="fl-tag">
                          {tag === "—" ? "—" : translateRiskTag(tag, t)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div
                      className="fl-icon-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="fl-icon-btn"
                        data-tip={t("航班报告", "Flight Report")}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/risk-monitoring/flight-report?id=${flight.id}`,
                          );
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </button>
                      {/* 处置按钮已移除 */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="fl-pagination">
        <span className="fl-page-info">
          {filteredFlights.length} {t("条结果", "results")} | {t("第", "Page")}{" "}
          {page} {t("页，共", "of")} {totalPages || 1}
        </span>
        <div className="fl-page-btns">
          <button disabled={page === 1} onClick={() => setPage(1)}>
            &laquo;
          </button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            &lsaquo;
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                className={p === page ? "fl-page-active" : ""}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            &rsaquo;
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(totalPages)}
          >
            &raquo;
          </button>
        </div>
      </div>

      {/* Airport Popover */}
      {airportPopover && (
        <div
          className="fl-airport-popover"
          style={{ left: airportPopover.x, top: airportPopover.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="fl-airport-popover-item"
            onClick={() => {
              navigate(
                `/environment-topic/environment-detail?code=${airportPopover.code}`,
              );
              setAirportPopover(null);
            }}
          >
            {t("查看机场环境", "Airport Environment")}
          </button>
          <button
            className="fl-airport-popover-item"
            onClick={() => {
              navigate(
                `/airport-center/airport-detail?code=${airportPopover.code}`,
              );
              setAirportPopover(null);
            }}
          >
            {t("查看机场详情", "Airport Detail")}
          </button>
        </div>
      )}
    </div>
  );
}
