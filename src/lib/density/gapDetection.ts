import type { CoverageGap, EventCounts, InstitutionCounts } from "./densityTypes";

interface GapInput {
  county: string;
  institutions: InstitutionCounts;
  events: EventCounts;
  recurringTraditions: number;
  volunteerOpportunities: number;
  sourceFeedsDiscovered: number;
  citiesInCounty: number;
}

export function detectCoverageGaps(input: GapInput): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const { institutions: inst, events: ev } = input;

  if (inst.churches >= 5 && ev.churchTagged < Math.ceil(inst.churches * 0.15)) {
    gaps.push({
      kind: "church_events",
      severity: ev.churchTagged <= 2 ? "critical" : "high",
      message: `${input.county} County: ${inst.churches} churches tracked but only ${ev.churchTagged} church-tagged events on calendar.`,
      known: inst.churches,
      observed: ev.churchTagged,
      suggestedAction: "Run church event harvest — fish fries, spaghetti dinners, VBS, trunk-or-treat feeds.",
    });
  }

  if (inst.schools >= 3 && ev.schoolTagged < Math.ceil(inst.schools * 0.2)) {
    gaps.push({
      kind: "school_events",
      severity: ev.schoolTagged <= 1 ? "critical" : "high",
      message: `${inst.schools} schools tracked but only ${ev.schoolTagged} school/sports events indexed.`,
      known: inst.schools,
      observed: ev.schoolTagged,
      suggestedAction: "Harvest school district calendars, athletics, and board meeting schedules.",
    });
  }

  if (input.citiesInCounty > 0 && input.recurringTraditions === 0) {
    gaps.push({
      kind: "traditions",
      severity: "high",
      message: "No recurring traditions registered for this county.",
      suggestedAction: "Add county fairs, homecomings, parades, and annual fundraisers to recurring registry.",
    });
  }

  if (input.citiesInCounty > 0 && input.sourceFeedsDiscovered < input.citiesInCounty) {
    gaps.push({
      kind: "institution_feeds",
      severity: input.sourceFeedsDiscovered === 0 ? "critical" : "medium",
      message: `${input.sourceFeedsDiscovered}/${input.citiesInCounty} cities have institution feed templates (city, library, parks, chamber).`,
      known: input.citiesInCounty,
      observed: input.sourceFeedsDiscovered,
      suggestedAction: "Run discover:sources and attach official calendar URLs per city.",
    });
  }

  if (inst.total >= 10 && ev.total < 10) {
    gaps.push({
      kind: "overall_sparse",
      severity: ev.total <= 3 ? "critical" : "high",
      message: `${inst.total} institutions tracked but only ${ev.total} total events — calendar feels empty to visitors.`,
      known: inst.total,
      observed: ev.total,
      suggestedAction: "Prioritize institution-first harvest before adding more UI.",
    });
  }

  if (input.volunteerOpportunities === 0 && inst.libraries + inst.civicOrgs >= 3) {
    gaps.push({
      kind: "volunteer",
      severity: "medium",
      message: "No verified volunteer opportunities indexed despite civic institutions on file.",
      suggestedAction: "Harvest library, food pantry, and festival volunteer signup pages.",
    });
  }

  return gaps;
}
