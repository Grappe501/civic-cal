import type { CivicEvent } from "../types";
import {
  filterPublicEvents,
  isEventPastForPublic,
  isPubliclyVisibleEvent,
} from "./eventArchive";
import {
  ELECTION_CALENDAR_LAST_DAY,
  isEventHeldForPostElectionRelease,
  isPostElectionCalendarHoldActive,
  summarizeCountyEventHorizon,
  type CountyHorizonCounts,
} from "./publicCalendarHorizon";
import { getBundledSeedEvents, loadDemoSeedEvents, loadMainSeedEvents } from "./seedCatalog";

export type EventDataSource =
  | "seed-only-env"
  | "seed"
  | "demo-seed"
  | "seed-fallback"
  | "seed-fallback-empty-db"
  | "database"
  | "api"
  | "unknown";

export type HiddenReason =
  | "past-archived"
  | "not-approved"
  | "archived-status"
  | "missing-start-date"
  | "missing-slug"
  | "post-election-hold";

export interface HiddenEventSample {
  event: CivicEvent;
  reason: HiddenReason;
  detail: string;
}

export interface EventDataDiagnostics {
  seedEventsCount: number;
  demoSeedEventsCount: number;
  bundledSeedCount: number;
  apiEventsCount: number | null;
  rawApiSource: string | null;
  visibleEventsCount: number;
  archivedOrPastHiddenCount: number;
  pendingOrUnapprovedHiddenCount: number;
  missingDateCount: number;
  missingSlugCount: number;
  currentSource: EventDataSource;
  viteUseSeed: boolean;
  apiReachable: boolean;
  whyPublicCalendarEmpty: string[];
  visibleSamples: CivicEvent[];
  hiddenSamples: HiddenEventSample[];
  dataMode: "live-db" | "seed-demo" | "mixed" | "empty";
  postElectionHeldCount: number;
  electionCalendarLastDay: string;
  postElectionReleaseActive: boolean;
  countyHorizonSummary: CountyHorizonCounts[];
}

function classifyHidden(event: CivicEvent, now: Date): HiddenEventSample | null {
  if (!event.startAt) {
    return { event, reason: "missing-start-date", detail: "No startAt" };
  }
  if (!event.slug) {
    return { event, reason: "missing-slug", detail: "No slug" };
  }
  const status = event.status ?? "approved";
  if (status === "archived" || status === "rejected" || status === "pending") {
    return { event, reason: "not-approved", detail: `status=${status}` };
  }
  if (isEventPastForPublic(event, now)) {
    return { event, reason: "past-archived", detail: "Past public visibility cutoff" };
  }
  if (isEventHeldForPostElectionRelease(event, now)) {
    return {
      event,
      reason: "post-election-hold",
      detail: `Held until September release — starts after ${ELECTION_CALENDAR_LAST_DAY}`,
    };
  }
  return null;
}

function resolveDataMode(source: EventDataSource, visible: number): EventDataDiagnostics["dataMode"] {
  if (visible === 0) return "empty";
  if (source === "database") return "live-db";
  if (source === "seed-only-env" || source.startsWith("seed")) return "seed-demo";
  return "mixed";
}

export function analyzeEventCatalog(events: CivicEvent[], now = new Date()): {
  visible: CivicEvent[];
  hidden: HiddenEventSample[];
  missingDateCount: number;
  missingSlugCount: number;
  pastHidden: number;
  unapprovedHidden: number;
  postElectionHeld: number;
} {
  const hidden: HiddenEventSample[] = [];
  let missingDateCount = 0;
  let missingSlugCount = 0;
  let pastHidden = 0;
  let unapprovedHidden = 0;
  let postElectionHeld = 0;

  for (const e of events) {
    if (!e.startAt) missingDateCount++;
    if (!e.slug) missingSlugCount++;
    const h = classifyHidden(e, now);
    if (h) {
      hidden.push(h);
      if (h.reason === "past-archived") pastHidden++;
      if (h.reason === "not-approved" || h.reason === "archived-status") unapprovedHidden++;
      if (h.reason === "post-election-hold") postElectionHeld++;
    }
  }

  const visible = filterPublicEvents(events, now);
  return {
    visible,
    hidden,
    missingDateCount,
    missingSlugCount,
    pastHidden,
    unapprovedHidden,
    postElectionHeld,
  };
}

export async function runEventDataDiagnostics(): Promise<EventDataDiagnostics> {
  const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";
  const viteUseSeed = import.meta.env.VITE_USE_SEED === "true";
  const now = new Date();

  const mainSeed = loadMainSeedEvents();
  const demoSeed = loadDemoSeedEvents();
  const bundled = getBundledSeedEvents();

  let apiEvents: CivicEvent[] | null = null;
  let rawApiSource: string | null = null;
  let apiReachable = false;

  if (!viteUseSeed) {
    try {
      const res = await fetch(`${fnBase}/events?limit=500`);
      apiReachable = res.ok;
      if (res.ok) {
        const data = await res.json();
        apiEvents = (data.events ?? []) as CivicEvent[];
        rawApiSource = data.source ?? "api";
      }
    } catch {
      apiReachable = false;
    }
  }

  let workingSet = bundled;
  let currentSource: EventDataSource = "seed-fallback";

  if (viteUseSeed) {
    workingSet = bundled;
    currentSource = "seed-only-env";
  } else if (apiEvents != null) {
    if (rawApiSource === "database") {
      currentSource = "database";
      workingSet = apiEvents.length > 0 ? apiEvents : bundled;
      if (apiEvents.length === 0) currentSource = "seed-fallback-empty-db";
    } else if (rawApiSource?.includes("seed")) {
      currentSource = apiEvents.length > 0 ? "seed" : "seed-fallback";
      workingSet = apiEvents.length > 0 ? apiEvents : bundled;
    } else {
      currentSource = "api";
      workingSet = apiEvents.length > 0 ? apiEvents : bundled;
    }
  }

  const analysis = analyzeEventCatalog(workingSet, now);
  const seedAnalysis = analyzeEventCatalog(bundled, now);

  const whyEmpty: string[] = [];
  if (analysis.visible.length === 0) {
    if (viteUseSeed) whyEmpty.push("VITE_USE_SEED=true — using bundled seed only.");
    if (apiReachable && apiEvents?.length === 0 && rawApiSource === "database") {
      whyEmpty.push("DATABASE_URL is connected but returned zero approved future events.");
      whyEmpty.push("Bundled seed fallback should apply — check client fetchEvents merge.");
    }
    if (!apiReachable) whyEmpty.push("Events API not reachable — using bundled seed in browser fallback.");
    if (seedAnalysis.pastHidden > 0 && seedAnalysis.visible.length === 0) {
      whyEmpty.push(`All ${bundled.length} bundled seed events are past or archived.`);
    }
    if (seedAnalysis.unapprovedHidden > 0) {
      whyEmpty.push(`${seedAnalysis.unapprovedHidden} seed events hidden by approval status.`);
    }
    if (whyEmpty.length === 0) whyEmpty.push("No visible events after filters — check archive cutoff and status.");
  }

  return {
    seedEventsCount: mainSeed.length,
    demoSeedEventsCount: demoSeed.length,
    bundledSeedCount: bundled.length,
    apiEventsCount: apiEvents?.length ?? null,
    rawApiSource,
    visibleEventsCount: analysis.visible.length,
    archivedOrPastHiddenCount: analysis.pastHidden,
    pendingOrUnapprovedHiddenCount: analysis.unapprovedHidden,
    missingDateCount: analysis.missingDateCount,
    missingSlugCount: analysis.missingSlugCount,
    currentSource,
    viteUseSeed,
    apiReachable,
    whyPublicCalendarEmpty: whyEmpty,
    visibleSamples: analysis.visible.slice(0, 20),
    hiddenSamples: analysis.hidden.slice(0, 20),
    dataMode: resolveDataMode(currentSource, analysis.visible.length),
    postElectionHeldCount: analysis.postElectionHeld,
    electionCalendarLastDay: ELECTION_CALENDAR_LAST_DAY,
    postElectionReleaseActive: !isPostElectionCalendarHoldActive(now),
    countyHorizonSummary: summarizeCountyEventHorizon(workingSet, now),
  };
}

export function isPubliclyVisible(event: CivicEvent, now = new Date()): boolean {
  return isPubliclyVisibleEvent(event, now);
}
