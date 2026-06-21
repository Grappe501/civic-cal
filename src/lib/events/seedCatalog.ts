import type { CivicEvent } from "../types";
import seedBundle from "../../../data/seed-events.json";
import demoBundle from "../../../data/seed-events-public-demo.json";

type SeedFile = { events?: CivicEvent[]; label?: string };

export function loadMainSeedEvents(): CivicEvent[] {
  return (seedBundle as SeedFile).events ?? [];
}

export function loadDemoSeedEvents(): CivicEvent[] {
  return (demoBundle as SeedFile).events ?? [];
}

/** Merged bundled seeds — main first, demo fills unique slugs. */
export function getBundledSeedEvents(): CivicEvent[] {
  const bySlug = new Map<string, CivicEvent>();
  for (const e of loadMainSeedEvents()) bySlug.set(e.slug, e);
  for (const e of loadDemoSeedEvents()) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
  }
  return [...bySlug.values()];
}

export function isDemoSeedEvent(event: CivicEvent): boolean {
  return event.source === "demo_seed" || event.id.startsWith("demo-seed-");
}
