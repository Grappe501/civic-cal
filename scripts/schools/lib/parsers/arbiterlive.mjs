/**
 * Pass 28 — ArbiterLive athletics schedule HTML parser.
 */
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

function parseDate(text) {
  const s = String(text ?? "");
  const m1 = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return `${m1[3]}-${m1[1].padStart(2, "0")}-${m1[2].padStart(2, "0")}`;
  const m2 = s.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m2) {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const mi = months.indexOf(m2[1].toLowerCase());
    if (mi >= 0) return `${m2[3]}-${String(mi + 1).padStart(2, "0")}-${String(m2[2]).padStart(2, "0")}`;
  }
  return null;
}

export function discoverArbiterUrls(html, pageUrl) {
  const urls = new Set();
  const re = /https?:\/\/[^"'\\s]*arbiterlive\.com[^"'\\s]*/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.add(m[0].replace(/&amp;/g, "&"));
  return [...urls];
}

export function parseArbiterLiveHtml(html, sourceUrl) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const events = [];
  const seen = new Set();

  const gameRe = /(\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})[^]{0,120}?(?:vs\.?|@|v\.s\.)[^]{0,120}?(football|basketball|baseball|softball|volleyball|soccer|track|wrestling)/gi;
  let m;
  while ((m = gameRe.exec(text)) !== null) {
    const eventDate = parseDate(m[1]);
    if (!eventDate || eventDate < "2026-01-01" || eventDate > "2027-12-31") continue;
    const ctx = text.slice(m.index, m.index + 160).trim();
    const title = ctx.slice(0, 120);
    const key = `${eventDate}|${title.slice(0, 30)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({
      title,
      event_date: eventDate,
      source_url: sourceUrl,
      confidence_score: platformConfidence("arbiterlive"),
      platform: "arbiterlive",
      raw_text: ctx,
      lane_id: classifySchoolLane(ctx),
    });
  }

  return events.slice(0, 80);
}
