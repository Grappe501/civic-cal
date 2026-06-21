import type { CivicEvent } from "../types";
import type { EventIntelligenceDossier } from "../intelligence/eventDossierTypes";
import { buildDeterministicDossier } from "../ai/eventDossierBuilder";
import { inferPublicEventPriority, type PublicEventPriorityLabel } from "./publicEventPriority";
import { isPubliclyVisibleEvent } from "./eventArchive";
import { getBundledSeedEvents } from "./seedCatalog";
import { getNarrativeForEvent } from "../narratives/narrativeRegistry";

export interface EventPageQualityScore {
  eventId: string;
  slug: string;
  title: string;
  county: string;
  total: number;
  maxScore: number;
  percent: number;
  band: "strong" | "moderate" | "thin";
  publicPriority: PublicEventPriorityLabel;
  missing: string[];
  dimensions: Record<string, boolean>;
}

const DIMENSIONS = [
  "title_date_location",
  "description",
  "history",
  "official_links",
  "parking_accessibility",
  "cost_tickets_vendor",
  "host_profile",
  "geo_links",
  "related_pages",
  "freshness",
] as const;

function dossierFor(event: CivicEvent): EventIntelligenceDossier {
  return buildDeterministicDossier({ event }).dossier;
}

export function scoreEventPageQuality(
  event: CivicEvent,
  dossier?: EventIntelligenceDossier,
): EventPageQualityScore {
  const d = dossier ?? dossierFor(event);
  const narrative = getNarrativeForEvent(event);
  const priority = inferPublicEventPriority(event);

  const dimensions: Record<string, boolean> = {
    title_date_location: Boolean(event.title && event.startAt && event.county),
    description: Boolean((event.description?.trim().length ?? 0) >= 40),
    history: Boolean(d.yearsRunning || d.historicalNotes || narrative?.history || event.historyDossier),
    official_links: Boolean(event.websiteUrl || d.officialWebsite || (d.sourceLinks?.length ?? 0) > 0),
    parking_accessibility: Boolean(d.parkingInfo || d.accessibilityInfo),
    cost_tickets_vendor: Boolean(d.ticketCost || d.vendorOptions || event.isFree != null),
    host_profile: Boolean(event.hostOrganization || d.hostOrganization),
    geo_links: Boolean(event.city && event.county),
    related_pages: Boolean(narrative || event.festivalCategory || event.harvestBatch),
    freshness: Boolean(event.source || event.websiteUrl) && (event.status ?? "approved") === "approved",
  };

  const missing = DIMENSIONS.filter((k) => !dimensions[k]).map((k) => k.replace(/_/g, " "));
  const hit = DIMENSIONS.filter((k) => dimensions[k]).length;
  const maxScore = DIMENSIONS.length;
  const percent = Math.round((hit / maxScore) * 100);
  const band: EventPageQualityScore["band"] = percent >= 70 ? "strong" : percent >= 45 ? "moderate" : "thin";

  return {
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    county: event.county,
    total: hit,
    maxScore,
    percent,
    band,
    publicPriority: priority.label,
    missing,
    dimensions: { ...dimensions },
  };
}

export function scoreAllPublicEventPages(now = new Date()): EventPageQualityScore[] {
  return getBundledSeedEvents()
    .filter((e) => isPubliclyVisibleEvent(e, now))
    .map((e) => scoreEventPageQuality(e))
    .sort((a, b) => a.percent - b.percent || a.title.localeCompare(b.title));
}

export function eventPageQualitySummary(scores: EventPageQualityScore[]) {
  const thin = scores.filter((s) => s.band === "thin").length;
  const highPriorityThin = scores.filter(
    (s) =>
      s.band === "thin" &&
      (s.publicPriority === "Essential local tradition" ||
        s.publicPriority === "Major community gathering" ||
        s.publicPriority === "Civic meeting"),
  ).length;
  return {
    total: scores.length,
    thin,
    moderate: scores.filter((s) => s.band === "moderate").length,
    strong: scores.filter((s) => s.band === "strong").length,
    highPriorityThin,
  };
}
