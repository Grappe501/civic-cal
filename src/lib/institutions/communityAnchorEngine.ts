import type { CivicEvent } from "../types";
import { listChurches, listColleges, listOrganizations, listSchools } from "./registry";
import {
  listExtensionOffices,
  listHomemakerClubs,
  listVfdAnchors,
} from "./communityAnchorsRegistry";
import type {
  AnchorEventSourcing,
  CommunityAnchorsSnapshot,
  CommunityAnchorKind,
  CommunityAttendanceSignal,
  FoodTrailCategory,
  ParadeProfile,
} from "./communityAnchorTypes";
import { ATTENDANCE_SIGNAL_LABELS, FOOD_TRAIL_LABELS } from "./communityAnchorTypes";

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").toLowerCase();
}

const FOOD_PATTERNS: { category: FoodTrailCategory; pattern: RegExp }[] = [
  { category: "fish_fry", pattern: /fish fry/i },
  { category: "spaghetti_dinner", pattern: /spaghetti/i },
  { category: "wild_game_dinner", pattern: /wild game/i },
  { category: "chili_cookoff", pattern: /chili cook/i },
  { category: "bbq_cookoff", pattern: /bbq cook|barbecue cook/i },
  { category: "pancake_breakfast", pattern: /pancake breakfast/i },
  { category: "catfish_festival", pattern: /catfish/i },
  { category: "crawfish_boil", pattern: /crawfish/i },
  { category: "pie_contest", pattern: /pie contest|pie auction/i },
  { category: "community_meal", pattern: /community meal|community dinner/i },
  { category: "church_supper", pattern: /church supper|church dinner|supper/i },
];

const ANCHOR_EVENT_PATTERNS: Record<CommunityAnchorKind, RegExp> = {
  extension_office: /cooperative extension|extension office|4-h|master gardener|livestock show|food preservation|gardening workshop|poultry workshop|farm management/i,
  four_h: /\b4-h\b|livestock show|youth leadership|ffa/i,
  homemakers: /homemaker|extension homemaker|eh club|home demonstration/i,
  vfd: /volunteer fire|vfd|fire department|pancake breakfast fundraiser|firefighter/i,
  church: /church|fish fry|spaghetti|faith meal|parish|bbq dinner/i,
  school: /school|pta|booster|homecoming|graduation|school board/i,
  college: /college|university|campus|razorback|a-state|uc[a]/i,
  library: /library/i,
  chamber: /chamber of commerce|chamber breakfast/i,
  rotary: /rotary/i,
  lions: /lions club/i,
  farm_bureau: /farm bureau/i,
  hospital: /hospital|health fair|clinic/i,
  parade: /parade/i,
  food_event: /fish fry|spaghetti|bbq|pancake|dinner|cookoff|supper|meal/i,
};

const SIGNAL_PATTERNS: { signal: CommunityAttendanceSignal; pattern: RegExp; weight: number }[] = [
  { signal: "agriculture", pattern: /farm bureau|ffa|4-h|livestock|extension|agriculture|poultry|master gardener/i, weight: 85 },
  { signal: "faith", pattern: /church|faith|fish fry|spaghetti|parish|supper|vbs/i, weight: 80 },
  { signal: "youth", pattern: /4-h|youth|teen|esports|college|intramural|school play/i, weight: 70 },
  { signal: "families", pattern: /family|kids|children|homecoming|school|parade|fair/i, weight: 65 },
  { signal: "seniors", pattern: /senior|homemaker|retire|golden/i, weight: 75 },
  { signal: "veterans", pattern: /veteran|vfw|memorial day|veterans day|legion/i, weight: 78 },
  { signal: "business_leaders", pattern: /chamber|rotary|farm bureau|leadership breakfast/i, weight: 82 },
  { signal: "educators", pattern: /school board|pta|teacher|education|library/i, weight: 72 },
];

function eventText(e: CivicEvent): string {
  return `${e.title} ${e.description ?? ""} ${e.hostOrganization ?? ""} ${e.category}`;
}

function classifyFoodEvent(e: CivicEvent): FoodTrailCategory | null {
  const text = eventText(e);
  for (const { category, pattern } of FOOD_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  if (e.category === "faith_meal") return "church_supper";
  return null;
}

function inferAttendanceSignals(e: CivicEvent): CommunityAttendanceSignal[] {
  const text = eventText(e);
  return SIGNAL_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ signal }) => signal);
}

function signalInfluenceScore(signal: CommunityAttendanceSignal, events: CivicEvent[]): number {
  const cfg = SIGNAL_PATTERNS.find((s) => s.signal === signal)!;
  const matching = events.filter((e) => cfg.pattern.test(eventText(e)));
  const rdBoost = matching.reduce((s, e) => s + (e.relationshipDensityScore ?? 0), 0) / Math.max(1, matching.length);
  return Math.round(cfg.weight * 0.4 + matching.length * 8 + rdBoost * 0.3);
}

function paradeType(title: string): ParadeProfile["paradeType"] {
  if (/christmas/i.test(title)) return "christmas";
  if (/veteran/i.test(title)) return "veterans";
  if (/homecoming/i.test(title)) return "homecoming";
  if (/fair/i.test(title)) return "county_fair";
  if (/rodeo/i.test(title)) return "rodeo";
  if (/independence|july 4|fourth of july/i.test(title)) return "independence";
  if (/festival/i.test(title)) return "festival";
  return "other";
}

function buildParadeProfiles(events: CivicEvent[]): ParadeProfile[] {
  return events
    .filter((e) => /parade/i.test(e.title))
    .map((e) => ({
      eventTitle: e.title,
      slug: e.slug,
      paradeType: paradeType(e.title),
      estimatedAttendance: e.typicalAttendanceBand ?? null,
      route: /route/i.test(e.description ?? "") ? "See event details" : null,
      floatOpportunity: true,
      candidateParticipation: true,
      boothOpportunity: /festival|fair|homecoming/i.test(e.title),
    }));
}

function countEventsForAnchor(events: CivicEvent[], kind: CommunityAnchorKind): number {
  const pattern = ANCHOR_EVENT_PATTERNS[kind];
  return events.filter((e) => pattern.test(eventText(e)) || (kind === "church" && (e.category === "faith_meal" || e.category === "community_church"))).length;
}

function buildEventSourcing(county: string, events: CivicEvent[]): AnchorEventSourcing[] {
  const countyEvents = events.filter((e) => e.county.toLowerCase() === normCounty(county));
  const orgs = listOrganizations(county);
  const rows: AnchorEventSourcing[] = [
    { kind: "church", label: "Churches", anchorCount: listChurches(county).length, eventsSourced: countEventsForAnchor(countyEvents, "church") },
    { kind: "school", label: "Schools", anchorCount: listSchools(county).length, eventsSourced: countEventsForAnchor(countyEvents, "school") },
    { kind: "vfd", label: "Volunteer fire departments", anchorCount: listVfdAnchors(county).length, eventsSourced: countEventsForAnchor(countyEvents, "vfd") },
    { kind: "extension_office", label: "Extension / 4-H", anchorCount: listExtensionOffices(county).length, eventsSourced: countEventsForAnchor(countyEvents, "extension_office") + countEventsForAnchor(countyEvents, "four_h") },
    { kind: "homemakers", label: "Extension Homemakers", anchorCount: listHomemakerClubs(county).length, eventsSourced: countEventsForAnchor(countyEvents, "homemakers") },
    { kind: "parade", label: "Parades", anchorCount: buildParadeProfiles(countyEvents).length, eventsSourced: countEventsForAnchor(countyEvents, "parade") },
    { kind: "food_event", label: "Food events", anchorCount: countyEvents.filter((e) => classifyFoodEvent(e)).length, eventsSourced: countyEvents.filter((e) => classifyFoodEvent(e)).length },
    { kind: "rotary", label: "Rotary", anchorCount: orgs.filter((o) => o.orgType === "rotary").length, eventsSourced: countEventsForAnchor(countyEvents, "rotary") },
    { kind: "farm_bureau", label: "Farm Bureau", anchorCount: orgs.filter((o) => o.orgType === "farm_bureau").length, eventsSourced: countEventsForAnchor(countyEvents, "farm_bureau") },
    { kind: "chamber", label: "Chambers", anchorCount: orgs.filter((o) => o.orgType === "chamber").length, eventsSourced: countEventsForAnchor(countyEvents, "chamber") },
  ];

  return rows.map((row) => {
    let influenceNote: string | undefined;
    if (row.kind === "homemakers" && row.eventsSourced <= 2 && row.anchorCount >= 3) {
      influenceNote = "Homemaker clubs often know everyone in the county — low calendar coverage is a blind spot";
    }
    if (row.kind === "extension_office" && row.anchorCount >= 1 && row.eventsSourced >= 3) {
      influenceNote = "Recurring agriculture & youth gathering points";
    }
    if (row.kind === "vfd" && row.eventsSourced >= 2) {
      influenceNote = "Rural communities revolve around church, school, and VFD";
    }
    return { ...row, influenceNote };
  });
}

function computeCoverageScore(sourcing: AnchorEventSourcing[], anchorCounts: CommunityAnchorsSnapshot["anchorCounts"]): number {
  const totalAnchors =
    anchorCounts.churches +
    anchorCounts.schools +
    anchorCounts.vfds +
    anchorCounts.extensionOffices +
    anchorCounts.homemakerClubs;
  const totalEvents = sourcing.reduce((s, r) => s + r.eventsSourced, 0);
  if (totalAnchors === 0) return 0;
  const ratio = Math.min(1, totalEvents / (totalAnchors * 2));
  const verifiedBoost = sourcing.filter((r) => r.eventsSourced > 0).length / sourcing.length;
  return Math.round(ratio * 60 + verifiedBoost * 40);
}

export function buildCommunityAnchorsSnapshot(county: string, events: CivicEvent[]): CommunityAnchorsSnapshot {
  const countyNorm = normCounty(county);
  const countyEvents = events.filter((e) => e.county.toLowerCase() === countyNorm);
  const orgs = listOrganizations(county);

  const anchorCounts = {
    churches: listChurches(county).length,
    schools: listSchools(county).length,
    colleges: listColleges(county).length,
    extensionOffices: listExtensionOffices(county).length,
    fourHClubs: orgs.filter((o) => o.orgType === "four_h").length,
    homemakerClubs: listHomemakerClubs(county).length,
    vfds: listVfdAnchors(county).length,
    libraries: orgs.filter((o) => o.orgType === "library").length,
    chambers: orgs.filter((o) => o.orgType === "chamber").length,
    rotary: orgs.filter((o) => o.orgType === "rotary").length,
    lions: orgs.filter((o) => o.orgType === "lions").length,
    farmBureau: orgs.filter((o) => o.orgType === "farm_bureau").length,
    hospitals: orgs.filter((o) => o.orgType === "hospital").length,
  };

  const eventSourcing = buildEventSourcing(county, events);
  const foodEvents = countyEvents
    .map((e) => {
      const category = classifyFoodEvent(e);
      if (!category) return null;
      return { title: e.title, slug: e.slug, category, signals: inferAttendanceSignals(e) };
    })
    .filter(Boolean) as CommunityAnchorsSnapshot["foodEvents"];

  const signalCounts = new Map<CommunityAttendanceSignal, number>();
  for (const e of countyEvents) {
    for (const sig of inferAttendanceSignals(e)) {
      signalCounts.set(sig, (signalCounts.get(sig) ?? 0) + 1);
    }
  }
  const topAttendanceSignals = [...signalCounts.entries()]
    .map(([signal, eventCount]) => ({
      signal,
      eventCount,
      influenceScore: signalInfluenceScore(signal, countyEvents),
    }))
    .sort((a, b) => b.influenceScore - a.influenceScore)
    .slice(0, 6);

  return {
    county,
    extensionOffices: listExtensionOffices(county),
    homemakerClubs: listHomemakerClubs(county),
    vfds: listVfdAnchors(county),
    anchorCounts,
    eventSourcing,
    countyCoverageScore: computeCoverageScore(eventSourcing, anchorCounts),
    parades: buildParadeProfiles(countyEvents),
    foodEvents: foodEvents.slice(0, 20),
    topAttendanceSignals,
  };
}

export function formatAnchorSourcingLine(row: AnchorEventSourcing): string {
  return `${row.label}: ${row.anchorCount} anchors · ${row.eventsSourced} events sourced`;
}

export { ATTENDANCE_SIGNAL_LABELS, FOOD_TRAIL_LABELS };
