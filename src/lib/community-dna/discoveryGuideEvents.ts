import type { CivicEvent } from "../types";
import { getBundledSeedEvents } from "../events/seedCatalog";
import { getDiscoveryGuide } from "./communityDnaEngine";

export function eventsForDiscoveryGuide(slug: string, limit = 48): CivicEvent[] {
  const guide = getDiscoveryGuide(slug);
  if (!guide?.filters?.length) return [];

  const patterns = guide.filters.map((f) => new RegExp(f.replace(/\s+/g, "\\s+"), "i"));
  return getBundledSeedEvents()
    .filter((e) => patterns.some((p) => p.test(e.title ?? "") || p.test(e.description ?? "")))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, limit);
}

export function countyEventCounts(): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of getBundledSeedEvents()) {
    if (!e.county) continue;
    map.set(e.county, (map.get(e.county) ?? 0) + 1);
  }
  return map;
}
