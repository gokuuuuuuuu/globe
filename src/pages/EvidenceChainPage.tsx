import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./EvidenceChainPage.css";

// ===== Mock Data =====

const assessment = {
  id: "P6-FA123",
  subject: "Aircrew Fatigue",
  date: "2023-10-27",
  lastUpdatedBy: "2023-10-27",
  createdBy: "User Name",
  lastUpdated: "2023-10-27 09:30",
  status: "Verified",
  riskLevel: "Red / High Risk",
};

const riskDistribution = [
  { name: "Red", value: 60, color: "#dc2626" },
  { name: "Orange", value: 40, color: "#f97316" },
  { name: "Yellow", value: 25, color: "#eab308" },
  { name: "Green", value: 72, color: "#22c55e" },
];

interface EvidenceItem {
  category: string;
  icon: string;
  summary: string;
  time: string;
  relation: string;
  badge?: { text: string; type: "red" | "orange" | "verified" };
  hasDownload: boolean;
}

const evidenceItems: EvidenceItem[] = [
  {
    category: "QAR / Flight Data",
    icon: "\u2197",
    summary: "Elevated Fatigue Risk Index (FRI) on Flight 123",
    time: "2023-10-15 09:30 UTC",
    relation: "Linked to Risk Factor: Continuous Duty Periods > 12h",
    badge: { text: "Red", type: "red" },
    hasDownload: true,
  },
  {
    category: "Training Records",
    icon: "\uD83D\uDCCB",
    summary: "Fatigue Management Course Completed",
    time: "2023-10-15 09:30 UTC",
    relation: "Compliant with Training Policy",
    badge: { text: "Verified", type: "verified" },
    hasDownload: true,
  },
  {
    category: "Maintenance Records",
    icon: "\uD83D\uDD27",
    summary: "Maintenance Event E1004",
    time: "2023-10-15 09:30 UTC",
    relation: "Potentially Impacts Aircraft Availability",
    badge: { text: "Orange", type: "orange" },
    hasDownload: true,
  },
  {
    category: "Messages",
    icon: "\uD83D\uDCAC",
    summary: "Elevated Fatigue Risk Index (Flight 123)",
    time: "2023-10-15 09:30 UTC",
    relation: "Linked to Risk Factor: Conneguees",
    badge: { text: "Red", type: "red" },
    hasDownload: true,
  },
  {
    category: "Notices",
    icon: "\uD83D\uDCAC",
    summary: "Fatigue Management Course Completed",
    time: "2023-10-15 09:30 UTC",
    relation: "Compliant with Training Policy",
    badge: { text: "Verified", type: "verified" },
    hasDownload: true,
  },
  {
    category: "Rule Clauses",
    icon: "\uD83D\uDCC4",
    summary: "Maintenance Event E1004 on Gary Flight 1233",
    time: "2023-10-15 09:30 UTC",
    relation: "Linked to Risk Factor: Continuous Duty Periods > 12h",
    badge: undefined,
    hasDownload: true,
  },
  {
    category: "Messages",
    icon: "\uD83D\uDCAC",
    summary: "Elevated Fatigue Risk Index (FRI) on Flight 123",
    time: "2023-10-15 09:30 UTC",
    relation: "Linked to Risk Factor: Continuous Duty Periods > 12h",
    badge: undefined,
    hasDownload: true,
  },
  {
    category: "Notices",
    icon: "\uD83D\uDCAC",
    summary: "Maintenance Event E1004",
    time: "2023-10-15 09:30 UTC",
    relation: "Compliant scots",
    badge: undefined,
    hasDownload: true,
  },
  {
    category: "Manual Feedback",
    icon: "\uD83D\uDCDD",
    summary: "Maintenance Event E1004",
    time: "2023-10-15 09:30 UTC",
    relation: "Potentially Impacts Aircraft Availability",
    badge: { text: "Orange", type: "orange" },
    hasDownload: false,
  },
];

const categoryTranslations: Record<string, string> = {
  "QAR / Flight Data": "QAR / 飞行数据",
  "Training Records": "训练记录",
  "Maintenance Records": "维修记录",
  Messages: "消息",
  Notices: "通知",
  "Rule Clauses": "规章条款",
  "Manual Feedback": "人工反馈",
};

const AXIS_TICK = { fill: "#64748b", fontSize: 11 };
const GRID_STROKE = "rgba(148,163,184,0.1)";

// ===== Component =====

export function EvidenceChainPage() {
  const { t } = useLanguage();

  return (
    <div className="ec-root">
      {/* Breadcrumb */}
      <div className="ec-breadcrumb">
        MRIWP
        <span className="ec-breadcrumb-sep">&gt;</span>
        {t("风险监控", "Risk Monitoring")}
        <span className="ec-breadcrumb-sep">&gt;</span>
        <span className="ec-breadcrumb-active">
          {t("证据链", "Evidence Chain")}
        </span>
      </div>

      {/* Page Header */}
      <div className="ec-page-header">
        <h1 className="ec-page-title">{t("证据链", "Evidence Chain")}</h1>
        <button className="ec-btn-primary">
          <span>&#8595;</span>{" "}
          {t("下载完整证据包", "Download Full Evidence Package")}
        </button>
      </div>

      <div className="ec-content">
        {/* Assessment Summary */}
        <div className="ec-summary-card">
          <div className="ec-summary-title">
            {t("评估摘要", "Assessment Summary")}
          </div>
          <div className="ec-summary-body">
            <div className="ec-summary-fields">
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("评估ID：", "Assessment ID:")}
                </span>
                <span className="ec-field-value">{assessment.id}</span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">{t("日期：", "Date:")}</span>
                <span className="ec-field-value">{assessment.date}</span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("主题：", "Subject:")}
                </span>
                <span className="ec-field-value">{assessment.subject}</span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("最后更新人：", "Last Updated By:")}
                </span>
                <span className="ec-field-value">
                  {assessment.lastUpdatedBy}
                </span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("创建人：", "Created By:")}
                </span>
                <span className="ec-field-value">{assessment.createdBy}</span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">{t("状态：", "Status:")}</span>
                <span className="ec-field-value ec-status-verified">
                  {t("已验证", "Verified")}
                </span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("最后更新：", "Last Updated:")}
                </span>
                <span className="ec-field-value">{assessment.lastUpdated}</span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("风险等级：", "Risk Level:")}
                </span>
                <span className="ec-field-value">{assessment.riskLevel}</span>
              </div>
              <div className="ec-field-row">
                <span className="ec-field-label">
                  {t("风险等级：", "Risk Level:")}
                </span>
                <span className="ec-risk-badge-inline ec-badge-red">
                  Red / High Risk
                </span>
              </div>
            </div>
            <div className="ec-summary-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} />
                  <Bar dataKey="value" barSize={28} radius={[3, 3, 0, 0]}>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Verified status bar */}
        <div className="ec-verified-bar">
          {t("最后验证：状态开启 | ", "Last Verified: Status on | ")}
          <span className="ec-verified-link">
            {t("完整审计日志", "Full audit Log")}
          </span>
        </div>

        {/* Evidence Cards Grid */}
        <div className="ec-evidence-grid">
          {evidenceItems.map((item, i) => (
            <div key={i} className="ec-evidence-card">
              <div className="ec-evidence-card-header">
                <span className="ec-evidence-card-title">
                  {t(
                    categoryTranslations[item.category] || item.category,
                    item.category,
                  )}
                </span>
                <div className="ec-evidence-status">
                  <span>{t("状态：", "Status:")}</span>
                  <span className="ec-status-icon ec-status-icon-ok">
                    &#10003;
                  </span>
                </div>
              </div>

              <div className="ec-evidence-item">
                <div className="ec-evidence-item-header">
                  <div className="ec-evidence-icon">{item.icon}</div>
                  <div>
                    <div className="ec-evidence-summary-label">
                      {t("摘要", "Summary")}
                    </div>
                    <div className="ec-evidence-summary-text">
                      {item.summary}
                    </div>
                  </div>
                </div>
                <div className="ec-evidence-time">{item.time}</div>
                <div className="ec-evidence-relation">
                  {t("与风险项的关系", "Relation to Risk Item")}
                </div>
                <div className="ec-evidence-relation-text">
                  {item.relation}
                  {item.badge && (
                    <span
                      className={`ec-risk-badge-inline ec-badge-${item.badge.type}`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </div>
                <div className="ec-evidence-added">
                  <span>&#9775;</span> {t("添加人", "Added By")}
                </div>
              </div>

              <div className="ec-evidence-actions">
                <button className="ec-btn">
                  {t("查看原始来源", "View Original Source")}
                </button>
                <button className="ec-btn">
                  {t("查看相关规则", "View Related Rule")}
                </button>
                {item.hasDownload && (
                  <button className="ec-btn ec-btn-download">
                    &#8595; {t("下载证据包", "Download Evidence Package")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom verified bar */}
        <div className="ec-verified-bar">
          {t("最后验证：状态开启 | ", "Last Verified | ")}
          <span className="ec-verified-link">
            {t("完整审计日志", "Full audit Log")}
          </span>
        </div>
      </div>
    </div>
  );
}
