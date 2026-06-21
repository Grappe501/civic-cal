/**
 * Pass 27 — lightweight HTML event extraction from district / athletics pages.
 */
import { classifySchoolLane } from "./school-lane-classifier.mjs";

const DATE_PATTERNS = [
  /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
  /\b(\d{4})-(\d{2})-(\d{2})\b/g,
];

const EVENT_KEYWORDS =
  /school board|board meeting|football|basketball|homecoming|senior night|graduation|commencement|band concert|concert|play|theater|theatre|pto|booster|fundraiser|vs\.|game|athletics/i;

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIsoDate(match, patternIndex) {
  try {
    if (patternIndex === 0) {
      const [, m, d, y] = match;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    if (patternIndex === 1) {
      const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const month = months.indexOf(String(match[1]).toLowerCase());
      if (month < 0) return null;
      const d = String(match[2]).padStart(2, "0");
      const m = String(month + 1).padStart(2, "0");
      return `${match[3]}-${m}-${d}`;
    }
    if (patternIndex === 2) return match[0];
  } catch {
    return null;
  }
  return null;
}

function contextWindow(text, index, radius = 120) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).trim();
}

export function parseSchoolCalendarHtml(html, sourceUrl) {
  const text = stripHtml(html);
  const events = [];
  const seen = new Set();

  for (let pi = 0; pi < DATE_PATTERNS.length; pi++) {
    const re = DATE_PATTERNS[pi];
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const eventDate = parseIsoDate(match, pi);
      if (!eventDate || eventDate < "2026-01-01" || eventDate > "2027-12-31") continue;

      const ctx = contextWindow(text, match.index);
      if (!EVENT_KEYWORDS.test(ctx)) continue;

      const laneId = classifySchoolLane(ctx);
      const title = ctx.slice(0, 100).replace(/\s+/g, " ").trim();
      const key = `${eventDate}|${laneId}|${title.slice(0, 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      events.push({
        title,
        event_date: eventDate,
        lane_id: laneId,
        raw_text: ctx,
        source_url: sourceUrl,
        confidence_score: 55,
      });
    }
  }

  return events.slice(0, 80);
}
