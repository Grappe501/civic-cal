import type { CivicEvent } from "../types";
import seedBundle from "../../../data/seed-events.json";
import demoBundle from "../../../data/seed-events-public-demo.json";
import approvedPartyBundle from "../../../data/ingestion/political-party-meetings-approved-events.json";
import approvedSchoolBundle from "../../../data/ingestion/school-events-approved-events.json";
import approvedFairFestivalBundle from "../../../data/ingestion/fair-festival-approved-events.json";
import approvedCountyFairBundle from "../../../data/ingestion/county-fair-approved-events.json";
import approvedHistoricPoliticalBundle from "../../../data/ingestion/historic-political-events-approved-events.json";
import approvedTop250CityFestivalBundle from "../../../data/ingestion/top250-city-festival-approved-events.json";

type SeedFile = { events?: CivicEvent[]; label?: string };

export function loadMainSeedEvents(): CivicEvent[] {
  return (seedBundle as SeedFile).events ?? [];
}

export function loadDemoSeedEvents(): CivicEvent[] {
  return (demoBundle as SeedFile).events ?? [];
}

export function loadApprovedPartyEvents(): CivicEvent[] {
  return (approvedPartyBundle as SeedFile).events ?? [];
}

export function loadApprovedSchoolEvents(): CivicEvent[] {
  return (approvedSchoolBundle as SeedFile).events ?? [];
}

export function loadApprovedFairFestivalEvents(): CivicEvent[] {
  return (approvedFairFestivalBundle as SeedFile).events ?? [];
}

export function loadApprovedCountyFairEvents(): CivicEvent[] {
  return (approvedCountyFairBundle as SeedFile).events ?? [];
}

export function loadApprovedHistoricPoliticalEvents(): CivicEvent[] {
  return (approvedHistoricPoliticalBundle as SeedFile).events ?? [];
}

export function loadApprovedTop250CityFestivalEvents(): CivicEvent[] {
  return (approvedTop250CityFestivalBundle as SeedFile).events ?? [];
}

/** Merged bundled seeds — main first, demo fills unique slugs, approved party meetings last. */
export function getBundledSeedEvents(): CivicEvent[] {
  const bySlug = new Map<string, CivicEvent>();
  for (const e of loadMainSeedEvents()) bySlug.set(e.slug, e);
  for (const e of loadDemoSeedEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  for (const e of loadApprovedPartyEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  for (const e of loadApprovedSchoolEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  for (const e of loadApprovedFairFestivalEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  for (const e of loadApprovedCountyFairEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  for (const e of loadApprovedHistoricPoliticalEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  for (const e of loadApprovedTop250CityFestivalEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  return [...bySlug.values()];
}

export function isDemoSeedEvent(event: CivicEvent): boolean {
  return event.source === "demo_seed" || event.id.startsWith("demo-seed-");
}
