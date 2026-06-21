import type { CampaignOwnedEvent } from "./campaignEventTypes";

const PREFIX = "civic-cal-campaign-events";

function key(slug: string): string {
  return `${PREFIX}:${slug}`;
}

export function loadCampaignEvents(slug: string): CampaignOwnedEvent[] {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw) return JSON.parse(raw) as CampaignOwnedEvent[];
  } catch (_) {}
  return [];
}

export function saveCampaignEvents(slug: string, events: CampaignOwnedEvent[]): void {
  localStorage.setItem(key(slug), JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("civic-campaign-events-updated", { detail: slug }));
}

export function addCampaignEvent(slug: string, event: Omit<CampaignOwnedEvent, "id" | "createdAt" | "workspaceSlug">): CampaignOwnedEvent {
  const record: CampaignOwnedEvent = {
    ...event,
    id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceSlug: slug,
    createdAt: new Date().toISOString(),
  };
  const all = loadCampaignEvents(slug);
  all.push(record);
  saveCampaignEvents(slug, all);
  return record;
}

export function deleteCampaignEvent(slug: string, id: string): void {
  saveCampaignEvents(slug, loadCampaignEvents(slug).filter((e) => e.id !== id));
}

export function updateCampaignEvent(slug: string, id: string, patch: Partial<CampaignOwnedEvent>): void {
  const all = loadCampaignEvents(slug).map((e) => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e));
  saveCampaignEvents(slug, all);
}
