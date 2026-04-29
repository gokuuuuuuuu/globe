import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getAirportList } from "../api/airport";
import { useLanguage } from "../i18n/useLanguage";
import "./AirportListPage.css";

// ===== Types =====

interface AirportItem {
  rank: number;
  id: number;
  code: string;
  iataCode: string | null;
  name: string;
  city: string | null;
  country: string | null;
  totalFlightCount: number;
  highRiskFlightCount: number;
  highRiskFlightRatio: number;
  topRisk: string | null;
  riskLevel: string;
  riskDrivers: { name: string; count: number }[];
  lat?: number | null;
  lon?: number | null;
}

// ===== Helpers =====

function getRiskBadge(
  riskLevel: string,
  t: (zh: string, en: string) => string,
) {
  if (riskLevel === "HIGH" || riskLevel === "高")
    return { label: t("高", "HIGH"), cls: "ap-badge-high" };
  if (riskLevel === "MEDIUM" || riskLevel === "中")
    return { label: t("中", "MEDIUM"), cls: "ap-badge-medium" };
  return { label: t("低", "LOW"), cls: "ap-badge-low" };
}

function getMarkerColor(riskLevel: string): string {
  if (riskLevel === "HIGH" || riskLevel === "高") return "#dc2626";
  if (riskLevel === "MEDIUM" || riskLevel === "中") return "#ea580c";
  return "#22c55e";
}

const PAGE_SIZE = 12;

// ===== Component =====

export function AirportListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [airports, setAirports] = useState<AirportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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

  // Fetch airport list from API
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          page,
          pageSize: PAGE_SIZE,
        };
        if (search.trim()) {
          params.keyword = search.trim();
        }
        const res = await getAirportList(
          params as Parameters<typeof getAirportList>[0],
        );
        if (!cancelled) {
          setAirports(res.items ?? []);
          setTotal(res.total ?? 0);
        }
      } catch (err) {
        console.error("Failed to fetch airport list:", err);
        if (!cancelled) {
          setAirports([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const topAirports = airports.slice(0, 10);

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
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#94a3b8",
                }}
              >
                {t("加载中...", "Loading...")}
              </div>
            ) : (
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
                  {airports.map((a) => {
                    const badge = getRiskBadge(a.riskLevel, t);
                    return (
                      <tr
                        key={a.id || a.code}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            `/airport-center/airport-detail?code=${a.code}`,
                          )
                        }
                      >
                        <td>
                          <span className="ap-rank">{a.rank}</span>
                        </td>
                        <td>
                          <div className="ap-airport-code">{a.code}</div>
                          <div className="ap-airport-name">{a.name}</div>
                        </td>
                        <td>
                          <span className="ap-total-flights">
                            {a.totalFlightCount}
                          </span>
                        </td>
                        <td className="ap-high-risk-flights">
                          <span className="ap-risk-percent">
                            {(a.highRiskFlightRatio * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                            {a.topRisk}
                          </span>
                        </td>
                        <td>
                          <span className={`ap-risk-badge ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {airports.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: "center", color: "#94a3b8" }}
                      >
                        {t("暂无数据", "No data")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
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
                className="ap-dark-tiles"
              />
              {airports
                .filter((a) => a.lat && a.lon)
                .map((a) => {
                  const color = getMarkerColor(a.riskLevel);
                  const radius = Math.max(
                    4,
                    Math.min(12, a.totalFlightCount / 10),
                  );
                  return (
                    <CircleMarker
                      key={a.id}
                      center={[a.lat!, a.lon!]}
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
                          <strong>{a.code}</strong> - {a.name}
                          <br />
                          {t("航班数：", "Flights: ")}
                          {a.totalFlightCount} | {t("风险：", "Risk: ")}
                          {a.riskLevel}
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
            {topAirports.map((a) => {
              const badge = getRiskBadge(a.riskLevel, t);
              return (
                <div key={a.id || a.code} className="ap-summary-card">
                  <div className="ap-summary-card-header">
                    <div className="ap-summary-card-title">
                      <span
                        className="ap-summary-rank-dot"
                        style={{
                          background: getMarkerColor(a.riskLevel),
                        }}
                      >
                        {a.rank}
                      </span>
                      <span className="ap-summary-code">{a.code}</span>
                    </div>
                    <span className={`ap-risk-badge ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="ap-summary-stats">
                    <div className="ap-summary-stat">
                      <div className="ap-summary-stat-label">
                        {t("航班数", "Flights")}
                      </div>
                      <div className="ap-summary-stat-value">
                        {a.totalFlightCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="ap-summary-stat">
                      <div className="ap-summary-stat-label">
                        {t("高风险占比", "High Risk %")}
                      </div>
                      <div className="ap-summary-stat-value">
                        {(a.highRiskFlightRatio * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {a.topRisk && (
                    <div className="ap-summary-drivers">
                      <span className="ap-driver-tag">
                        <span className="ap-driver-icon">&#9650;</span>
                        {a.topRisk}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
