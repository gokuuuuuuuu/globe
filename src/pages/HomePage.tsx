// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useMemo, useState, useRef, useEffect } from "react";
import "../App.css";
import "./HomePage.css";
import { GlobeView } from "../views/GlobeView";
import { MapView } from "../views/MapView";
import { useAtlasData } from "../hooks/useAtlasData";
import { useAppStore } from "../store/useAppStore";
import {
  FLIGHTS,
  AIRPORTS,
  calculateRiskFromEnvironmentRisk,
} from "../data/flightData";
import { ALL_PERSONS } from "../data/personData";
// import type { Person } from "../data/personData";
import { AnalysisPage } from "./AnalysisPage";
import { useLanguage } from "../i18n/useLanguage";

type ObjectTab = "flights" | "airports" | "personnel";

const LAYERS = [
  { key: "wind", labelZh: "风", labelEn: "Wind" },
  { key: "temperature", labelZh: "温度", labelEn: "Temp" },
  { key: "precipitation", labelZh: "降水", labelEn: "Precip" },
  { key: "fog", labelZh: "雾", labelEn: "Fog" },
  { key: "moisture", labelZh: "湿度", labelEn: "Moisture" },
  { key: "lightning", labelZh: "闪电", labelEn: "Lightning" },
  { key: "cat", labelZh: "晴空湍流", labelEn: "CAT" },
  { key: "visibility", labelZh: "能见度", labelEn: "Visibility" },
] as const;

export function HomePage() {
  const { t } = useLanguage();
  const { atlas, world, isLoading, error } = useAtlasData();
  const {
    view,
    setView,
    showWindLayer,
    setShowWindLayer,
    showTemperatureLayer,
    setShowTemperatureLayer,
    showPrecipitationLayer,
    setShowPrecipitationLayer,
    showFogLayer,
    setShowFogLayer,
    showMoistureLayer,
    setShowMoistureLayer,
    showLightningLayer,
    setShowLightningLayer,
    showCATLayer,
    setShowCATLayer,
    showVisibilityLayer,
    setShowVisibilityLayer,
    selectedFlightRouteId,
    setSelectedFlightRouteId,
    setSidebarTab,
    timelineIsPlaying,
    setTimelineIsPlaying,
    riskZones,
    setRiskZones,
  } = useAppStore();

  const [objectTab, setObjectTab] = useState<ObjectTab>("flights");
  const [riskFilter, setRiskFilter] = useState<"all" | "red" | "orange">("all");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const redOrangeOnly =
    riskZones.length === 2 &&
    riskZones.includes("red") &&
    riskZones.includes("orange");

  const toggleRedOrangeOnly = () => {
    if (redOrangeOnly) {
      setRiskZones(["red", "orange", "yellow", "green"]);
    } else {
      setRiskZones(["red", "orange"]);
    }
  };

  const canRender = !!atlas && !!world;

  const layerStates: Record<string, { active: boolean; toggle: () => void }> = {
    wind: {
      active: showWindLayer,
      toggle: () => setShowWindLayer(!showWindLayer),
    },
    temperature: {
      active: showTemperatureLayer,
      toggle: () => setShowTemperatureLayer(!showTemperatureLayer),
    },
    precipitation: {
      active: showPrecipitationLayer,
      toggle: () => setShowPrecipitationLayer(!showPrecipitationLayer),
    },
    fog: { active: showFogLayer, toggle: () => setShowFogLayer(!showFogLayer) },
    moisture: {
      active: showMoistureLayer,
      toggle: () => setShowMoistureLayer(!showMoistureLayer),
    },
    lightning: {
      active: showLightningLayer,
      toggle: () => setShowLightningLayer(!showLightningLayer),
    },
    cat: { active: showCATLayer, toggle: () => setShowCATLayer(!showCATLayer) },
    visibility: {
      active: showVisibilityLayer,
      toggle: () => setShowVisibilityLayer(!showVisibilityLayer),
    },
  };

  const flightStats = useMemo(() => {
    let red = 0,
      orange = 0,
      yellow = 0,
      green = 0;
    FLIGHTS.forEach((f) => {
      const { riskZone } = calculateRiskFromEnvironmentRisk(f.environmentRisk);
      if (riskZone === "red") red++;
      else if (riskZone === "orange") orange++;
      else if (riskZone === "yellow") yellow++;
      else green++;
    });
    return { total: FLIGHTS.length, red, orange, yellow, green };
  }, []);

  const airportStats = useMemo(() => {
    let red = 0,
      orange = 0,
      green = 0;
    AIRPORTS.forEach((a) => {
      if (a.environmentRisk >= 7) red++;
      else if (a.environmentRisk >= 5) orange++;
      else green++;
    });
    return { total: AIRPORTS.length, red, orange, green };
  }, []);

  const personnelStats = useMemo(() => {
    const techCounts: Record<string, number> = {};
    let highRisk = 0,
      mediumRisk = 0,
      lowRisk = 0;
    ALL_PERSONS.forEach((p) => {
      techCounts[p.pfTechnology] = (techCounts[p.pfTechnology] || 0) + 1;
      const rv = p.riskValue ?? 0;
      if (rv >= 2.5) highRisk++;
      else if (rv >= 2) mediumRisk++;
      else lowRisk++;
    });
    return {
      total: ALL_PERSONS.length,
      highRisk,
      mediumRisk,
      lowRisk,
      techCounts,
    };
  }, []);

  const highRiskFlights = useMemo(() => {
    return FLIGHTS.filter((f) => {
      const { riskZone } = calculateRiskFromEnvironmentRisk(f.environmentRisk);
      if (riskFilter === "red") return riskZone === "red";
      if (riskFilter === "orange") return riskZone === "orange";
      return riskZone === "red" || riskZone === "orange";
    }).sort(
      (a, b) =>
        b.humanRisk +
        b.machineRisk +
        b.environmentRisk -
        (a.humanRisk + a.machineRisk + a.environmentRisk),
    );
  }, [riskFilter]);

  const highRiskAirports = useMemo(() => {
    return AIRPORTS.filter((a) => {
      if (riskFilter === "red") return a.environmentRisk >= 7;
      if (riskFilter === "orange")
        return a.environmentRisk >= 5 && a.environmentRisk < 7;
      return a.environmentRisk >= 5;
    }).sort(
      (a, b) =>
        b.environmentRisk - a.environmentRisk || b.flightCount - a.flightCount,
    );
  }, [riskFilter]);

  const highRiskPersonnel = useMemo(() => {
    return [...ALL_PERSONS]
      .filter((p) => {
        const rv = p.riskValue ?? 0;
        if (riskFilter === "red") return rv >= 2.5;
        if (riskFilter === "orange") return rv >= 2.0 && rv < 2.5;
        return rv >= 2.0;
      })
      .sort((a, b) => (b.riskValue ?? 0) - (a.riskValue ?? 0));
  }, [riskFilter]);

  const riskListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedFlightRouteId && riskListRef.current) {
      const card = document.getElementById(
        `risk-card-${selectedFlightRouteId}`,
      );
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedFlightRouteId]);

  const renderView = () => {
    if (!atlas || !world) return null;
    switch (view) {
      case "globe":
        return <GlobeView atlas={atlas} world={world} />;
      case "map":
        return <MapView world={world} atlas={atlas} />;
      default:
        return <GlobeView atlas={atlas} world={world} />;
    }
  };

  return (
    <div className="hp-root">
      {/* ===== Header ===== */}
      <header className="hp-header">
        <div className="hp-header-left">
          <span className="hp-logo">
            {t("▲ 重大风险智能预警平台", "▲ MRIWP")}
          </span>
        </div>
        <div className="hp-header-right">
          <span className="hp-header-time">
            {t("数据刷新时间", "Data Refresh Time")}
            <br />
            <strong>2026-03-23 02:20</strong>
          </span>
          <span className="hp-header-login">
            {t("登录状态：", "Login Status:")}
            <br />
            <strong>
              {t("admin (高级管理员)", "admin (Senior Administrator)")}
            </strong>
          </span>
        </div>
      </header>

      <div className="hp-toolbar">
        <div className="hp-toolbar-section">
          <span className="hp-toolbar-label">
            {t("对象切换", "Object Switching")}
          </span>
          <div className="hp-btn-group">
            <button
              className={`hp-btn ${objectTab === "flights" ? "hp-btn-active" : ""}`}
              onClick={() => setObjectTab("flights")}
            >
              {t("航班", "Flights")}
            </button>
            <button
              className={`hp-btn ${objectTab === "airports" ? "hp-btn-active" : ""}`}
              onClick={() => setObjectTab("airports")}
            >
              {t("机场", "Airports")}
            </button>
            <button
              className={`hp-btn ${objectTab === "personnel" ? "hp-btn-active" : ""}`}
              onClick={() => setObjectTab("personnel")}
            >
              {t("人员", "Personnel")}
            </button>
          </div>
        </div>
        <div className="hp-toolbar-section">
          <div className="hp-btn-group hp-btn-group-right">
            <button
              className={`hp-btn ${showAnalysis ? "hp-btn-active" : ""}`}
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              {t("综合分析", "Summary Analysis")}
            </button>
            <button className="hp-btn">
              {t("统计分析", "Statistical Analysis")}
            </button>
            <button className="hp-btn">
              {t("治理工作流", "Governance Workflow")}
            </button>
          </div>
        </div>
      </div>

      <div className="hp-stats-row">
        {objectTab === "flights" && (
          <>
            <StatCard
              label={t("预测航班", "Forecast Flights")}
              value={flightStats.total.toLocaleString()}
              trend="up"
            />
            <StatCard
              label={t("红色", "Red")}
              value={flightStats.red.toString()}
              change="-1%"
              color="#ef4444"
              trend="down"
            />
            <StatCard
              label={t("橙色", "Orange")}
              value={flightStats.orange.toString()}
              change="+12"
              color="#f97316"
              trend="up"
            />
            <StatCard
              label={t("绿色", "Green")}
              value={flightStats.green.toString()}
              change="+55"
              color="#22c55e"
              trend="up"
            />
            <StatCard
              label={t("高风险机场", "High-Risk Airports")}
              value={airportStats.red.toString()}
            />
            <StatCard
              label={t("高风险人员", "High-Risk Personnel")}
              value={personnelStats.highRisk.toString()}
              change="+3"
              trend="up"
            />
            <StatCard
              label={t("新增高风险(1h)", "New High-Risk (1h)")}
              value="17"
            />
          </>
        )}
        {objectTab === "airports" && (
          <>
            <StatCard
              label={t("监控机场", "Monitored Airports")}
              value={airportStats.total.toString()}
            />
            <StatCard
              label={t("红色", "Red")}
              value={airportStats.red.toString()}
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label={t("橙色", "Orange")}
              value={airportStats.orange.toString()}
              color="#f97316"
            />
            <StatCard
              label={t("绿色", "Green")}
              value={airportStats.green.toString()}
              color="#22c55e"
            />
            <StatCard
              label={t("高风险航班", "High-Risk Flights")}
              value={flightStats.red.toString()}
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label={t("运营人员", "Operators")}
              value={new Set(
                AIRPORTS.map((a) => a.operatorCount),
              ).size.toString()}
            />
            <StatCard
              label={t("总航班数", "Total Flights")}
              value={AIRPORTS.reduce(
                (s, a) => s + a.flightCount,
                0,
              ).toLocaleString()}
            />
            <StatCard label={t("新增告警(1h)", "New Alerts (1h)")} value="8" />
          </>
        )}
        {objectTab === "personnel" && (
          <>
            <StatCard
              label={t("监控人员", "Monitored Personnel")}
              value={personnelStats.total.toLocaleString()}
            />
            <StatCard
              label={t("高风险", "High Risk")}
              value={personnelStats.highRisk.toString()}
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label={t("中风险", "Medium Risk")}
              value={personnelStats.mediumRisk.toString()}
              color="#f97316"
            />
            <StatCard
              label={t("低风险", "Low Risk")}
              value={personnelStats.lowRisk.toString()}
              color="#22c55e"
            />
            <StatCard
              label={t("教员", "Instructor")}
              value={(personnelStats.techCounts["教员"] || 0).toString()}
            />
            <StatCard
              label={t("机长", "Captain")}
              value={(personnelStats.techCounts["机长"] || 0).toString()}
            />
            <StatCard
              label={t("副驾驶", "First Officer")}
              value={(
                (personnelStats.techCounts["第一副驾驶"] || 0) +
                (personnelStats.techCounts["第二副驾驶"] || 0)
              ).toString()}
            />
            <StatCard
              label={t("巡航机长", "Cruise Captain")}
              value={(personnelStats.techCounts["巡航机长"] || 0).toString()}
            />
          </>
        )}
      </div>

      {/* ===== Three-Column Body ===== */}
      <div className="hp-body">
        {/* --- Left Filter Panel (collapsible) --- */}
        {leftPanelCollapsed ? (
          <div
            className="hp-left-tab"
            onClick={() => setLeftPanelCollapsed(false)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{t("筛选", "Filter")}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ) : (
          <aside className="hp-left-panel">
            <div className="hp-panel-header">
              <h2 className="hp-panel-title">
                {t("筛选与值班控制", "Filters & Duty Control")}
              </h2>
              <button
                className="hp-panel-close"
                onClick={() => setLeftPanelCollapsed(true)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
            <div className="hp-filter-list">
              {objectTab === "flights" && (
                <>
                  <FilterItem
                    label={t("对象视图", "Object View")}
                    value={t("航班 - 主要对象", "Flights - Primary Object")}
                  />
                  <FilterItem
                    label={t("航空部门 / 中队", "Airline Division / Squadron")}
                    value={t(
                      "所有部门 · 所有中队",
                      "All Divisions · All Squadrons",
                    )}
                  />
                  <FilterItem
                    label={t("区域 / 机场", "Region / Airport")}
                    value={t("华东 · 所有机场", "East China · All Airports")}
                  />
                  <FilterItem
                    label={t("航班号 / 机尾号", "Flight No. / Tail No.")}
                    value={t(
                      "所有航班 · 所有飞机",
                      "All Flights · All Aircraft",
                    )}
                  />
                  <FilterItem
                    label={t("风险等级", "Risk Level")}
                    value={t("红色 · 橙色", "Red · Orange")}
                    valueColor
                  />
                  <FilterItem
                    label={t("风险类型", "Risk Type")}
                    value={t("全部 · 人为/机械/环境", "All · Human/Mech/Env")}
                  />
                  <FilterItem
                    label={t("治理状态", "Governance Status")}
                    value={t("仅开放工单", "Open Tickets Only")}
                  />
                </>
              )}
              {objectTab === "airports" && (
                <>
                  <FilterItem
                    label={t("对象视图", "Object View")}
                    value={t("机场 - 主要对象", "Airports - Primary Object")}
                  />
                  <FilterItem
                    label={t("区域", "Region")}
                    value={t("华东 · 所有省份", "East China · All Provinces")}
                  />
                  <FilterItem
                    label={t("机场代码 / 名称", "Airport Code / Name")}
                    value={t("所有机场", "All Airports")}
                  />
                  <FilterItem
                    label={t("环境风险等级", "Env Risk Level")}
                    value={t("红色 · 橙色", "Red · Orange")}
                    valueColor
                  />
                  <FilterItem
                    label={t("航班数量范围", "Flight Count Range")}
                    value={t("不限", "Unlimited")}
                  />
                  <FilterItem
                    label={t("运营人员数", "Operator Count")}
                    value={t("不限", "Unlimited")}
                  />
                </>
              )}
              {objectTab === "personnel" && (
                <>
                  <FilterItem
                    label={t("对象视图", "Object View")}
                    value={t("人员 - 主要对象", "Personnel - Primary Object")}
                  />
                  <FilterItem
                    label={t("技术等级", "Tech Level")}
                    value={t(
                      "全部 · 教员/机长/副驾",
                      "All · Instructor/Captain/FO",
                    )}
                  />
                  <FilterItem
                    label={t("机队", "Fleet")}
                    value={t("所有机队", "All Fleets")}
                  />
                  <FilterItem
                    label={t("风险值范围", "Risk Value Range")}
                    value="≥2.0"
                  />
                  <FilterItem
                    label={t("飞行年限", "Flight Years")}
                    value={t("不限", "Unlimited")}
                  />
                  <FilterItem
                    label={t("当前机型", "Current Aircraft")}
                    value={t("所有机型", "All Types")}
                  />
                </>
              )}
            </div>
            <div className="hp-filter-actions">
              <button className="hp-btn hp-btn-primary">
                {t("应用", "Apply")}
              </button>
              <button className="hp-btn">{t("重置", "Reset")}</button>
            </div>
            <button className="hp-link-btn">
              {t("切换到列表视图", "Switch to List View")}
            </button>
          </aside>
        )}

        {/* --- Center Map Area --- */}

        <div className="hp-center">
          {/* Map Top Toolbar */}
          <div className="hp-map-toolbar">
            <h3 className="hp-map-title">
              {t("空间分布", "Spatial Distribution")} (
              {objectTab === "flights"
                ? t("航班", "Flights")
                : objectTab === "airports"
                  ? t("机场", "Airports")
                  : t("人员", "Personnel")}{" "}
              {t("模式", "Mode")})
            </h3>
            <div className="hp-map-actions">
              <button
                className={`hp-btn hp-btn-sm ${view === "globe" ? "hp-btn-active" : ""}`}
                onClick={() => setView("globe")}
              >
                {t("3D 地球", "3D Globe")}
              </button>
              <button
                className={`hp-btn hp-btn-sm ${view === "map" ? "hp-btn-active" : ""}`}
                onClick={() => setView("map")}
              >
                {t("2D 地图", "2D Map")}
              </button>
              <button
                className={`hp-btn hp-btn-sm ${redOrangeOnly ? "hp-btn-active" : ""}`}
                onClick={toggleRedOrangeOnly}
              >
                {t(
                  <>
                    仅显示<span style={{ color: "#ef4444" }}>红色</span>和
                    <span style={{ color: "#f97316" }}>橙色</span>
                  </>,
                  <>
                    <span style={{ color: "#ef4444" }}>Red</span> and{" "}
                    <span style={{ color: "#f97316" }}>Orange</span> Only
                  </>,
                )}
              </button>
              <button
                className={`hp-btn hp-btn-sm ${timelineIsPlaying ? "hp-btn-active" : ""}`}
                onClick={() => setTimelineIsPlaying(!timelineIsPlaying)}
              >
                {timelineIsPlaying
                  ? t("暂停时间线", "Pause Timeline")
                  : t("播放时间线", "Play Timeline")}
              </button>
            </div>
          </div>

          {/* Layer Toggle Bar */}
          <div className="hp-layer-bar">
            {LAYERS.map((layer) => (
              <button
                key={layer.key}
                className={`hp-layer-btn ${layerStates[layer.key].active ? "active" : ""}`}
                onClick={layerStates[layer.key].toggle}
                title={t(layer.labelZh, layer.labelEn)}
              >
                {t(layer.labelZh, layer.labelEn)}
              </button>
            ))}
          </div>

          {/* Map Container */}
          <div className="hp-map-container">
            {isLoading && (
              <div className="status-card">
                <div className="spinner" />
                <p>{t("加载数据中...", "Loading data...")}</p>
              </div>
            )}
            {!isLoading && error && (
              <div className="status-card error">
                <p>
                  {t("加载失败：", "Load failed: ")}
                  {error}
                </p>
              </div>
            )}
            {!isLoading && !error && canRender && renderView()}
          </div>

          {/* Footer Info Bar */}
          <div className="hp-map-footer">
            {objectTab === "flights" && (
              <>
                <span>
                  {t("最高红色航班：", "Top Red Flight: ")}MU3531 ·{" "}
                  {t("着陆风险", "Landing Risk")}{" "}
                  <span className="text-red">9.2</span>
                </span>
                <span>
                  {t("首要因素：", "Top Factor: ")}
                  {t("环境", "Env")} <span className="text-green">41%</span> ·
                  {t("人为", "Human")} <span className="text-yellow">34%</span>{" "}
                  · {t("机械", "Mech")} 25%
                </span>
                <span>
                  {t("待处理工单：", "Pending Tickets: ")}
                  <span className="text-blue">17</span> ·
                  {t("未分配：", "Unassigned: ")}
                  <span className="text-red">5</span>
                </span>
              </>
            )}
            {objectTab === "airports" && (
              <>
                <span>
                  {t("红色机场：", "Red Airports: ")}
                  <span className="text-red">{airportStats.red}</span>
                </span>
                <span>
                  {t("总航班覆盖：", "Total Flight Coverage: ")}
                  <span className="text-blue">
                    {AIRPORTS.reduce(
                      (s, a) => s + a.flightCount,
                      0,
                    ).toLocaleString()}
                  </span>
                </span>
                <span>
                  {t("橙色告警机场：", "Orange Alert Airports: ")}
                  <span className="text-orange">{airportStats.orange}</span>
                </span>
              </>
            )}
            {objectTab === "personnel" && (
              <>
                <span>
                  {t("高风险人员：", "High-Risk Personnel: ")}
                  <span className="text-red">{personnelStats.highRisk}</span>
                </span>
                <span>
                  {t("教员：", "Instructors: ")}
                  {personnelStats.techCounts["教员"] || 0} ·
                  {t("机长：", "Captains: ")}
                  {personnelStats.techCounts["机长"] || 0}
                </span>
                <span>
                  {t("中风险人员：", "Medium-Risk Personnel: ")}
                  <span className="text-orange">
                    {personnelStats.mediumRisk}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* --- Right Risk Ranking Panel --- */}
        <aside className="hp-right-panel">
          <h2 className="hp-panel-title">
            {t("风险排名", "Risk Ranking")} (
            {objectTab === "flights"
              ? t("航班", "Flights")
              : objectTab === "airports"
                ? t("机场", "Airports")
                : t("人员", "Personnel")}
            )
          </h2>
          <div className="hp-risk-tabs">
            <button
              className={`hp-btn hp-btn-sm ${riskFilter === "all" ? "hp-btn-active" : ""}`}
              onClick={() => setRiskFilter("all")}
            >
              {t("全部", "All")}
            </button>
            <button
              className={`hp-btn hp-btn-sm ${riskFilter === "red" ? "hp-btn-active" : "hp-btn-red"}`}
              onClick={() => setRiskFilter("red")}
            >
              {objectTab === "personnel"
                ? t("高风险", "High")
                : t("红色", "Red")}
            </button>
            <button
              className={`hp-btn hp-btn-sm ${riskFilter === "orange" ? "hp-btn-active" : "hp-btn-orange"}`}
              onClick={() => setRiskFilter("orange")}
            >
              {objectTab === "personnel"
                ? t("中风险", "Medium")
                : t("橙色", "Orange")}
            </button>
          </div>
          <div className="hp-risk-list" ref={riskListRef}>
            {/* ===== Flight Cards ===== */}
            {objectTab === "flights" &&
              highRiskFlights.map((flight) => {
                const { riskZone } = calculateRiskFromEnvironmentRisk(
                  flight.environmentRisk,
                );
                const isSelected = selectedFlightRouteId === flight.id;
                return (
                  <div
                    key={flight.id}
                    id={`risk-card-${flight.id}`}
                    className={`hp-risk-card hp-risk-${riskZone} ${isSelected ? "hp-risk-card-selected" : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFlightRouteId(null);
                      } else {
                        setSelectedFlightRouteId(flight.id);
                        setSidebarTab("airline");
                      }
                    }}
                  >
                    <div className="hp-risk-card-header">
                      <strong>{flight.flightNumber}</strong>
                      {isSelected && (
                        <span className="hp-selected-badge">
                          {t("已选中", "SELECTED")}
                        </span>
                      )}
                    </div>
                    <div className="hp-risk-card-body">
                      <p>
                        {flight.fromAirport} → {flight.toAirport}
                        {flight.aircraftType && (
                          <span className="hp-risk-tag hp-risk-tag-info">
                            {flight.aircraftType}
                          </span>
                        )}
                      </p>
                      <p>
                        {t("综合风险：", "Composite Risk: ")}
                        <span
                          className={
                            riskZone === "red" ? "text-red" : "text-orange"
                          }
                        >
                          {(
                            (flight.humanRisk +
                              flight.machineRisk +
                              flight.environmentRisk) /
                            3
                          ).toFixed(1)}
                        </span>
                        <span className="hp-risk-breakdown">
                          (H {flight.humanRisk} / M {flight.machineRisk} / E{" "}
                          {flight.environmentRisk})
                        </span>
                      </p>
                      <p className="hp-risk-tags-row">
                        {flight.environmentRisk >= 7 && (
                          <span className="hp-risk-tag hp-risk-tag-red">
                            {t("环境高", "Env High")}
                          </span>
                        )}
                        {flight.environmentRisk >= 5 &&
                          flight.environmentRisk < 7 && (
                            <span className="hp-risk-tag hp-risk-tag-orange">
                              {t("环境中", "Env Medium")}
                            </span>
                          )}
                        {flight.humanRisk >= 5 && (
                          <span className="hp-risk-tag hp-risk-tag-yellow">
                            {t("人为风险", "Human Risk")}
                          </span>
                        )}
                        {flight.machineRisk >= 5 && (
                          <span className="hp-risk-tag hp-risk-tag-yellow">
                            {t("机械风险", "Mech Risk")}
                          </span>
                        )}
                      </p>
                      <p>
                        <span
                          className={`hp-status-dot hp-status-${flight.status === "巡航中" ? "flying" : flight.status === "未起飞" ? "pending" : "landed"}`}
                        />
                        {flight.status === "巡航中"
                          ? t("飞行中", "In Flight")
                          : flight.status === "未起飞"
                            ? t("计划中", "Scheduled")
                            : t("已降落", "Landed")}
                        {flight.operatingUnit && (
                          <span className="hp-risk-unit">
                            · {flight.operatingUnit} {t("部门", "Div.")}
                          </span>
                        )}
                      </p>
                      {flight.scheduledDeparture && (
                        <p className="hp-risk-time">
                          {t("预计起飞", "ETD")} {flight.scheduledDeparture} →{" "}
                          {t("预计到达", "ETA")}{" "}
                          {flight.scheduledArrival || "-"}
                        </p>
                      )}
                    </div>
                    <div className="hp-risk-card-actions">
                      <button
                        className="hp-btn hp-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFlightRouteId(flight.id);
                          setSidebarTab("airline");
                        }}
                      >
                        {t("查看航班", "View Flight")}
                      </button>
                      <button
                        className="hp-btn hp-btn-sm hp-btn-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("处理", "Handle")}
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* ===== Airport Cards ===== */}
            {objectTab === "airports" &&
              highRiskAirports.map((airport) => {
                const riskZone =
                  airport.environmentRisk >= 7
                    ? "red"
                    : airport.environmentRisk >= 5
                      ? "orange"
                      : "green";
                return (
                  <div
                    key={airport.id}
                    className={`hp-risk-card hp-risk-${riskZone}`}
                  >
                    <div className="hp-risk-card-header">
                      <strong>{airport.code}</strong>
                      <span className="hp-risk-tag hp-risk-tag-info">
                        {airport.countryCode}
                      </span>
                    </div>
                    <div className="hp-risk-card-body">
                      <p>{airport.nameZh || airport.name}</p>
                      <p>
                        {t("环境风险：", "Env Risk: ")}
                        <span
                          className={
                            riskZone === "red" ? "text-red" : "text-orange"
                          }
                        >
                          {airport.environmentRisk.toFixed(1)}
                        </span>
                      </p>
                      <p className="hp-risk-tags-row">
                        {riskZone === "red" && (
                          <span className="hp-risk-tag hp-risk-tag-red">
                            {t("高风险", "High Risk")}
                          </span>
                        )}
                        {riskZone === "orange" && (
                          <span className="hp-risk-tag hp-risk-tag-orange">
                            {t("中风险", "Medium Risk")}
                          </span>
                        )}
                      </p>
                      <p>
                        {t("航班数：", "Flights: ")}
                        <strong>{airport.flightCount}</strong>
                        <span className="hp-risk-unit">
                          {" "}
                          · {t("运营人员：", "Operators: ")}
                          {airport.operatorCount}
                        </span>
                      </p>
                      <p className="hp-risk-time">
                        {t("坐标：", "Coords: ")}
                        {airport.lat.toFixed(2)}°N, {airport.lon.toFixed(2)}°E
                      </p>
                    </div>
                    <div className="hp-risk-card-actions">
                      <button className="hp-btn hp-btn-sm">
                        {t("查看机场", "View Airport")}
                      </button>
                      <button className="hp-btn hp-btn-sm hp-btn-primary">
                        {t("处理", "Handle")}
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* ===== Personnel Cards ===== */}
            {objectTab === "personnel" &&
              highRiskPersonnel.map((person) => {
                const rv = person.riskValue ?? 0;
                const riskZone =
                  rv >= 2.5 ? "red" : rv >= 2.0 ? "orange" : "green";
                return (
                  <div
                    key={person.id}
                    className={`hp-risk-card hp-risk-${riskZone}`}
                  >
                    <div className="hp-risk-card-header">
                      <strong>{person.name}</strong>
                      <span className="hp-risk-tag hp-risk-tag-info">
                        {person.pfTechnology}
                      </span>
                    </div>
                    <div className="hp-risk-card-body">
                      <p>
                        {t("风险值：", "Risk Value: ")}
                        <span
                          className={
                            riskZone === "red" ? "text-red" : "text-orange"
                          }
                        >
                          {rv.toFixed(1)}
                        </span>
                        <span className="hp-risk-breakdown">
                          · ID {person.pfId}
                        </span>
                      </p>
                      <p className="hp-risk-tags-row">
                        {rv >= 2.5 && (
                          <span className="hp-risk-tag hp-risk-tag-red">
                            {t("高风险", "High Risk")}
                          </span>
                        )}
                        {rv >= 2.0 && rv < 2.5 && (
                          <span className="hp-risk-tag hp-risk-tag-orange">
                            {t("中风险", "Medium Risk")}
                          </span>
                        )}
                      </p>
                      {person.age && (
                        <p>
                          {t("年龄：", "Age: ")}
                          {person.age}
                          {person.flightYears && (
                            <span className="hp-risk-unit">
                              {" "}
                              · {t("飞行年限：", "Flight Years: ")}
                              {person.flightYears}
                            </span>
                          )}
                        </p>
                      )}
                      {person.totalFlightHours && (
                        <p className="hp-risk-time">
                          {t("总飞行时间：", "Total Hours: ")}
                          {person.totalFlightHours}h
                          {person.recent90DaysFlightHours &&
                            ` · ${t("近90天：", "Last 90d: ")}${person.recent90DaysFlightHours}h`}
                        </p>
                      )}
                      {person.currentAircraftType && (
                        <p className="hp-risk-time">
                          {t("当前机型：", "Current Type: ")}
                          {person.currentAircraftType}
                        </p>
                      )}
                    </div>
                    <div className="hp-risk-card-actions">
                      <button className="hp-btn hp-btn-sm">
                        {t("查看人员", "View Person")}
                      </button>
                      <button className="hp-btn hp-btn-sm hp-btn-primary">
                        {t("处理", "Handle")}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>
      </div>

      {/* ===== Summary Analysis Overlay ===== */}
      {showAnalysis && (
        <div className="hp-analysis-overlay">
          <div className="hp-analysis-header">
            <h2>{t("综合分析", "Summary Analysis")}</h2>
            <button
              className="hp-btn hp-btn-sm"
              onClick={() => setShowAnalysis(false)}
            >
              ✕ {t("关闭", "Close")}
            </button>
          </div>
          <div className="hp-analysis-content">
            <AnalysisPage />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Sub-components =====

function StatCard({
  label,
  value,
  change,
  color,
  trend,
}: {
  label: string;
  value: string;
  change?: string;
  color?: string;
  trend?: "up" | "down";
}) {
  const cardStyle: React.CSSProperties = color
    ? { background: `${color}18`, borderColor: `${color}40` }
    : {};

  return (
    <div className="hp-stat-card" style={cardStyle}>
      <div className="hp-stat-label" style={color ? { color } : undefined}>
        {color && (
          <span className="hp-stat-dot" style={{ background: color }} />
        )}
        {label}
      </div>
      <div className="hp-stat-value">
        <span style={color ? { color } : undefined}>{value}</span>
        {change && (
          <span
            className="hp-stat-change"
            style={color ? { color, opacity: 0.7 } : undefined}
          >
            {change}
          </span>
        )}
        {trend && (
          <span
            className={`hp-stat-trend ${trend}`}
            style={color ? { color } : undefined}
          >
            {trend === "up" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </div>
  );
}

function FilterItem({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="hp-filter-item">
      <div className="hp-filter-item-label">{label}</div>
      <div className={`hp-filter-item-value ${valueColor ? "colored" : ""}`}>
        {valueColor ? (
          <>
            <span className="text-red">{t("红色", "Red")}</span>
            {" · "}
            <span className="text-orange">{t("橙色", "Orange")}</span>
          </>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
