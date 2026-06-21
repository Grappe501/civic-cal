import datesBundle from "../../../data/state-dates/statewide-calendar-dates.json";
import registryBundle from "../../../data/state-dates/source-registry.json";

export type StateDateCategory =
  | "elections"
  | "voter_registration"
  | "early_voting"
  | "hunting_season"
  | "fishing_season"
  | "school_calendar"
  | "state_holiday"
  | "agriculture_fair_season"
  | "civic_deadline";

export interface StateCalendarDate {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
  category: StateDateCategory | string;
  subcategory?: string | null;
  sourceName: string;
  sourceUrl: string;
  appliesStatewide: boolean;
  county?: string | null;
  city?: string | null;
  notes?: string | null;
  seasonYear?: string | null;
  species?: string | null;
  method?: string | null;
  zone?: string | null;
  verificationStatus: "verified" | "needs_review" | "rejected";
}

function optionalString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function mapDate(d: (typeof datesBundle.dates)[number]): StateCalendarDate {
  const raw = d as Record<string, unknown>;
  return {
    id: d.id,
    title: d.title,
    date: d.date,
    endDate: optionalString(raw.end_date),
    category: d.category,
    subcategory: optionalString(raw.subcategory),
    sourceName: d.source_name,
    sourceUrl: d.source_url,
    appliesStatewide: d.applies_statewide ?? true,
    county: optionalString(raw.county),
    city: optionalString(raw.city),
    notes: optionalString(raw.notes),
    seasonYear: optionalString(raw.season_year),
    species: optionalString(raw.species),
    method: optionalString(raw.method),
    zone: optionalString(raw.zone),
    verificationStatus: d.verification_status as StateCalendarDate["verificationStatus"],
  };
}

export function listAllStateDates(includeUnverified = false): StateCalendarDate[] {
  return datesBundle.dates
    .map(mapDate)
    .filter((d) => includeUnverified || d.verificationStatus === "verified");
}

export interface StateDateFilters {
  category?: string;
  county?: string;
  from?: string;
  to?: string;
  verifiedOnly?: boolean;
}

export function filterStateDates(filters: StateDateFilters = {}): StateCalendarDate[] {
  let list = listAllStateDates(!filters.verifiedOnly);
  const from = filters.from ? new Date(filters.from) : new Date();
  from.setHours(0, 0, 0, 0);

  list = list.filter((d) => {
    const end = d.endDate ? new Date(d.endDate) : new Date(d.date);
    return end >= from;
  });

  if (filters.category) list = list.filter((d) => d.category === filters.category);
  if (filters.county) {
    list = list.filter((d) => d.appliesStatewide || d.county?.toLowerCase() === filters.county!.toLowerCase());
  }
  if (filters.to) {
    const to = new Date(filters.to);
    list = list.filter((d) => new Date(d.date) <= to);
  }

  return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function upcomingStateDates(limit = 8): StateCalendarDate[] {
  return filterStateDates({ verifiedOnly: true }).slice(0, limit);
}

export function stateDatesForCounty(county: string): StateCalendarDate[] {
  return filterStateDates({ county, verifiedOnly: true });
}

export function electionDates(): StateCalendarDate[] {
  return filterStateDates({ category: "elections", verifiedOnly: true });
}

export function huntingSeasonDates(includeUnverified = false): StateCalendarDate[] {
  return listAllStateDates(includeUnverified).filter((d) => d.category === "hunting_season");
}

export function fishingSeasonDates(): StateCalendarDate[] {
  return filterStateDates({ category: "fishing_season", verifiedOnly: true });
}

export function stateDateCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    elections: "Elections",
    voter_registration: "Voter registration",
    early_voting: "Early voting",
    hunting_season: "Hunting season",
    fishing_season: "Fishing season",
    school_calendar: "School calendar",
    state_holiday: "State holiday",
    agriculture_fair_season: "Fair season",
    civic_deadline: "Civic deadline",
  };
  return labels[cat] ?? cat.replace(/_/g, " ");
}

export function sourceRegistry() {
  return registryBundle.sources;
}

export function harvestTasks() {
  return registryBundle.harvest_tasks;
}

export function datesPolicy(): string {
  return datesBundle.policy;
}
