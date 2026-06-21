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

function mapCountyRaw(raw: Record<string, unknown>): CountyIntelligenceDossier {
  const demo = raw.demographics as Record<string, unknown> | undefined;
  const pol = raw.political as Record<string, unknown> | undefined;
  const inst = raw.institutions as Record<string, unknown> | undefined;
  const med = raw.media as Record<string, unknown> | undefined;

  return {
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
    rollupVersion: (raw.rollup_version as number) ?? 1,
    feederCities: (raw.feeder_cities as string[]) ?? [],
    demographics: demo
      ? {
          population: (demo.population as number) ?? null,
          growthTrend: (demo.growth_trend as string) ?? null,
          ageDistribution: (demo.age_distribution as string) ?? null,
          income: (demo.income as string) ?? null,
          education: (demo.education as string) ?? null,
          housing: (demo.housing as string) ?? null,
          raceEthnicity: (demo.race_ethnicity as string) ?? null,
          employment: (demo.employment as string) ?? null,
          industry: (demo.industry as string) ?? null,
          migration: (demo.migration as string) ?? null,
        }
      : undefined,
    political: pol
      ? {
          sosTurnout: (pol.sos_turnout as string) ?? null,
          historicalTurnout: (pol.historical_turnout as string) ?? null,
          primaryTurnout: (pol.primary_turnout as string) ?? null,
          generalTurnout: (pol.general_turnout as string) ?? null,
          baselineVotes: (pol.baseline_votes as number) ?? null,
          voteTargets: (pol.vote_targets as number) ?? null,
          persuasionTargets: (pol.persuasion_targets as number) ?? null,
          turnoutTargets: (pol.turnout_targets as number) ?? null,
          voteDeficit: (pol.vote_deficit as number) ?? null,
          projectedVoteGain: (pol.projected_vote_gain as number) ?? null,
        }
      : undefined,
    institutions: inst
      ? {
          churches: (inst.churches as string[]) ?? [],
          schools: (inst.schools as string[]) ?? [],
          libraries: (inst.libraries as string[]) ?? [],
          colleges: (inst.colleges as string[]) ?? [],
          volunteerFireDepartments: (inst.volunteer_fire_departments as string[]) ?? [],
          rotary: (inst.rotary as string[]) ?? [],
          lions: (inst.lions as string[]) ?? [],
          kiwanis: (inst.kiwanis as string[]) ?? [],
          farmBureau: (inst.farm_bureau as string[]) ?? [],
          ffa: (inst.ffa as string[]) ?? [],
          fourH: (inst.four_h as string[]) ?? [],
          chambers: (inst.chambers as string[]) ?? [],
        }
      : undefined,
    media: med
      ? {
          newspapers: (med.newspapers as string[]) ?? [],
          radio: (med.radio as string[]) ?? [],
          facebookPages: (med.facebook_pages as string[]) ?? [],
          communityGroups: (med.community_groups as string[]) ?? [],
          newsletters: (med.newsletters as string[]) ?? [],
          podcasts: (med.podcasts as string[]) ?? [],
        }
      : undefined,
  };
}

function loadCounties(): CountyIntelligenceDossier[] {
  const bundle = countyBundle as { counties?: Record<string, unknown>[] };
  return (bundle.counties ?? []).map(mapCountyRaw);
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
