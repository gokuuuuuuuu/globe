// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { downloadCSV } from "../utils/exportUtils";
import "./MaintenanceInfoPage.css";

// ===== Mock Data =====

const aircraftInfo = {
  id: "P20-4561",
  aircraftId: "N123AR",
  model: "Challenger 350",
  location: "KORD",
  status: "Serviceable",
  totalHours: 1388,
  cycles: "Cycles / Cycles",
};

const restrictions = [
  { code: "MEL 32-01", description: "Nose Gear Steering" },
  { code: "DDM 21-05", description: "Packs" },
];

const riskProfile = [
  { phase: "Landing", pct: 90, color: "#ef4444" },
  { phase: "Cruise", pct: 80, color: "#f97316" },
  { phase: "Takeoff", pct: 65, color: "#84cc16" },
  { phase: "Pre-flight", pct: 30, color: "#22c55e" },
];

const repeatedFaults = [
  { system: "System 29 Hydraulics", count: -3 },
  { system: "System 29 Hydraulics", count: -3 },
];

// Timeline events: type = "unscheduled" | "scheduled"
const timelineEvents = [
  { day: 2, type: "unscheduled" as const, tooltip: "Rudder Actuator Fault" },
  { day: 5, type: "scheduled" as const, tooltip: "Scheduled Check A" },
  { day: 8, type: "unscheduled" as const, tooltip: "Hydraulic Pump Failure" },
  { day: 11, type: "scheduled" as const, tooltip: "Component Replacement" },
  { day: 14, type: "unscheduled" as const, tooltip: "Avionics Fault" },
  { day: 17, type: "scheduled" as const, tooltip: "Tire Change" },
  { day: 20, type: "unscheduled" as const, tooltip: "Engine Vibration Alert" },
  { day: 24, type: "scheduled" as const, tooltip: "Scheduled Inspection" },
];

// Timeline risk badges
const timelineRisks = [
  { day: 2, level: "Red" as const },
  { day: 5, level: "Green" as const },
  { day: 8, level: "Yellow" as const },
  { day: 11, level: "Yellow" as const },
  { day: 14, level: "Red" as const },
  { day: 17, level: "Green" as const },
  { day: 20, level: "Yellow" as const },
  { day: 24, level: "Open" as const },
];

type SortField = "date" | "eventType" | "status" | "criticality" | "phases";
type SortDir = "asc" | "desc";

interface MaintenanceRecord {
  date: string;
  recordId: string;
  eventType: string;
  description: string;
  criticalSystems: string;
  status: "Closed" | "Open";
  repeated: boolean;
  criticality: "High" | "Yellow" | "Green" | "Red";
  phases: string[];
  highlighted?: boolean;
}

const tableData: MaintenanceRecord[] = [
  {
    date: "08/03/2023",
    recordId: "N123AR",
    eventType: "Scheduled Check",
    description: "Rudder Actuator Fault",
    criticalSystems: "ATA 27",
    status: "Closed",
    repeated: true,
    criticality: "High",
    phases: ["Takeoff", "Landing", "Cruise"],
  },
  {
    date: "07/01/2023",
    recordId: "N123AR",
    eventType: "Fault",
    description: "Left Main Gear Tire Change",
    criticalSystems: "ATA 27",
    status: "Closed",
    repeated: false,
    criticality: "Yellow",
    phases: ["Takeoff", "Landing", "Cruise"],
  },
  {
    date: "07/07/2023",
    recordId: "N123AR",
    eventType: "Component Change",
    description: "Left Main Gear Tire Change",
    criticalSystems: "ATA 32",
    status: "Open",
    repeated: true,
    criticality: "Green",
    phases: ["Takeoff", "Landing", "Cruise"],
    highlighted: true,
  },
  {
    date: "07/01/2023",
    recordId: "N123AR",
    eventType: "Component Change",
    description: "Left Main Gear Tire Change",
    criticalSystems: "ATA 32",
    status: "Open",
    repeated: false,
    criticality: "Yellow",
    phases: ["Takeoff", "Landing"],
  },
  {
    date: "09/01/2023",
    recordId: "N123AR",
    eventType: "Scheduled Check",
    description: "Brake System Inspection",
    criticalSystems: "ATA 32",
    status: "Closed",
    repeated: false,
    criticality: "Yellow",
    phases: ["Landing", "Cruise"],
  },
  {
    date: "06/01/2023",
    recordId: "N123AR",
    eventType: "Fault",
    description: "Rudder Actuator Fault",
    criticalSystems: "ATA 37",
    status: "Open",
    repeated: false,
    criticality: "Red",
    phases: ["Takeoff", "Landing", "Cruise"],
  },
];

const TIMELINE_DAYS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24,
];

const criticalityOrder: Record<string, number> = {
  Red: 4,
  High: 4,
  Yellow: 2,
  Green: 1,
};

function getCriticalityClass(c: string) {
  if (c === "High" || c === "Red") return "mt-criticality-red";
  if (c === "Yellow") return "mt-criticality-yellow";
  return "mt-criticality-green";
}

function getPhaseClass(phase: string) {
  if (phase === "Takeoff") return "mt-phase-dot-takeoff";
  if (phase === "Landing") return "mt-phase-dot-landing";
  if (phase === "Cruise") return "mt-phase-dot-cruise";
  return "mt-phase-dot-preflight";
}

function getBadgeClass(level: string) {
  if (level === "Red") return "mt-badge-red";
  if (level === "Yellow") return "mt-badge-yellow";
  if (level === "Green") return "mt-badge-green";
  return "mt-badge-open";
}

// SVG icons as inline components
function WrenchIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DownloadIcon() {
  return (
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span
      className={active ? "mt-sort-icon mt-sort-icon-active" : "mt-sort-icon"}
    >
      {active ? (dir === "asc" ? "▲" : "▼") : "▲▼"}
    </span>
  );
}

export function MaintenanceInfoPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedRow, setSelectedRow] = useState<number>(2); // highlighted row index

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedData = [...tableData].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "date":
        return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "eventType":
        return dir * a.eventType.localeCompare(b.eventType);
      case "status":
        return dir * a.status.localeCompare(b.status);
      case "criticality":
        return (
          dir *
          ((criticalityOrder[a.criticality] || 0) -
            (criticalityOrder[b.criticality] || 0))
        );
      case "phases":
        return dir * (a.phases.length - b.phases.length);
      default:
        return 0;
    }
  });

  const getDayPosition = (day: number) => {
    const idx = TIMELINE_DAYS.indexOf(day);
    if (idx === -1) return "0%";
    return `${((idx + 0.5) / TIMELINE_DAYS.length) * 100}%`;
  };

  return (
    <div className="mt-root">
      {/* Breadcrumb */}
      <div className="mt-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="mt-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/aircraft-topic/aircraft-list")}
        >
          {t("机", "Aircraft")}
        </span>
        <span className="mt-breadcrumb-sep">&gt;</span>
        <span className="mt-breadcrumb-active">
          {t("维修信息", "Maintenance Info")}: P20 Asset
        </span>
      </div>
      <div style={{ margin: "8px 0 0 0" }}>
        <button
          style={{
            background: "rgba(71,85,105,0.5)",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#e2e8f0",
            borderRadius: 6,
            padding: "4px 14px",
            cursor: "pointer",
            fontSize: 13,
          }}
          onClick={() => navigate(-1)}
        >
          {t("返回", "Back")}
        </button>
      </div>

      {/* Top 4 Cards */}
      <div className="mt-top-cards">
        {/* Card 1: Aircraft Info */}
        <div className="mt-card">
          <h3 className="mt-card-title">{aircraftInfo.id}</h3>
          <div className="mt-card-subtitle">
            ({t("飞机ID", "Aircraft ID")}: {aircraftInfo.aircraftId})
          </div>
          <div className="mt-card-row">
            <span className="mt-card-label">{t("机型", "Model")}</span>
            <span className="mt-card-value">{aircraftInfo.model}</span>
          </div>
          <div className="mt-card-row">
            <span className="mt-card-label">
              {t("当前位置", "Current Location")}
            </span>
            <span className="mt-card-value">{aircraftInfo.location}</span>
          </div>
          <div className="mt-card-row">
            <span className="mt-card-label">{t("状态", "Status")}</span>
            <span className="mt-card-value mt-card-value-green">
              {t("可用", aircraftInfo.status)}
            </span>
          </div>
          <div className="mt-card-row">
            <span className="mt-card-label">
              {t("总飞行小时", "Total Hours")}
            </span>
            <span className="mt-card-value">
              {aircraftInfo.totalHours} +{" "}
              {t("循环 / 循环", aircraftInfo.cycles)}
            </span>
          </div>
        </div>

        {/* Card 2: Active Key Restrictions */}
        <div className="mt-card">
          <h3 className="mt-card-title">
            {t("关键限制", "Active Key Restrictions")}
          </h3>
          <div className="mt-card-subtitle">
            {t("关键项目和DDM", "Critical items and DDMs")}
          </div>
          {restrictions.map((r, i) => (
            <div className="mt-restriction-item" key={i}>
              <div className="mt-warning-icon">⚠</div>
              <div>
                <div className="mt-restriction-code">{r.code}</div>
                <div className="mt-restriction-desc">
                  {r.description === "Nose Gear Steering"
                    ? t("前起落架转向", "Nose Gear Steering")
                    : r.description === "Packs"
                      ? t("组件", "Packs")
                      : r.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Card 3: Flight-Phase Risk Profile */}
        <div className="mt-card">
          <h3 className="mt-card-title">
            {t("飞行阶段风险画像", "Flight-Phase Risk Profile")}
          </h3>
          <div className="mt-card-subtitle">
            {t("当前汇总风险", "Current aggregated risk")}
          </div>
          {riskProfile.map((r, i) => (
            <div className="mt-risk-bar-group" key={i}>
              <div className="mt-risk-bar-label">
                <span className="mt-risk-bar-name">
                  {t(
                    r.phase === "Landing"
                      ? "着陆"
                      : r.phase === "Cruise"
                        ? "巡航"
                        : r.phase === "Takeoff"
                          ? "起飞"
                          : "飞行前",
                    r.phase,
                  )}
                </span>
                <span className="mt-risk-bar-pct">{r.pct}%</span>
              </div>
              <div className="mt-risk-bar-track">
                <div
                  className="mt-risk-bar-fill"
                  style={{ width: `${r.pct}%`, background: r.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Card 4: Recent Repeated Faults */}
        <div className="mt-card">
          <h3 className="mt-card-title">
            {t("近期重复故障", "Recent Repeated Faults")}
          </h3>
          <div className="mt-card-subtitle">
            {t("近期重复为3次出现", "Recent repeated is 3 occurrences")}
          </div>
          {repeatedFaults.map((f, i) => (
            <div className="mt-fault-item" key={i}>
              <span className="mt-fault-name">
                {f.system === "System 29 Hydraulics"
                  ? t("系统29 液压", "System 29 Hydraulics")
                  : f.system}
              </span>
              <span className="mt-fault-count">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Section: Maintenance History & Risk Analysis */}
      <div className="mt-section-header">
        <h2 className="mt-section-title">
          {t("维修历史与风险分析", "Maintenance History & Risk Analysis")}
        </h2>
        <div className="mt-section-controls">
          <button className="mt-btn">
            <span className="mt-btn-icon">
              <CalendarIcon />
            </span>
            {t("过去12个月", "past 12 months")}
            <span className="mt-btn-icon" style={{ marginLeft: 2 }}>
              ▾
            </span>
          </button>
          <button className="mt-btn">
            {t("筛选", "Filters")}
            <span className="mt-btn-icon" style={{ marginLeft: 2 }}>
              ▾
            </span>
          </button>
          <button
            className="mt-btn"
            onClick={() => {
              const headers = [
                t("日期", "Date"),
                t("记录ID", "Record ID"),
                t("事件类型", "Event Type"),
                t("描述", "Description"),
                t("关键系统", "Critical Systems"),
                t("状态", "Status"),
                t("重复", "Repeated"),
                t("严重性", "Criticality"),
                t("飞行阶段", "Phases"),
              ];
              const rows = sortedData.map((r) => [
                r.date,
                r.recordId,
                r.eventType,
                r.description,
                r.criticalSystems,
                r.status,
                r.repeated ? t("是", "Yes") : t("否", "No"),
                r.criticality,
                r.phases.join(", "),
              ]);
              downloadCSV(t("维护记录", "maintenance_records"), headers, rows);
            }}
          >
            <span className="mt-btn-icon">
              <DownloadIcon />
            </span>
            {t("导出", "Export")}
          </button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="mt-timeline-container">
        <div className="mt-timeline-scroll">
          <div className="mt-timeline-inner">
            {/* Timeline Axis */}
            <div className="mt-timeline-axis">
              {TIMELINE_DAYS.map((day) => (
                <div className="mt-timeline-tick" key={day}>
                  {day}
                </div>
              ))}
            </div>

            {/* Event rows */}
            <div className="mt-timeline-rows">
              {/* Row 1: Maintenance event icons */}
              <div className="mt-timeline-row">
                <div className="mt-timeline-row-label">
                  {t("维修事件", "Events")}
                </div>
                <div className="mt-timeline-row-track">
                  {timelineEvents.map((evt, i) => (
                    <div
                      key={i}
                      className={`mt-timeline-event ${
                        evt.type === "unscheduled"
                          ? "mt-timeline-event-unscheduled"
                          : "mt-timeline-event-scheduled"
                      }`}
                      style={{ left: getDayPosition(evt.day) }}
                      onMouseEnter={() => setHoveredEvent(i)}
                      onMouseMove={(e) =>
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      {evt.type === "unscheduled" ? (
                        <WrenchIcon />
                      ) : (
                        <GearIcon />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashed connectors */}
              {timelineEvents.map((evt, i) => {
                const matchRisk = timelineRisks.find((r) => r.day === evt.day);
                if (!matchRisk) return null;
                return (
                  <div
                    key={`conn-${i}`}
                    className="mt-timeline-connector"
                    style={{
                      left: `calc(100px + (100% - 100px) * ${(TIMELINE_DAYS.indexOf(evt.day) + 0.5) / TIMELINE_DAYS.length})`,
                      top: "54px",
                      height: "24px",
                    }}
                  />
                );
              })}

              {/* Row 2: Risk badges */}
              <div className="mt-timeline-row">
                <div className="mt-timeline-row-label">
                  {t("风险等级", "Risk Level")}
                </div>
                <div className="mt-timeline-row-track">
                  {timelineRisks.map((risk, i) => (
                    <div
                      key={i}
                      className={`mt-timeline-badge ${getBadgeClass(risk.level)}`}
                      style={{ left: getDayPosition(risk.day) }}
                    >
                      {risk.level === "Red"
                        ? t("红色", "Red")
                        : risk.level === "Yellow"
                          ? t("黄色", "Yellow")
                          : risk.level === "Green"
                            ? t("绿色", "Green")
                            : risk.level === "Open"
                              ? t("进行中", "Open")
                              : risk.level}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-timeline-legend">
              <div className="mt-legend-item">
                <span
                  className="mt-legend-icon"
                  style={{
                    background: "rgba(239,68,68,0.2)",
                    border: "1.5px solid #ef4444",
                    color: "#ef4444",
                  }}
                >
                  <WrenchIcon />
                </span>
                {t("非计划", "Unscheduled")}
              </div>
              <div className="mt-legend-item">
                <span
                  className="mt-legend-icon"
                  style={{
                    background: "rgba(59,130,246,0.2)",
                    border: "1.5px solid #3b82f6",
                    color: "#3b82f6",
                  }}
                >
                  <GearIcon />
                </span>
                {t("计划", "Scheduled")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-table-container">
        <table className="mt-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("date")}>
                <span className="mt-th-sortable">
                  {t("日期", "Date")}
                  <SortIcon active={sortField === "date"} dir={sortDir} />
                </span>
              </th>
              <th>{t("记录ID", "Record ID")}</th>
              <th onClick={() => handleSort("eventType")}>
                <span className="mt-th-sortable">
                  {t("事件类型", "Event Type")}
                  <SortIcon active={sortField === "eventType"} dir={sortDir} />
                </span>
              </th>
              <th>{t("描述", "Description")}</th>
              <th>{t("关键系统", "Critical Systems")}</th>
              <th onClick={() => handleSort("status")}>
                <span className="mt-th-sortable">
                  {t("状态", "Status")}
                  <SortIcon active={sortField === "status"} dir={sortDir} />
                </span>
              </th>
              <th>{t("重复", "Repeated")}</th>
              <th onClick={() => handleSort("criticality")}>
                <span className="mt-th-sortable">
                  {t("严重程度", "Criticality")}
                  <SortIcon
                    active={sortField === "criticality"}
                    dir={sortDir}
                  />
                </span>
              </th>
              <th onClick={() => handleSort("phases")}>
                <span className="mt-th-sortable">
                  {t("影响飞行阶段", "Affected Flight Phases")}
                  <SortIcon active={sortField === "phases"} dir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={i}
                className={
                  row.highlighted || selectedRow === i
                    ? "mt-table-row-highlighted"
                    : ""
                }
                onClick={() => setSelectedRow(i)}
                style={{ cursor: "pointer" }}
              >
                <td>{row.date}</td>
                <td>{row.recordId}</td>
                <td>
                  {row.eventType === "Scheduled Check"
                    ? t("计划检查", "Scheduled Check")
                    : row.eventType === "Fault"
                      ? t("故障", "Fault")
                      : row.eventType === "Component Change"
                        ? t("部件更换", "Component Change")
                        : row.eventType}
                </td>
                <td>
                  {row.description === "Rudder Actuator Fault"
                    ? t("方向舵作动器故障", "Rudder Actuator Fault")
                    : row.description === "Left Main Gear Tire Change"
                      ? t("左主起落架轮胎更换", "Left Main Gear Tire Change")
                      : row.description === "Brake System Inspection"
                        ? t("刹车系统检查", "Brake System Inspection")
                        : row.description}
                </td>
                <td>{row.criticalSystems}</td>
                <td>
                  <span
                    className={
                      row.status === "Closed"
                        ? "mt-status-closed"
                        : "mt-status-open"
                    }
                  >
                    {row.status === "Closed"
                      ? t("已关闭", "Closed")
                      : t("进行中", "Open")}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      row.repeated ? "mt-repeated-yes" : "mt-repeated-no"
                    }
                  >
                    {row.repeated ? t("是", "Yes") : t("否", "No")}
                  </span>
                </td>
                <td>
                  <span
                    className={`mt-criticality ${getCriticalityClass(row.criticality)}`}
                  >
                    {row.criticality === "High"
                      ? t("高", "High")
                      : row.criticality === "Yellow"
                        ? t("黄色", "Yellow")
                        : row.criticality === "Green"
                          ? t("绿色", "Green")
                          : row.criticality === "Red"
                            ? t("红色", "Red")
                            : row.criticality}
                  </span>
                </td>
                <td>
                  <div className="mt-phase-dots">
                    {row.phases.map((phase, j) => (
                      <span className="mt-phase-dot-item" key={j}>
                        <span
                          className={`mt-phase-dot ${getPhaseClass(phase)}`}
                        />
                        {t(
                          phase === "Takeoff"
                            ? "起飞"
                            : phase === "Landing"
                              ? "着陆"
                              : phase === "Cruise"
                                ? "巡航"
                                : "飞行前",
                          phase,
                        )}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons Bar */}
      <div className="mt-action-bar">
        <button className="mt-btn mt-btn-primary">
          {t("查看维修详情", "View Maintenance Details")}
        </button>
        <button className="mt-btn">
          {t("查看相关航班", "View Related Flights")}
        </button>
        <button className="mt-btn">
          {t("查看特定航班", "View Specific Flight")}
        </button>
      </div>
      {/* Fixed tooltip rendered at root level */}
      {hoveredEvent !== null && (
        <div
          className="mt-timeline-tooltip"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 40,
          }}
        >
          <div className="mt-tooltip-title">
            {t("事件风险摘要", "Event Risk Summary")}
          </div>
          <div className="mt-tooltip-desc">
            {t("故障", "Fault")}:{" "}
            {timelineEvents[hoveredEvent].tooltip === "Rudder Actuator Fault"
              ? t("方向舵作动器故障", "Rudder Actuator Fault")
              : timelineEvents[hoveredEvent].tooltip === "Scheduled Check A"
                ? t("计划检查A", "Scheduled Check A")
                : timelineEvents[hoveredEvent].tooltip ===
                    "Hydraulic Pump Failure"
                  ? t("液压泵故障", "Hydraulic Pump Failure")
                  : timelineEvents[hoveredEvent].tooltip ===
                      "Component Replacement"
                    ? t("部件更换", "Component Replacement")
                    : timelineEvents[hoveredEvent].tooltip === "Avionics Fault"
                      ? t("航电故障", "Avionics Fault")
                      : timelineEvents[hoveredEvent].tooltip === "Tire Change"
                        ? t("轮胎更换", "Tire Change")
                        : timelineEvents[hoveredEvent].tooltip ===
                            "Engine Vibration Alert"
                          ? t("发动机振动警报", "Engine Vibration Alert")
                          : timelineEvents[hoveredEvent].tooltip ===
                              "Scheduled Inspection"
                            ? t("计划检查", "Scheduled Inspection")
                            : timelineEvents[hoveredEvent].tooltip}
          </div>
        </div>
      )}
    </div>
  );
}
