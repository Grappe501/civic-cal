import registryBundle from "../../../data/political-events/historic-political-event-registry.json";
import approvedBundle from "../../../data/ingestion/historic-political-events-approved-events.json";
import stagedBundle from "../../../data/ingestion/historic-political-events-staged.json";
import researchBundle from "../../../data/ingestion/historic-political-events-research-tasks.json";
import type { CivicEvent } from "../types";

export type HistoricPoliticalSpeaker = {
  name: string;
  year?: number;
  role?: string;
  source_url: string;
};

export type HistoricPoliticalHistoryDossier = {
  firstYearHeld?: number | null;
  honors?: string | null;
  typicalAudience?: string | null;
  historicSignificance?: string | null;
  notableSpeakers?: HistoricPoliticalSpeaker[];
  recurringPattern?: string | null;
  hostOrganization?: string | null;
  ticketUrl?: string | null;
  sourceLinks?: { label: string; url: string; trust?: string }[];
  lastRefreshed?: string | null;
  confidenceScore?: number;
  historyAvailable?: boolean;
};

export type HistoricPoliticalRegistryEntry = {
  id: string;
  title: string;
  event_type: string;
  political_context?: string;
  host_organization?: string;
  city?: string | null;
  county?: string | null;
  venue?: string | null;
  verification_status?: string;
  history_available?: boolean;
  confidence_score?: number;
  verified_dates?: { year: number; start: string | null; end?: string | null; source_url?: string }[];
  first_year_held?: number;
  honors?: string;
  typical_audience?: string;
  historic_significance?: string;
  notable_speakers?: HistoricPoliticalSpeaker[];
  recurring_pattern?: string;
  source_url?: string;
  official_url?: string;
  ticket_url?: string;
};

type ApprovedEvent = CivicEvent & {
  politicalEventRegistryId?: string;
  historyDossier?: HistoricPoliticalHistoryDossier;
};

export function loadHistoricPoliticalRegistry(): HistoricPoliticalRegistryEntry[] {
  return (registryBundle as { events?: HistoricPoliticalRegistryEntry[] }).events ?? [];
}

export function registryToHistoryDossier(entry: HistoricPoliticalRegistryEntry): HistoricPoliticalHistoryDossier {
  return {
    firstYearHeld: entry.first_year_held ?? null,
    honors: entry.honors ?? null,
    typicalAudience: entry.typical_audience ?? null,
    historicSignificance: entry.historic_significance ?? null,
    notableSpeakers: entry.notable_speakers ?? [],
    recurringPattern: entry.recurring_pattern ?? null,
    hostOrganization: entry.host_organization ?? null,
    ticketUrl: entry.ticket_url ?? null,
    sourceLinks: [
      ...(entry.source_url ? [{ label: "Official source", url: entry.source_url, trust: "high" }] : []),
      ...(entry.official_url && entry.official_url !== entry.source_url
        ? [{ label: "Host organization", url: entry.official_url, trust: "high" }]
        : []),
    ],
    lastRefreshed: (registryBundle as { generatedAt?: string }).generatedAt ?? null,
    confidenceScore: entry.confidence_score ?? 70,
    historyAvailable: Boolean(entry.history_available),
  };
}

export function getHistoricPoliticalEventHistory(event: CivicEvent): HistoricPoliticalHistoryDossier | null {
  const extended = event as ApprovedEvent;
  if (extended.historyDossier?.historyAvailable || extended.historyDossier?.historicSignificance) {
    return extended.historyDossier;
  }

  const regId = extended.politicalEventRegistryId;
  if (regId) {
    const entry = loadHistoricPoliticalRegistry().find((e) => e.id === regId);
    if (entry?.history_available) return registryToHistoryDossier(entry);
  }

  const byTitle = loadHistoricPoliticalRegistry().find(
    (e) => e.title.toLowerCase() === event.title.toLowerCase() && e.history_available,
  );
  if (byTitle) return registryToHistoryDossier(byTitle);

  return null;
}

export function loadApprovedHistoricPoliticalEvents(): ApprovedEvent[] {
  return ((approvedBundle as { events?: ApprovedEvent[] }).events ?? []) as ApprovedEvent[];
}

export function runHistoricPoliticalHealth() {
  const registry = loadHistoricPoliticalRegistry();
  const approved = loadApprovedHistoricPoliticalEvents();
  const staged = stagedBundle as { stagedCount?: number; dated_events?: unknown[]; candidates?: unknown[] };
  const research = researchBundle as { openCount?: number; tasks?: unknown[] };

  return {
    registryCount: registry.length,
    historyDossierCount: registry.filter((e) => e.history_available).length,
    verified2026Count: registry.filter((e) =>
      (e.verified_dates ?? []).some((d) => d.year === 2026 && d.start),
    ).length,
    approvedPublicCount: approved.length,
    stagedCount: staged.stagedCount ?? (staged.dated_events?.length ?? 0) + (staged.candidates?.length ?? 0),
    researchTaskCount: research.openCount ?? research.tasks?.length ?? 0,
  };
}

export function listCivicPoliticalDirectoryEntries() {
  const approvedSlugs = new Set(loadApprovedHistoricPoliticalEvents().map((e) => e.politicalEventRegistryId ?? e.slug));
  const approvedByReg = new Map(
    loadApprovedHistoricPoliticalEvents()
      .filter((e) => e.politicalEventRegistryId)
      .map((e) => [e.politicalEventRegistryId!, e]),
  );

  return loadHistoricPoliticalRegistry().map((entry) => {
    const approved = approvedByReg.get(entry.id);
    const verified2026 = (entry.verified_dates ?? []).find((d) => d.year === 2026 && d.start);
    return {
      id: entry.id,
      title: entry.title,
      eventType: entry.event_type,
      city: entry.city,
      county: entry.county,
      hostOrganization: entry.host_organization,
      verificationStatus: entry.verification_status,
      historyAvailable: Boolean(entry.history_available),
      confidenceScore: entry.confidence_score ?? 0,
      nextVerifiedDate: verified2026?.start ?? approved?.startAt?.slice(0, 10) ?? null,
      approvedSlug: approved?.slug ?? null,
      isApproved: Boolean(approved || approvedSlugs.has(entry.id)),
    };
  });
}
