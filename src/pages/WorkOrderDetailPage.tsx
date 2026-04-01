import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import "./WorkOrderDetailPage.css";

// ===== Mock Data =====

const objectInfo = {
  assetName: "Asset-004",
  assetId: "AS-004",
  location: "Data Center B",
  diskScores: "N/A",
  owner: "John Doe",
  criticality: "High",
  details: "Remediation of Asset-004",
};

const riskItems = [
  { risk: "Critical vulnerability", impact: "Financial loss" },
  { risk: "Unauthorized access", impact: "Compliance violation" },
  { risk: "Update firewall rules", impact: "Compliance violation" },
  { risk: "Unmonitored management", impact: "Financial loss" },
];

const suggestedActions = [
  { action: "Patch Asset-004", person: "" },
  { action: "Restrict access", person: "" },
  { action: "Update firewall rules", person: "" },
  { action: "Update control access", person: "" },
];

const statusItems = [
  { name: "Critical vulnerability", sub: "", status: "high" as const },
  { name: "Unauthorized access", sub: "", status: "high" as const },
  {
    name: "Update firewall rules",
    sub: "Compliance connections",
    status: "remoted" as const,
  },
  {
    name: "Patch Asset-004",
    sub: "Financial loss\nCompliance violation",
    status: "high" as const,
  },
];

const feedbackRecords = [
  {
    name: "John Member",
    time: "5 year ago",
    text: "Patch Asset-004 commented but update and one, unulating for work order this Asset-004.",
    avatar: "gray",
  },
  {
    name: "John Member",
    time: "3 year ago",
    text: "Comment: Nsenerts and password updates ePatch Asset-004\nAttahmented processt - Select hams",
    attachment: "1 photo",
    avatar: "blue",
  },
  {
    name: "John Member",
    time: "16 hours ago",
    text: "Content Patch Asset-004\nComment: Nsenerts and password updates ePatch Asset-004\nAttahmented processt - School Inuns",
    attachment: "2 photo",
    avatar: "gray",
  },
  {
    name: "John Member",
    time: "1 year ago",
    text: "Patch Asset-004",
    avatar: "gray",
  },
];

const TAB_KEYS = [
  "governance",
  "remediations",
  "collaborators",
  "stakeholders",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

// ===== Component =====

export function WorkOrderDetailPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("governance");
  const [closureOption, setClosureOption] = useState("remediated");

  const tabLabels: Record<TabKey, string> = {
    governance: t("治理", "Governance"),
    remediations: t("修复措施", "Remediations"),
    collaborators: t("协作者", "Collaborators"),
    stakeholders: t("利益相关方", "Stakeholders"),
  };

  const tAction = (action: string) => {
    const map: Record<string, string> = {
      "Patch Asset-004": "修补 Asset-004",
      "Restrict access": "限制访问",
      "Update firewall rules": "更新防火墙规则",
      "Update control access": "更新控制访问",
    };
    return t(map[action] || action, action);
  };

  const tRisk = (risk: string) => {
    const map: Record<string, string> = {
      "Critical vulnerability": "关键漏洞",
      "Unauthorized access": "未授权访问",
      "Update firewall rules": "更新防火墙规则",
      "Unmonitored management": "未监控管理",
      "Financial loss": "财务损失",
      "Compliance violation": "合规违规",
      "Compliance connections": "合规关联",
    };
    return t(map[risk] || risk, risk);
  };

  return (
    <div className="wod-root">
      {/* Breadcrumb */}
      <div className="wod-breadcrumb">
        {t("首页", "Home")}
        <span className="wod-breadcrumb-sep">&gt;</span>
        {t("治理闭环", "Governance")}
        <span className="wod-breadcrumb-sep">&gt;</span>
        {t("工单", "Work Orders")}
        <span className="wod-breadcrumb-sep">&gt;</span>
        <span className="wod-breadcrumb-active">WO-20230815</span>
      </div>

      <div className="wod-body">
        {/* Page header */}
        <div className="wod-page-header">
          <h1 className="wod-page-title">
            WO-20230815:{" "}
            {t(
              "Asset-004 高风险发现的修复",
              "Remediation of Asset-004 High Risk Findings",
            )}
          </h1>
          <div className="wod-header-actions">
            <button className="wod-btn wod-btn-primary">
              {t("分配操作", "Assign Action")}
            </button>
            <button className="wod-btn wod-btn-green">
              {t("提交反馈", "Submit Feedback")}
            </button>
            <button className="wod-btn">
              {t("审核并关闭", "Review and Close")}
            </button>
            <button className="wod-btn">
              {t("查看对象详情", "View Object Details")}
            </button>
          </div>
        </div>

        {/* Row 1: Object Info + Risk Summary */}
        <div className="wod-row">
          {/* Object Information */}
          <div className="wod-card">
            <div className="wod-card-title">
              {t("对象信息", "Object Information")}
            </div>
            <div className="wod-obj-content">
              <div className="wod-obj-left">
                <span className="wod-obj-label">
                  {t("资产名称", "Asset Name")}
                </span>
                <span className="wod-obj-value">{objectInfo.assetName}</span>
              </div>
              <div className="wod-obj-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="wod-obj-fields">
                <div className="wod-field">
                  <span className="wod-field-label">
                    {t("资产名称", "Asset Name")}
                  </span>
                  <span className="wod-field-value">
                    {objectInfo.assetName}
                  </span>
                </div>
                <div className="wod-field">
                  <span className="wod-field-label">
                    {t("负责人", "Owner")}
                  </span>
                  <span className="wod-field-value">{objectInfo.owner}</span>
                </div>
                <div className="wod-field">
                  <span className="wod-field-label">
                    {t("资产编号", "Asset ID")}
                  </span>
                  <span className="wod-field-value">{objectInfo.assetId}</span>
                </div>
                <div className="wod-field">
                  <span className="wod-field-label">
                    {t("严重程度", "Criticality")}
                  </span>
                  <span className="wod-field-value high">
                    {t("高", objectInfo.criticality)}
                  </span>
                </div>
                <div className="wod-field">
                  <span className="wod-field-label">
                    {t("位置", "Location")}
                  </span>
                  <span className="wod-field-value">{objectInfo.location}</span>
                </div>
                <div className="wod-field">
                  <span className="wod-field-label">
                    {t("磁盘评分", "Disk Scores")}
                  </span>
                  <span className="wod-field-value">
                    {objectInfo.diskScores}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <span className="wod-field-label">{t("详情", "Details")}</span>
              <div className="wod-field-value" style={{ marginTop: 4 }}>
                {t("Asset-004 的修复", objectInfo.details)}
              </div>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="wod-card">
            <div className="wod-card-title">
              {t("风险摘要", "Risk Summary")}
            </div>
            <div className="wod-risk-content">
              {/* Risk Matrix */}
              <div className="wod-risk-matrix">
                <div className="wod-matrix-title">
                  {t("风险矩阵", "Risk Matrix")}
                </div>
                <div className="wod-matrix-grid">
                  {/* Y-axis label */}
                  <div className="wod-matrix-ylabel">{t("影响", "Impact")}</div>
                  {/* Row 1 (High impact) */}
                  <div className="wod-matrix-cell orange">&nbsp;</div>
                  <div className="wod-matrix-cell red">&nbsp;</div>
                  <div className="wod-matrix-cell red active">
                    {t("高", "High")}
                  </div>
                  {/* Row 2 (Medium impact) */}
                  <div style={{ gridColumn: 1 }} />
                  <div className="wod-matrix-cell yellow">&nbsp;</div>
                  <div className="wod-matrix-cell orange">&nbsp;</div>
                  <div className="wod-matrix-cell red">&nbsp;</div>
                  {/* Row 3 (Low impact) */}
                  <div style={{ gridColumn: 1 }} />
                  <div className="wod-matrix-cell green">&nbsp;</div>
                  <div className="wod-matrix-cell yellow">&nbsp;</div>
                  <div className="wod-matrix-cell orange">&nbsp;</div>
                  {/* X-axis labels */}
                  <div />
                  <div className="wod-matrix-label">{t("低", "Low")}</div>
                  <div className="wod-matrix-label">{t("中", "Impact")}</div>
                  <div className="wod-matrix-label">{t("高", "High")}</div>
                </div>
              </div>

              {/* Risk / Impact table */}
              <div className="wod-risk-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t("风险", "Risk")}</th>
                      <th>{t("影响", "Impact")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskItems.map((item, i) => (
                      <tr key={i}>
                        <td>{tRisk(item.risk)}</td>
                        <td>{tRisk(item.impact)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="wod-tabs-row">
          {/* Tab navigation */}
          <div className="wod-tab-nav">
            {TAB_KEYS.map((key) => (
              <button
                key={key}
                className={`wod-tab-btn${activeTab === key ? " active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {tabLabels[key]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="wod-tab-content">
            {/* Row: Suggested Actions + Status */}
            <div className="wod-row">
              <div className="wod-card">
                <div className="wod-card-title">
                  {t("建议操作", "Suggested Actions")}
                </div>
                <table className="wod-actions-table">
                  <thead>
                    <tr>
                      <th>{t("操作", "Action")}</th>
                      <th>{t("责任人", "Responsible Person")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestedActions.map((a, i) => (
                      <tr key={i}>
                        <td>{tAction(a.action)}</td>
                        <td>
                          <select className="wod-person-select">
                            <option>
                              {t("选择责任人", "Secondble Person")}
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="wod-card">
                <table className="wod-status-table">
                  <thead>
                    <tr>
                      <th>{t("责任人", "Responsible Person")}</th>
                      <th>{t("状态", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusItems.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div>{tRisk(item.name)}</div>
                          {item.sub && (
                            <div className="wod-sub-text">
                              {item.sub.split("\n").map((s, j) => (
                                <div key={j}>{tRisk(s)}</div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`wod-status-badge ${item.status}`}>
                            {item.status === "high"
                              ? t("高", "High")
                              : t("已修复", "Remoted")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom: Feedback + Review + Closure */}
            <div className="wod-bottom-row">
              {/* Feedback Records */}
              <div className="wod-card">
                <div className="wod-card-title">
                  {t("反馈记录", "Feedback Records")}
                </div>
                <div className="wod-feedback-list">
                  {feedbackRecords.map((fb, i) => (
                    <div className="wod-feedback-item" key={i}>
                      <div
                        className={`wod-feedback-avatar${fb.avatar === "blue" ? " blue" : ""}`}
                      >
                        {fb.name.charAt(0)}
                      </div>
                      <div className="wod-feedback-body">
                        <div className="wod-feedback-header">
                          <span className="wod-feedback-name">{fb.name}</span>
                          <span className="wod-feedback-time">
                            {t(
                              fb.time
                                .replace("year ago", "年前")
                                .replace("years ago", "年前")
                                .replace("hours ago", "小时前"),
                              fb.time,
                            )}
                          </span>
                        </div>
                        <div className="wod-feedback-text">{fb.text}</div>
                        {fb.attachment && (
                          <div style={{ marginTop: 4 }}>
                            <span className="wod-feedback-link">
                              {t("附件:", "Attachment:")}{" "}
                              {t(
                                fb.attachment.replace("photo", "张照片"),
                                fb.attachment,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Comments */}
              <div className="wod-card">
                <div className="wod-card-title">
                  {t("审核评论", "Review Comments")}
                </div>
                <div className="wod-review-section">
                  <div>
                    <div className="wod-review-subtitle">
                      {t("授权用户", "Authorized users")}
                    </div>
                    <div className="wod-review-desc">
                      {t(
                        "授权用户可以添加评论或选择固定评论。",
                        "Authorized users to add comments, or select freed comments.",
                      )}
                    </div>
                  </div>
                  <input
                    className="wod-comment-input"
                    placeholder={t("添加评论...", "Add comment...")}
                  />
                  <div>
                    <div className="wod-review-subtitle">
                      {t("选择标准回复", "Select standard responses")}
                    </div>
                    <div className="wod-response-row" style={{ marginTop: 8 }}>
                      <select className="wod-response-select">
                        <option>{t("标准回复", "Standard response")}</option>
                      </select>
                      <select className="wod-response-select">
                        <option>
                          {t("选择回复...", "Select response...")}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="wod-review-subtitle">
                      {t("历史评论", "Previous Comments")}
                    </div>
                    <span className="wod-prev-comments">
                      {t("查看 1 条历史评论。", "View 1 previous comments.")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Closure Conclusion */}
              <div className="wod-card">
                <div className="wod-card-title">
                  {t("最终关闭结论", "Final Closure Conclusion")}
                </div>
                <div className="wod-closure-section">
                  <div>
                    <div className="wod-closure-subtitle">
                      {t("必填字段", "Mandatory field")}
                    </div>
                    <div className="wod-closure-desc">
                      {t(
                        "记录结果的必填字段。",
                        "Mandatory field for documented outcomes.",
                      )}
                    </div>
                  </div>
                  <div className="wod-radio-group">
                    <label className="wod-radio-label">
                      <input
                        type="radio"
                        name="closure"
                        value="remediated"
                        checked={closureOption === "remediated"}
                        onChange={(e) => setClosureOption(e.target.value)}
                      />
                      {t("已修复", "Remediated")}
                    </label>
                    <label className="wod-radio-label">
                      <input
                        type="radio"
                        name="closure"
                        value="mitigated"
                        checked={closureOption === "mitigated"}
                        onChange={(e) => setClosureOption(e.target.value)}
                      />
                      {t("已缓解", "Mitigated")}
                    </label>
                    <label className="wod-radio-label">
                      <input
                        type="radio"
                        name="closure"
                        value="risk-accepted"
                        checked={closureOption === "risk-accepted"}
                        onChange={(e) => setClosureOption(e.target.value)}
                      />
                      {t("风险已接受", "Risk Accepted")}
                    </label>
                    <label className="wod-radio-label">
                      <input
                        type="radio"
                        name="closure"
                        value="false-positive"
                        checked={closureOption === "false-positive"}
                        onChange={(e) => setClosureOption(e.target.value)}
                      />
                      {t("误报", "False Positive")}
                    </label>
                  </div>
                  <div>
                    <div className="wod-closure-subtitle">
                      {t("详细说明", "Detailed explanation")}
                    </div>
                    <textarea
                      className="wod-textarea"
                      placeholder={t("详细说明...", "Detailed explanation...")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="wod-action-bar">
        <button className="wod-btn wod-btn-green">
          {t("提交反馈", "Submit Feedback")}
        </button>
        <button className="wod-btn">
          {t("审核并关闭", "Review and Close")}
        </button>
        <button className="wod-btn wod-btn-primary">
          {t("查看对象详情", "View Object Details")}
        </button>
      </div>
    </div>
  );
}
