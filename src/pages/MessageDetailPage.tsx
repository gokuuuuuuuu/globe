import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./MessageDetailPage.css";

// ===== Mock Data =====

const messageSummary = {
  id: "MSG-123456",
  riskLevel: "High",
  riskColor: "Red",
  source: "FAA NOTAM",
  messageType: "Airspace Restriction",
  receivedTime: "11/22/23, 11:39 PM",
};

const rawMessageText = `MSG-123456 CODE:
FAA NOTAM TODAY AIRSPACE RESTRICTION
TEAM-OROTAM AARSPACE RESTRICTION AIRSPACE RESTRICTION
SCSIPTI@138998240 DAROMBADS ID23 AIRSPACE RESTRICTION
BLANRES START AFFECT:COCEY
SEARCH PROCESSOS
MONGARY
SEARCH SECTORE RONTEMARS
TAX:TDOORFER
PROPHEAPATSOR FEAMILCR
SUBJECT CONBITORY RODLY ENTER/DPLAST TERSEANR TREXXMANY SYSTEMXVARISPASS
SIGONCIEWANGCIN CECONTECIIGITCODINCN GSGONEREGHEDSEVIENSR FSETOHESEGOSEINTTACK
TERMEOVSIN PRENIPUCMGR CIRCUIN VIOW RVEPCRO CECYPROKETCERROVCONERRHOPADCW
FEATURE DEFERT DAN TO FRIGGRANGEYINENT OPPERTURE PREFTITANCE ERROR RESTRICTION
COMDRANGHMALIENT.
SUBJECT/KEYWORDS:
TEXTETCTION (30X)9-T0 (12340)
TENEERTBB:
ASSPRESSION
ROUTE CLARIFUANT NOTAM SECTOR ALPHANUM
POSITION REPORT MANDATORY BELOW FL350
AIRSPACE CLASS: B RESTRICTION LATERAL LIMITS
COORD: N33°56.5 W118°24.0 RADIUS 15NM
VERTICAL LIMITS: SFC TO FL180
EFFECTIVE: 2023-03-23T22:50Z TO 2023-03-23T23:50Z
SCHEDULE: DAILY 0600-1800 UTC
TRAFFIC ADVISORY: ALL AIRCRAFT MUST CONTACT KLAX APPROACH
ON FREQ 124.500 PRIOR TO ENTERING RESTRICTED AREA
REASON: TEMPORARY FLIGHT RESTRICTION - VIP MOVEMENT
AUTHORITY: FAA ORDER 7400.2M CHAPTER 29
CANCELLATION: NOTAM C0456/23
REF: AIP SUPPLEMENT 45/2023
##
END MSG-123456`;

const timelineEvents = [
  { label: "Received", time: "11/22/2023, 12:59 PM", active: true },
  { label: "Processed", time: "11/22/2023, 12:39 AM", active: false },
  { label: "Analyzed", time: "11/22/2023, 12:39 PM", active: false },
];

const parsedFields = [
  { key: "Originating Agency", value: "Authori Agency" },
  {
    key: "Affected Airspace/Location",
    value: "FAA NOTAM Electroncisbnos Airspace/Location",
  },
  { key: "Effective Start Time", value: "2023-03-23 10:50 PM" },
  { key: "Effective End Time", value: "2023-03-23 11:50 PM" },
  { key: "Subject/Keywords", value: "Subject flest" },
];

const severityRows = [
  { label: "Severity Score", value: "100" },
  { label: "Risk Level", value: "50" },
  { label: "Severity Score", value: "10" },
  { label: "Analyzee Breakdown", value: "0.8" },
  { label: "Severity Score", value: "12" },
];

const riskChartData = [
  { time: "08:00", red: 72, yellow: 45, green: 20 },
  { time: "09:00", red: 80, yellow: 50, green: 25 },
  { time: "10:00", red: 65, yellow: 55, green: 30 },
  { time: "11:00", red: 90, yellow: 40, green: 18 },
  { time: "12:00", red: 85, yellow: 48, green: 22 },
];

// ===== Component =====

export function MessageDetailPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"parsed" | "metadata">("parsed");
  const [detectionOpen, setDetectionOpen] = useState(false);
  const [analysisNotesOpen, setAnalysisNotesOpen] = useState(false);
  const [addedBySystemOpen, setAddedBySystemOpen] = useState(true);
  const [analystNotesOpen, setAnalystNotesOpen] = useState(true);

  return (
    <div className="msg-root">
      {/* Breadcrumb */}
      <div className="msg-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="msg-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/environment-topic/environment-detail")}
        >
          {t("环", "Environment")}
        </span>
        <span className="msg-breadcrumb-sep">&gt;</span>
        <span className="msg-breadcrumb-active">
          {t("消息详情", "Message Detail")}
        </span>
      </div>
      <div style={{ margin: "8px 0 0 24px" }}>
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

      <div className="msg-body">
        {/* ── Message Summary Card ── */}
        <div className="msg-summary-card">
          <div className="msg-summary-top">
            <span className="msg-summary-id">{messageSummary.id}</span>
            <div className="msg-summary-actions">
              <button className="msg-btn msg-btn-primary">
                &#10003;&nbsp;{t("解决风险", "Resolve Risk")}
              </button>
              <button className="msg-btn">
                &#9787;&nbsp;{t("分配分析师", "Assign Analyst")}
              </button>
              <button className="msg-btn">
                &#8599;&nbsp;{t("分享", "Share")}
              </button>
            </div>
          </div>

          <div className="msg-summary-fields">
            <div className="msg-field">
              <span className="msg-field-label">ID</span>
              <span className="msg-field-value">{messageSummary.id}</span>
            </div>
            <div className="msg-field">
              <span className="msg-field-label">
                {t("风险等级", "Risk Level")}
              </span>
              <span className="msg-badge msg-badge-red">
                {t("高", "High")} / {messageSummary.riskColor}
              </span>
            </div>
            <div className="msg-field">
              <span className="msg-field-label">{t("来源", "Source")}</span>
              <span className="msg-field-value">{messageSummary.source}</span>
            </div>
            <div className="msg-field">
              <span className="msg-field-label">
                {t("消息类型", "Message Type")}
              </span>
              <span className="msg-field-value">
                {t("空域限制", "Airspace Restriction")}
              </span>
            </div>
            <div className="msg-field">
              <span className="msg-field-label">
                {t("接收时间", "Received Time")}
              </span>
              <span className="msg-field-value">
                {messageSummary.receivedTime}
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="msg-columns">
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Associated Risk Item bar */}
            <div className="msg-risk-bar">
              <div className="msg-risk-bar-left">
                <span>
                  MSG-123456, FAA NOTAM {t("空域限制", "Airspace Restriction")}
                </span>
                <span className="msg-badge msg-badge-green">
                  {t("高", "High")}
                </span>
                <span className="msg-badge msg-badge-green">
                  {t("高", "High")}
                </span>
              </div>
              <div className="msg-risk-bar-right">
                <button className="msg-menu-dots">&#8943;</button>
              </div>
            </div>

            {/* Original Message Text */}
            <div className="msg-card">
              <div className="msg-card-header">
                <span className="msg-card-title">
                  {t("原始消息文本", "Original Message Text")}
                </span>
                <button className="msg-filter-btn">
                  &#9776;&nbsp;{t("筛选", "Filters")}
                </button>
              </div>
              <div className="msg-code-block">{rawMessageText}</div>
            </div>

            {/* Timeline */}
            <div className="msg-card">
              <div className="msg-card-header">
                <span className="msg-card-title">
                  {t("时间线", "Timeline")}
                </span>
              </div>
              <div className="msg-timeline">
                {timelineEvents.map((evt, i) => (
                  <div className="msg-timeline-item" key={i}>
                    <div className="msg-timeline-dot-col">
                      <div
                        className={`msg-timeline-dot${evt.active ? " active" : ""}`}
                      />
                      {i < timelineEvents.length - 1 && (
                        <div className="msg-timeline-line" />
                      )}
                    </div>
                    <div className="msg-timeline-content">
                      <span className="msg-timeline-label">
                        {t(
                          evt.label === "Received"
                            ? "已接收"
                            : evt.label === "Processed"
                              ? "已处理"
                              : "已分析",
                          evt.label,
                        )}
                      </span>
                      <span className="msg-timeline-time">{evt.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tabs: Parsed Fields | Metadata */}
            <div className="msg-card">
              <div className="msg-tabs">
                <button
                  className={`msg-tab${activeTab === "parsed" ? " active" : ""}`}
                  onClick={() => setActiveTab("parsed")}
                >
                  {t("解析字段", "Parsed Fields")}
                </button>
                <button
                  className={`msg-tab${activeTab === "metadata" ? " active" : ""}`}
                  onClick={() => setActiveTab("metadata")}
                >
                  {t("元数据", "Metadata")}
                </button>
              </div>

              {activeTab === "parsed" ? (
                <>
                  <div className="msg-toolbar">
                    <button className="msg-filter-btn">
                      &#9776;&nbsp;{t("筛选", "Filters")}
                    </button>
                    <button className="msg-filter-btn">
                      {t("排序", "Sort")}
                    </button>
                  </div>
                  <table className="msg-kv-table">
                    <tbody>
                      {parsedFields.map((f, i) => {
                        const keyMap: Record<string, string> = {
                          "Originating Agency": "发起机构",
                          "Affected Airspace/Location": "受影响空域/位置",
                          "Effective Start Time": "生效开始时间",
                          "Effective End Time": "生效结束时间",
                          "Subject/Keywords": "主题/关键词",
                        };
                        const valueMap: Record<string, string> = {
                          "Authori Agency": "授权机构",
                          "Subject flest": "主题检索",
                        };
                        return (
                          <tr key={i}>
                            <th>{t(keyMap[f.key] ?? f.key, f.key)}</th>
                            <td>{t(valueMap[f.value] ?? f.value, f.value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div style={{ padding: 24, color: "#64748b", fontSize: 13 }}>
                  {t("暂无元数据信息", "No metadata information available.")}
                </div>
              )}
            </div>

            {/* Severity Score */}
            <div className="msg-card">
              <div className="msg-severity">
                <div className="msg-severity-header">
                  {t("严重程度评分", "Severity Score")}
                </div>
                <div className="msg-severity-sub">
                  {t("当前风险评分明细", "Current Risk Score breakdown")}
                </div>
                <div className="msg-severity-body">
                  <div className="msg-severity-kv">
                    {severityRows.map((r, i) => {
                      const labelMap: Record<string, string> = {
                        "Severity Score": "严重程度评分",
                        "Risk Level": "风险等级",
                        "Analyzee Breakdown": "分析细分",
                      };
                      return (
                        <div className="msg-severity-kv-row" key={i}>
                          <span className="msg-severity-kv-label">
                            {t(labelMap[r.label] ?? r.label, r.label)}
                          </span>
                          <span className="msg-severity-kv-value">
                            {r.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="msg-severity-chart">
                    <ResponsiveContainer width="100%" height={130}>
                      <LineChart data={riskChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.1)"
                        />
                        <XAxis
                          dataKey="time"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
                          tickLine={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="red"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="yellow"
                          stroke="#eab308"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="green"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible: Detection Rules Triggered */}
            <div className="msg-collapsible">
              <div
                className="msg-collapsible-header"
                onClick={() => setDetectionOpen(!detectionOpen)}
              >
                <span className="msg-collapsible-title">
                  {t("触发的检测规则 (1)", "Detection Rules Triggered (1)")}
                </span>
                <span className={`msg-chevron${detectionOpen ? " open" : ""}`}>
                  &#9660;
                </span>
              </div>
              {detectionOpen && (
                <div className="msg-collapsible-body">
                  <p>
                    {t(
                      "规则: FAA NOTAM 空域限制自动触发",
                      "Rule: FAA NOTAM Airspace Restriction auto-trigger",
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Collapsible: Analysis Notes */}
            <div className="msg-collapsible">
              <div
                className="msg-collapsible-header"
                onClick={() => setAnalysisNotesOpen(!analysisNotesOpen)}
              >
                <span className="msg-collapsible-title">
                  {t("分析备注 (0)", "Analysis Notes (0)")}
                </span>
                <span
                  className={`msg-chevron${analysisNotesOpen ? " open" : ""}`}
                >
                  &#9660;
                </span>
              </div>
              {analysisNotesOpen && (
                <div className="msg-collapsible-body">
                  <p style={{ color: "#64748b" }}>
                    {t("暂无分析备注", "No analysis notes yet.")}
                  </p>
                </div>
              )}
            </div>

            {/* Collapsible: Added by other system */}
            <div className="msg-collapsible">
              <div
                className="msg-collapsible-header"
                onClick={() => setAddedBySystemOpen(!addedBySystemOpen)}
              >
                <span className="msg-collapsible-title">
                  {t("其他系统添加", "Added by other system")}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="msg-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddedBySystemOpen(!addedBySystemOpen);
                    }}
                  >
                    {addedBySystemOpen
                      ? t("收起", "At Collapse")
                      : t("展开", "Expand")}
                  </button>
                  <span
                    className={`msg-chevron${addedBySystemOpen ? " open" : ""}`}
                  >
                    &#9660;
                  </span>
                </div>
              </div>
              {addedBySystemOpen && (
                <div className="msg-collapsible-body">
                  <p>{t("触发的检测规则", "Detection Rules Triggered")}</p>
                  <p>{t("触发的检测规则", "Detection Rules Triggered")}</p>
                </div>
              )}
            </div>

            {/* Analysis Notes – analyst */}
            <div className="msg-collapsible">
              <div
                className="msg-collapsible-header"
                onClick={() => setAnalystNotesOpen(!analystNotesOpen)}
              >
                <span className="msg-collapsible-title">
                  {t("分析备注", "Analysis Notes")}
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 400,
                    }}
                  >
                    {t("由其他分析师添加", "Added by other analyst")}
                  </span>
                </span>
                <span
                  className={`msg-chevron${analystNotesOpen ? " open" : ""}`}
                >
                  &#9660;
                </span>
              </div>
              {analystNotesOpen && (
                <div className="msg-collapsible-body">
                  <input
                    className="msg-notes-input"
                    placeholder={t(
                      "由系统或…添加",
                      "Added by system or the...",
                    )}
                    readOnly
                  />
                  <div className="msg-note-entry">
                    <div className="msg-avatar">A</div>
                    <span>
                      {t("添加: 其他分析师", "Added : other analyst")}
                    </span>
                  </div>
                  <div className="msg-notes-actions">
                    <button className="msg-btn">
                      {t("重置分析师", "Reset analyst")}
                    </button>
                    <button className="msg-btn msg-btn-primary">
                      {t("分享", "Share")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related Context ── */}
        <div className="msg-card">
          <div className="msg-card-header">
            <span className="msg-card-title">
              {t("相关上下文", "Related Context")}
            </span>
          </div>

          <div className="msg-related">
            {/* Related Flight */}
            <div className="msg-related-card">
              <div className="msg-related-header">
                <span className="msg-related-title">
                  {t("关联航班", "Related Flight")}
                </span>
                <button className="msg-menu-dots">&#8943;</button>
              </div>
              <div className="msg-related-big">{t("航班", "Flight")} AR123</div>
              <button
                className="msg-btn msg-btn-primary"
                style={{ marginBottom: 10 }}
              >
                + {t("筛选", "Filters")}
              </button>
              <div className="msg-related-row">
                <span>
                  <span className="msg-related-label">
                    {t("航空公司", "Airline")}:{" "}
                  </span>
                  <span className="msg-related-value">
                    {t("航空公司", "Airline")}
                  </span>
                </span>
                <span>
                  <span className="msg-related-label">
                    {t("出发", "Origin")}:{" "}
                  </span>
                  <span className="msg-related-value">FAA 6123</span>
                </span>
                <span style={{ color: "#64748b" }}>&rarr;</span>
                <span>
                  <span className="msg-related-label">
                    {t("目的地", "Dest")}:{" "}
                  </span>
                  <span className="msg-related-value">FAX 6500</span>
                </span>
              </div>
              <div className="msg-related-row">
                <span className="msg-related-label">
                  {t("设备", "Equipment")}
                </span>
              </div>
              <div className="msg-related-row">
                <span className="msg-related-label">
                  {t("当前状态", "Current Status")}:{" "}
                </span>
                <span className="msg-status-on">{t("在线", "On")}</span>
              </div>
            </div>

            {/* Related Airport */}
            <div className="msg-related-card msg-airport-card">
              <div className="msg-airport-info">
                <div className="msg-related-header">
                  <span className="msg-related-title">
                    {t("关联机场", "Related Airport")}
                  </span>
                  <button className="msg-menu-dots">&#8943;</button>
                </div>
                <div className="msg-related-big">KLAX</div>
                <div className="msg-related-row">
                  <span className="msg-related-label">
                    {t("机场代码", "Airport Code")}:{" "}
                  </span>
                  <span className="msg-related-value">Name</span>
                </div>
                <div className="msg-related-row">
                  <span className="msg-related-label">
                    {t("机场", "Airport")}:{" "}
                  </span>
                  <span className="msg-related-value">KLAX</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className="msg-badge msg-badge-green">
                    {t("运行状态", "Operational Status")}
                  </span>
                </div>
              </div>
              <div className="msg-airport-map">
                <svg viewBox="0 0 160 140" width="160" height="140">
                  {/* Background */}
                  <rect width="160" height="140" fill="#1a2332" rx="6" />
                  {/* Grid roads */}
                  <line
                    x1="0"
                    y1="35"
                    x2="160"
                    y2="35"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="70"
                    x2="160"
                    y2="70"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="105"
                    x2="160"
                    y2="105"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  <line
                    x1="40"
                    y1="0"
                    x2="40"
                    y2="140"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  <line
                    x1="80"
                    y1="0"
                    x2="80"
                    y2="140"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  <line
                    x1="120"
                    y1="0"
                    x2="120"
                    y2="140"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  {/* Main roads */}
                  <line
                    x1="0"
                    y1="55"
                    x2="160"
                    y2="55"
                    stroke="#2d3d50"
                    strokeWidth="2"
                  />
                  <line
                    x1="95"
                    y1="0"
                    x2="95"
                    y2="140"
                    stroke="#2d3d50"
                    strokeWidth="2"
                  />
                  {/* Diagonal road */}
                  <line
                    x1="20"
                    y1="0"
                    x2="140"
                    y2="140"
                    stroke="#263040"
                    strokeWidth="1"
                  />
                  {/* Area blocks */}
                  <rect
                    x="45"
                    y="38"
                    width="30"
                    height="14"
                    rx="2"
                    fill="#1e3a2a"
                    opacity="0.5"
                  />
                  <rect
                    x="100"
                    y="60"
                    width="25"
                    height="20"
                    rx="2"
                    fill="#1e2d3a"
                    opacity="0.5"
                  />
                  <rect
                    x="50"
                    y="80"
                    width="35"
                    height="18"
                    rx="2"
                    fill="#1e3a2a"
                    opacity="0.4"
                  />
                  {/* Water body */}
                  <ellipse
                    cx="130"
                    cy="110"
                    rx="22"
                    ry="16"
                    fill="#162738"
                    opacity="0.6"
                  />
                  {/* Marker pin */}
                  <g transform="translate(95, 48)">
                    <circle r="12" fill="rgba(59,130,246,0.2)" />
                    <circle r="6" fill="rgba(59,130,246,0.4)" />
                    <circle r="3.5" fill="#3b82f6" />
                    <circle r="1.5" fill="#fff" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
