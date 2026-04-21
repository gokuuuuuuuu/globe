// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  getIcaoCode,
} from "../data/flightData";
import { ALL_PERSONS } from "../data/personData";
import { AnalysisPage } from "./AnalysisPage";
import { useLanguage } from "../i18n/useLanguage";
import { useAuthStore, isFullDataAccess } from "../store/useAuthStore";
import { Timeline } from "../components/Timeline";
import { UnifiedLegend } from "../components/Legend";

type ObjectTab = "flights" | "airports" | "personnel";

const LAYERS = [
  { key: "wind", labelZh: "风", labelEn: "Wind" },
  { key: "temperature", labelZh: "温度", labelEn: "Temp" },
  { key: "precipitation", labelZh: "降水", labelEn: "Precip" },
  { key: "fog", labelZh: "雾", labelEn: "Fog" },
  { key: "moisture", labelZh: "湿度", labelEn: "Moisture" },
  { key: "lightning", labelZh: "闪电", labelEn: "Lightning" },
  { key: "cat", labelZh: "颠簸区", labelEn: "CAT" },
  { key: "visibility", labelZh: "能见度", labelEn: "Visibility" },
] as const;

// Mock warning feed data
// const WARNING_FEED = [
//   {
//     id: 1,
//     titleZh: "航班大面积延误",
//     titleEn: "Mass Flight Delays",
//     descZh: "ZLXY 出港延误率 31% · 影响 264 架次 · 高风险",
//     descEn: "ZLXY departure delay 31% · 264 flights affected · High Risk",
//     time: "02m",
//     tags: ["red", "critical"],
//     level: "red",
//   },
//   {
//     id: 2,
//     titleZh: "恶劣天气预警",
//     titleEn: "Severe Weather Alert",
//     descZh: "ZSPD 区域强对流 · 风速 18m/s · 暴务预警",
//     descEn: "ZSPD convective storm · Wind 18m/s · Storm warning",
//     time: "05m",
//     tags: ["red", "weather"],
//     level: "red",
//   },
//   {
//     id: 3,
//     titleZh: "跑道容量告警",
//     titleEn: "Runway Capacity Warning",
//     descZh: "ZSNJ 02L 利用率 94% · 接近临界量",
//     descEn: "ZSNJ 02L utilization 94% · Near critical",
//     time: "11m",
//     tags: ["orange", "warn"],
//     level: "orange",
//   },
//   {
//     id: 4,
//     titleZh: "机务人员短缺",
//     titleEn: "Maintenance Staff Shortage",
//     descZh: "ZBAD 资深机务 6/10 · 低于阈值",
//     descEn: "ZBAD senior staff 6/10 · Below threshold",
//     time: "14m",
//     tags: ["red", "critical"],
//     level: "red",
//   },
// ];

export function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
  } = useAppStore();

  const authUser = useAuthStore((s) => s.user);
  const fullAccess = isFullDataAccess(authUser);

  // 根据角色过滤航班数据
  const scopedFlights = useMemo(() => {
    if (fullAccess) return FLIGHTS;
    const userUnit = authUser?.unit;
    if (!userUnit) return FLIGHTS;
    return FLIGHTS.filter((f) => {
      const unit = f.operatingUnit === "上海" ? "飞行总队" : f.operatingUnit;
      return unit === userUnit;
    });
  }, [fullAccess, authUser?.unit]);

  const [searchParams, setSearchParams] = useSearchParams();
  const objectTab = (searchParams.get("tab") as ObjectTab) || "flights";
  const setObjectTab = (tab: ObjectTab) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", tab);
    setSearchParams(sp, { replace: true });
    // Sync riskZones and objectTab to the target tab's filter state
    setRiskZones(
      redYellowByTab[tab] ? ["red", "yellow"] : ["red", "yellow", "green"],
    );
    setHomeObjectTab(tab);
  };
  const riskFilter =
    (searchParams.get("risk") as "all" | "red" | "yellow") || "all";
  const setRiskFilter = (risk: "all" | "red" | "yellow") => {
    const sp = new URLSearchParams(searchParams);
    sp.set("risk", risk);
    setSearchParams(sp, { replace: true });
  };
  const expandedCardId = searchParams.get("expanded") || null;
  const setExpandedCardId = (id: string | null) => {
    const sp = new URLSearchParams(searchParams);
    if (id) {
      sp.set("expanded", id);
    } else {
      sp.delete("expanded");
    }
    setSearchParams(sp, { replace: true });
  };
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { setRiskZones, setHomeObjectTab } = useAppStore();
  // Per-tab red/yellow filter state
  const [redYellowByTab, setRedYellowByTab] = useState<
    Record<ObjectTab, boolean>
  >({
    flights: false,
    airports: false,
    personnel: false,
  });
  const redYellowOnly = redYellowByTab[objectTab];
  const toggleRedYellowOnly = () => {
    const next = !redYellowOnly;
    setRedYellowByTab((prev) => ({ ...prev, [objectTab]: next }));
    setRiskZones(next ? ["red", "yellow"] : ["red", "yellow", "green"]);
  };

  const canRender = !!atlas && !!world;

  const layerStates = useMemo<
    Record<string, { active: boolean; toggle: () => void }>
  >(
    () => ({
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
      fog: {
        active: showFogLayer,
        toggle: () => setShowFogLayer(!showFogLayer),
      },
      moisture: {
        active: showMoistureLayer,
        toggle: () => setShowMoistureLayer(!showMoistureLayer),
      },
      lightning: {
        active: showLightningLayer,
        toggle: () => setShowLightningLayer(!showLightningLayer),
      },
      cat: {
        active: showCATLayer,
        toggle: () => setShowCATLayer(!showCATLayer),
      },
      visibility: {
        active: showVisibilityLayer,
        toggle: () => setShowVisibilityLayer(!showVisibilityLayer),
      },
    }),
    [
      showWindLayer,
      showTemperatureLayer,
      showPrecipitationLayer,
      showFogLayer,
      showMoistureLayer,
      showLightningLayer,
      showCATLayer,
      showVisibilityLayer,
    ],
  );

  // ===== Stats computations =====
  const flightStats = useMemo(() => {
    let red = 0,
      yellow = 0,
      green = 0;
    FLIGHTS.forEach((f) => {
      const { riskZone } = calculateRiskFromEnvironmentRisk(f.environmentRisk);
      if (riskZone === "red") red++;
      else if (riskZone === "yellow") yellow++;
      else green++;
    });
    return { total: FLIGHTS.length, red, yellow, green };
  }, []);

  const airportStats = useMemo(() => {
    let red = 0,
      yellow = 0,
      green = 0;
    AIRPORTS.forEach((a) => {
      if (a.environmentRisk >= 7) red++;
      else if (a.environmentRisk >= 5) yellow++;
      else green++;
    });
    return { total: AIRPORTS.length, red, yellow, green };
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

  // ===== Risk lists =====
  const highRiskFlights = useMemo(() => {
    return scopedFlights
      .filter((f) => {
        const { riskZone } = calculateRiskFromEnvironmentRisk(
          f.environmentRisk,
        );
        if (riskFilter === "red") return riskZone === "red";
        if (riskFilter === "yellow") return riskZone === "yellow";
        return riskZone === "red" || riskZone === "yellow";
      })
      .sort(
        (a, b) =>
          b.humanRisk +
          b.machineRisk +
          b.environmentRisk -
          (a.humanRisk + a.machineRisk + a.environmentRisk),
      );
  }, [riskFilter, scopedFlights]);

  const highRiskAirports = useMemo(() => {
    return AIRPORTS.filter((a) => {
      if (riskFilter === "red") return a.environmentRisk >= 7;
      if (riskFilter === "yellow")
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
        if (riskFilter === "yellow") return rv >= 2.0 && rv < 2.5;
        return rv >= 2.0;
      })
      .sort((a, b) => (b.riskValue ?? 0) - (a.riskValue ?? 0));
  }, [riskFilter]);

  // Top critical item for hero card
  const topCriticalItem = useMemo(() => {
    if (objectTab === "flights" && highRiskFlights.length > 0) {
      const f = highRiskFlights[0];
      const score = (
        (f.humanRisk + f.machineRisk + f.environmentRisk) /
        3
      ).toFixed(1);
      return {
        code: f.flightNumber,
        name: `${getIcaoCode(f.fromAirport)} → ${getIcaoCode(f.toAirport)}`,
        region: f.operatingUnit || "",
        score,
        flights: f.aircraftType || "-",
        staff:
          f.status === "巡航中"
            ? t("飞行中", "In Flight")
            : f.status === "未起飞"
              ? t("计划中", "Scheduled")
              : t("已降落", "Landed"),
        alerts: "1",
        id: f.id,
      };
    }
    if (objectTab === "airports" && highRiskAirports.length > 0) {
      const a = highRiskAirports[0];
      return {
        code: a.code4,
        name: a.nameZh || a.name,
        region: `${a.countryCode} · CAAC`,
        score: a.environmentRisk.toFixed(1),
        flights: a.flightCount.toString(),
        staff: a.operatorCount.toString(),
        alerts: a.environmentRisk >= 7 ? "3" : "1",
        id: a.id,
      };
    }
    if (objectTab === "personnel" && highRiskPersonnel.length > 0) {
      const p = highRiskPersonnel[0];
      return {
        code: p.name,
        name: p.pfTechnology,
        region: `ID: ${p.pfId}`,
        score: (p.riskValue ?? 0).toFixed(1),
        flights: p.totalFlightHours ? `${p.totalFlightHours}h` : "-",
        staff: p.currentAircraftType || "-",
        alerts: "1",
        id: p.id,
      };
    }
    return null;
  }, [objectTab, highRiskFlights, highRiskAirports, highRiskPersonnel, t]);

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

  // Current stats based on active tab
  const currentStats =
    objectTab === "flights"
      ? {
          total: flightStats.total,
          red: flightStats.red,
          yellow: flightStats.yellow,
          green: flightStats.green,
        }
      : objectTab === "airports"
        ? {
            total: airportStats.total,
            red: airportStats.red,
            yellow: airportStats.yellow,
            green: airportStats.green,
          }
        : {
            total: personnelStats.total,
            red: personnelStats.highRisk,
            yellow: personnelStats.mediumRisk,
            green: personnelStats.lowRisk,
          };

  const gaugeScore = topCriticalItem ? parseFloat(topCriticalItem.score) : 0;
  const gaugeCircumference = 2 * Math.PI * 54;
  const gaugeDasharray = `${(gaugeScore / 10) * gaugeCircumference} ${gaugeCircumference}`;

  return (
    <div className="stage">
      {/* Ambient Blobs */}
      <div className="ambient">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
        <div className="blob b5" />
      </div>

      {/* Map fills background */}
      <div className="map-wrap">
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
      <div className="grain" />
      <div className="vignette" />

      {/* Left Column removed per requirements */}
      {
        null
        // <div className="left-col-old">
        //   {/* Filter Panel */}
        //   <div className="filter-panel glass">
        //     <div className="fp-head">
        //       <div className="fp-title">
        //         {t("筛选与值班控制", "Filters & Duty Control")}
        //       </div>
        //       <button
        //         className="fp-collapse"
        //         onClick={() => setLeftPanelCollapsed(true)}
        //       >
        //         ‹
        //       </button>
        //     </div>

        //     <div className="fp-body">
        //       {objectTab === "flights" && (
        //         <>
        //           <FilterItem
        //             label={t("对象视图", "Object View")}
        //             value={t("航班 - 主要对象", "Flights - Primary Object")}
        //           />
        //           <FilterItem
        //             label={t("航空部门 / 中队", "Airline Division / Squadron")}
        //             value={t(
        //               "所有部门 · 所有中队",
        //               "All Divisions · All Squadrons",
        //             )}
        //           />
        //           <FilterItem
        //             label={t("区域 / 机场", "Region / Airport")}
        //             value={t("华东 · 所有机场", "East China · All Airports")}
        //           />
        //           <FilterItem
        //             label={t("航班号 / 机尾号", "Flight No. / Tail No.")}
        //             value={t(
        //               "所有航班 · 所有飞机",
        //               "All Flights · All Aircraft",
        //             )}
        //           />
        //           <FilterItem
        //             label={t("风险等级", "Risk Level")}
        //             value={t("红色 · 橙色", "Red · Orange")}
        //             valueColor
        //           />
        //           <FilterItem
        //             label={t("风险类型", "Risk Type")}
        //             value={t("全部 · 人为/机械/环境", "All · Human/Mech/Env")}
        //           />
        //           <FilterItem
        //             label={t("治理状态", "Governance Status")}
        //             value={t("仅开放工单", "Open Tickets Only")}
        //           />
        //         </>
        //       )}
        //       {objectTab === "airports" && (
        //         <>
        //           <FilterItem
        //             label={t("对象视图", "Object View")}
        //             value={t("机场 - 主要对象", "Airports - Primary Object")}
        //           />
        //           <FilterItem
        //             label={t("区域", "Region")}
        //             value={t("华东 · 所有省份", "East China · All Provinces")}
        //           />
        //           <FilterItem
        //             label={t("机场代码 / 名称", "Airport Code / Name")}
        //             value={t("所有机场", "All Airports")}
        //           />
        //           <FilterItem
        //             label={t("环境风险等级", "Env Risk Level")}
        //             value={t("红色 · 橙色", "Red · Orange")}
        //             valueColor
        //           />
        //           <FilterItem
        //             label={t("航班数量范围", "Flight Count Range")}
        //             value={t("不限", "Unlimited")}
        //           />
        //           <FilterItem
        //             label={t("运营人员数", "Operator Count")}
        //             value={t("不限", "Unlimited")}
        //           />
        //         </>
        //       )}
        //       {objectTab === "personnel" && (
        //         <>
        //           <FilterItem
        //             label={t("对象视图", "Object View")}
        //             value={t("人员 - 主要对象", "Personnel - Primary Object")}
        //           />
        //           <FilterItem
        //             label={t("技术等级", "Tech Level")}
        //             value={t(
        //               "全部 · 教员/机长/副驾",
        //               "All · Instructor/Captain/FO",
        //             )}
        //           />
        //           <FilterItem
        //             label={t("机队", "Fleet")}
        //             value={t("所有机队", "All Fleets")}
        //           />
        //           <FilterItem
        //             label={t("风险值范围", "Risk Value Range")}
        //             value="≥2.0"
        //           />
        //           <FilterItem
        //             label={t("飞行年限", "Flight Years")}
        //             value={t("不限", "Unlimited")}
        //           />
        //           <FilterItem
        //             label={t("当前机型", "Current Aircraft")}
        //             value={t("所有机型", "All Types")}
        //           />
        //         </>
        //       )}
        //     </div>

        //     <div className="fp-actions">
        //       <button className="fp-apply">{t("应用", "Apply")}</button>
        //       <button className="fp-reset">{t("重置", "Reset")}</button>
        //     </div>
        //     <button className="fp-link-btn">
        //       {t("切换到列表视图", "Switch to List View")}
        //     </button>
        //   </div>

        //   {/* Warning Feed */}
        //   <div className="warn-card glass">
        //     <div className="warn-head">
        //       <div className="lhs">
        //         <div className="icon">!</div>
        //         <span className="ttl">{t("预警动态", "WARNING FEED")}</span>
        //       </div>
        //       <div className="ct">
        //         <b>{String(WARNING_FEED.length).padStart(2, "0")}</b>{" "}
        //         {t("新增 · 1小时", "NEW · 1H")}
        //       </div>
        //     </div>
        //     <div className="warn-body">
        //       {WARNING_FEED.map((item) => (
        //         <div key={item.id} className={`warn-item ${item.level}`}>
        //           <div className="top">
        //             <span className="ttl">{t(item.titleZh, item.titleEn)}</span>
        //             <span className="tm">{item.time}</span>
        //           </div>
        //           <div className="desc">{t(item.descZh, item.descEn)}</div>
        //           <div className="footer">
        //             <div className="tags">
        //               {item.tags.map((tag) => (
        //                 <span key={tag} className={`tag ${tag}`}>
        //                   {tag.toUpperCase()}
        //                 </span>
        //               ))}
        //             </div>
        //             <span className="arrow">&rarr;</span>
        //           </div>
        //         </div>
        //       ))}
        //     </div>
        //   </div>
        // </div>
      }

      {/* ===== Center Stage ===== */}
      <div className="center-stage">
        <div className="stage-toolbar">
          <div className="toolbar-strip glass-sm">
            {/* Actions */}
            <div className="toolbar-group">
              <button
                className={showAnalysis ? "active" : ""}
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                {t("综合分析", "Analysis")}
              </button>
              {/* 治理工作流按钮已移除 */}
            </div>

            <div className="toolbar-div" />

            {/* Layers */}
            <div className="toolbar-group">
              {LAYERS.map((layer) => (
                <button
                  key={layer.key}
                  className={layerStates[layer.key].active ? "active" : ""}
                  onClick={layerStates[layer.key].toggle}
                  title={t(layer.labelZh, layer.labelEn)}
                >
                  {t(layer.labelZh, layer.labelEn)}
                </button>
              ))}
            </div>

            <div className="toolbar-div" />

            {/* View mode */}
            <div className="toolbar-group">
              <button
                className={view === "globe" ? "active" : ""}
                onClick={() => setView("globe")}
              >
                3D
              </button>
              <button
                className={view === "map" ? "active" : ""}
                onClick={() => setView("map")}
              >
                2D
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Left Column: Overview ===== */}
      <div className="left-col">
        {/* Object Tabs: FLT / APT / PSN */}
        <div className="obj-row">
          <div
            className={`obj-pill glass-sm ${objectTab === "flights" ? "active" : ""}`}
            onClick={() => setObjectTab("flights")}
          >
            <span className="lbl">{t("航班", "FLT")}</span>
            <span className="v">{flightStats.total.toLocaleString()}</span>
          </div>
          <div
            className={`obj-pill glass-sm ${objectTab === "airports" ? "active" : ""}`}
            onClick={() => setObjectTab("airports")}
          >
            <span className="lbl">{t("机场", "APT")}</span>
            <span className="v">{airportStats.total}</span>
          </div>
          <div
            className={`obj-pill glass-sm ${objectTab === "personnel" ? "active" : ""}`}
            onClick={() => setObjectTab("personnel")}
          >
            <span className="lbl">{t("人员", "PSN")}</span>
            <span className="v">{personnelStats.total}</span>
          </div>
        </div>

        {/* Supervised / Risk Distribution */}
        <div className="dist-card glass">
          <div className="dist-header">
            <span className="l">
              {t("监控总览", "SUPERVISED")} ·{" "}
              {t("风险等级分布", "Risk Distribution")}
            </span>
            <span className="total">{currentStats.total}</span>
          </div>

          <div className="dist-bar">
            <div
              className="seg red"
              style={{
                flex: currentStats.red,
              }}
            />
            <div
              className="seg yellow"
              style={{
                flex: currentStats.yellow,
              }}
            />
            <div
              className="seg green"
              style={{
                flex: currentStats.green,
              }}
            />
          </div>

          <div className="dist-chips">
            <div className="dist-chip red">
              <div className="row1">
                <div className="dot" />
                <span className="lbl">{t("高风险", "High")}</span>
              </div>
              <div className="v">{currentStats.red}</div>
              <div className="delta">&#9650; 4k / 1h</div>
            </div>
            <div className="dist-chip yellow">
              <div className="row1">
                <div className="dot" />
                <span className="lbl">{t("中风险", "Medium")}</span>
              </div>
              <div className="v">{currentStats.yellow}</div>
              <div className="delta">&#9650; 2k / 1h</div>
            </div>
            <div className="dist-chip green">
              <div className="row1">
                <div className="dot" />
                <span className="lbl">{t("正常", "Normal")}</span>
              </div>
              <div className="v">{currentStats.green}</div>
              <div className="delta">&#9660; 1k / 1h</div>
            </div>
          </div>
          {objectTab !== "personnel" && (
            <button
              className={`dist-filter-btn ${redYellowOnly ? "active" : ""}`}
              onClick={toggleRedYellowOnly}
            >
              {redYellowOnly
                ? t("显示全部", "Show All")
                : t("仅红黄", "Red/Ylw Only")}
            </button>
          )}
        </div>

        {/* Critical Alert Hero Card */}
        {topCriticalItem && (
          <div
            className={`glass ${riskFilter === "yellow" ? "glass-tint-yellow" : "glass-tint-red"} hero-compact`}
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (objectTab === "flights")
                navigate("/risk-monitoring/flight-detail");
              else if (objectTab === "airports")
                navigate(
                  `/airport-center/airport-detail?code=${topCriticalItem?.id}`,
                );
              else
                navigate(
                  `/personnel-center/personnel-detail?id=${topCriticalItem?.id}`,
                );
            }}
          >
            {/* Row 1: status bar */}
            <div className="hero-status">
              <div className="lhs">
                <div className="pulse" />
                {t("紧急告警", "CRITICAL")}
              </div>
              <span className="id">#A-0001</span>
            </div>

            {/* Row 2: code + gauge */}
            <div className="hero-body">
              <div className="hero-info">
                <div className="hero-code">{topCriticalItem.code}</div>
                <div className="hero-name">
                  {topCriticalItem.name} · {topCriticalItem.region}
                </div>
              </div>
              <div className="gauge">
                <svg viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop
                        offset="0%"
                        stopColor={
                          riskFilter === "yellow" ? "#eab308" : "#FF3957"
                        }
                      />
                      <stop
                        offset="100%"
                        stopColor={
                          riskFilter === "yellow" ? "#fbbf24" : "#ff7088"
                        }
                      />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="11"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeWidth="11"
                    strokeDasharray={gaugeDasharray}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="num">
                  <span className="v">{topCriticalItem.score}</span>
                  <span className="max">/ 10.0</span>
                </div>
              </div>
            </div>

            {/* Row 3: inline meta chips */}
            <div className="hero-chips">
              <span className="hero-chip">
                {objectTab === "flights" ? t("机型", "TYPE") : t("航班", "FLT")}
                <strong>{topCriticalItem.flights}</strong>
              </span>
              <span className="hero-chip">
                {objectTab === "flights" ? t("状态", "STS") : t("人员", "STF")}
                <strong>{topCriticalItem.staff}</strong>
              </span>
              <span className="hero-chip">
                {t("告警", "ALT")}
                <strong>{topCriticalItem.alerts}</strong>
              </span>
              <span className="hero-chip hero-chip-red">
                {t("紧急", "CRIT")}
              </span>
            </div>

            {/* 操作按钮已移除，改为点击卡片跳转 */}
          </div>
        )}

        {/* 图例面板 - 填满左下角 */}
        <UnifiedLegend
          activeLayers={{
            wind: showWindLayer,
            temperature: showTemperatureLayer,
            precipitation: showPrecipitationLayer,
            fog: showFogLayer,
            moisture: showMoistureLayer,
            lightning: showLightningLayer,
            cat: showCATLayer,
            visibility: showVisibilityLayer,
          }}
        />
      </div>

      {/* ===== Right Column: Risk Queue ===== */}
      <div className="right-col">
        {/* Ranked Risk Queue */}
        <div className="list-card glass">
          <div className="list-head">
            <span className="title">
              {t("排名", "RANKED")} · {t("风险队列", "Risk Queue")}
            </span>
            <div className="list-filters">
              <button
                className={riskFilter === "all" ? "active" : ""}
                onClick={() => setRiskFilter("all")}
              >
                {t("全部", "ALL")}
              </button>
              <button
                className={`${riskFilter === "red" ? "active" : ""} ${riskFilter !== "red" ? "red-text" : ""}`}
                onClick={() => setRiskFilter("red")}
              >
                {t("红色", "RED")}
              </button>
              <button
                className={`${riskFilter === "yellow" ? "active" : ""} ${riskFilter !== "yellow" ? "yellow-text" : ""}`}
                onClick={() => setRiskFilter("yellow")}
              >
                {t("黄色", "YLW")}
              </button>
            </div>
          </div>

          <div className="list-rows" ref={riskListRef}>
            {/* Flight items */}
            {objectTab === "flights" &&
              highRiskFlights.map((flight, idx) => {
                const { riskZone } = calculateRiskFromEnvironmentRisk(
                  flight.environmentRisk,
                );
                const isSelected = selectedFlightRouteId === flight.id;
                const isExpanded = expandedCardId === flight.id;
                const score = (
                  (flight.humanRisk +
                    flight.machineRisk +
                    flight.environmentRisk) /
                  3
                ).toFixed(1);

                return (
                  <div key={flight.id} id={`risk-card-${flight.id}`}>
                    <div
                      className={`ap-row ${riskZone} ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setExpandedCardId(isExpanded ? null : flight.id);
                        if (!isSelected) {
                          setSelectedFlightRouteId(flight.id);
                          setSidebarTab("airline");
                        }
                      }}
                    >
                      <span className="ap-num">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="ap-info">
                        <div className="code">
                          {flight.flightNumber}
                          {isSelected && (
                            <span className="sel-badge">
                              {t("已选中", "SEL")}
                            </span>
                          )}
                        </div>
                        <div className="meta">
                          {getIcaoCode(flight.fromAirport)} &rarr;{" "}
                          {getIcaoCode(flight.toAirport)}
                          {flight.aircraftType && ` · ${flight.aircraftType}`}
                        </div>
                      </div>
                      <div className="ap-right">
                        <div className={`score ${riskZone}`}>{score}</div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ranked-detail">
                        <p>
                          {t("综合风险：", "Composite: ")}
                          <span
                            className={
                              riskZone === "red" ? "text-red" : "text-yellow"
                            }
                          >
                            {score}
                          </span>
                          <span className="risk-breakdown">
                            ({t("人", "H")} {flight.humanRisk} / {t("机", "M")}{" "}
                            {flight.machineRisk} / {t("环", "E")}{" "}
                            {flight.environmentRisk})
                          </span>
                        </p>
                        <p className="risk-tags-row" style={{ marginTop: 4 }}>
                          {flight.environmentRisk >= 7 && (
                            <span className="risk-tag red">
                              {t("环境高", "Env High")}
                            </span>
                          )}
                          {flight.environmentRisk >= 5 &&
                            flight.environmentRisk < 7 && (
                              <span className="risk-tag yellow">
                                {t("环境中", "Env Med")}
                              </span>
                            )}
                          {flight.humanRisk >= 5 && (
                            <span className="risk-tag yellow">
                              {t("人为风险", "Human")}
                            </span>
                          )}
                          {flight.machineRisk >= 5 && (
                            <span className="risk-tag yellow">
                              {t("机械风险", "Mech")}
                            </span>
                          )}
                        </p>
                        <p style={{ marginTop: 4 }}>
                          <span
                            className={`status-dot status-${flight.status === "巡航中" ? "flying" : flight.status === "未起飞" ? "pending" : "landed"}`}
                          />
                          {flight.status === "巡航中"
                            ? t("飞行中", "In Flight")
                            : flight.status === "未起飞"
                              ? t("计划中", "Scheduled")
                              : t("已降落", "Landed")}
                          {flight.operatingUnit && (
                            <span className="risk-unit">
                              {" "}
                              · {flight.operatingUnit} {t("部门", "Div.")}
                            </span>
                          )}
                        </p>
                        {flight.scheduledDeparture && (
                          <p className="risk-time" style={{ marginTop: 2 }}>
                            {t("预计起飞", "ETD")} {flight.scheduledDeparture}{" "}
                            &rarr; {t("预计到达", "ETA")}{" "}
                            {flight.scheduledArrival || "-"}
                          </p>
                        )}
                        <div className="ranked-detail-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/risk-monitoring/flight-detail");
                            }}
                          >
                            {t("查看航班", "View Flight")}
                          </button>
                          {/* 处理按钮已移除 */}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Airport items */}
            {objectTab === "airports" &&
              highRiskAirports.map((airport, idx) => {
                const riskZone =
                  airport.environmentRisk >= 7
                    ? "red"
                    : airport.environmentRisk >= 5
                      ? "yellow"
                      : "green";
                const isExpanded = expandedCardId === airport.id;

                return (
                  <div key={airport.id}>
                    <div
                      className={`ap-row ${riskZone}`}
                      onClick={() =>
                        setExpandedCardId(isExpanded ? null : airport.id)
                      }
                    >
                      <span className="ap-num">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="ap-info">
                        <div className="code">
                          {airport.code4}
                          <span className="risk-tag info">
                            {airport.countryCode}
                          </span>
                        </div>
                        <div className="meta">
                          {t("航班", "FLT")} <b>{airport.flightCount}</b>{" "}
                          {t("人员", "STF")} <b>{airport.operatorCount}</b>
                        </div>
                      </div>
                      <div className="ap-right">
                        <div className={`score ${riskZone}`}>
                          {airport.environmentRisk.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ranked-detail">
                        <p>{airport.nameZh || airport.name}</p>
                        <p>
                          {t("环境风险：", "Env Risk: ")}
                          <span
                            className={
                              riskZone === "red" ? "text-red" : "text-yellow"
                            }
                          >
                            {airport.environmentRisk.toFixed(1)}
                          </span>
                        </p>
                        <p className="risk-tags-row" style={{ marginTop: 4 }}>
                          {riskZone === "red" && (
                            <span className="risk-tag red">
                              {t("高风险", "High Risk")}
                            </span>
                          )}
                          {riskZone === "yellow" && (
                            <span className="risk-tag yellow">
                              {t("中风险", "Medium Risk")}
                            </span>
                          )}
                        </p>
                        <p style={{ marginTop: 4 }}>
                          {t("航班数：", "Flights: ")}
                          <strong>{airport.flightCount}</strong>
                          <span className="risk-unit">
                            {" "}
                            · {t("运营人员：", "Operators: ")}
                            {airport.operatorCount}
                          </span>
                        </p>
                        <p className="risk-time" style={{ marginTop: 2 }}>
                          {t("坐标：", "Coords: ")}
                          {airport.lat.toFixed(2)}°N, {airport.lon.toFixed(2)}
                          °E
                        </p>
                        <div className="ranked-detail-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/airport-center/airport-detail?code=${airport.code}`,
                              );
                            }}
                          >
                            {t("查看机场", "View Airport")}
                          </button>
                          <button className="primary">
                            {t("处理", "Handle")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Personnel items */}
            {objectTab === "personnel" &&
              highRiskPersonnel.map((person, idx) => {
                const rv = person.riskValue ?? 0;
                const riskZone =
                  rv >= 2.5 ? "red" : rv >= 2.0 ? "yellow" : "green";
                const isExpanded = expandedCardId === person.id;

                return (
                  <div key={person.id}>
                    <div
                      className={`ap-row ${riskZone}`}
                      onClick={() =>
                        setExpandedCardId(isExpanded ? null : person.id)
                      }
                    >
                      <span className="ap-num">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="ap-info">
                        <div className="code">
                          {person.name}
                          <span className="risk-tag info">
                            {person.pfTechnology}
                          </span>
                        </div>
                        <div className="meta">
                          ID {person.pfId}
                          {person.currentAircraftType &&
                            ` · ${person.currentAircraftType}`}
                        </div>
                      </div>
                      <div className="ap-right">
                        <div className={`score ${riskZone}`}>
                          {rv.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ranked-detail">
                        <p>
                          {t("风险值：", "Risk: ")}
                          <span
                            className={
                              riskZone === "red" ? "text-red" : "text-yellow"
                            }
                          >
                            {rv.toFixed(1)}
                          </span>
                          <span className="risk-breakdown">
                            · ID {person.pfId}
                          </span>
                        </p>
                        <p className="risk-tags-row" style={{ marginTop: 4 }}>
                          {rv >= 2.5 && (
                            <span className="risk-tag red">
                              {t("高风险", "High Risk")}
                            </span>
                          )}
                          {rv >= 2.0 && rv < 2.5 && (
                            <span className="risk-tag yellow">
                              {t("中风险", "Medium Risk")}
                            </span>
                          )}
                        </p>
                        {person.age && (
                          <p style={{ marginTop: 4 }}>
                            {t("年龄：", "Age: ")}
                            {person.age}
                            {person.flightYears && (
                              <span className="risk-unit">
                                {" "}
                                · {t("飞行年限：", "Flight Years: ")}
                                {person.flightYears}
                              </span>
                            )}
                          </p>
                        )}
                        {person.totalFlightHours && (
                          <p className="risk-time" style={{ marginTop: 2 }}>
                            {t("总飞行时间：", "Total Hours: ")}
                            {person.totalFlightHours}h
                            {person.recent90DaysFlightHours &&
                              ` · ${t("近90天：", "Last 90d: ")}${person.recent90DaysFlightHours}h`}
                          </p>
                        )}
                        {person.currentAircraftType && (
                          <p className="risk-time" style={{ marginTop: 2 }}>
                            {t("当前机型：", "Current Type: ")}
                            {person.currentAircraftType}
                          </p>
                        )}
                        <div className="ranked-detail-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/personnel-center/personnel-detail?id=${person.id}`,
                              );
                            }}
                          >
                            {t("查看人员", "View Person")}
                          </button>
                          <button className="primary">
                            {t("处理", "Handle")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ===== Bottom Strip (Timeline only) ===== */}
      <div className="bottom-strip">
        <div className="glass bs-timeline">
          <Timeline />
        </div>
      </div>

      {/* ===== Summary Analysis Overlay ===== */}
      {showAnalysis && (
        <div className="analysis-overlay">
          <div className="analysis-header">
            <button onClick={() => setShowAnalysis(false)}>
              {t("关闭", "Close")}
            </button>
          </div>
          <div className="analysis-content">
            <AnalysisPage />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Sub-components =====

// function FilterItem({
//   label,
//   value,
//   valueColor,
// }: {
//   label: string;
//   value: string;
//   valueColor?: boolean;
// }) {
//   const { t } = useLanguage();
//   return (
//     <div className="fp-field">
//       <div className="fp-label">{label}</div>
//       <div className="fp-value">
//         {valueColor ? (
//           <>
//             <span style={{ color: "var(--red)" }}>{t("红色", "Red")}</span>
//             {" · "}
//             <span style={{ color: "var(--orange)" }}>
//               {t("橙色", "Orange")}
//             </span>
//           </>
//         ) : (
//           value
//         )}
//         <span className="fp-chev">&#9662;</span>
//       </div>
//     </div>
//   );
// }
