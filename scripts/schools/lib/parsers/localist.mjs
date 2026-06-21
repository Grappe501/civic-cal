/**
 * Pass 28 — Localist calendar JSON API (common on college sites).
 */
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

function parseIsoDay(val) {
  if (!val) return null;
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function localistApiCandidates(pageUrl) {
  try {
    const base = new URL(pageUrl);
    if (!/localist|calendar\./i.test(base.hostname + pageUrl)) return [];
    return [
      `${base.origin}/api/2/events?days=180&pp=100`,
      `${base.origin}/api/2/events/search?days=180&pp=100`,
    ];
  } catch {
    return [];
  }
}

export function parseLocalistJson(json, sourceUrl) {
  const rows = json?.events ?? json?.data ?? [];
  const events = [];
  for (const row of rows) {
    const inst = row.event_instances?.[0]?.event_instance ?? row.event_instance ?? row;
    const start = inst?.start ?? inst?.start_time ?? row.start ?? row.start_time;
    const eventDate = parseIsoDay(start);
    if (!eventDate || eventDate < "2026-01-01" || eventDate > "2027-12-31") continue;
    const title = String(row.title ?? row.name ?? inst?.title ?? "Event").slice(0, 180);
    events.push({
      title,
      event_date: eventDate,
      source_url: row.localist_url ?? row.url ?? sourceUrl,
      confidence_score: platformConfidence("localist"),
      platform: "localist",
      raw_text: String(row.description ?? row.summary ?? title).slice(0, 400),
      lane_id: classifySchoolLane(`${title} ${row.description ?? ""}`),
    });
  }
  return events.slice(0, 150);
}
