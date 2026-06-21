import type { CivicEvent } from "../types";
import seedBundle from "../../../data/seed-events.json";
import demoBundle from "../../../data/seed-events-public-demo.json";
import approvedPartyBundle from "../../../data/ingestion/political-party-meetings-approved-events.json";
import approvedSchoolBundle from "../../../data/ingestion/school-events-approved-events.json";
import approvedFairFestivalBundle from "../../../data/ingestion/fair-festival-approved-events.json";
import approvedCountyFairBundle from "../../../data/ingestion/county-fair-approved-events.json";
import approvedHistoricPoliticalBundle from "../../../data/ingestion/historic-political-events-approved-events.json";
import approvedTop250CityFestivalBundle from "../../../data/ingestion/top250-city-festival-approved-events.json";
import approvedAgricultureBundle from "../../../data/agriculture/agriculture-event-approved-events.json";
import { dedupeCatalogEvents } from "../dedupe/dedupeRecords";

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

export function loadApprovedAgricultureEvents(): CivicEvent[] {
  return (approvedAgricultureBundle as SeedFile).events ?? [];
}

/** Merged bundled seeds — later approved bundles win on slug and canonical key. */
export function getBundledSeedEvents(): CivicEvent[] {
  const layers: Array<{ priority: number; source: string; events: CivicEvent[] }> = [
    { priority: 0, source: "main", events: loadMainSeedEvents() },
    { priority: 1, source: "demo", events: loadDemoSeedEvents() },
    { priority: 2, source: "party", events: loadApprovedPartyEvents() },
    { priority: 3, source: "school", events: loadApprovedSchoolEvents() },
    { priority: 4, source: "fair_festival", events: loadApprovedFairFestivalEvents() },
    { priority: 5, source: "county_fair", events: loadApprovedCountyFairEvents() },
    { priority: 6, source: "historic_political", events: loadApprovedHistoricPoliticalEvents() },
    { priority: 7, source: "top250_festival", events: loadApprovedTop250CityFestivalEvents() },
    { priority: 8, source: "agriculture", events: loadApprovedAgricultureEvents() },
  ];

  const tagged = layers.flatMap(({ priority, source, events }) =>
    events.map((event) => ({ event, priority, source })),
  );

  return dedupeCatalogEvents(tagged);
}

export function isDemoSeedEvent(event: CivicEvent): boolean {
  return event.source === "demo_seed" || event.id.startsWith("demo-seed-");
}
