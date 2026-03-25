import { useState } from "react";
import "./FlightDetailPage.css";

// Mock data for the flight detail
const flightInfo = {
  flightNumber: "FL7890",
  tailNumber: "N567UA",
  aircraftType: "Boeing 737-8MAX",
  departure: "SFO (San Francisco)",
  arrival: "ORD (Chicago O'Hare)",
  scheduledTime: "Oct 28, 2024 08:15 AM",
  forecastWindow: "±20 min",
  compositeRiskLevel: "High",
  majorRiskAlert: "Severe Turbulence",
  governanceStatus: "In Progress",
};

const phases = [
  {
    name: "Takeoff",
    riskScore: 72,
    weight: "20%",
    bars: [45, 60, 72, 55, 38, 50, 65],
    barColors: [
      "#3b82f6",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
    ],
    tags: ["Engine Performance", "Human"],
  },
  {
    name: "Cruise",
    riskScore: 85,
    weight: "50%",
    bars: [50, 70, 85, 60, 45, 75, 65],
    barColors: [
      "#3b82f6",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
    ],
    tags: ["Crosswinds", "Crosswinds"],
  },
  {
    name: "Landing",
    riskScore: 60,
    weight: "30%",
    bars: [40, 55, 60, 35, 50, 45, 30],
    barColors: [
      "#3b82f6",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
    ],
    tags: ["Braking Action"],
  },
];

const factorData = {
  human: [
    { name: "Crew Fatigue", score: 3.0, color: "red" },
    { name: "Communication Lag", score: 2.0, color: "red" },
    { name: "Crew Fatigue", score: 2.0, color: "orange" },
    { name: "Communication", score: 1.8, color: "yellow" },
    { name: "Communication Lag", score: 1.0, color: "green" },
  ],
  aircraft: [
    { name: "Engine Issue", score: 3.0, color: "red" },
    { name: "Communication Lag", score: 2.0, color: "red" },
    { name: "Communication Lag", score: 2.0, color: "orange" },
    { name: "Engine Issue", score: 1.9, color: "yellow" },
    { name: "Engine Issue", score: 1.0, color: "green" },
  ],
  environment: [
    { name: "Thunderstorms", score: 3.0, color: "red" },
    { name: "Thunderstorms", score: 2.5, color: "red" },
    { name: "Engine Issue", score: 2.0, color: "orange" },
    { name: "High Traffic", score: 1.9, color: "yellow" },
    { name: "Communication Lag", score: 1.0, color: "green" },
  ],
  composite: [
    { name: "High Traffic", score: 3.0, color: "red" },
    { name: "High Traffic", score: 2.5, color: "red" },
    { name: "Thunderstorms", score: 2.0, color: "orange" },
    { name: "High Traffic", score: 1.9, color: "yellow" },
    { name: "Braking Action", score: 1.0, color: "green" },
  ],
};

const majorRiskEvents = [
  {
    risk: "Severe Turbulence",
    priority: "Critical - Red",
    priorityClass: "fd-priority-critical-red",
    cause: "Thunderstorms forecasted",
    action: "Alter altitude or route",
  },
  {
    risk: "Communication Loss",
    priority: "High",
    priorityClass: "fd-priority-high",
    cause: "Radio interference",
    action: "Use backup channel",
  },
  {
    risk: "Engine Issue",
    priority: "Critical - High",
    priorityClass: "fd-priority-critical-high",
    cause: "Thunderstorms forecasted",
    action: "Alter altitude or route roter",
  },
  {
    risk: "Communication Loss",
    priority: "Critical - Red",
    priorityClass: "fd-priority-critical-red",
    cause: "Radio commounding forecasted",
    action: "View altitudon mentions",
  },
];

function getDotClass(color: string) {
  if (color === "red") return "fd-dot-red";
  if (color === "orange") return "fd-dot-orange";
  if (color === "yellow") return "fd-dot-yellow";
  return "fd-dot-green";
}

export function FlightDetailPage() {
  const [activeTab, setActiveTab] = useState<"phases" | "causes">("phases");

  return (
    <div className="fd-root">
      {/* Breadcrumb */}
      <div className="fd-breadcrumb">
        <span>MRIWP</span>
        <span className="fd-breadcrumb-sep">&gt;</span>
        <span>Risk Monitoring</span>
        <span className="fd-breadcrumb-sep">&gt;</span>
        <span className="fd-breadcrumb-active">Single Flight Detail</span>
      </div>

      {/* Page Header */}
      <div className="fd-page-header">
        <h1 className="fd-page-title">
          Single Flight Detail - {flightInfo.flightNumber}
        </h1>
        <div className="fd-header-actions">
          <button className="fd-btn">View Full Report</button>
          <button className="fd-btn">View Explanation</button>
          <button className="fd-btn">View Evidence</button>
          <button className="fd-btn fd-btn-danger">Initiate Action</button>
        </div>
      </div>

      {/* Flight Info Bar */}
      <div className="fd-info-bar">
        <div className="fd-info-item">
          <div className="fd-info-label">Flight Number</div>
          <div className="fd-info-value">{flightInfo.flightNumber}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Aircraft Tail Number</div>
          <div className="fd-info-value">{flightInfo.tailNumber}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Aircraft Type</div>
          <div className="fd-info-value">{flightInfo.aircraftType}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Departure Airport</div>
          <div className="fd-info-value">{flightInfo.departure}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Arrival Airport</div>
          <div className="fd-info-value">{flightInfo.arrival}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Scheduled Time</div>
          <div className="fd-info-value">{flightInfo.scheduledTime}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Forecast Time Window</div>
          <div className="fd-info-value">{flightInfo.forecastWindow}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Composite Risk Level</div>
          <div className="fd-info-value fd-info-value-high">
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#f97316",
                  display: "inline-block",
                }}
              />
              {flightInfo.compositeRiskLevel}
            </span>
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Major Risk Alert</div>
          <div className="fd-info-value fd-info-value-red">
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "inline-block",
                }}
              />
              {flightInfo.majorRiskAlert}
            </span>
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">Governance Status</div>
          <div className="fd-info-value">
            <span className="fd-gov-status">
              <span className="fd-gov-dot" style={{ background: "#22c55e" }} />
              {flightInfo.governanceStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="fd-tabs">
        <button
          className={`fd-tab ${activeTab === "phases" ? "fd-tab-active" : ""}`}
          onClick={() => setActiveTab("phases")}
        >
          Flight Phases
        </button>
        <button
          className={`fd-tab ${activeTab === "causes" ? "fd-tab-active" : ""}`}
          onClick={() => setActiveTab("causes")}
        >
          Cause Dimensions
        </button>
      </div>

      {/* Content */}
      <div className="fd-content">
        {activeTab === "phases" && (
          <>
            {/* Flight Phases Cards */}
            <div className="fd-phases">
              {phases.map((phase) => (
                <div className="fd-phase-card" key={phase.name}>
                  <div className="fd-phase-header">
                    <div className="fd-phase-name">{phase.name}</div>
                    <div className="fd-phase-scores">
                      <div className="fd-phase-score-item">
                        <div className="fd-phase-score-label">Risk Score</div>
                        <div className="fd-phase-score-value">
                          {phase.riskScore}
                        </div>
                      </div>
                      <div className="fd-phase-score-item">
                        <div className="fd-phase-score-label">Weight</div>
                        <div className="fd-phase-score-value">
                          {phase.weight}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="fd-phase-chart">
                    {phase.bars.map((h, i) => (
                      <div
                        key={i}
                        className="fd-phase-bar"
                        style={{
                          height: `${(h / 100) * 100}%`,
                          background: phase.barColors[i],
                        }}
                      />
                    ))}
                  </div>
                  <div className="fd-phase-tags">
                    <span className="fd-phase-tags-label">Risk Tags</span>
                    {phase.tags.map((tag, i) => (
                      <span key={i} className="fd-phase-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Top-Factor Contribution Area */}
            <h2 className="fd-section-title">Top-Factor Contribution Area</h2>
            <div className="fd-factors">
              <div className="fd-factor-card">
                <div className="fd-factor-title">Human Top 5</div>
                {factorData.human.map((item, i) => (
                  <div className="fd-factor-row" key={i}>
                    <div className="fd-factor-left">
                      <span
                        className={`fd-factor-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-name">{item.name}</span>
                    </div>
                    <div className="fd-factor-right">
                      <span
                        className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-score">
                        {item.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fd-factor-card">
                <div className="fd-factor-title">Aircraft Top 5</div>
                {factorData.aircraft.map((item, i) => (
                  <div className="fd-factor-row" key={i}>
                    <div className="fd-factor-left">
                      <span
                        className={`fd-factor-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-name">{item.name}</span>
                    </div>
                    <div className="fd-factor-right">
                      <span
                        className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-score">
                        {item.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fd-factor-card">
                <div className="fd-factor-title">Environment Top 5</div>
                {factorData.environment.map((item, i) => (
                  <div className="fd-factor-row" key={i}>
                    <div className="fd-factor-left">
                      <span
                        className={`fd-factor-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-name">{item.name}</span>
                    </div>
                    <div className="fd-factor-right">
                      <span
                        className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-score">
                        {item.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fd-factor-card">
                <div className="fd-factor-title">Composite Top 10</div>
                {factorData.composite.map((item, i) => (
                  <div className="fd-factor-row" key={i}>
                    <div className="fd-factor-left">
                      <span
                        className={`fd-factor-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-name">{item.name}</span>
                    </div>
                    <div className="fd-factor-right">
                      <span
                        className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                      />
                      <span className="fd-factor-score">
                        {item.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Major Risk Event Section */}
            <div className="fd-risk-section-header">
              <h2 className="fd-section-title" style={{ margin: 0 }}>
                Major Risk Event Section
              </h2>
              <div className="fd-risk-section-actions">
                <button className="fd-btn">View Full Report</button>
                <button className="fd-btn">View Explanation</button>
                <button className="fd-btn">View Evidence</button>
                <button className="fd-btn">View Major Risk Detail</button>
                <button className="fd-btn fd-btn-danger">
                  Initiate Action
                </button>
              </div>
            </div>
            <table className="fd-risk-table">
              <thead>
                <tr>
                  <th>Major Risk</th>
                  <th>Priority</th>
                  <th>Cause Summaries</th>
                  <th>Suggested Actions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {majorRiskEvents.map((evt, i) => (
                  <tr key={i}>
                    <td>{evt.risk}</td>
                    <td>
                      <span className={`fd-priority ${evt.priorityClass}`}>
                        {evt.priority}
                      </span>
                    </td>
                    <td>{evt.cause}</td>
                    <td>{evt.action}</td>
                    <td>
                      <button className="fd-btn">View Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Governance Section */}
            <div className="fd-gov-section-header">
              <h2 className="fd-section-title" style={{ margin: 0 }}>
                Governance Section
              </h2>
              <div className="fd-risk-section-actions">
                <button className="fd-btn">View Related Person</button>
                <button className="fd-btn">View Related Aircraft</button>
                <button className="fd-btn">View Related Environment</button>
              </div>
            </div>
            <div className="fd-gov-cards">
              <div className="fd-gov-card">
                <div className="fd-gov-card-label">Responsible Department</div>
                <div className="fd-gov-card-value">Flight Operations</div>
              </div>
              <div className="fd-gov-card">
                <div className="fd-gov-card-label">Responsible Person</div>
                <div className="fd-gov-person">
                  <div className="fd-gov-avatar">SJ</div>
                  <div>
                    <div className="fd-gov-card-value">Sarah Jenkins</div>
                    <div className="fd-gov-card-sub">Senior Dispatcher</div>
                  </div>
                </div>
              </div>
              <div className="fd-gov-card">
                <div className="fd-gov-card-label">Latest Feedback</div>
                <div className="fd-gov-card-value">
                  Reroute planned and reviewed
                </div>
              </div>
              <div className="fd-gov-card">
                <div className="fd-gov-card-label">Latest Review</div>
                <div className="fd-gov-card-value">Oct 27, 2024 16:30</div>
              </div>
              <div className="fd-gov-card">
                <div className="fd-gov-card-label">
                  Current Work Order Status
                </div>
                <div className="fd-gov-card-value">
                  Work Order #WO-456
                  <span className="fd-pending-badge">Pending Approval</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "causes" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Cause Dimensions view coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
