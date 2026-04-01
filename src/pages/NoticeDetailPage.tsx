import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "../i18n/useLanguage";
import "./NoticeDetailPage.css";

// ZBAA marker icon
const pekIcon = L.divIcon({
  className: "ntc-map-marker",
  html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(239,68,68,0.6)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// ===== Mock Data =====

const noticeData = {
  title: "Beijing Capital International Airport (ZBAA) Thunderstorm Warning",
  effectiveTime: "2024-06-15 14:00 (CST)",
  expirationTime: "2024-06-15 18:00 (CST)",
  issuedTime: "2024-06-15 12:30 (CST)",
  rawText: `METAR ZBAA 150600Z 20008G18KT 150V250
1500 R01/1000N R36R/1200D +TSRA SCT015CB
BKN030 25/18 Q1005 NOSIG TEMPO 1200
+TSRA GR GS CB...`,
  source: "Aviation Weather Center (AWC)",
  sourceUrl: "https://www.aviation.com/rweather/original.pdf",
  lastUpdated: "1 hour ago",
};

const impactData = {
  affectedAirports: "ZBAA, ZBAD, ZBTJ",
  radius: "~100 km",
  severeWeatherType: "Thunderstorm, Hail",
  description:
    "Significant convective activity expected to impact all approach and departure corridors.",
};

const affectedStats = {
  totalAffected: 154,
  flightsDiverted: 23,
  flightsDelayed: 87,
  cancellations: 12,
};

const affectedFlights = [
  {
    id: "CA123",
    route: "ZBAA-ZSPD",
    status: "delayed",
    statusLabel: "Delayed (Weather)",
  },
  {
    id: "MU456",
    route: "ZGGG-ZBAA",
    status: "diverted",
    statusLabel: "Diverted",
  },
  { id: "HU789", route: "ZBAA-ZGSZ", status: "active", statusLabel: "Active" },
  {
    id: "HU536",
    route: "ZBAA-ZBAA",
    status: "diverted",
    statusLabel: "Diverted",
  },
];

const riskConclusion = {
  level: "HIGH",
  color: "Red",
  description:
    "Thunderstorm activity at ZBAA presents substantial operational risk. Expected to cause significant arrival and departure delays, potential ground stops, and flight diversions.",
  factors: ["Convective Activity", "Low Visibility", "Strong Winds"],
  confidence: 85,
};

// ===== Component =====

export function NoticeDetailPage() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"raw" | "formatted">("raw");

  return (
    <div className="ntc-root">
      {/* Breadcrumb */}
      <div className="ntc-breadcrumb">
        {t("首页", "Home")}
        <span className="ntc-breadcrumb-sep">&gt;</span>
        {t("环境专题", "Environment")}
        <span className="ntc-breadcrumb-sep">&gt;</span>
        {t("通告", "Notice")}
        <span className="ntc-breadcrumb-sep">&gt;</span>
        <span className="ntc-breadcrumb-active">
          {t("通告详情", "Notice Detail")}
        </span>
      </div>

      <div className="ntc-body">
        {/* ── Page Header ── */}
        <div className="ntc-page-header">
          <div className="ntc-page-header-left">
            <h1 className="ntc-page-title">
              {t("通告详情：", "Notice Detail: ")}
              {t("北京首都国际机场 (ZBAA) 雷暴预警", noticeData.title)}
            </h1>
            <div className="ntc-page-meta">
              <span>
                <span className="ntc-meta-label">
                  {t("生效时间:", "Effective:")}
                </span>
                <span className="ntc-meta-value">
                  {noticeData.effectiveTime}
                </span>
              </span>
              <span>
                <span className="ntc-meta-label">
                  {t("过期时间:", "Expiration:")}
                </span>
                <span className="ntc-meta-value">
                  {noticeData.expirationTime}
                </span>
              </span>
              <span>
                <span className="ntc-meta-label">
                  {t("发布时间:", "Issued:")}
                </span>
                <span className="ntc-meta-value">{noticeData.issuedTime}</span>
              </span>
            </div>
          </div>
          <button className="ntc-update-btn">
            &#8635;&nbsp;{t("更新", "Update")}
          </button>
        </div>

        {/* ── Row 1: Original Notice Text + Impact Scope ── */}
        <div className="ntc-row">
          {/* Original Notice Text */}
          <div className="ntc-card">
            <div className="ntc-card-header">
              <span className="ntc-card-title">
                {t("原始通告文本", "Original Notice Text")}
              </span>
              <div className="ntc-toggle-group">
                <button
                  className={`ntc-toggle-btn${viewMode === "raw" ? " active" : ""}`}
                  onClick={() => setViewMode("raw")}
                >
                  {t("原始", "Raw")}
                </button>
                <button
                  className={`ntc-toggle-btn${viewMode === "formatted" ? " active" : ""}`}
                  onClick={() => setViewMode("formatted")}
                >
                  {t("格式化", "Formatted")}
                </button>
              </div>
            </div>

            <div className="ntc-code-block">{noticeData.rawText}</div>

            <div className="ntc-source-section">
              <div className="ntc-source-label">{t("来源", "Source")}</div>
              <div className="ntc-source-value">
                {t("航空气象中心 (AWC)", noticeData.source)}
              </div>
              <a
                className="ntc-source-link"
                href={noticeData.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {noticeData.sourceUrl}
              </a>

              <div style={{ marginTop: 16 }}>
                <div className="ntc-source-label">
                  {t("最后更新", "Last Updated")}
                </div>
                <div className="ntc-source-value">
                  {t("1 小时前", noticeData.lastUpdated)}
                </div>
              </div>
            </div>
          </div>

          {/* Impact Scope */}
          <div className="ntc-card">
            <div className="ntc-card-header">
              <span className="ntc-card-title">
                {t("影响范围", "Impact Scope")}
              </span>
              <button className="ntc-filter-btn">
                &#9776;&nbsp;{t("筛选", "Filters")}&nbsp;&#9662;
              </button>
            </div>

            <div className="ntc-impact-content">
              <div className="ntc-impact-map">
                <MapContainer
                  center={[40.08, 116.59]}
                  zoom={8}
                  style={{ width: "100%", height: "100%" }}
                  zoomControl={true}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&x={x}&y={y}&z={z}"
                    subdomains={["1", "2", "3", "4"]}
                    className="ntc-dark-tiles"
                  />
                  {/* ~100km impact radius */}
                  <Circle
                    center={[40.08, 116.59]}
                    radius={100000}
                    pathOptions={{
                      color: "rgba(239, 68, 68, 0.5)",
                      fillColor: "rgba(239, 68, 68, 0.15)",
                      fillOpacity: 0.15,
                      weight: 2,
                    }}
                  />
                  <Circle
                    center={[40.08, 116.59]}
                    radius={50000}
                    pathOptions={{
                      color: "rgba(239, 68, 68, 0.6)",
                      fillColor: "rgba(239, 68, 68, 0.25)",
                      fillOpacity: 0.25,
                      weight: 1,
                    }}
                  />
                  {/* ZBAA */}
                  <Marker position={[40.08, 116.59]} icon={pekIcon}>
                    <Tooltip
                      direction="right"
                      permanent
                      className="ntc-map-tooltip"
                    >
                      ZBAA
                    </Tooltip>
                  </Marker>
                </MapContainer>
              </div>

              <div className="ntc-impact-info">
                <div className="ntc-impact-row">
                  <span className="ntc-impact-label">
                    {t("受影响机场:", "Affected Airports:")}
                  </span>
                  <span className="ntc-impact-value">
                    {impactData.affectedAirports}
                  </span>
                </div>
                <div className="ntc-impact-row">
                  <span className="ntc-impact-label">
                    {t("半径:", "Radius:")}
                  </span>
                  <span className="ntc-impact-value">{impactData.radius}</span>
                </div>
                <div className="ntc-impact-row">
                  <span className="ntc-impact-label">
                    {t("恶劣天气类型:", "Severe Weather Type:")}
                  </span>
                  <span className="ntc-impact-value">
                    {t("雷暴, 冰雹", impactData.severeWeatherType)}
                  </span>
                </div>

                <div className="ntc-impact-desc">
                  {t(
                    "预计有重大对流活动，将影响所有进近和离场走廊。",
                    impactData.description,
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Affected Flights + Risk Conclusion ── */}
        <div className="ntc-row">
          {/* Affected Flights or Airports */}
          <div className="ntc-card">
            <div className="ntc-card-header">
              <span className="ntc-card-title">
                {t("受影响航班或机场", "Affected Flights or Airports")}
              </span>
              <button className="ntc-filter-btn">
                &#9776;&nbsp;{t("筛选", "Filters")}&nbsp;&#9662;
              </button>
            </div>

            <div className="ntc-stats-row">
              <div className="ntc-stat-item">
                <div className="ntc-stat-label">
                  {t("总影响:", "Total Affected:")}
                </div>
                <div className="ntc-stat-value">
                  {affectedStats.totalAffected}
                </div>
              </div>
              <div className="ntc-stat-item">
                <div className="ntc-stat-label">
                  {t("备降航班:", "Flights Diverted:")}
                </div>
                <div className="ntc-stat-value">
                  {affectedStats.flightsDiverted}
                </div>
              </div>
              <div className="ntc-stat-item">
                <div className="ntc-stat-label">
                  {t("延误航班:", "Flights Delayed:")}
                </div>
                <div className="ntc-stat-value">
                  {affectedStats.flightsDelayed}
                </div>
              </div>
              <div className="ntc-stat-item">
                <div className="ntc-stat-label">
                  {t("取消航班:", "Cancellations:")}
                </div>
                <div className="ntc-stat-value">
                  {affectedStats.cancellations}
                </div>
              </div>
            </div>

            <table className="ntc-table">
              <thead>
                <tr>
                  <th>{t("航班号", "Flight ID")}</th>
                  <th>{t("始发/目的", "Origin/Dest")}</th>
                  <th>{t("状态", "Status")}</th>
                  <th>{t("影响详情", "Impact Details")}</th>
                </tr>
              </thead>
              <tbody>
                {affectedFlights.map((flight) => (
                  <tr key={flight.id}>
                    <td>{flight.id}</td>
                    <td>{flight.route}</td>
                    <td>
                      <span
                        className={
                          flight.status === "delayed"
                            ? "ntc-status-delayed"
                            : flight.status === "diverted"
                              ? "ntc-status-diverted"
                              : "ntc-status-active"
                        }
                      >
                        {flight.status === "delayed"
                          ? t("延误 (天气)", flight.statusLabel)
                          : flight.status === "diverted"
                            ? t("备降", flight.statusLabel)
                            : t("正常", flight.statusLabel)}
                      </span>
                    </td>
                    <td>
                      <span className="ntc-detail-link">
                        {t("影响详情", "Impact Details")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relationship to Risk Conclusion */}
          <div className="ntc-card">
            <div className="ntc-card-header">
              <span className="ntc-card-title">
                {t("与风险结论的关系", "Relationship to Risk Conclusion")}
              </span>
              <button className="ntc-filter-btn">
                {t("风险", "Risk")}&nbsp;&#9662;
              </button>
            </div>

            <div className="ntc-risk-section">
              <div className="ntc-risk-header">
                <div className="ntc-risk-badge">
                  <div className="ntc-risk-badge-level high">
                    {t("高", riskConclusion.level)}
                  </div>
                  <span className="ntc-risk-badge-color">
                    ({t("红色", riskConclusion.color)})
                  </span>
                </div>
                <div className="ntc-risk-desc">
                  {t(
                    "ZBAA 的雷暴活动构成重大运营风险。预计将导致严重的到达和出发延误、潜在的地面停机和航班改道。",
                    riskConclusion.description,
                  )}
                </div>
              </div>

              <div>
                <div className="ntc-factors-title">
                  {t("贡献因素", "Contributing Factors")}
                </div>
                <div className="ntc-factors-tags">
                  {riskConclusion.factors.map((factor, i) => (
                    <span key={i} className="ntc-factor-tag">
                      {t(
                        factor === "Convective Activity"
                          ? "对流活动"
                          : factor === "Low Visibility"
                            ? "低能见度"
                            : "强风",
                        factor,
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ntc-evidence-row">
                <button className="ntc-evidence-btn">
                  {t("证据分析", "Evidence Analysis")}
                </button>
                <span className="ntc-breakdown-link">
                  {t("详细分解", "Detailed breakdown")}&nbsp;&rsaquo;
                </span>
              </div>

              <div className="ntc-confidence">
                <span className="ntc-confidence-label">
                  {t("数据置信度", "Data Confidence")}
                </span>
                <div className="ntc-confidence-bar">
                  <div
                    className="ntc-confidence-fill"
                    style={{ width: `${riskConclusion.confidence}%` }}
                  />
                </div>
                <span className="ntc-confidence-value">
                  {riskConclusion.confidence >= 70
                    ? t("高", "High")
                    : riskConclusion.confidence >= 40
                      ? t("中", "Medium")
                      : t("低", "Low")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
