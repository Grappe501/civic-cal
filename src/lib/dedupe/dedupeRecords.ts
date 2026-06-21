import type { CivicEvent } from "../types";

function normalizeText(value?: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Stable public key for the same real-world occurrence. */
export function getEventCanonicalKey(
  event: Pick<CivicEvent, "title" | "startAt" | "city" | "county">,
): string {
  const date = (event.startAt ?? "").slice(0, 10);
  return `${normalizeText(event.title)}|${date}|${normalizeText(event.city || event.county)}|${normalizeText(event.county)}`;
}

/** Stricter key for party meeting occurrences. */
export function getPartyMeetingCanonicalKey(event: CivicEvent): string | null {
  const isParty = event.category === "public_party_meeting" || Boolean(event.partyLabel);
  if (!isParty) return null;
  const when = (event.startAt ?? "").slice(0, 16);
  return `party|${normalizeText(event.county)}|${(event.partyLabel ?? "").toLowerCase()}|${when}|${normalizeText(event.title)}`;
}

function canonicalKeyForEvent(event: CivicEvent): string {
  return getPartyMeetingCanonicalKey(event) ?? getEventCanonicalKey(event);
}

function eventRichness(event: CivicEvent): number {
  let score = 0;
  if ((event.description?.trim().length ?? 0) >= 40) score += 4;
  if (event.websiteUrl) score += 3;
  if (event.hostOrganization) score += 2;
  if (event.latitude != null) score += 1;
  if (event.source && event.source !== "demo_seed") score += 1;
  return score;
}

function pickPreferredEvent(a: CivicEvent, b: CivicEvent, aPriority = 0, bPriority = 0): CivicEvent {
  if (aPriority !== bPriority) return aPriority > bPriority ? a : b;
  const ar = eventRichness(a);
  const br = eventRichness(b);
  if (ar !== br) return ar > br ? a : b;
  return (a.slug?.length ?? 0) >= (b.slug?.length ?? 0) ? a : b;
}

export function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    if (!item.slug) continue;
    seen.set(item.slug, item);
  }
  return [...seen.values()];
}

export function dedupeByTitleDateCity(events: CivicEvent[]): CivicEvent[] {
  return dedupeByCanonicalKey(events);
}

export function dedupeByCanonicalKey(events: CivicEvent[]): CivicEvent[] {
  const seen = new Map<string, CivicEvent>();
  for (const event of events) {
    const key = canonicalKeyForEvent(event);
    const existing = seen.get(key);
    seen.set(key, existing ? pickPreferredEvent(existing, event) : event);
  }
  return [...seen.values()];
}

export interface RelatedLinkLike {
  href?: string;
  to?: string;
  slug?: string;
  entityType?: string;
  title?: string;
  label?: string;
}

export function dedupeRelatedLinks<T extends RelatedLinkLike>(links: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const link of links) {
    const href = (link.href ?? link.to ?? "").replace(/\/$/, "").toLowerCase();
    const key =
      href ||
      `${link.entityType ?? ""}:${link.slug ?? link.label ?? link.title ?? ""}`.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

/** Render-time / fetch-time event list dedupe. */
export function dedupeEvents(events: CivicEvent[]): CivicEvent[] {
  return dedupeByCanonicalKey(dedupeBySlug(events));
}

/** Merge layered seed bundles — later layers win on slug and canonical key. */
export function dedupeCatalogEvents(
  tagged: Array<{ event: CivicEvent; priority: number; source?: string }>,
): CivicEvent[] {
  tagged.sort((a, b) => a.priority - b.priority);
  const bySlug = new Map<string, CivicEvent>();
  for (const { event } of tagged) {
    if (event.slug) bySlug.set(event.slug, event);
  }
  return dedupeByCanonicalKey([...bySlug.values()]);
}

/** Exclude events already shown in a primary list (e.g. county page highlights). */
export function excludeEventsByCanonicalKey(events: CivicEvent[], exclude: CivicEvent[]): CivicEvent[] {
  const keys = new Set(exclude.map(getEventCanonicalKey));
  return events.filter((e) => !keys.has(getEventCanonicalKey(e)));
}
