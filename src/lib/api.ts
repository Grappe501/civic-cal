import type { CivicEvent, EventFilters, SubmitEventPayload } from "./types";
import { filterPublicEvents, isPubliclyVisibleEvent } from "./events/eventArchive";
import seedBundle from "../../data/seed-events.json";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";
const useSeedOnly = import.meta.env.VITE_USE_SEED === "true";

function seedEvents(): CivicEvent[] {
  return (seedBundle as { events: CivicEvent[] }).events ?? [];
}

function filterSeed(events: CivicEvent[], filters: EventFilters & { limit?: number }): CivicEvent[] {
  let list = events.filter((e) => e.status === "approved" || !e.status);

  if (filters.county) list = list.filter((e) => e.county?.toLowerCase() === filters.county!.toLowerCase());
  if (filters.city) list = list.filter((e) => e.city?.toLowerCase().includes(filters.city!.toLowerCase()));
  if (filters.category) list = list.filter((e) => e.category === filters.category);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.locationName?.toLowerCase().includes(q),
    );
  }
  if (filters.civicOnly) list = list.filter((e) => e.category === "civic_meeting" || e.isPublicGovernmentMeeting);
  if (filters.familyFriendly) list = list.filter((e) => e.isFamilyFriendly !== false);
  if (filters.freeOnly) list = list.filter((e) => e.isFree !== false);
  if (filters.candidateRelevant) list = list.filter((e) => e.candidateRelevant);
  if (filters.featured) list = list.filter((e) => e.featured);

  list = filterPublicEvents(list);

  list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const limit = filters.limit ?? 500;
  return list.slice(0, limit);
}

function toParams(filters: EventFilters & { slug?: string; status?: string; limit?: number }) {
  const p = new URLSearchParams();
  if (filters.slug) p.set("slug", filters.slug);
  if (filters.county) p.set("county", filters.county);
  if (filters.city) p.set("city", filters.city);
  if (filters.category) p.set("category", filters.category);
  if (filters.q) p.set("q", filters.q);
  if (filters.civicOnly) p.set("civicOnly", "true");
  if (filters.familyFriendly) p.set("familyFriendly", "true");
  if (filters.freeOnly) p.set("freeOnly", "true");
  if (filters.candidateRelevant) p.set("candidateRelevant", "true");
  if (filters.thisWeekend) p.set("thisWeekend", "true");
  if (filters.featured) p.set("featured", "true");
  if (filters.status) p.set("status", filters.status);
  if (filters.limit) p.set("limit", String(filters.limit));
  return p;
}

export async function fetchEvents(filters: EventFilters = {}): Promise<CivicEvent[]> {
  if (useSeedOnly) return filterSeed(seedEvents(), filters);
  try {
    const res = await fetch(`${fnBase}/events?${toParams(filters)}`);
    if (!res.ok) throw new Error("Failed to load events");
    const data = await res.json();
    return filterPublicEvents(data.events ?? []);
  } catch {
    return filterSeed(seedEvents(), { ...filters, limit: filters.limit ?? 500 });
  }
}

function visibleSeedEvent(slug: string): CivicEvent | null {
  const event = seedEvents().find((e) => e.slug === slug);
  return event && isPubliclyVisibleEvent(event) ? event : null;
}

export async function fetchEventBySlug(slug: string): Promise<CivicEvent | null> {
  if (useSeedOnly) return visibleSeedEvent(slug);
  try {
    const res = await fetch(`${fnBase}/events?slug=${encodeURIComponent(slug)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load event");
    const data = await res.json();
    const event = (data.event ?? null) as CivicEvent | null;
    return event && isPubliclyVisibleEvent(event) ? event : null;
  } catch {
    return visibleSeedEvent(slug);
  }
}

export async function submitEvent(payload: SubmitEventPayload): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${fnBase}/events-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Submission failed");
  return data;
}

export async function fetchAdminEvents(token: string, status = "pending"): Promise<CivicEvent[]> {
  const res = await fetch(`${fnBase}/events-admin?status=${status}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Admin fetch failed");
  const data = await res.json();
  return data.events ?? [];
}

export async function adminAction(
  token: string,
  id: string,
  action: "approve" | "reject" | "feature" | "geocode" | "set_coordinates",
  extra?: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${fnBase}/events-admin`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, action, ...extra }),
  });
  if (!res.ok) throw new Error("Admin action failed");
}

export async function fetchAdminMapReview(token: string): Promise<CivicEvent[]> {
  const res = await fetch(`${fnBase}/events-admin?mapReview=true&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Map review fetch failed");
  const data = await res.json();
  return data.events ?? [];
}

export { geocodeLocation } from "./maps/geocode";

export function groupEventsByCounty(events: CivicEvent[]): Map<string, CivicEvent[]> {
  const map = new Map<string, CivicEvent[]>();
  for (const e of events) {
    const list = map.get(e.county) ?? [];
    list.push(e);
    map.set(e.county, list);
  }
  return map;
}

export function emptyCounties(allCounties: string[], events: CivicEvent[]): string[] {
  const withEvents = new Set(events.map((e) => e.county));
  return allCounties.filter((c) => !withEvents.has(c));
}
