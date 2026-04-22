import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  AIRPORTS,
  FLIGHTS,
  calculateRiskFromEnvironmentRisk,
} from "../data/flightData";
import { useLanguage } from "../i18n/useLanguage";
import "./AirportListPage.css";

// ===== Helpers =====

function getRiskBadge(risk: number, t: (zh: string, en: string) => string) {
  if (risk >= 7) return { label: t("高", "HIGH"), cls: "ap-badge-high" };
  if (risk >= 3) return { label: t("中", "MEDIUM"), cls: "ap-badge-medium" };
  return { label: t("低", "LOW"), cls: "ap-badge-low" };
}

function getMarkerColor(risk: number): string {
  if (risk >= 7) return "#dc2626";
  if (risk >= 3) return "#ea580c";
  return "#22c55e";
}

function getRiskDrivers(t: (zh: string, en: string) => string) {
  return [
    t("天气延误", "Weather Delays"),
    t("安全公告", "Security Advisory"),
    t("拥堵", "Congestion"),
    t("空管延误", "ATC Delays"),
    t("维护", "Maintenance"),
  ];
}

function getDrivers(seed: number, t: (zh: string, en: string) => string) {
  const drivers = getRiskDrivers(t);
  const count = 1 + (seed % 3);
  const start = seed % drivers.length;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(drivers[(start + i) % drivers.length]);
  }
  return result;
}

const PAGE_SIZE = 12;

// ===== Component =====

export function AirportListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const riskParam = searchParams.get("risk");
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

  // Build ranked airport list
  const rankedAirports = useMemo(() => {
    // Count high-risk flights per airport
    const highRiskMap: Record<string, number> = {};
    FLIGHTS.forEach((f) => {
      const { riskZone } = calculateRiskFromEnvironmentRisk(f.environmentRisk);
      if (riskZone === "red" || riskZone === "yellow") {
        highRiskMap[f.fromAirport] = (highRiskMap[f.fromAirport] || 0) + 1;
        highRiskMap[f.toAirport] = (highRiskMap[f.toAirport] || 0) + 1;
      }
    });

    return AIRPORTS.map((a, i) => {
      // Mock: high-risk flight percentage around 1%
      const mockPct = (0.5 + ((i * 7 + 3) % 11) / 10).toFixed(2);
      const highRisk =
        a.flightCount > 0
          ? Math.max(1, Math.round((a.flightCount * parseFloat(mockPct)) / 100))
          : 0;
      return { ...a, highRiskFlights: highRisk, highRiskPct: mockPct };
    })
      .filter((a) => {
        if (riskParam === "high" && a.environmentRisk < 7) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            a.code.toLowerCase().includes(q) ||
            (a.code4 || "").toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.flightCount - a.flightCount);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(rankedAirports.length / PAGE_SIZE));
  const pagedAirports = rankedAirports.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const topAirports = rankedAirports.slice(0, 10);

  // --- Resizable panels ---
  const mainRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(300);
  const draggingRef = useRef<"left" | "right" | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = useCallback(
    (side: "left" | "right", e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = side;
      startXRef.current = e.clientX;
      startWidthRef.current = side === "left" ? leftWidth : rightWidth;

      const onMouseMove = (ev: MouseEvent) => {
        if (!mainRef.current) return;
        const mainRect = mainRef.current.getBoundingClientRect();
        const delta = ev.clientX - startXRef.current;
        const minPanel = 200;
        const minMap = 300;

        if (draggingRef.current === "left") {
          const newLeft = Math.max(minPanel, startWidthRef.current + delta);
          const maxLeft = mainRect.width - rightWidth - minMap - 12;
          setLeftWidth(Math.min(newLeft, maxLeft));
        } else {
          const newRight = Math.max(minPanel, startWidthRef.current - delta);
          const maxRight = mainRect.width - leftWidth - minMap - 12;
          setRightWidth(Math.min(newRight, maxRight));
        }
      };

      const onMouseUp = () => {
        draggingRef.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [leftWidth, rightWidth],
  );

  return (
    <div className="ap-root">
      {/* Breadcrumb */}
      <div className="ap-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="ap-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/airport-center/airport-list")}
        >
          {t("机场", "Airports")}
        </span>
        <span className="ap-breadcrumb-sep">&gt;</span>
        <span className="ap-breadcrumb-active">
          {t("机场列表", "Airport List")}
        </span>
      </div>

      {/* Filters */}
      <div className="ap-filters">
        <div className="ap-filter-group">
          <span className="ap-filter-label">
            {t("时间窗口", "Time Window")}
          </span>
          <input
            className="ap-filter-date"
            type="text"
            disabled
            defaultValue={t(
              "近7天：2024-05-15 至 2024-05-21",
              "Last 7 Days: 2024-05-15 to 2024-05-21",
            )}
            readOnly
          />
        </div>
        <div className="ap-filter-group">
          <span className="ap-filter-label">
            {t("机场搜索", "Airport Search")}
          </span>
          <input
            className="ap-filter-input"
            type="text"
            placeholder={t("机场搜索", "Airport Search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="ap-filter-actions">
          {/* <button className="ap-btn ap-btn-primary">
            {t("应用", "Apply")}
          </button> */}
          <button
            className="ap-btn ap-btn-secondary"
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
          >
            {t("清除", "Clear")}
          </button>
        </div>
      </div>

      {/* Main 3 columns */}
      <div className="ap-main" ref={mainRef}>
        {/* Left: Ranking Table */}
        <div className="ap-panel" style={{ width: leftWidth, flexShrink: 0 }}>
          <div className="ap-panel-title">
            {t("机场排名", "Airport Ranking")}
          </div>
          <div className="ap-panel-body" style={{ overflowX: "hidden" }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>{t("排名", "Rank")}</th>
                  <th>{t("机场代码 / 名称", "Airport Code / Name")}</th>
                  <th>{t("总航班数", "Total Flights")}</th>
                  <th>{t("高风险航班占比", "High-Risk Flights %")}</th>
                  <th>{t("首要风险", "Primary Risk")}</th>
                  <th>{t("综合风险等级", "Composite Risk Level")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedAirports.map((a, i) => {
                  const rank = (page - 1) * PAGE_SIZE + i + 1;
                  // risk badge computed via composite below
                  const composite = getRiskBadge(
                    a.environmentRisk >= 5
                      ? a.environmentRisk
                      : a.environmentRisk + 1,
                    t,
                  );
                  return (
                    <tr
                      key={a.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(
                          `/airport-center/airport-detail?code=${a.code}`,
                        )
                      }
                    >
                      <td>
                        <span className="ap-rank">{rank}</span>
                      </td>
                      <td>
                        <div className="ap-airport-code">
                          {a.code4 || a.code}
                        </div>
                        <div className="ap-airport-name">
                          {a.nameZh || a.name}
                        </div>
                      </td>
                      <td>
                        <span className="ap-total-flights">
                          {a.flightCount}
                        </span>
                      </td>
                      <td className="ap-high-risk-flights">
                        {a.highRiskFlights}
                        <br />
                        <span className="ap-risk-percent">
                          ({a.highRiskPct}%)
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                          {getDrivers(i + rank, t)[0]}
                        </span>
                      </td>
                      <td>
                        <span className={`ap-risk-badge ${composite.cls}`}>
                          {composite.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="ap-pagination">
            <button
              className="ap-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              &laquo;
            </button>
            <button
              className="ap-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              &lsaquo;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  className={`ap-page-btn ${p === page ? "ap-page-btn-active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="ap-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="ap-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              &raquo;
            </button>
          </div>
        </div>

        {/* Left resize handle */}
        <div
          className="ap-resize-handle"
          onMouseDown={(e) => onMouseDown("left", e)}
        />

        {/* Center: Map */}
        <div className="ap-map-panel" style={{ flex: 1, minWidth: 300 }}>
          <div className="ap-panel-title">
            {t("机场风险地图", "Airport Risk Map")}
          </div>
          <div className="ap-map-container">
            <MapContainer
              center={[35, 105]}
              zoom={4}
              style={{ width: "100%", height: "100%" }}
              zoomControl={true}
              attributionControl={true}
            >
              <TileLayer
                url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&x={x}&y={y}&z={z}"
                subdomains={["1", "2", "3", "4"]}
                // attribution='&copy; <a href="https://www.amap.com/">高德地图</a>'
                className="ap-dark-tiles"
              />
              {AIRPORTS.filter((a) => a.environmentRisk >= 3).map((a) => {
                const color = getMarkerColor(a.environmentRisk);
                const radius = Math.max(4, Math.min(12, a.flightCount / 10));
                return (
                  <CircleMarker
                    key={a.id}
                    center={[a.lat, a.lon]}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.7,
                      color: color,
                      weight: 1,
                      opacity: 0.9,
                    }}
                  >
                    <Tooltip>
                      <div
                        style={{
                          background: "#0f172a",
                          color: "#e2e8f0",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        <strong>{a.code4 || a.code}</strong> - {a.name}
                        <br />
                        {t("航班数：", "Flights: ")}
                        {a.flightCount} | {t("风险：", "Risk: ")}
                        {a.environmentRisk.toFixed(1)}
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            {/* Legend */}
            <div className="ap-map-legend">
              <div className="ap-map-legend-title">
                {t("地图图例", "Map Legend")}
              </div>
              {[
                { color: "#dc2626", label: t("高", "High") },
                { color: "#ea580c", label: t("中", "Medium") },
              ].map((item) => (
                <div key={item.color} className="ap-map-legend-item">
                  <span
                    className="ap-map-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right resize handle */}
        <div
          className="ap-resize-handle"
          onMouseDown={(e) => onMouseDown("right", e)}
        />

        {/* Right: Summary Cards */}
        <div
          className="ap-cards-panel"
          style={{ width: rightWidth, flexShrink: 0 }}
        >
          <div className="ap-panel-title">
            {t("机场摘要卡片", "Airport Summary Cards")}
          </div>
          <div className="ap-cards-body">
            {topAirports.map((a, i) => {
              const badge = getRiskBadge(a.environmentRisk, t);
              const drivers = getDrivers(i, t);
              const riskFlightsPct = (
                (a.highRiskFlights / Math.max(1, a.flightCount)) *
                100
              ).toFixed(2);
              return (
                <div key={a.id} className="ap-summary-card">
                  <div className="ap-summary-card-header">
                    <div className="ap-summary-card-title">
                      <span
                        className="ap-summary-rank-dot"
                        style={{
                          background: getMarkerColor(a.environmentRisk),
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="ap-summary-code">
                        {a.code4 || a.code}
                      </span>
                    </div>
                    {/* Mini sparkline placeholder */}
                    <svg className="ap-summary-sparkline" viewBox="0 0 60 20">
                      <polyline
                        points={`0,${15 - (i % 3) * 4} 10,${10 + (i % 2) * 5} 20,${8 - (i % 4)} 30,${12 + (i % 3) * 2} 40,${6 + (i % 5)} 50,${14 - (i % 2) * 3} 60,${10 + (i % 3)}`}
                        fill="none"
                        stroke={getMarkerColor(a.environmentRisk)}
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <div className="ap-summary-stats">
                    <div className="ap-summary-stat">
                      <div className="ap-summary-stat-label">
                        {t("统计", "Stats")}
                      </div>
                      <div className="ap-summary-stat-value">
                        {a.flightCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="ap-summary-stat">
                      <div className="ap-summary-stat-label">
                        {t("风险航班", "Risk Flights")}
                      </div>
                      <div className="ap-summary-stat-value">
                        {riskFlightsPct}%
                      </div>
                    </div>
                    <div className="ap-summary-stat">
                      <div className="ap-summary-stat-label">
                        {t("补助", "Grants")}
                      </div>
                      <div className="ap-summary-stat-value">
                        {(13.5 + i * 1.3).toFixed(1)}m
                      </div>
                    </div>
                    <div className="ap-summary-stat">
                      <div className="ap-summary-stat-label">{badge.label}</div>
                      <div className="ap-summary-stat-value">
                        {(29.9 - i * 2.1).toFixed(1)}m
                      </div>
                    </div>
                  </div>
                  <div className="ap-summary-drivers-label">
                    {t("风险驱动因素", "Risk Drivers")}
                  </div>
                  <div className="ap-summary-drivers">
                    {drivers.map((d, di) => (
                      <span key={di} className="ap-driver-tag">
                        <span className="ap-driver-icon">&#9650;</span>
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="ap-summary-trend-label">
                    {t("趋势", "Trend")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
