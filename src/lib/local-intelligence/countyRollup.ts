import type { CivicEvent } from "../types";
import type { CampaignEventPlan } from "../campaigns/types";
import { scoreEventForCampaign } from "../campaigns/eventIntel";
import type {
  CityIntelligenceDossier,
  CountyCandidateActivityRollup,
  CountyEventsRollup,
  CountyIntelligenceDossier,
  CountyRollupView,
} from "./types";
import { citiesInCounty } from "./registry";
import { buildCountyCommunityLayer, buildSportsHubSnapshot } from "../institutions/countyCommunityLayer";
import { buildCommunityAnchorsSnapshot } from "../institutions/communityAnchorEngine";

const INSTITUTION_CATALOG = [
  "Rotary",
  "Lions Club",
  "Kiwanis",
  "Farm Bureau",
  "FFA",
  "4-H",
  "Chamber of commerce",
  "Volunteer fire department",
] as const;

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function unionFromCities(cities: CityIntelligenceDossier[], key: keyof CityIntelligenceDossier): string[] {
  const out: string[] = [];
  for (const c of cities) {
    const val = c[key];
    if (Array.isArray(val)) out.push(...(val as string[]));
  }
  return unique(out);
}

function categorizeEvents(events: CivicEvent[]): CountyEventsRollup {
  const recurring: string[] = [];
  const flagship: string[] = [];
  const government: string[] = [];
  const church: string[] = [];
  const sports: string[] = [];
  const community: string[] = [];
  const festivals: string[] = [];
  const parades: string[] = [];
  const volunteer: string[] = [];
  const foodEvents: string[] = [];

  const foodPattern = /fish fry|spaghetti|wild game|chili cook|bbq cook|pancake breakfast|catfish|crawfish|pie contest|church supper|community meal/i;

  for (const e of events) {
    const label = `${e.title}${e.city ? ` · ${e.city}` : ""}`;
    if (e.isRecurring) recurring.push(label);
    if (e.featured || e.highCivicValue) flagship.push(label);
    if (e.category === "civic_meeting" || e.isPublicGovernmentMeeting) government.push(label);
    else if (e.category === "community_church" || e.category === "faith_meal") church.push(label);
    else if (e.category === "school") sports.push(label);
    else if (e.category === "volunteer") volunteer.push(label);
    else if (/parade/i.test(e.title)) parades.push(label);
    else if (/fair|festival|heritage|rodeo/i.test(e.title)) festivals.push(label);
    else community.push(label);
    if (foodPattern.test(`${e.title} ${e.description ?? ""}`) || e.category === "faith_meal") foodEvents.push(label);
  }

  return {
    upcomingCount: events.length,
    recurring: recurring.slice(0, 12),
    flagship: flagship.slice(0, 8),
    government: government.slice(0, 10),
    church: church.slice(0, 10),
    sports: sports.slice(0, 8),
    community: community.slice(0, 10),
    festivals: festivals.slice(0, 8),
    parades: parades.slice(0, 8),
    volunteer: volunteer.slice(0, 8),
    foodEvents: foodEvents.slice(0, 10),
  };
}

function buildCandidateActivity(
  events: CivicEvent[],
  plans: Record<string, CampaignEventPlan>,
): CountyCandidateActivityRollup {
  let attended = 0;
  let skipped = 0;
  let considering = 0;
  const coverage: string[] = [];

  for (const e of events) {
    const plan = plans[e.id];
    if (!plan) continue;
    if (plan.planStatus === "skip") skipped += 1;
    else if (["attending", "candidate_should_attend", "surrogate_should_attend"].includes(plan.planStatus)) {
      attended += 1;
      coverage.push(`Planned: ${e.title}`);
    } else if (plan.planStatus === "considering" || plan.planStatus === "needs_research") considering += 1;
  }

  const hasRd = events.some((e) => scoreEventForCampaign(e).relationshipDensityScore >= 60);

  return {
    attendedCount: attended,
    skippedCount: skipped,
    consideringCount: considering,
    volunteerActivityNotes: events.filter((e) => plans[e.id]?.needsVolunteers).map((e) => e.title).slice(0, 6),
    eventCoverageNotes: coverage.slice(0, 8),
    presenceMapAvailable: events.some((e) => e.latitude != null),
    relationshipDensityMapAvailable: hasRd,
  };
}

/** Merge static county dossier + city feeders + live events into County Rollup 2.0 view */
export function buildCountyRollupView(
  dossier: CountyIntelligenceDossier,
  events: CivicEvent[],
  plans: Record<string, CampaignEventPlan> = {},
): CountyRollupView {
  const cities = citiesInCounty(dossier.county);
  const countyEvents = events.filter((e) => e.county?.toLowerCase() === dossier.county.toLowerCase());
  const eventRollup = categorizeEvents(countyEvents);

  // Enrich static institutions from city feeders when registry block is sparse
  const institutions = dossier.institutions ?? {
    churches: unionFromCities(cities, "churches"),
    schools: unionFromCities(cities, "schools"),
    libraries: [`${dossier.county} County public library — verify`],
    colleges: [],
    volunteerFireDepartments: [`${dossier.county} County VFD — verify roster`],
    rotary: [`${dossier.county} Rotary — verify chapter`],
    lions: [],
    kiwanis: [],
    farmBureau: [`${dossier.county} Farm Bureau — verify`],
    ffa: [`${dossier.county} FFA chapters — verify`],
    fourH: [`${dossier.county} 4-H — verify`],
    chambers: unionFromCities(cities, "civicInstitutions").filter((x) => /chamber/i.test(x)),
  };

  const enriched: CountyIntelligenceDossier = {
    ...dossier,
    feederCities: cities.map((c) => c.city),
    institutions,
    media: dossier.media ?? {
      newspapers: unionFromCities(cities, "localMedia"),
      radio: [`${dossier.county} County radio — verify`],
      facebookPages: [],
      communityGroups: [],
      newsletters: [],
      podcasts: [],
    },
    demographics: dossier.demographics ?? {
      population: dossier.population ?? cities.reduce((s, c) => s + (c.population ?? 0), 0),
      growthTrend: "Census ACS trend — pending import",
      ageDistribution: cities[0]?.ageProfile ?? "Verify ACS age cohorts",
      income: cities[0]?.incomeProfile ?? "Median household income — ACS pending",
      education: cities[0]?.educationProfile ?? "Education attainment — ACS pending",
      housing: "Housing tenure / affordability — ACS pending",
      raceEthnicity: "Race/ethnicity composition — ACS pending",
      employment: dossier.employmentProfile,
      industry: (dossier.economicDrivers ?? []).join("; ") || "Industry mix — BLS QCEW pending",
      migration: "Net migration — Census pending",
    },
    political: dossier.political ?? {
      sosTurnout: "SOS historical turnout — pending import",
      historicalTurnout: "Prior cycle turnout — pending",
      primaryTurnout: "Primary turnout — pending",
      generalTurnout: "General turnout — pending",
      baselineVotes: dossier.priorSosBaseline,
      voteTargets: dossier.targetVotes,
      persuasionTargets: cities.reduce((s, c) => s + (c.persuasionGap ?? 0), 0) || null,
      turnoutTargets: cities.reduce((s, c) => s + (c.turnoutGap ?? 0), 0) || null,
      voteDeficit:
        dossier.priorSosBaseline != null && dossier.targetVotes != null
          ? dossier.targetVotes - dossier.priorSosBaseline
          : null,
      projectedVoteGain: null,
    },
  };

  return {
    dossier: enriched,
    cities,
    events: eventRollup,
    candidateActivity: buildCandidateActivity(countyEvents, plans),
    communityLayer: buildCountyCommunityLayer(
      dossier.county,
      cities.length,
      events,
      dossier.recurringTraditions ?? [],
    ),
    sportsHub: buildSportsHubSnapshot(dossier.county, events),
    communityAnchors: buildCommunityAnchorsSnapshot(dossier.county, events),
  };
}

export function institutionsNotYetInCalendar(
  institutions: CountyRollupView["dossier"]["institutions"],
  events: CountyEventsRollup,
): string[] {
  if (!institutions) return [];
  const eventText = JSON.stringify(events).toLowerCase();
  const gaps: string[] = [];
  for (const inst of INSTITUTION_CATALOG) {
    const key = inst.toLowerCase().split(" ")[0];
    if (!eventText.includes(key)) gaps.push(`${inst} events not indexed`);
  }
  return gaps.slice(0, 6);
}
