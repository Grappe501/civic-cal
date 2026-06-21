/**
 * Pass 28 — MaxPreps schedule page parser.
 */
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

function parseDate(text) {
  const m = String(text).match(/(\d{1,2})\/(\d{1,2})\/(?:\d{2}|\d{4})/);
  if (!m) return null;
  let y = m[3] ?? m[0].slice(-4);
  if (y.length === 2) y = `20${y}`;
  return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

export function discoverMaxPrepsUrls(html) {
  const urls = new Set();
  const re = /https?:\/\/[^"'\\s]*maxpreps\.com[^"'\\s]*schedule[^"'\\s]*/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.add(m[0].replace(/&amp;/g, "&"));
  return [...urls];
}

export function parseMaxPrepsHtml(html, sourceUrl) {
  const events = [];
  const seen = new Set();
  const rowRe = /(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\S]{0,200}?(?:vs\.?|@)[\s\S]{0,120}/gi;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const eventDate = parseDate(m[1]);
    if (!eventDate || eventDate < "2026-01-01" || eventDate > "2027-12-31") continue;
    const chunk = m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
    const key = `${eventDate}|${chunk.slice(0, 35)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({
      title: chunk,
      event_date: eventDate,
      source_url: sourceUrl,
      confidence_score: platformConfidence("maxpreps"),
      platform: "maxpreps",
      raw_text: chunk,
      lane_id: classifySchoolLane(chunk),
    });
  }
  return events.slice(0, 60);
}
