import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./FeedbackReviewPage.css";

// ===== Mock Data =====

const workOrderInfo = {
  id: "WO-20231027-004",
  assetName: "High-Pressure Pump A-1",
  location: "Zone 4, Building B",
  dateCreated: "2023-10-27 09:15",
  riskLevel: "High",
  reportedBy: "J. Doe",
};

const attachments = [
  { name: "Pump_Sound_Recording.mp3", size: "32.7 MB", type: "audio" as const },
  { name: "Vibration_Report.pdf", size: "34.3 KB", type: "pdf" as const },
  { name: "Thermal_Image_01.jpg", size: "59.9 KB", type: "image" as const },
];

// ===== Component =====

export function FeedbackReviewPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [continuousObs, setContinuousObs] = useState("no");

  return (
    <div className="fbr-root">
      {/* Page header */}
      <div className="fbr-page-header">
        <button
          style={{
            background: "rgba(71,85,105,0.5)",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#e2e8f0",
            borderRadius: 6,
            padding: "4px 14px",
            cursor: "pointer",
            fontSize: 13,
            marginRight: 12,
          }}
          onClick={() => navigate(-1)}
        >
          {t("返回", "Back")}
        </button>
        <h1 className="fbr-page-title">
          {t(
            "反馈 / 复核 - 工单 #WO-20231027-004",
            "Feedback / Review - Work Order #WO-20231027-004",
          )}
        </h1>
        <div className="fbr-breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            {t("工作台", "Dashboard")}
          </span>
          <span className="fbr-breadcrumb-sep">&gt;</span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/governance/work-order-list")}
          >
            {t("治理闭环", "Governance")}
          </span>
          <span className="fbr-breadcrumb-sep">&gt;</span>
          <span className="fbr-breadcrumb-active">{t("反馈", "Feedback")}</span>
        </div>
      </div>

      <div className="fbr-body">
        {/* Basic Work Order Information */}
        <div className="fbr-card">
          <div className="fbr-card-title">
            {t("基本工单信息", "Basic Work Order Information")}
          </div>
          <div className="fbr-info-fields">
            <div className="fbr-field">
              <span className="fbr-field-label">
                {t("工单编号", "Work Order ID")}
              </span>
              <span className="fbr-field-value">{workOrderInfo.id}</span>
            </div>
            <div className="fbr-field">
              <span className="fbr-field-label">
                {t("资产名称", "Asset Name")}
              </span>
              <span className="fbr-field-value">
                {t("高压泵 A-1", workOrderInfo.assetName)}
              </span>
            </div>
            <div className="fbr-field">
              <span className="fbr-field-label">{t("位置", "Location")}</span>
              <span className="fbr-field-value">
                {t("4区, B栋", workOrderInfo.location)}
              </span>
            </div>
            <div className="fbr-field">
              <span className="fbr-field-label">
                {t("创建日期", "Date Created")}
              </span>
              <span className="fbr-field-value">
                {workOrderInfo.dateCreated}
              </span>
            </div>
            <div className="fbr-field">
              <span className="fbr-field-label">
                {t("风险等级", "Risk Level")}
              </span>
              <span className="fbr-risk-badge">
                {t("高", workOrderInfo.riskLevel)}
              </span>
            </div>
            <div className="fbr-field" style={{ gridColumn: "span 5" }}>
              <span className="fbr-field-label">
                {t("报告人", "Reported By")}
              </span>
              <span className="fbr-field-value">
                {workOrderInfo.reportedBy}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback & Review Form */}
        <div className="fbr-card">
          <div className="fbr-card-title">
            {t("反馈与复核表单", "Feedback & Review Form")}
          </div>

          <div className="fbr-form-row">
            {/* Left: Feedback + Review */}
            <div>
              <div className="fbr-form-label">
                {t("反馈内容", "Feedback Content")}
              </div>
              <textarea
                className="fbr-textarea"
                defaultValue={t(
                  "在例行检查中观察到泵体不规则振动和异常噪音。初步评估指向潜在轴承磨损。建议进行详细检查。",
                  "Observed irregular vibration and unusual noise in the pump during routine check. Initial assessment points to potential bearing wear. Recommending detailed inspection.",
                )}
              />

              <div className="fbr-form-label" style={{ marginTop: 20 }}>
                {t("复核评论", "Review Comments")}
              </div>
              <textarea
                className="fbr-textarea"
                defaultValue={t(
                  "同意该评估。已安排专业维修团队在48小时内检查。请更新进展。",
                  "Concur with the assessment. Scheduled specialized maintenance team for inspection within 48 hours. Please update on progress.",
                )}
              />

              {/* False Alarm + Continuous Observation */}
              <div className="fbr-options-row" style={{ marginTop: 16 }}>
                <div className="fbr-option-group">
                  <span className="fbr-option-title">
                    {t("误报", "False Alarm")}
                  </span>
                  <span className="fbr-checkbox-label">
                    {t("标记为误报", "Mark as False Alarm")}
                  </span>
                </div>
                <div className="fbr-option-group">
                  <span className="fbr-option-title">
                    {t("需要持续观察", "Continuous Observation Needed")}
                  </span>
                  <div className="fbr-radio-group">
                    <label className="fbr-radio-label">
                      <input
                        type="radio"
                        name="continuous"
                        value="yes"
                        checked={continuousObs === "yes"}
                        onChange={(e) => setContinuousObs(e.target.value)}
                      />
                      {t("是", "Yes")}
                    </label>
                    <label className="fbr-radio-label">
                      <input
                        type="radio"
                        name="continuous"
                        value="no"
                        checked={continuousObs === "no"}
                        onChange={(e) => setContinuousObs(e.target.value)}
                      />
                      {t("否", "No")}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Attachments */}
            <div>
              <div className="fbr-form-label">{t("附件", "Attachments")}</div>
              <div className="fbr-attachments">
                <div className="fbr-upload-zone">
                  {t(
                    "上传相关文件或拖放至此",
                    "Upload relevant files or drag & drop",
                  )}
                </div>
                <div className="fbr-file-list">
                  {attachments.map((file, i) => (
                    <div className="fbr-file-item" key={i}>
                      <div className={`fbr-file-icon ${file.type}`}>
                        {file.type === "audio"
                          ? "🔊"
                          : file.type === "pdf"
                            ? "📄"
                            : "🖼️"}
                      </div>
                      <div className="fbr-file-info">
                        <div className="fbr-file-name">{file.name}</div>
                        <div className="fbr-file-size">{file.size}</div>
                      </div>
                      <button className="fbr-file-upload-btn">↗</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="fbr-status-bar">
            <div className="fbr-status-field">
              <span className="fbr-status-label">
                {t("当前状态", "Current Status")}
              </span>
              <span className="fbr-status-value">
                {t("审核中", "Under Review")}
              </span>
            </div>
            <div className="fbr-status-field">
              <span className="fbr-status-label">
                {t("分配给", "Assigned To")}
              </span>
              <span className="fbr-status-value">
                J. Doe ({t("维修主管", "Maintenance Lead")})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fbr-action-bar">
        <div className="fbr-action-left">
          <button className="fbr-btn">{t("取消", "Cancel")}</button>
        </div>
        <div className="fbr-action-right">
          <button className="fbr-btn">
            {t("保存并返回", "Save and Return")}
          </button>
          <button className="fbr-btn fbr-btn-primary">
            {t("提交并返回列表", "Submit and Back to List")}
          </button>
        </div>
      </div>
    </div>
  );
}
