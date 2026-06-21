import seedBundle from "../../../data/campaigns/initial-campaign-workspaces.json";
import type { CampaignWorkspace, DashboardTheme, DistrictScope } from "./types";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

interface RawWorkspace {
  slug: string;
  campaign_name: string;
  candidate_name: string;
  office_sought: string;
  district_type: CampaignWorkspace["districtType"];
  district_name: string;
  dashboard_label: string;
  counties: string[];
  cities: string[];
  district_scope: DistrictScope;
  dashboard_theme: DashboardTheme;
  notes?: string;
  is_active?: boolean;
  access_mode?: string;
  id?: string;
}

function mapWorkspace(raw: RawWorkspace): CampaignWorkspace {
  return {
    id: raw.id,
    slug: raw.slug,
    campaignName: raw.campaign_name,
    candidateName: raw.candidate_name,
    officeSought: raw.office_sought,
    districtType: raw.district_type,
    districtName: raw.district_name,
    dashboardLabel: raw.dashboard_label,
    counties: raw.counties ?? [],
    cities: raw.cities ?? [],
    districtScope: raw.district_scope,
    dashboardTheme: raw.dashboard_theme,
    notes: raw.notes,
    isActive: raw.is_active !== false,
    accessMode: raw.access_mode ?? "private_admin",
    googleCalendarStatus: "not_connected",
    mobilizeStatus: "not_connected",
  };
}

function localWorkspaces(): CampaignWorkspace[] {
  const bundle = seedBundle as { workspaces?: RawWorkspace[] };
  return (bundle.workspaces ?? []).map(mapWorkspace).filter((w) => w.isActive);
}

export function getWorkspaceBySlug(slug: string): CampaignWorkspace | null {
  return localWorkspaces().find((w) => w.slug === slug) ?? null;
}

export function listCampaignWorkspaces(): CampaignWorkspace[] {
  return localWorkspaces();
}

export async function fetchCampaignWorkspaces(): Promise<CampaignWorkspace[]> {
  try {
    const res = await fetch(`${fnBase}/campaign-workspaces`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    if (data.workspaces?.length) return data.workspaces as CampaignWorkspace[];
  } catch (_) {}
  return localWorkspaces();
}

export async function fetchCampaignWorkspaceBySlug(slug: string): Promise<CampaignWorkspace | null> {
  try {
    const res = await fetch(`${fnBase}/campaign-workspaces?slug=${encodeURIComponent(slug)}`);
    if (res.status === 404) return getWorkspaceBySlug(slug);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return (data.workspace as CampaignWorkspace) ?? getWorkspaceBySlug(slug);
  } catch (_) {
    return getWorkspaceBySlug(slug);
  }
}

/** Apply CSS variables for branded dashboard shell */
export function dashboardThemeVars(theme: DashboardTheme): Record<string, string> {
  return {
    "--campaign-primary": theme.primaryColor,
    "--campaign-accent": theme.accentColor,
    "--campaign-surface": theme.surfaceColor,
  };
}
