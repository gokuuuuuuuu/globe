import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { FlightListPage } from "./pages/FlightListPage";
import { FlightDetailPage } from "./pages/FlightDetailPage";
import { FlightReportPage } from "./pages/FlightReportPage";
import { FactorExplanationPage } from "./pages/FactorExplanationPage";
import { EvidenceChainPage } from "./pages/EvidenceChainPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<HomePage />} />
          <Route path="risk-monitoring/flights" element={<FlightListPage />} />
          <Route
            path="risk-monitoring/flight-detail"
            element={<FlightDetailPage />}
          />
          <Route
            path="risk-monitoring/flight-report"
            element={<FlightReportPage />}
          />
          <Route
            path="risk-monitoring/factor-explanation"
            element={<FactorExplanationPage />}
          />
          <Route
            path="risk-monitoring/evidence-chain"
            element={<EvidenceChainPage />}
          />
          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: "#0b1120",
        color: "#64748b",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Page Under Construction</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>
          This feature is being developed...
        </p>
      </div>
    </div>
  );
}

export default App;
