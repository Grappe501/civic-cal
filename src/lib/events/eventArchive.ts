import { endOfDay, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { CivicEvent } from "../types";

/** Arkansas default; individual events may set `timezone`. */
export const DEFAULT_EVENT_TIMEZONE = "America/Chicago";

type EventTiming = Pick<CivicEvent, "startAt" | "endAt" | "allDay" | "timezone" | "status">;

/** Instant after which the event is treated as past for public surfaces. */
export function publicVisibilityCutoff(event: EventTiming): Date {
  const tz = event.timezone || DEFAULT_EVENT_TIMEZONE;
  if (event.endAt) return parseISO(event.endAt);

  const start = parseISO(event.startAt);
  const zonedStart = toZonedTime(start, tz);
  return fromZonedTime(endOfDay(zonedStart), tz);
}

export function isEventPastForPublic(event: EventTiming, now: Date = new Date()): boolean {
  if (event.status === "archived") return true;
  return now.getTime() > publicVisibilityCutoff(event).getTime();
}

/** Approved, not archived, and still within the public visibility window. */
export function isPubliclyVisibleEvent(event: CivicEvent, now: Date = new Date()): boolean {
  const status = event.status ?? "approved";
  if (status !== "approved") return false;
  return !isEventPastForPublic(event, now);
}

export function filterPublicEvents(events: CivicEvent[], now: Date = new Date()): CivicEvent[] {
  return events.filter((e) => isPubliclyVisibleEvent(e, now));
}
