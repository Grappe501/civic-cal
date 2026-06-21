import type { CampaignWorkspace } from "./types";
import { contrastRatio, darkenHex, isLightBackground, lightenHex, pickReadableText } from "../contrast";

export interface CampaignBrandingProfile {
  heroSubtitle: string;
  scopeCardTitle: string;
  scopeCardBody: string;
  priorityLaneTitle: string;
  priorityLaneItems: string[];
  whereToBeTitle: string;
  whereToBeBody: string;
  accentPattern?: string;
}

/** Readable campaign color tokens — use for badges, heroes, and dashboards. */
export interface CampaignColorTokens {
  brandColor: string;
  brandDark: string;
  brandSoft: string;
  textOnBrand: string;
  textOnSoft: string;
  volunteerColor: string;
  textOnVolunteer: string;
  /** Hero gradient using darkened brand stops (accent stays off the text band). */
  heroGradient: string;
}

const PROFILES: Record<string, CampaignBrandingProfile> = {
  "kelly-grappe-sos": {
    heroSubtitle: "Statewide command center for election integrity, voter access, and civic trust.",
    scopeCardTitle: "Statewide scope",
    scopeCardBody: "All 75 counties · Secretary of State jurisdiction · every vote counted.",
    priorityLaneTitle: "Election integrity priority lane",
    priorityLaneItems: [
      "County quorum courts & election commission meetings",
      "Voter registration drives & civic education forums",
      "Community access events in underserved counties",
      "High-trust church & civic dinners statewide",
    ],
    whereToBeTitle: "This is where your campaign should be",
    whereToBeBody:
      "Kelly's statewide mandate means showing up where Arkansans decide trust — county courthouses, community dinners, and access events that prove every vote counts.",
    accentPattern: "statewide-grid",
  },
  "chris-jones-ar02": {
    heroSubtitle: "Central Arkansas district intelligence — inside, near, and worth the trip.",
    scopeCardTitle: "Congressional District 2",
    scopeCardBody: "Pulaski · Lonoke · Faulkner · Saline · Jefferson · and AR-02 communities.",
    priorityLaneTitle: "District opportunity lane",
    priorityLaneItems: [
      "Inside-district church dinners & chamber breakfasts",
      "School board & city council in core counties",
      "Rivalry games & homecoming in district schools",
      "Near-district festivals worth the drive",
    ],
    whereToBeTitle: "This is where your campaign should be",
    whereToBeBody:
      "AR-02 wins on relationship density — show up inside the district first, then near-border high-value events that pull voters across county lines.",
    accentPattern: "district-band",
  },
  "fred-love-governor": {
    heroSubtitle: "All-Arkansas movement map — regional opportunity from Delta to Ozarks.",
    scopeCardTitle: "Governor · statewide",
    scopeCardBody: "Regional breakdown across Northwest, River Valley, Central, Delta, and South.",
    priorityLaneTitle: "Movement-building lane",
    priorityLaneItems: [
      "County fairs & heritage festivals in every region",
      "Farm Bureau, Rotary, and VFD fundraisers",
      "Quorum courts in underserved Delta counties",
      "School & sports traditions that define towns",
    ],
    whereToBeTitle: "This is where your campaign should be",
    whereToBeBody:
      "A governor's race is won in the places outsiders skip — fish fries in Phillips County, livestock shows in Boone, and chamber breakfasts in every region.",
    accentPattern: "statewide-movement",
  },
  "eduardo-guzman-senate": {
    heroSubtitle: "Fort Smith & River Valley — local relationship density is the path to SD-27.",
    scopeCardTitle: "State Senate District 27",
    scopeCardBody: "Sebastian · Crawford · Franklin · Logan · and River Valley communities.",
    priorityLaneTitle: "River Valley relationship lane",
    priorityLaneItems: [
      "Fort Smith chamber & civic breakfasts",
      "Church dinners & parish fundraisers",
      "School board & city council in Sebastian County",
      "Van Buren / Crawford community traditions",
    ],
    whereToBeTitle: "This is where your campaign should be",
    whereToBeBody:
      "SD-27 is relationship-first politics — the people who show up at VFW fish fries and school homecomings are the people who decide Senate races.",
    accentPattern: "river-valley",
  },
  "joshua-irby-sd16": {
    heroSubtitle: "Saline, Benton, Bryant — Senate District 16 civic calendar command.",
    scopeCardTitle: "State Senate District 16",
    scopeCardBody: "Saline · Pulaski partial · Bryant · Benton · and surrounding communities.",
    priorityLaneTitle: "Saline County priority lane",
    priorityLaneItems: [
      "Bryant & Benton school events & rivalries",
      "Saline County church dinners & fundraisers",
      "City council & quorum court in district",
      "Chamber breakfasts in growing suburbs",
    ],
    whereToBeTitle: "This is where your campaign should be",
    whereToBeBody:
      "SD-16 is won in the suburbs and small towns where people know each other — church parking lots, booster clubs, and city hall.",
    accentPattern: "saline-suburban",
  },
  "wendy-peer-house": {
    heroSubtitle: "Common sense leadership for Fort Smith families — HD-50.",
    scopeCardTitle: "State House District 50",
    scopeCardBody: "Fort Smith · Sebastian County · community anchors from Mercy/Baptist to Creekmore Park.",
    priorityLaneTitle: "Local legislative priority lane",
    priorityLaneItems: [
      "Fort Smith & Van Buren city council meetings",
      "River Valley church dinners & community fundraisers",
      "School board meetings in Sebastian County",
      "Chamber breakfasts & VFD fish fries",
    ],
    whereToBeTitle: "This is where your campaign should be",
    whereToBeBody:
      "A state representative wins by showing up where neighbors gather — parish halls, booster clubs, and the events that never make Facebook.",
    accentPattern: "river-valley-legislative",
  },
};

export function getCampaignBranding(slug: string, workspace: CampaignWorkspace): CampaignBrandingProfile {
  return (
    PROFILES[slug] ?? {
      heroSubtitle: workspace.dashboardTheme.heroTagline,
      scopeCardTitle: workspace.districtName,
      scopeCardBody: `${workspace.counties.length} counties · ${workspace.cities.slice(0, 4).join(", ")}`,
      priorityLaneTitle: "Event priority lane",
      priorityLaneItems: ["Government meetings", "Community church events", "School & sports", "Festivals & fairs"],
      whereToBeTitle: "This is where your campaign should be",
      whereToBeBody: "Focus on high relationship-density events inside your district scope.",
    }
  );
}

/** Per-campaign contrast-safe color overrides (light accents stay off hero text). */
const COLOR_OVERRIDES: Partial<Record<string, Partial<CampaignColorTokens>>> = {
  "joshua-irby-sd16": {
    brandDark: "#152a45",
    volunteerColor: "#1E3A5F",
    textOnVolunteer: "#FFFFFF",
  },
  "wendy-peer-house": {
    volunteerColor: "#C45A1F",
    textOnVolunteer: "#FFFFFF",
  },
};

export function resolveCampaignColors(workspace: CampaignWorkspace): CampaignColorTokens {
  const theme = workspace.dashboardTheme;
  const brandColor = theme.primaryColor;
  let brandDark = darkenHex(brandColor, isLightBackground(brandColor) ? 0.35 : 0.18);
  const accentDark = darkenHex(theme.accentColor, isLightBackground(theme.accentColor) ? 0.4 : 0.12);
  if (contrastRatio("#FFFFFF", brandDark) < 4.5) brandDark = darkenHex(brandColor, 0.35);

  const brandSoft = lightenHex(theme.surfaceColor, 0.02);
  const volunteerRaw =
    workspace.volunteerBrandColor?.trim() ||
    (isLightBackground(theme.accentColor) ? accentDark : theme.accentColor);
  let volunteerColor = volunteerRaw;
  let textOnVolunteer = pickReadableText(volunteerColor);
  if (contrastRatio(textOnVolunteer, volunteerColor) < 4.5) {
    volunteerColor = isLightBackground(volunteerRaw) ? accentDark : darkenHex(volunteerRaw, 0.15);
    textOnVolunteer = pickReadableText(volunteerColor);
  }

  const tokens: CampaignColorTokens = {
    brandColor,
    brandDark,
    brandSoft,
    textOnBrand: pickReadableText(brandDark),
    textOnSoft: pickReadableText(brandSoft, { minRatio: 4.5, dark: "#1A1F2E" }),
    volunteerColor,
    textOnVolunteer,
    heroGradient: `linear-gradient(135deg, ${brandDark} 0%, ${brandColor} 72%, ${accentDark} 100%)`,
  };

  const override = COLOR_OVERRIDES[workspace.slug];
  if (override) Object.assign(tokens, override);

  tokens.textOnBrand = pickReadableText(brandDark);
  if (override?.textOnVolunteer) tokens.textOnVolunteer = override.textOnVolunteer;

  return tokens;
}
