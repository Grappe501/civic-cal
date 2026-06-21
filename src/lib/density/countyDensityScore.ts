import type { CivicEvent } from "../types";
import type { EventCounts } from "./densityTypes";

const CHURCH_RE = /church|fish fry|spaghetti|bbq fundraiser|vbs|trunk or treat|congregation|parish/i;
const SCHOOL_RE = /school|homecoming|football|basketball|band|graduation|school board|athletic/i;
const FOOD_RE = /fish fry|spaghetti|dinner|meal|bbq|pancake/i;
const SPORT_RE = /football|basketball|5k|10k|race|marathon|game|tournament/i;
const FEST_RE = /festival|fair|parade|rodeo/i;

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").toLowerCase();
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function countCountyEvents(county: string, events: CivicEvent[]): EventCounts {
  const cNorm = normCounty(county);
  const countyEvents = events.filter((e) => e.county.toLowerCase() === cNorm);

  const institutionHosts = new Set<string>();
  for (const e of countyEvents) {
    if (e.hostOrganization) institutionHosts.add(e.hostOrganization.toLowerCase().slice(0, 24));
  }

  return {
    total: countyEvents.length,
    thisMonth: countyEvents.filter((e) => e.startAt && isThisMonth(e.startAt)).length,
    recurring: countyEvents.filter((e) => e.isRecurring || /annual|recurring/i.test(e.title)).length,
    churchTagged: countyEvents.filter((e) => CHURCH_RE.test(`${e.title} ${e.description ?? ""} ${e.hostOrganization ?? ""}`)).length,
    schoolTagged: countyEvents.filter((e) => SCHOOL_RE.test(`${e.title} ${e.description ?? ""} ${e.category ?? ""}`)).length,
    festivalParade: countyEvents.filter((e) => FEST_RE.test(e.title)).length,
    sports: countyEvents.filter((e) => SPORT_RE.test(`${e.title} ${e.description ?? ""}`)).length,
    food: countyEvents.filter((e) => FOOD_RE.test(e.title)).length,
    institutionsWithEvents: institutionHosts.size,
  };
}

export function computeCoverageScore(input: {
  institutionsTotal: number;
  eventsTotal: number;
  eventsThisMonth: number;
  institutionsWithEvents: number;
  recurringTraditions: number;
  volunteerOpportunities: number;
  sourceFeedsDiscovered: number;
  citiesInCounty: number;
  projectedFutureEvents: number;
}): number {
  const {
    institutionsTotal,
    eventsTotal,
    eventsThisMonth,
    institutionsWithEvents,
    recurringTraditions,
    volunteerOpportunities,
    sourceFeedsDiscovered,
    citiesInCounty,
    projectedFutureEvents,
  } = input;

  if (institutionsTotal === 0) return 0;

  const eventRatio = Math.min(1, eventsTotal / Math.max(12, institutionsTotal * 0.4));
  const institutionLinkRatio = Math.min(1, institutionsWithEvents / Math.max(3, institutionsTotal * 0.25));
  const monthActivity = Math.min(1, eventsThisMonth / 8);
  const traditionScore = Math.min(1, recurringTraditions / 5);
  const volunteerScore = Math.min(1, volunteerOpportunities / 3);
  const feedScore = citiesInCounty > 0 ? Math.min(1, sourceFeedsDiscovered / citiesInCounty) : 0;
  const projectionScore = Math.min(1, projectedFutureEvents / 50);

  const weighted =
    eventRatio * 28 +
    institutionLinkRatio * 22 +
    monthActivity * 12 +
    traditionScore * 12 +
    volunteerScore * 8 +
    feedScore * 10 +
    projectionScore * 8;

  return Math.round(Math.min(100, weighted));
}
