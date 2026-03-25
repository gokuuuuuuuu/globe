import { useState } from "react";
import "./FlightReportPage.css";

const NAV_SECTIONS = [
  { id: "flight-facts", label: "Flight Facts", icon: "doc" },
  { id: "composite-risk", label: "Composite Risk Conclusion", icon: "chart" },
  { id: "flight-phase", label: "Flight Phase Risk Analysis", icon: "phase" },
  { id: "human-factor", label: "Human Factor Analysis", icon: "human" },
  {
    id: "aircraft-factor",
    label: "Aircraft Factor Analysis",
    icon: "aircraft",
  },
  { id: "env-factor", label: "Environmental Factor Analysis", icon: "env" },
  { id: "major-risk", label: "Major Risk Event Explanation", icon: "alert" },
  { id: "evidence", label: "Evidence Appendix", icon: "evidence" },
  { id: "governance", label: "Governance Records", icon: "gov" },
];

const flightInfo = {
  flightId: "737-AR123",
  date: "Oct 26, 2023",
  aircraft: "Boeing 737-800",
  pilot: "Joren Conman",
  route: "ORD-JFK",
  status: "Complete",
  summary: "Summary are critical analysis...",
};

// Icons for sidebar nav
function NavIcon({ type }: { type: string }) {
  const s = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "doc":
      return (
        <svg {...s}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "chart":
      return (
        <svg {...s}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "phase":
      return (
        <svg {...s}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "human":
      return (
        <svg {...s}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "aircraft":
      return (
        <svg {...s}>
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case "env":
      return (
        <svg {...s}>
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      );
    case "alert":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "evidence":
      return (
        <svg {...s}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "gov":
      return (
        <svg {...s}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return null;
  }
}

export function FlightReportPage() {
  const [activeSection, setActiveSection] = useState("composite-risk");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fr-root">
      {/* Breadcrumb */}
      <div className="fr-breadcrumb">
        <span>MRIWP</span>
        <span className="fr-breadcrumb-sep">&gt;</span>
        <span>Risk Monitoring</span>
        <span className="fr-breadcrumb-sep">&gt;</span>
        <span className="fr-breadcrumb-active">Full Flight Report</span>
      </div>

      {/* Page Header */}
      <div className="fr-page-header">
        <h1 className="fr-page-title">Full Flight Report</h1>
        <div className="fr-header-actions">
          <button className="fr-btn">Page PDF</button>
          <button className="fr-btn">Actions</button>
        </div>
      </div>

      {/* Flight Info Bar */}
      <div className="fr-info-bar">
        <div className="fr-info-item">
          <div className="fr-info-label">Flight ID</div>
          <div className="fr-info-value">{flightInfo.flightId}</div>
        </div>
        <div className="fr-info-item">
          <div className="fr-info-label">Date</div>
          <div className="fr-info-value">{flightInfo.date}</div>
        </div>
        <div className="fr-info-item">
          <div className="fr-info-label">Aircraft</div>
          <div className="fr-info-value">{flightInfo.aircraft}</div>
        </div>
        <div className="fr-info-item">
          <div className="fr-info-label">Pilot in Command</div>
          <div className="fr-info-value">{flightInfo.pilot}</div>
        </div>
        <div className="fr-info-item">
          <div className="fr-info-label">Route</div>
          <div className="fr-info-value">{flightInfo.route}</div>
        </div>
        <div className="fr-info-item">
          <div className="fr-info-label">Status</div>
          <div className="fr-info-value fr-info-value-green">
            {flightInfo.status}
          </div>
        </div>
        <div className="fr-info-item">
          <div className="fr-info-label">Summary</div>
          <div className="fr-info-value">{flightInfo.summary}</div>
        </div>
      </div>

      {/* Export row */}
      <div className="fr-export-row">
        <button className="fr-btn">Export PDF</button>
        <button className="fr-btn">Export Word</button>
        <button className="fr-btn fr-btn-primary">Back to Flight Detail</button>
      </div>

      {/* Body: nav + content */}
      <div className="fr-body">
        {/* Sidebar Nav */}
        <nav className="fr-nav">
          {NAV_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              className={`fr-nav-item ${activeSection === sec.id ? "fr-nav-item-active" : ""}`}
              onClick={() => scrollToSection(sec.id)}
            >
              <span className="fr-nav-icon">
                <NavIcon type={sec.icon} />
              </span>
              {sec.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="fr-content">
          {/* 1. Composite Risk Conclusion */}
          <div id="composite-risk" className="fr-section">
            <h2 className="fr-section-title">Composite Risk Conclusion</h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-overall-risk">
                  <div>
                    <div className="fr-overall-label">OVERALL RISK:</div>
                    <div className="fr-overall-value fr-overall-value-red">
                      HIGH (Red)
                    </div>
                  </div>
                  <div>
                    <div className="fr-overall-label">RISK SCORE:</div>
                    <div
                      className="fr-overall-value"
                      style={{ color: "#f8fafc" }}
                    >
                      78/100
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div
                    className="fr-donut"
                    style={{
                      background: `conic-gradient(#ef4444 0deg 138deg, #f97316 138deg 239deg, #eab308 239deg 349deg, #22c55e 349deg 360deg)`,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "absolute",
                      }}
                    >
                      <span className="fr-donut-center">Critical</span>
                    </div>
                  </div>
                  <div className="fr-donut-legend">
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#ef4444" }}
                      />{" "}
                      Critical <span className="fr-legend-count">20</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#f97316" }}
                      />{" "}
                      High <span className="fr-legend-count">28</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#eab308" }}
                      />{" "}
                      Medium <span className="fr-legend-count">3</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#22c55e" }}
                      />{" "}
                      Low <span className="fr-legend-count">1</span>
                    </div>
                  </div>
                </div>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f8fafc",
                    margin: "0 0 8px",
                  }}
                >
                  Introduction
                </h4>
                <div className="fr-text">
                  <p>
                    The flight recent event consolidation analysis covers
                    preceding composite risk factors including high-to-runway
                    threat and maintenance contributing factors.
                  </p>
                  <ul>
                    <li>
                      <strong>Critical risk:</strong> HIGH risk, a progression
                      in composite risk with fine economic assessment.
                    </li>
                    <li>
                      <strong>High areas:</strong> In-flight cases of excessive
                      contributing factors, distribution centers in volume and
                      risk appendices.
                    </li>
                    <li>
                      <strong>Medium risk:</strong> Routine maintenance exposit
                      and environmental assessment metrics are maintained,
                      resulting in factors managing to other engine contributing
                      factors.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Flight Phase Risk Analysis mini */}
              <div className="fr-card">
                <div className="fr-card-title">Flight Phase Risk Analysis</div>
                <div className="fr-text" style={{ marginBottom: 12 }}>
                  The Flight phase risk analysis provides risk distribution
                  across flight phases.
                </div>
                <div className="fr-bar-chart">
                  {[
                    { label: "Pre-flight", vals: [1, 2, 3, 2] },
                    { label: "Takeoff", vals: [2, 3, 4, 3] },
                    { label: "Climb", vals: [1, 2, 2, 1] },
                    { label: "Cruise", vals: [3, 5, 8, 2] },
                    { label: "Descent", vals: [1, 2, 3, 1] },
                    { label: "Approach", vals: [2, 3, 4, 2] },
                    { label: "Landing", vals: [2, 4, 6, 3] },
                  ].map((phase) => {
                    const total = phase.vals.reduce((a, b) => a + b, 0);
                    const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e"];
                    return (
                      <div className="fr-bar-group" key={phase.label}>
                        <div
                          className="fr-bar-stack"
                          style={{ height: `${(total / 20) * 100}%` }}
                        >
                          {phase.vals.map((v, i) => (
                            <div
                              key={i}
                              className="fr-bar-segment"
                              style={{
                                height: `${(v / total) * 100}%`,
                                background: colors[i],
                              }}
                            />
                          ))}
                        </div>
                        <div className="fr-bar-label">{phase.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="fr-chart-legend">
                  {[
                    { label: "Criticalce", color: "#ef4444" },
                    { label: "High", color: "#f97316" },
                    { label: "Medium", color: "#3b82f6" },
                    { label: "Low", color: "#22c55e" },
                  ].map((l) => (
                    <div className="fr-chart-legend-item" key={l.label}>
                      <span
                        className="fr-chart-legend-dot"
                        style={{ background: l.color }}
                      />
                      {l.label}
                    </div>
                  ))}
                </div>
                <table className="fr-mini-table">
                  <thead>
                    <tr>
                      <th>Critical Events</th>
                      <th></th>
                      <th style={{ textAlign: "right" }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        phase: "Pre-flight",
                        detail: "Boeing 737-800",
                        risk: 2,
                      },
                      { phase: "Takeoff", detail: "Boeing 737-800", risk: 3 },
                      { phase: "Climb", detail: "Boeing 737-800", risk: 3 },
                      { phase: "Cruise", detail: "Descent ORD-JFK", risk: 2 },
                      {
                        phase: "Approach",
                        detail: "Approach ORD-JFK",
                        risk: 1,
                      },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td>{r.phase}</td>
                        <td>{r.detail}</td>
                        <td style={{ textAlign: "right" }}>{r.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. Human Factor Analysis */}
          <div id="human-factor" className="fr-section">
            <h2 className="fr-section-title">Human Factor Analysis</h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">Metric Cards</div>
                <div className="fr-grid-2" style={{ marginBottom: 16 }}>
                  {[
                    {
                      label: "Crew Fatigue",
                      badge: "Moderate - Orange",
                      cls: "fr-badge-moderate",
                    },
                    {
                      label: "Communication",
                      badge: "Good",
                      cls: "fr-badge-good",
                    },
                    {
                      label: "Task Load",
                      badge: "Moderate -",
                      cls: "fr-badge-moderate",
                    },
                    { label: "Task Load", badge: "Good", cls: "fr-badge-good" },
                    {
                      label: "Communication",
                      badge: "Moderate -",
                      cls: "fr-badge-moderate",
                    },
                    {
                      label: "Task Load",
                      badge: "Guessed",
                      cls: "fr-badge-guessed",
                    },
                  ].map((m, i) => (
                    <div className="fr-metric-card" key={i}>
                      <div className="fr-metric-label">{m.label}</div>
                      <span className={`fr-status-badge ${m.cls}`}>
                        {m.badge}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="fr-text">
                  <p>Three cards converge in four term maintenance factors:</p>
                  <ul>
                    <li>
                      <strong>Crew Fatigue</strong> - Allimoration, crew own
                      ensure and communication actual problems.
                    </li>
                    <li>
                      <strong>Communication</strong> - Railings and small
                      ercerset eaten aent to more load.
                    </li>
                    <li>
                      <strong>Task Load</strong> - Analytical accolers cont in
                      seeting communicate contributing factors for maintenance
                      aspects and contributing factors.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">Aircraft Factor Analysis</div>
                <div className="fr-text" style={{ marginBottom: 12 }}>
                  Aircraft Factor analysis provides our contains for systems,
                  maintenance logs, engine airmo environments summary for
                  components and maintenance settings.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    className="fr-donut"
                    style={{
                      width: 100,
                      height: 100,
                      background: `conic-gradient(#ef4444 0deg 150deg, #f97316 150deg 240deg, #eab308 240deg 320deg, #22c55e 320deg 360deg)`,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "#1e293b",
                        position: "absolute",
                      }}
                    />
                  </div>
                  <div className="fr-donut-legend">
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#ef4444" }}
                      />{" "}
                      Critical <span className="fr-legend-count">11</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#f97316" }}
                      />{" "}
                      High <span className="fr-legend-count">6</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#eab308" }}
                      />{" "}
                      Medium <span className="fr-legend-count">5</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#22c55e" }}
                      />{" "}
                      Low <span className="fr-legend-count">1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Aircraft Factor Analysis */}
          <div id="aircraft-factor" className="fr-section">
            <h2 className="fr-section-title">Aircraft Factor Analysis</h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">Component System Status</div>
                <div className="fr-component-grid">
                  {[
                    { name: "Engines", color: "#ef4444" },
                    { name: "Avionics", color: "#f97316" },
                    { name: "Hydraulics", color: "#22c55e" },
                    { name: "Engines", color: "#22c55e" },
                    { name: "Avionics", color: "#22c55e" },
                    { name: "Hydraulics", color: "#22c55e" },
                  ].map((c, i) => (
                    <div className="fr-component-item" key={i}>
                      <span className="fr-component-name">{c.name}</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          className="fr-status-dot"
                          style={{ background: c.color }}
                        />
                        <span
                          className="fr-component-status"
                          style={{ color: c.color }}
                        >
                          Status
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="fr-status-row">
                    <span className="fr-status-label">Maintenance logs</span>
                    <span className="fr-status-badge fr-badge-moderate">
                      Summary
                    </span>
                  </div>
                  <div className="fr-status-row">
                    <span className="fr-status-label">
                      Maintenance logs summary
                    </span>
                    <span className="fr-status-badge fr-badge-moderate">
                      Summary
                    </span>
                  </div>
                  <div className="fr-status-row">
                    <span className="fr-status-label">
                      Maintenance status tag
                    </span>
                    <span className="fr-status-badge fr-badge-complete">
                      Complete
                    </span>
                  </div>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">Risk Phase Analysis</div>
                <div className="fr-bar-chart" style={{ height: 120 }}>
                  {[
                    { label: "Takeoff", vals: [3, 4, 5, 2] },
                    { label: "Climb", vals: [2, 3, 4, 1] },
                    { label: "Cruise", vals: [4, 5, 6, 3] },
                    { label: "Descent", vals: [2, 3, 3, 2] },
                    { label: "Landing", vals: [3, 4, 5, 2] },
                  ].map((phase) => {
                    const total = phase.vals.reduce((a, b) => a + b, 0);
                    const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e"];
                    return (
                      <div className="fr-bar-group" key={phase.label}>
                        <div
                          className="fr-bar-stack"
                          style={{ height: `${(total / 20) * 100}%` }}
                        >
                          {phase.vals.map((v, i) => (
                            <div
                              key={i}
                              className="fr-bar-segment"
                              style={{
                                height: `${(v / total) * 100}%`,
                                background: colors[i],
                              }}
                            />
                          ))}
                        </div>
                        <div className="fr-bar-label">{phase.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="fr-chart-legend">
                  {[
                    { label: "Maintenance", color: "#ef4444" },
                    { label: "Avionics", color: "#f97316" },
                    { label: "Hydraulics", color: "#3b82f6" },
                  ].map((l) => (
                    <div className="fr-chart-legend-item" key={l.label}>
                      <span
                        className="fr-chart-legend-dot"
                        style={{ background: l.color }}
                      />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Environmental Factor Analysis */}
          <div id="env-factor" className="fr-section">
            <h2 className="fr-section-title">Environmental Factor Analysis</h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">Weather & Environment</div>
                <div className="fr-text" style={{ marginBottom: 12 }}>
                  Environmental factor analysis covers the main environmental
                  risk categories affecting this flight.
                </div>
                <div className="fr-text">
                  <ul>
                    <li>
                      <strong>Weather conditions:</strong> Thunderstorms near
                      arrival.
                    </li>
                    <li>
                      <strong>Weather density:</strong> Moderate wind and
                      crosswind from air traffic conditions.
                    </li>
                    <li>
                      <strong>Air traffic density:</strong> Maintenance awaiting
                      metrics contributing to contributing factor analysis.
                    </li>
                  </ul>
                </div>
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#f8fafc",
                    margin: "12px 0 8px",
                  }}
                >
                  Key Analysis:
                </h4>
                <div className="fr-text">
                  <ul>
                    <li>
                      <strong>Engines:</strong> Increase manner factors and
                      flight
                    </li>
                    <li>
                      <strong>Communication:</strong> In-flight chaels and
                      actanics convention and communication systems.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">Environmental Conditions</div>
                <div className="fr-grid-2">
                  <div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">Weather conditions</div>
                      <div className="fr-env-value">
                        Thunderstorms near arrival
                      </div>
                    </div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">Air traffic density</div>
                      <div className="fr-env-value">Site traffic</div>
                    </div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">Weather</div>
                      <div className="fr-env-value">Moderate</div>
                    </div>
                  </div>
                  <div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">Airmanity</div>
                      <div className="fr-env-value">Normal range</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Major Risk Event Explanation */}
          <div id="major-risk" className="fr-section">
            <h2 className="fr-section-title">Major Risk Event Explanation</h2>
            <div className="fr-card">
              <div className="fr-text">
                <p>
                  This section details the top risk events identified during the
                  flight analysis, including their causes, severity, and
                  recommended mitigations.
                </p>
                <ul>
                  <li>
                    <strong>Severe Turbulence (Critical - Red):</strong>{" "}
                    Thunderstorms forecasted along the flight path. Recommended
                    action: alter altitude or route to avoid convective activity
                    zones.
                  </li>
                  <li>
                    <strong>Communication Loss (High):</strong> Radio
                    interference detected in cruise phase. Backup communication
                    channels should be activated according to standard
                    procedures.
                  </li>
                  <li>
                    <strong>Engine Issue (Critical - High):</strong> Maintenance
                    indicators suggest monitoring engine performance closely.
                    Thunderstorm ingestion risk elevated.
                  </li>
                  <li>
                    <strong>Crosswind Landing (Medium):</strong> Destination
                    airport reporting strong crosswinds. Crew should prepare for
                    potential go-around scenario.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 6. Evidence Appendix */}
          <div id="evidence" className="fr-section">
            <h2 className="fr-section-title">Evidence Appendix</h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">Evidence Summary</div>
                <div className="fr-evidence-block">
                  <p>
                    The paragraphs and text blocks provide the most analysis
                    specific data. Utilization metrics and state the precods by
                    urgante analysis, metadata and multiattribs, side within
                    data converter.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    Questions of metric environmental system, interspend
                    contributing factors risk analysis, following
                    semi-point-lets data also communication position.
                  </p>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">
                  Environmental Factor Analysis
                </div>
                <div className="fr-evidence-block">
                  <p>
                    The paragraphing analysis creates contributing and tons and
                    generating environmental algorithms contrib/utility of the
                    separator charts data cuties considered by five environment
                    materials and density of environmental materials and
                    accessibility of transformation station.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Governance Records */}
          <div id="governance" className="fr-section">
            <h2 className="fr-section-title">Governance Records</h2>
            <div className="fr-card">
              <div className="fr-gov-row">
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Responsible Department
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    Flight Operations
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Responsible Person
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    Sarah Jenkins - Senior Dispatcher
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Status</div>
                  <span className="fr-status-badge fr-badge-complete">
                    In Progress
                  </span>
                </div>
              </div>
              <div className="fr-gov-row">
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Latest Action
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    Reroute planned and reviewed
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Review Date
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    Oct 27, 2024 16:30
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Work Order
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    #WO-456{" "}
                    <span className="fr-status-badge fr-badge-guessed">
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Facts (scrolled-to section) */}
          <div id="flight-facts" className="fr-section">
            <h2 className="fr-section-title">Flight Facts</h2>
            <div className="fr-card">
              <div className="fr-grid-4">
                <div>
                  <div className="fr-env-label">Flight ID</div>
                  <div className="fr-env-value">{flightInfo.flightId}</div>
                </div>
                <div>
                  <div className="fr-env-label">Date</div>
                  <div className="fr-env-value">{flightInfo.date}</div>
                </div>
                <div>
                  <div className="fr-env-label">Aircraft</div>
                  <div className="fr-env-value">{flightInfo.aircraft}</div>
                </div>
                <div>
                  <div className="fr-env-label">Pilot in Command</div>
                  <div className="fr-env-value">{flightInfo.pilot}</div>
                </div>
                <div>
                  <div className="fr-env-label">Route</div>
                  <div className="fr-env-value">{flightInfo.route}</div>
                </div>
                <div>
                  <div className="fr-env-label">Status</div>
                  <div className="fr-env-value" style={{ color: "#22c55e" }}>
                    {flightInfo.status}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">Composite Risk</div>
                  <div className="fr-env-value" style={{ color: "#ef4444" }}>
                    HIGH (Red) - 78/100
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">Report Generated</div>
                  <div className="fr-env-value">Oct 28, 2024 09:15 AM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Phase section anchor */}
          <div id="flight-phase" />
        </div>
      </div>
    </div>
  );
}
