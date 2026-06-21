import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CountyPage, CountiesIndexPage } from "./pages/CountyPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { SubmitPage } from "./pages/SubmitPage";
import { ThisWeekPage, CivicWatchPage } from "./pages/IntelPages";
import { AdminPage } from "./pages/AdminPage";
import { MapPage } from "./pages/MapPage";
import { OrganizersPage } from "./pages/OrganizersPage";
import { OpportunityEnginePage } from "./pages/OpportunityEnginePage";
import { HelpBuildCalendarPage } from "./pages/HelpBuildCalendarPage";
import { CampaignsLandingPage } from "./pages/CampaignsLandingPage";
import { CampaignDemoPage } from "./pages/CampaignDemoPage";
import { CampaignWorkspacePage } from "./pages/CampaignWorkspacePage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/event/:slug" element={<EventDetailPage />} />
          <Route path="/counties" element={<CountiesIndexPage />} />
          <Route path="/county/:slug" element={<CountyPage />} />
          <Route path="/this-week" element={<ThisWeekPage />} />
          <Route path="/civic-watch" element={<CivicWatchPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/organizers" element={<OrganizersPage />} />
          <Route path="/opportunity-engine" element={<OpportunityEnginePage />} />
          <Route path="/help-build-the-calendar" element={<HelpBuildCalendarPage />} />
          <Route path="/campaigns" element={<CampaignsLandingPage />} />
          <Route path="/campaigns/demo" element={<CampaignDemoPage />} />
          <Route path="/campaigns/:slug" element={<CampaignWorkspacePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
