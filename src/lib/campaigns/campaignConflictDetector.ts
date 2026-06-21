import { parseISO, differenceInMinutes, isSameDay } from "date-fns";
import type { CivicEvent } from "../types";
import type { CampaignOwnedEvent, ScheduleConflict } from "./campaignEventTypes";
import { scoreEventForCampaign } from "./eventIntel";

function eventWindow(start: string, end?: string | null, allDay?: boolean): { start: Date; end: Date } {
  const s = parseISO(start);
  if (allDay) {
    const e = new Date(s);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  const e = end ? parseISO(end) : new Date(s.getTime() + 2 * 60 * 60 * 1000);
  return { start: s, end: e };
}

function windowsOverlap(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return a.start < b.end && b.start < a.end;
}

function crowdNote(event: CivicEvent): string | undefined {
  const band = event.typicalAttendanceBand;
  if (band === "massive") return "1,000+ expected";
  if (band === "large") return "Large crowd expected";
  if (/1200|1,200|1500|thousand/i.test(`${event.title} ${event.description ?? ""}`)) return "1,200+ mentioned in listing";
  return undefined;
}

/** Detect campaign schedule conflicts vs high-value community events */
export function detectScheduleConflicts(
  campaignEvents: CampaignOwnedEvent[],
  communityEvents: CivicEvent[],
  opts?: { minRd?: number },
): ScheduleConflict[] {
  const minRd = opts?.minRd ?? 70;
  const conflicts: ScheduleConflict[] = [];

  for (const ce of campaignEvents) {
    if (!ce.candidateAttending) continue;
    const cWin = eventWindow(ce.startAt, ce.endAt, ce.allDay);

    for (const ev of communityEvents) {
      if (!isSameDay(parseISO(ev.startAt), cWin.start)) continue;
      const eWin = eventWindow(ev.startAt, ev.endAt, ev.allDay);
      if (!windowsOverlap(cWin, eWin)) continue;

      const scored = scoreEventForCampaign(ev);
      const rd = scored.relationshipDensityScore;
      const crowd = crowdNote(ev);
      const highValue = rd >= minRd || ev.featured || ev.highCivicValue;

      if (!highValue && differenceInMinutes(cWin.start, eWin.start) > 180) continue;

      conflicts.push({
        severity: rd >= 85 || crowd ? "high" : "medium",
        campaignEvent: ce,
        communityEvent: {
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          startAt: ev.startAt,
          county: ev.county,
          city: ev.city,
        },
        message: buildConflictMessage(ce, ev, rd, crowd),
        communityRd: rd,
        expectedCrowdNote: crowd,
      });
    }
  }

  return conflicts.sort((a, b) => (b.communityRd ?? 0) - (a.communityRd ?? 0));
}

function buildConflictMessage(ce: CampaignOwnedEvent, ev: CivicEvent, rd: number, crowd?: string): string {
  const parts = [
    `Potential conflict: ${ce.title} overlaps with community event "${ev.title}"`,
    rd >= 90 ? `${rd} Relationship Density` : rd >= 70 ? `RD ${rd}` : null,
    crowd,
    ev.city ? `${ev.city}, ${ev.county} County` : `${ev.county} County`,
  ].filter(Boolean);
  return parts.join(" · ");
}
