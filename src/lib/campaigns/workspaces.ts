import seedBundle from "../../../data/campaigns/initial-campaign-workspaces.json";
import discoveredBundle from "../../../data/campaigns/discovered-campaign-workspaces.json";
import type { CampaignColorTokens } from "./brandingProfile";
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
  dashboard_theme: RawDashboardTheme;
  notes?: string;
  is_active?: boolean;
  access_mode?: string;
  id?: string;
  default_volunteer_signup_url?: string | null;
  mobilize_org_url?: string | null;
  volunteer_brand_color?: string | null;
  volunteer_badge_label?: string | null;
  campaign_website_url?: string | null;
}

interface RawDashboardTheme {
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  heroTagline: string;
  logoInitials: string;
  badgeLabel: string;
  logoUrl?: string | null;
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
    dashboardTheme: {
      ...raw.dashboard_theme,
      logoUrl: raw.dashboard_theme.logoUrl ?? null,
    },
    notes: raw.notes,
    isActive: raw.is_active !== false,
    accessMode: raw.access_mode ?? "private_admin",
    googleCalendarStatus: "not_connected",
    mobilizeStatus: raw.mobilize_org_url ? "pending" : "not_connected",
    defaultVolunteerSignupUrl: raw.default_volunteer_signup_url ?? null,
    mobilizeOrgUrl: raw.mobilize_org_url ?? null,
    volunteerBrandColor: raw.volunteer_brand_color ?? null,
    volunteerBadgeLabel: raw.volunteer_badge_label ?? null,
    campaignWebsiteUrl: raw.campaign_website_url ?? null,
  };
}

function localWorkspaces(): CampaignWorkspace[] {
  const initial = (seedBundle as { workspaces?: RawWorkspace[] }).workspaces ?? [];
  const discovered = (discoveredBundle as { workspaces?: RawWorkspace[] }).workspaces ?? [];
  const bySlug = new Map<string, RawWorkspace>();
  for (const w of initial) bySlug.set(w.slug, w);
  for (const w of discovered) {
    if (!bySlug.has(w.slug)) bySlug.set(w.slug, w);
  }
  return [...bySlug.values()].map(mapWorkspace).filter((w) => w.isActive);
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
export function dashboardThemeVars(theme: DashboardTheme, colors?: CampaignColorTokens): Record<string, string> {
  const base = {
    "--campaign-primary": theme.primaryColor,
    "--campaign-accent": theme.accentColor,
    "--campaign-surface": theme.surfaceColor,
  };
  if (!colors) return base;
  return {
    ...base,
    "--campaign-brand-dark": colors.brandDark,
    "--campaign-brand-soft": colors.brandSoft,
    "--campaign-on-brand": colors.textOnBrand,
    "--campaign-on-soft": colors.textOnSoft,
    "--campaign-volunteer": colors.volunteerColor,
    "--campaign-on-volunteer": colors.textOnVolunteer,
  };
}
