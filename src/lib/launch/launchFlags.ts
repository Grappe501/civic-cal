/**
 * Pre-launch public surface flags — routes stay built; nav/CTAs gated.
 * Set VITE_SHOW_* env vars to "true" to re-enable individual surfaces.
 */
function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = import.meta.env[name];
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return defaultValue;
}

export const launchFlags = {
  showDiscoverNav: envFlag("VITE_SHOW_DISCOVER_NAV", false),
  showExploreNav: envFlag("VITE_SHOW_EXPLORE_NAV", false),
  showMapNav: envFlag("VITE_SHOW_MAP_NAV", false),
  showStudentServicesNav: envFlag("VITE_SHOW_STUDENT_SERVICES_NAV", false),
  showOrganizationsNav: envFlag("VITE_SHOW_ORGANIZATIONS_NAV", false),
  showRacesNav: envFlag("VITE_SHOW_RACES_NAV", false),
  showCampaignWorkspacesNav: envFlag("VITE_SHOW_CAMPAIGN_WORKSPACES_NAV", false),
  showHomepageMap: envFlag("VITE_SHOW_HOMEPAGE_MAP", false),
  showHomepageIntentSearch: envFlag("VITE_SHOW_HOMEPAGE_INTENT_SEARCH", false),
  /** Republican county party meetings hidden from public calendar until explicitly enabled. */
  showRepublicanPartyMeetings: envFlag("VITE_SHOW_REPUBLICAN_PARTY_MEETINGS", false),
} as const;

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim());
}

export function shouldShowHomepageMap(): boolean {
  return launchFlags.showHomepageMap && hasGoogleMapsApiKey();
}

export function isPreLaunchPublicMode(): boolean {
  return !launchFlags.showDiscoverNav && !launchFlags.showExploreNav && !launchFlags.showMapNav;
}
