/**
 * Pass 28 — DragonFly / GoFan ticket event pages (light parse).
 */
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

function parseDate(text) {
  const s = String(text ?? "");
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  const m2 = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseTicketPlatform(html, sourceUrl, platform) {
  const events = [];
  const re = /"start(?:Date|_date|Time)?"\s*:\s*"([^"]+)"[\s\S]{0,400}?"title"\s*:\s*"([^"]+)"/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(html)) !== null) {
    const eventDate = parseDate(m[1]);
    if (!eventDate || eventDate < "2026-01-01" || eventDate > "2027-12-31") continue;
    const title = m[2].slice(0, 180);
    const key = `${eventDate}|${title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({
      title,
      event_date: eventDate,
      source_url: sourceUrl,
      confidence_score: platformConfidence(platform),
      platform,
      raw_text: title,
      lane_id: classifySchoolLane(title),
    });
  }
  return events;
}

export function discoverDragonFlyUrls(html) {
  const urls = new Set();
  const re = /https?:\/\/[^"'\\s]*dragonflymax\.com[^"'\\s]*/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.add(m[0]);
  return [...urls];
}

export function discoverGoFanUrls(html) {
  const urls = new Set();
  const re = /https?:\/\/[^"'\\s]*gofan\.(?:co|net)[^"'\\s]*/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.add(m[0]);
  return [...urls];
}

export function parseDragonFlyHtml(html, sourceUrl) {
  return parseTicketPlatform(html, sourceUrl, "dragonfly");
}

export function parseGoFanHtml(html, sourceUrl) {
  return parseTicketPlatform(html, sourceUrl, "gofan");
}
