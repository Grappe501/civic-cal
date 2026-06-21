import type { CivicEvent } from "./types";
import type { EventDossierBundle, EventIntelligenceDossier } from "./intelligence/eventDossierTypes";
import { buildDossierBundle } from "./ai/eventDossierBuilder";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export async function fetchEventDossier(event: CivicEvent): Promise<EventDossierBundle> {
  try {
    const q = new URLSearchParams();
    if (/^[0-9a-f-]{36}$/i.test(event.id)) q.set("eventId", event.id);
    else q.set("slug", event.slug);
    const res = await fetch(`${fnBase}/event-dossiers?${q}`);
    if (res.ok) {
      const data = await res.json();
      return { dossier: data.dossier, tasks: data.tasks ?? [], source: "database" };
    }
  } catch (_) {}
  return buildDossierBundle(event);
}

export async function fetchAdminDossiers(
  token: string,
  section: "missing" | "needs_research" | "low_confidence" | "recent",
): Promise<{ dossiers?: EventIntelligenceDossier[]; events?: { id: string; title: string; slug: string }[] }> {
  const res = await fetch(`${fnBase}/event-dossiers?adminSection=${section}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load dossiers");
  return res.json();
}

export async function runDossierResearch(token: string, event: CivicEvent): Promise<unknown> {
  const res = await fetch(`${fnBase}/event-dossier-research`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event: event }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Research failed");
  return data;
}

export async function updateDossier(
  token: string,
  eventId: string,
  dossier: Partial<EventIntelligenceDossier>,
  action?: "mark_verified",
): Promise<EventIntelligenceDossier> {
  const res = await fetch(`${fnBase}/event-dossiers`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, dossier, action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Update failed");
  return data.dossier;
}
