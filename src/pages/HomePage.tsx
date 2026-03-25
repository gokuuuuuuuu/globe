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

type ObjectTab = "flights" | "airports" | "personnel";

const LAYERS = [
  { key: "wind", label: "Wind" },
  { key: "temperature", label: "Temp" },
  { key: "precipitation", label: "Precip" },
  { key: "fog", label: "Fog" },
  { key: "moisture", label: "Moisture" },
  { key: "lightning", label: "Lightning" },
  { key: "cat", label: "CAT" },
  { key: "visibility", label: "Visibility" },
] as const;

export function HomePage() {
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
    timelineTimeRange,
    setTimelineTimeRange,
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
          <span className="hp-logo">▲ 重大风险智能预警平台</span>
          <span className="hp-header-title">
            Aviation Risk Prediction and Governance System · Home Workbench
          </span>
        </div>
        <div className="hp-header-right">
          <span className="hp-header-time">
            Data Refresh Time
            <br />
            <strong>2026-03-23 02:20</strong>
          </span>
          <span className="hp-header-login">
            Login Status:
            <br />
            <strong>admin (Senior Administrator)</strong>
          </span>
        </div>
      </header>

      <div className="hp-toolbar">
        <div className="hp-toolbar-section">
          <span className="hp-toolbar-label">Object Switching</span>
          <div className="hp-btn-group">
            <button
              className={`hp-btn ${objectTab === "flights" ? "hp-btn-active" : ""}`}
              onClick={() => setObjectTab("flights")}
            >
              Flights
            </button>
            <button
              className={`hp-btn ${objectTab === "airports" ? "hp-btn-active" : ""}`}
              onClick={() => setObjectTab("airports")}
            >
              Airports
            </button>
            <button
              className={`hp-btn ${objectTab === "personnel" ? "hp-btn-active" : ""}`}
              onClick={() => setObjectTab("personnel")}
            >
              Personnel
            </button>
          </div>
        </div>
        <div className="hp-toolbar-section">
          <span className="hp-toolbar-label">
            Forecast time window and Quick action
          </span>
          <div className="hp-btn-group">
            {[4, 10, 18, 24].map((h) => (
              <button
                key={h}
                className={`hp-btn ${timelineTimeRange === h ? "hp-btn-active" : ""}`}
                onClick={() => setTimelineTimeRange(h as 4 | 10 | 18 | 24)}
              >
                {h} Hours
              </button>
            ))}
          </div>
          <div className="hp-btn-group hp-btn-group-right">
            <button
              className={`hp-btn ${showAnalysis ? "hp-btn-active" : ""}`}
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              Summary Analysis
            </button>
            <button className="hp-btn">Statistical Analysis</button>
            <button className="hp-btn">Governance Workflow</button>
          </div>
        </div>
      </div>

      <div className="hp-stats-row">
        {objectTab === "flights" && (
          <>
            <StatCard
              label="Forecast Flights"
              value={flightStats.total.toLocaleString()}
              trend="up"
            />
            <StatCard
              label="Red"
              value={flightStats.red.toString()}
              change="+6.3%"
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label="Orange"
              value={flightStats.orange.toString()}
              change="+12"
              color="#f97316"
              trend="up"
            />
            <StatCard
              label="Yellow"
              value={flightStats.yellow.toString()}
              change="-18"
              color="#eab308"
              trend="down"
            />
            <StatCard
              label="Green"
              value={flightStats.green.toString()}
              change="+55"
              color="#22c55e"
              trend="up"
            />
            <StatCard
              label="High-Risk Airports"
              value={airportStats.red.toString()}
            />
            <StatCard
              label="High-Risk Personnel"
              value={personnelStats.highRisk.toString()}
              change="+3"
              trend="up"
            />
            <StatCard label="New High-Risk (1h)" value="17" />
          </>
        )}
        {objectTab === "airports" && (
          <>
            <StatCard
              label="Monitored Airports"
              value={airportStats.total.toString()}
            />
            <StatCard
              label="Red"
              value={airportStats.red.toString()}
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label="Orange"
              value={airportStats.orange.toString()}
              color="#f97316"
            />
            <StatCard
              label="Green"
              value={airportStats.green.toString()}
              color="#22c55e"
            />
            <StatCard
              label="High-Risk Flights"
              value={flightStats.red.toString()}
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label="Operators"
              value={new Set(
                AIRPORTS.map((a) => a.operatorCount),
              ).size.toString()}
            />
            <StatCard
              label="Total Flights"
              value={AIRPORTS.reduce(
                (s, a) => s + a.flightCount,
                0,
              ).toLocaleString()}
            />
            <StatCard label="New Alerts (1h)" value="8" />
          </>
        )}
        {objectTab === "personnel" && (
          <>
            <StatCard
              label="Monitored Personnel"
              value={personnelStats.total.toLocaleString()}
            />
            <StatCard
              label="High Risk"
              value={personnelStats.highRisk.toString()}
              color="#ef4444"
              trend="up"
            />
            <StatCard
              label="Medium Risk"
              value={personnelStats.mediumRisk.toString()}
              color="#f97316"
            />
            <StatCard
              label="Low Risk"
              value={personnelStats.lowRisk.toString()}
              color="#22c55e"
            />
            <StatCard
              label="Instructor"
              value={(personnelStats.techCounts["教员"] || 0).toString()}
            />
            <StatCard
              label="Captain"
              value={(personnelStats.techCounts["机长"] || 0).toString()}
            />
            <StatCard
              label="First Officer"
              value={(
                (personnelStats.techCounts["第一副驾驶"] || 0) +
                (personnelStats.techCounts["第二副驾驶"] || 0)
              ).toString()}
            />
            <StatCard
              label="Cruise Captain"
              value={(personnelStats.techCounts["巡航机长"] || 0).toString()}
            />
          </>
        )}
      </div>

      {/* ===== Three-Column Body ===== */}
      <div className="hp-body">
        {/* --- Left Filter Panel --- */}
        <aside className="hp-left-panel">
          <h2 className="hp-panel-title">Filters & Duty Control</h2>
          <div className="hp-filter-list">
            {objectTab === "flights" && (
              <>
                <FilterItem
                  label="Object View"
                  value="Flights - Primary Object"
                />
                <FilterItem
                  label="Airline Division / Squadron"
                  value="All Divisions · All Squadrons"
                />
                <FilterItem
                  label="Region / Airport"
                  value="East China · All Airports"
                />
                <FilterItem
                  label="Flight No. / Tail No."
                  value="All Flights · All Aircraft"
                />
                <FilterItem
                  label="Risk Level"
                  value="Red · Orange"
                  valueColor
                />
                <FilterItem label="Risk Type" value="All · Human/Mech/Env" />
                <FilterItem
                  label="Governance Status"
                  value="Open Tickets Only"
                />
              </>
            )}
            {objectTab === "airports" && (
              <>
                <FilterItem
                  label="Object View"
                  value="Airports - Primary Object"
                />
                <FilterItem label="Region" value="East China · All Provinces" />
                <FilterItem label="Airport Code / Name" value="All Airports" />
                <FilterItem
                  label="Env Risk Level"
                  value="Red · Orange"
                  valueColor
                />
                <FilterItem label="Flight Count Range" value="Unlimited" />
                <FilterItem label="Operator Count" value="Unlimited" />
              </>
            )}
            {objectTab === "personnel" && (
              <>
                <FilterItem
                  label="Object View"
                  value="Personnel - Primary Object"
                />
                <FilterItem
                  label="Tech Level"
                  value="All · Instructor/Captain/FO"
                />
                <FilterItem label="Fleet" value="All Fleets" />
                <FilterItem label="Risk Value Range" value="≥2.0" />
                <FilterItem label="Flight Years" value="Unlimited" />
                <FilterItem label="Current Aircraft" value="All Types" />
              </>
            )}
          </div>
          <div className="hp-filter-actions">
            <button className="hp-btn hp-btn-primary">Apply</button>
            <button className="hp-btn">Reset</button>
          </div>
          <button className="hp-link-btn">Switch to List View</button>
        </aside>

        {/* --- Center Map Area --- */}
        <div className="hp-center">
          {/* Map Top Toolbar */}
          <div className="hp-map-toolbar">
            <h3 className="hp-map-title">
              Spatial Distribution (
              {objectTab === "flights"
                ? "Flights"
                : objectTab === "airports"
                  ? "Airports"
                  : "Personnel"}{" "}
              Mode)
            </h3>
            <div className="hp-map-actions">
              <button
                className={`hp-btn hp-btn-sm ${view === "globe" ? "hp-btn-active" : ""}`}
                onClick={() => setView("globe")}
              >
                3D Globe
              </button>
              <button
                className={`hp-btn hp-btn-sm ${view === "map" ? "hp-btn-active" : ""}`}
                onClick={() => setView("map")}
              >
                2D Map
              </button>
              <button
                className={`hp-btn hp-btn-sm ${redOrangeOnly ? "hp-btn-active" : ""}`}
                onClick={toggleRedOrangeOnly}
              >
                <span style={{ color: "#ef4444" }}>Red</span> and{" "}
                <span style={{ color: "#f97316" }}>Orange</span> Only
              </button>
              <button
                className={`hp-btn hp-btn-sm ${timelineIsPlaying ? "hp-btn-active" : ""}`}
                onClick={() => setTimelineIsPlaying(!timelineIsPlaying)}
              >
                {timelineIsPlaying ? "Pause Timeline" : "Play Timeline"}
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
                title={layer.label}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Map Container */}
          <div className="hp-map-container">
            {isLoading && (
              <div className="status-card">
                <div className="spinner" />
                <p>Loading data...</p>
              </div>
            )}
            {!isLoading && error && (
              <div className="status-card error">
                <p>Load failed: {error}</p>
              </div>
            )}
            {!isLoading && !error && canRender && renderView()}
          </div>

          {/* Footer Info Bar */}
          <div className="hp-map-footer">
            {objectTab === "flights" && (
              <>
                <span>
                  Top Red Flight: MU3531 · Landing Risk{" "}
                  <span className="text-red">9.2</span>
                </span>
                <span>
                  Top Factor: Env <span className="text-green">41%</span> ·
                  Human <span className="text-yellow">34%</span> · Mech 25%
                </span>
                <span>
                  Pending Tickets: <span className="text-blue">17</span> ·
                  Unassigned: <span className="text-red">5</span>
                </span>
              </>
            )}
            {objectTab === "airports" && (
              <>
                <span>
                  Red Airports:{" "}
                  <span className="text-red">{airportStats.red}</span>
                </span>
                <span>
                  Total Flight Coverage:{" "}
                  <span className="text-blue">
                    {AIRPORTS.reduce(
                      (s, a) => s + a.flightCount,
                      0,
                    ).toLocaleString()}
                  </span>
                </span>
                <span>
                  Orange Alert Airports:{" "}
                  <span className="text-orange">{airportStats.orange}</span>
                </span>
              </>
            )}
            {objectTab === "personnel" && (
              <>
                <span>
                  High-Risk Personnel:{" "}
                  <span className="text-red">{personnelStats.highRisk}</span>
                </span>
                <span>
                  Instructors: {personnelStats.techCounts["教员"] || 0} ·
                  Captains: {personnelStats.techCounts["机长"] || 0}
                </span>
                <span>
                  Medium-Risk Personnel:{" "}
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
            Risk Ranking (
            {objectTab === "flights"
              ? "Flights"
              : objectTab === "airports"
                ? "Airports"
                : "Personnel"}
            )
          </h2>
          <div className="hp-risk-tabs">
            <button
              className={`hp-btn hp-btn-sm ${riskFilter === "all" ? "hp-btn-active" : ""}`}
              onClick={() => setRiskFilter("all")}
            >
              All
            </button>
            <button
              className={`hp-btn hp-btn-sm ${riskFilter === "red" ? "hp-btn-active" : "hp-btn-red"}`}
              onClick={() => setRiskFilter("red")}
            >
              {objectTab === "personnel" ? "High" : "Red"}
            </button>
            <button
              className={`hp-btn hp-btn-sm ${riskFilter === "orange" ? "hp-btn-active" : "hp-btn-orange"}`}
              onClick={() => setRiskFilter("orange")}
            >
              {objectTab === "personnel" ? "Medium" : "Orange"}
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
                        <span className="hp-selected-badge">SELECTED</span>
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
                        Composite Risk:{" "}
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
                            Env High
                          </span>
                        )}
                        {flight.environmentRisk >= 5 &&
                          flight.environmentRisk < 7 && (
                            <span className="hp-risk-tag hp-risk-tag-orange">
                              Env Medium
                            </span>
                          )}
                        {flight.humanRisk >= 5 && (
                          <span className="hp-risk-tag hp-risk-tag-yellow">
                            Human Risk
                          </span>
                        )}
                        {flight.machineRisk >= 5 && (
                          <span className="hp-risk-tag hp-risk-tag-yellow">
                            Mech Risk
                          </span>
                        )}
                      </p>
                      <p>
                        <span
                          className={`hp-status-dot hp-status-${flight.status === "巡航中" ? "flying" : flight.status === "未起飞" ? "pending" : "landed"}`}
                        />
                        {flight.status === "巡航中"
                          ? "In Flight"
                          : flight.status === "未起飞"
                            ? "Scheduled"
                            : "Landed"}
                        {flight.operatingUnit && (
                          <span className="hp-risk-unit">
                            · {flight.operatingUnit} Div.
                          </span>
                        )}
                      </p>
                      {flight.scheduledDeparture && (
                        <p className="hp-risk-time">
                          ETD {flight.scheduledDeparture} → ETA{" "}
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
                        View Flight
                      </button>
                      <button
                        className="hp-btn hp-btn-sm hp-btn-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Handle
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
                        Env Risk:{" "}
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
                            High Risk
                          </span>
                        )}
                        {riskZone === "orange" && (
                          <span className="hp-risk-tag hp-risk-tag-orange">
                            Medium Risk
                          </span>
                        )}
                      </p>
                      <p>
                        Flights: <strong>{airport.flightCount}</strong>
                        <span className="hp-risk-unit">
                          {" "}
                          · Operators: {airport.operatorCount}
                        </span>
                      </p>
                      <p className="hp-risk-time">
                        Coords: {airport.lat.toFixed(2)}°N,{" "}
                        {airport.lon.toFixed(2)}°E
                      </p>
                    </div>
                    <div className="hp-risk-card-actions">
                      <button className="hp-btn hp-btn-sm">View Airport</button>
                      <button className="hp-btn hp-btn-sm hp-btn-primary">
                        Handle
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
                        Risk Value:{" "}
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
                            High Risk
                          </span>
                        )}
                        {rv >= 2.0 && rv < 2.5 && (
                          <span className="hp-risk-tag hp-risk-tag-orange">
                            Medium Risk
                          </span>
                        )}
                      </p>
                      {person.age && (
                        <p>
                          Age: {person.age}
                          {person.flightYears && (
                            <span className="hp-risk-unit">
                              {" "}
                              · Flight Years: {person.flightYears}
                            </span>
                          )}
                        </p>
                      )}
                      {person.totalFlightHours && (
                        <p className="hp-risk-time">
                          Total Hours: {person.totalFlightHours}h
                          {person.recent90DaysFlightHours &&
                            ` · Last 90d: ${person.recent90DaysFlightHours}h`}
                        </p>
                      )}
                      {person.currentAircraftType && (
                        <p className="hp-risk-time">
                          Current Type: {person.currentAircraftType}
                        </p>
                      )}
                    </div>
                    <div className="hp-risk-card-actions">
                      <button className="hp-btn hp-btn-sm">View Person</button>
                      <button className="hp-btn hp-btn-sm hp-btn-primary">
                        Handle
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
            <h2>Summary Analysis</h2>
            <button
              className="hp-btn hp-btn-sm"
              onClick={() => setShowAnalysis(false)}
            >
              ✕ Close
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
  return (
    <div className="hp-filter-item">
      <div className="hp-filter-item-label">{label}</div>
      <div className={`hp-filter-item-value ${valueColor ? "colored" : ""}`}>
        {valueColor ? (
          <>
            <span className="text-red">Red</span>
            {" · "}
            <span className="text-orange">Orange</span>
          </>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
