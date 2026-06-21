/**
 * Pass 28 — parse JSON-LD Event blocks from HTML.
 */
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

function parseDate(val) {
  if (!val) return null;
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function collectEvents(node, out) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const n of node) collectEvents(n, out);
    return;
  }
  if (typeof node !== "object") return;

  const type = node["@type"];
  const types = Array.isArray(type) ? type : type ? [type] : [];
  if (types.some((t) => /event/i.test(String(t)))) {
    const start = node.startDate ?? node.startTime ?? node.dtstart;
    const eventDate = parseDate(start);
    if (eventDate && eventDate >= "2026-01-01" && eventDate <= "2027-12-31") {
      const title = String(node.name ?? node.title ?? "Event").slice(0, 180);
      out.push({
        title,
        event_date: eventDate,
        source_url: node.url ?? node.sameAs ?? null,
        confidence_score: platformConfidence("json_ld"),
        platform: "json_ld",
        raw_text: String(node.description ?? title).slice(0, 400),
        lane_id: classifySchoolLane(`${title} ${node.description ?? ""}`),
      });
    }
  }

  for (const v of Object.values(node)) {
    if (v && typeof v === "object") collectEvents(v, out);
  }
}

export function parseJsonLdEvents(html, sourceUrl) {
  const events = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim());
      collectEvents(json, events);
    } catch {
      /* skip malformed */
    }
  }

  const seen = new Set();
  return events.filter((e) => {
    const key = `${e.event_date}|${e.title.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    e.source_url = e.source_url || sourceUrl;
    return true;
  });
}
