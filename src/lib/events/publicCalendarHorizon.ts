import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CivicEvent } from "../types";
import { DEFAULT_EVENT_TIMEZONE } from "./eventArchive";

/** Last day shown on the public calendar during pre-election hold (inclusive). */
export const ELECTION_CALENDAR_LAST_DAY = "2026-11-03";

/** On/after this date, events after the election horizon may publish publicly. */
export const POST_ELECTION_CALENDAR_RELEASE_DAY = "2026-09-01";

export function eventLocalDayKey(
  event: Pick<CivicEvent, "startAt" | "timezone">,
): string | null {
  if (!event.startAt) return null;
  const tz = event.timezone || DEFAULT_EVENT_TIMEZONE;
  return formatInTimeZone(parseISO(event.startAt), tz, "yyyy-MM-dd");
}

/** Events starting strictly after election day (Nov 4+). */
export function isEventAfterElectionHorizon(
  event: Pick<CivicEvent, "startAt" | "timezone">,
): boolean {
  const day = eventLocalDayKey(event);
  if (!day) return false;
  return day > ELECTION_CALENDAR_LAST_DAY;
}

/** Events on or before the election horizon (now → Nov 3 window). */
export function isEventWithinElectionHorizon(
  event: Pick<CivicEvent, "startAt" | "timezone">,
): boolean {
  const day = eventLocalDayKey(event);
  if (!day) return false;
  return day <= ELECTION_CALENDAR_LAST_DAY;
}

/**
 * Post-election calendar content is compiled but withheld until September release.
 * Override with VITE_HOLD_POST_ELECTION_CALENDAR=true|false.
 */
export function isPostElectionCalendarHoldActive(now: Date = new Date()): boolean {
  const env = import.meta.env.VITE_HOLD_POST_ELECTION_CALENDAR;
  if (env === "false" || env === "0") return false;
  if (env === "true" || env === "1") return true;
  const release = parseISO(`${POST_ELECTION_CALENDAR_RELEASE_DAY}T00:00:00`);
  return now.getTime() < release.getTime();
}

export function isEventHeldForPostElectionRelease(
  event: Pick<CivicEvent, "startAt" | "timezone">,
  now: Date = new Date(),
): boolean {
  return isEventAfterElectionHorizon(event) && isPostElectionCalendarHoldActive(now);
}

export interface CountyHorizonCounts {
  county: string;
  /** Approved events from today through Nov 3 (public window). */
  visibleWindow: number;
  /** Approved events after Nov 3 — compiled, held until September release. */
  heldPostElection: number;
  /** Total approved in catalog for this county (any date). */
  totalApproved: number;
}

export function summarizeCountyEventHorizon(
  events: CivicEvent[],
  now: Date = new Date(),
): CountyHorizonCounts[] {
  const todayKey = formatInTimeZone(now, DEFAULT_EVENT_TIMEZONE, "yyyy-MM-dd");
  const byCounty = new Map<string, CountyHorizonCounts>();

  for (const event of events) {
    if ((event.status ?? "approved") !== "approved") continue;
    const county = event.county || "Unknown";
    const row = byCounty.get(county) ?? {
      county,
      visibleWindow: 0,
      heldPostElection: 0,
      totalApproved: 0,
    };
    row.totalApproved++;

    const day = eventLocalDayKey(event);
    if (!day) {
      byCounty.set(county, row);
      continue;
    }

    if (day >= todayKey && day <= ELECTION_CALENDAR_LAST_DAY) {
      row.visibleWindow++;
    }
    if (isEventAfterElectionHorizon(event)) {
      row.heldPostElection++;
    }

    byCounty.set(county, row);
  }

  return [...byCounty.values()].sort((a, b) => b.visibleWindow - a.visibleWindow || a.county.localeCompare(b.county));
}
