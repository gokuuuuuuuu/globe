import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useLanguage } from "./i18n/useLanguage";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { FlightListPage } from "./pages/FlightListPage";
import { FlightDetailPage } from "./pages/FlightDetailPage";
import { FlightReportPage } from "./pages/FlightReportPage";
import { FactorExplanationPage } from "./pages/FactorExplanationPage";
import { EvidenceChainPage } from "./pages/EvidenceChainPage";
import { MajorRiskDetailPage } from "./pages/MajorRiskDetailPage";
import { AirportListPage } from "./pages/AirportListPage";
import { AirportDetailPage } from "./pages/AirportDetailPage";
import { AirportFlightsPage } from "./pages/AirportFlightsPage";
import { PersonnelListPage } from "./pages/PersonnelListPage";
import { PersonnelDetailPage } from "./pages/PersonnelDetailPage";
import { PersonnelTrendPage } from "./pages/PersonnelTrendPage";
import { PersonnelVsFleetPage } from "./pages/PersonnelVsFleetPage";
import { TrainingDataPage } from "./pages/TrainingDataPage";
import { HistoricalFlightsPage } from "./pages/HistoricalFlightsPage";
import { AircraftListPage } from "./pages/AircraftListPage";
import { AircraftDetailPage } from "./pages/AircraftDetailPage";
import { MaintenanceInfoPage } from "./pages/MaintenanceInfoPage";
import { EnvironmentDetailPage } from "./pages/EnvironmentDetailPage";
import { MessageDetailPage } from "./pages/MessageDetailPage";
import { NoticeDetailPage } from "./pages/NoticeDetailPage";
import { WorkOrderListPage } from "./pages/WorkOrderListPage";
import { WorkOrderDetailPage } from "./pages/WorkOrderDetailPage";
import { FeedbackReviewPage } from "./pages/FeedbackReviewPage";
import { StatisticalAnalysisPage } from "./pages/StatisticalAnalysisPage";
import { RiskFactorLibraryPage } from "./pages/RiskFactorLibraryPage";
import { SystemManagementPage } from "./pages/SystemManagementPage";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="risk-monitoring/flights"
              element={<FlightListPage />}
            />
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
            <Route
              path="risk-monitoring/major-risk-detail"
              element={<MajorRiskDetailPage />}
            />
            <Route
              path="airport-center/airport-list"
              element={<AirportListPage />}
            />
            <Route
              path="airport-center/airport-detail"
              element={<AirportDetailPage />}
            />
            <Route
              path="airport-center/airport-flights"
              element={<AirportFlightsPage />}
            />
            <Route
              path="personnel-center/personnel-list"
              element={<PersonnelListPage />}
            />
            <Route
              path="personnel-center/personnel-detail"
              element={<PersonnelDetailPage />}
            />
            <Route
              path="personnel-center/personnel-trend"
              element={<PersonnelTrendPage />}
            />
            <Route
              path="personnel-center/personnel-vs-fleet"
              element={<PersonnelVsFleetPage />}
            />
            <Route
              path="personnel-center/training-data"
              element={<TrainingDataPage />}
            />
            <Route
              path="personnel-center/historical-flights"
              element={<HistoricalFlightsPage />}
            />
            <Route
              path="aircraft-topic/aircraft-list"
              element={<AircraftListPage />}
            />
            <Route
              path="aircraft-topic/aircraft-detail"
              element={<AircraftDetailPage />}
            />
            <Route
              path="aircraft-topic/maintenance-info"
              element={<MaintenanceInfoPage />}
            />
            <Route
              path="environment-topic/environment-detail"
              element={<EnvironmentDetailPage />}
            />
            <Route
              path="environment-topic/message-detail"
              element={<MessageDetailPage />}
            />
            <Route
              path="environment-topic/notice-detail"
              element={<NoticeDetailPage />}
            />
            <Route
              path="governance/work-order-list"
              element={<WorkOrderListPage />}
            />
            <Route
              path="governance/work-order-detail"
              element={<WorkOrderDetailPage />}
            />
            <Route
              path="governance/feedback-review"
              element={<FeedbackReviewPage />}
            />
            <Route
              path="statistical-analysis"
              element={<StatisticalAnalysisPage />}
            />
            <Route
              path="knowledge-center"
              element={<RiskFactorLibraryPage />}
            />
            <Route
              path="system-management"
              element={<SystemManagementPage />}
            />
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

function PlaceholderPage() {
  const { t } = useLanguage();
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
        <p style={{ fontSize: 16, fontWeight: 500 }}>
          {t("页面建设中", "Page Under Construction")}
        </p>
        <p style={{ fontSize: 13, marginTop: 4 }}>
          {t("此功能正在开发中...", "This feature is being developed...")}
        </p>
      </div>
    </div>
  );
}

export default App;
