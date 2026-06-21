import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { SafariPage } from "./pages/SafariPage";
import { RaceCircuitPage } from "./pages/RaceCircuitPage";
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
import { CampaignCityIntelPage } from "./pages/CampaignCityIntelPage";
import { CampaignCountyIntelPage } from "./pages/CampaignCountyIntelPage";
import { DistrictEnginePage } from "./pages/DistrictEnginePage";
import { CityPage } from "./pages/CityPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { OrganizationsIndexPage } from "./pages/OrganizationsIndexPage";
import { HostPortalPage } from "./pages/HostPortalPage";
import { HostDashboardPage } from "./pages/HostDashboardPage";
import { StudentServicePage } from "./pages/StudentServicePage";
import { StateDatesPage } from "./pages/StateDatesPage";
import {
  CalendarDayPage,
  CalendarIndexPage,
  CalendarMonthPage,
  CalendarWeekPage,
} from "./components/calendar/CalendarShell";
import { AdminDataHealthPage } from "./pages/AdminDataHealthPage";
import { AdminDensityPage } from "./pages/AdminDensityPage";
import { AdminFeedCoveragePage } from "./pages/AdminFeedCoveragePage";
import { AdminAutogrowPage } from "./pages/AdminAutogrowPage";
import { GeoResolverPage } from "./pages/GeoResolverPage";
import { EntityProfilePage } from "./pages/EntityProfilePage";
import { EntityDirectoryPage } from "./pages/EntityDirectoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/safari" element={<SafariPage />} />
          <Route path="/races" element={<RaceCircuitPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/event/:slug" element={<EventDetailPage />} />
          <Route path="/counties" element={<CountiesIndexPage />} />
          <Route path="/county/:slug" element={<CountyPage />} />
          <Route path="/city/:slug" element={<CityPage />} />
          <Route path="/organization/:slug" element={<OrganizationPage />} />
          <Route path="/organizations" element={<OrganizationsIndexPage />} />
          <Route path="/host" element={<HostPortalPage />} />
          <Route path="/host/dashboard" element={<HostDashboardPage />} />
          <Route path="/this-week" element={<ThisWeekPage />} />
          <Route path="/civic-watch" element={<CivicWatchPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/organizers" element={<OrganizersPage />} />
          <Route path="/opportunity-engine" element={<OpportunityEnginePage />} />
          <Route path="/help-build-the-calendar" element={<HelpBuildCalendarPage />} />
          <Route path="/district-engine" element={<DistrictEnginePage />} />
          <Route path="/campaigns" element={<CampaignsLandingPage />} />
          <Route path="/campaigns/demo" element={<CampaignDemoPage />} />
          <Route path="/campaigns/:slug" element={<CampaignWorkspacePage />} />
          <Route path="/campaigns/:slug/city/:citySlug" element={<CampaignCityIntelPage />} />
          <Route path="/campaigns/:slug/county/:countySlug" element={<CampaignCountyIntelPage />} />
          <Route path="/student-service" element={<StudentServicePage />} />
          <Route path="/calendar/dates" element={<StateDatesPage />} />
          <Route path="/calendar/day" element={<CalendarDayPage />} />
          <Route path="/calendar/week" element={<CalendarWeekPage />} />
          <Route path="/calendar/month" element={<CalendarMonthPage />} />
          <Route path="/calendar" element={<CalendarIndexPage />} />
          <Route path="/churches" element={<EntityDirectoryPage entityType="church" title="Arkansas churches" description="Church profiles linked to community events, meals, and fundraisers — sourced where verified." canonicalPath="/churches" />} />
          <Route path="/schools" element={<EntityDirectoryPage entityType="school" title="Arkansas schools" description="Public school profiles with calendar ties, board meeting sources, and student-service opportunities where verified." canonicalPath="/schools" />} />
          <Route path="/colleges" element={<EntityDirectoryPage entityType="college" title="Arkansas colleges" description="College and university community profiles across Arkansas." canonicalPath="/colleges" />} />
          <Route path="/festivals" element={<EntityDirectoryPage entityType="festival" title="Arkansas festivals" description="Recurring festival traditions — confirm dates annually from official sources." canonicalPath="/festivals" />} />
          <Route path="/parades" element={<EntityDirectoryPage entityType="parade" title="Arkansas parades" description="Community parade traditions indexed from calendar and registry sources." canonicalPath="/parades" />} />
          <Route path="/volunteer-opportunities" element={<EntityDirectoryPage entityType="volunteer_opportunity" title="Volunteer opportunities" description="Student-service eligible and community volunteer roles with verification notes." canonicalPath="/volunteer-opportunities" />} />
          <Route path="/dates" element={<EntityDirectoryPage entityType="state_date" title="Important Arkansas dates" description="Statewide and regional dates that shape community calendars — elections, tax deadlines, and civic milestones." canonicalPath="/dates" />} />
          <Route path="/church/:slug" element={<EntityProfilePage entityType="church" />} />
          <Route path="/school/:slug" element={<EntityProfilePage entityType="school" />} />
          <Route path="/college/:slug" element={<EntityProfilePage entityType="college" />} />
          <Route path="/candidate/:slug" element={<EntityProfilePage entityType="candidate" />} />
          <Route path="/race/:slug" element={<EntityProfilePage entityType="race" />} />
          <Route path="/festival/:slug" element={<EntityProfilePage entityType="festival" />} />
          <Route path="/parade/:slug" element={<EntityProfilePage entityType="parade" />} />
          <Route path="/volunteer/:slug" element={<EntityProfilePage entityType="volunteer_opportunity" />} />
          <Route path="/date/:slug" element={<EntityProfilePage entityType="state_date" />} />
          <Route path="/admin/data-health" element={<AdminDataHealthPage />} />
          <Route path="/admin/density" element={<AdminDensityPage />} />
          <Route path="/admin/feeds" element={<AdminFeedCoveragePage />} />
          <Route path="/admin/autogrow" element={<AdminAutogrowPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/:slug" element={<GeoResolverPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
