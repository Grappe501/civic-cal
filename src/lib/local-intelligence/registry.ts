import topCityBundle from "../../../data/local-intelligence/top-city-dossiers.json";
import countyBundle from "../../../data/local-intelligence/county-dossiers.json";
import sosTargetsBundle from "../../../data/local-intelligence/sos-election-targets.json";
import type {
  CityIntelligenceDossier,
  CountyIntelligenceDossier,
  SosElectionTarget,
} from "./types";

interface RawCity {
  city: string;
  county: string;
  region: string;
  priority_rank: number;
  population?: number | null;
  demographics_summary?: string | null;
  age_profile?: string | null;
  income_profile?: string | null;
  employment_profile?: string | null;
  education_profile?: string | null;
  major_employers?: string[];
  civic_institutions?: string[];
  churches?: string[];
  schools?: string[];
  recurring_events?: string[];
  local_media?: string[];
  political_notes?: string | null;
  sos_baseline_votes?: number | null;
  sos_target_votes?: number | null;
  persuasion_gap?: number | null;
  turnout_gap?: number | null;
  opportunity_notes?: string | null;
  confidence_score?: number;
  source_links?: { label: string; url: string; type?: string }[];
}

function mapCity(raw: RawCity): CityIntelligenceDossier {
  return {
    city: raw.city,
    county: raw.county,
    region: raw.region,
    priorityRank: raw.priority_rank,
    population: raw.population,
    demographicsSummary: raw.demographics_summary,
    ageProfile: raw.age_profile,
    incomeProfile: raw.income_profile,
    employmentProfile: raw.employment_profile,
    educationProfile: raw.education_profile,
    majorEmployers: raw.major_employers ?? [],
    civicInstitutions: raw.civic_institutions ?? [],
    churches: raw.churches ?? [],
    schools: raw.schools ?? [],
    recurringEvents: raw.recurring_events ?? [],
    localMedia: raw.local_media ?? [],
    politicalNotes: raw.political_notes,
    sosBaselineVotes: raw.sos_baseline_votes,
    sosTargetVotes: raw.sos_target_votes,
    persuasionGap: raw.persuasion_gap,
    turnoutGap: raw.turnout_gap,
    opportunityNotes: raw.opportunity_notes,
    confidenceScore: raw.confidence_score ?? 20,
    sourceLinks: raw.source_links ?? [],
  };
}

function loadCities(): CityIntelligenceDossier[] {
  const bundle = topCityBundle as { cities?: RawCity[] };
  return (bundle.cities ?? []).map(mapCity);
}

function loadCounties(): CountyIntelligenceDossier[] {
  const bundle = countyBundle as {
    counties?: Record<string, unknown>[];
  };
  return (bundle.counties ?? []).map((raw) => ({
    county: String(raw.county),
    region: String(raw.region || "Arkansas"),
    countySeat: (raw.county_seat as string) || null,
    population: (raw.population as number) ?? null,
    demographicsSummary: (raw.demographics_summary as string) || null,
    employmentProfile: (raw.employment_profile as string) || null,
    economicDrivers: (raw.economic_drivers as string[]) ?? [],
    majorTowns: (raw.major_towns as string[]) ?? [],
    civicCalendarSources: (raw.civic_calendar_sources as string[]) ?? [],
    recurringTraditions: (raw.recurring_traditions as string[]) ?? [],
    priorSosBaseline: (raw.prior_sos_baseline as number) ?? null,
    targetVotes: (raw.target_votes as number) ?? null,
    winPathNotes: (raw.win_path_notes as string) || null,
    confidenceScore: (raw.confidence_score as number) ?? 15,
    sourceLinks: (raw.source_links as { label: string; url: string }[]) ?? [],
  }));
}

export function citySlug(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function cityFromSlug(slug: string): CityIntelligenceDossier | undefined {
  return loadCities().find((c) => citySlug(c.city) === slug.toLowerCase());
}

export function getCityDossier(cityName: string): CityIntelligenceDossier | undefined {
  const norm = cityName.toLowerCase();
  return loadCities().find((c) => c.city.toLowerCase() === norm);
}

export function getCountyDossier(countyName: string): CountyIntelligenceDossier | undefined {
  const norm = countyName.replace(/\s+County$/i, "").toLowerCase();
  return loadCounties().find((c) => c.county.toLowerCase() === norm);
}

export function countyFromSlugLocal(slug: string): CountyIntelligenceDossier | undefined {
  const norm = slug.toLowerCase().replace(/-/g, " ");
  return loadCounties().find((c) => c.county.toLowerCase().replace(/\s+/g, " ") === norm || c.county.toLowerCase().replace(/\s+/g, "-") === slug);
}

export function listCityDossiers(limit = 250): CityIntelligenceDossier[] {
  return loadCities().slice(0, limit);
}

export function listCountyDossiers(): CountyIntelligenceDossier[] {
  return loadCounties();
}

export function listSosTargets(): SosElectionTarget[] {
  const bundle = sosTargetsBundle as { targets?: SosElectionTarget[] };
  return bundle.targets ?? [];
}

export function getSosTargetForCity(city: string, county: string): SosElectionTarget | undefined {
  const targets = listSosTargets();
  return (
    targets.find((t) => t.geographyType === "city" && t.geographyName.toLowerCase() === city.toLowerCase()) ||
    targets.find((t) => t.geographyType === "county" && t.geographyName.toLowerCase() === county.toLowerCase())
  );
}

export function citiesInCounty(county: string): CityIntelligenceDossier[] {
  const norm = county.replace(/\s+County$/i, "").toLowerCase();
  return loadCities().filter((c) => c.county.toLowerCase() === norm);
}

export function voteTargetGap(dossier: CityIntelligenceDossier | CountyIntelligenceDossier): number | null {
  const baseline =
    "sosBaselineVotes" in dossier && dossier.sosBaselineVotes != null
      ? dossier.sosBaselineVotes
      : "priorSosBaseline" in dossier
        ? dossier.priorSosBaseline
        : null;
  const target =
    "sosTargetVotes" in dossier && dossier.sosTargetVotes != null
      ? dossier.sosTargetVotes
      : "targetVotes" in dossier
        ? dossier.targetVotes
        : null;
  if (baseline == null || target == null) return null;
  return target - baseline;
}
