import { Link } from "react-router-dom";
import { CampaignDashboard } from "../components/campaigns/CampaignDashboard";
import type { CampaignWorkspace } from "../lib/campaigns/types";

const DEMO_WORKSPACE: CampaignWorkspace = {
  slug: "demo",
  campaignName: "Demo — Arkansas Civic Outreach",
  candidateName: "Sample Candidate",
  officeSought: "Statewide visibility (demo)",
  districtType: "statewide",
  districtName: "Central Arkansas sample",
  dashboardLabel: "Demo Command Center",
  counties: ["Conway", "Pulaski", "Faulkner", "Garland"],
  cities: ["Little Rock", "Morrilton", "Conway"],
  districtScope: {
    mode: "statewide",
    counties: ["Conway", "Pulaski", "Faulkner", "Garland"],
    cities: [],
    boundaryPrecision: "partial",
    boundaryNote: "Demo scope — subset of counties for testing",
  },
  dashboardTheme: {
    primaryColor: "#1B4332",
    accentColor: "#6B9080",
    surfaceColor: "#F5F0E6",
    heroTagline: "Explore the civic intelligence dashboard.",
    logoInitials: "Demo",
    badgeLabel: "Sandbox",
  },
  isActive: true,
  accessMode: "public_demo",
};

export function CampaignDemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/campaigns" className="text-sm text-ark-sage hover:underline">← All campaign dashboards</Link>
      <div className="mt-4">
        <CampaignDashboard workspace={DEMO_WORKSPACE} />
      </div>
    </div>
  );
}
