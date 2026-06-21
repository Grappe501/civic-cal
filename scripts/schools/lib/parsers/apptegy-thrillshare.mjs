/**
 * Pass 28 — Apptegy / Thrillshare embedded JSON and RSS discovery.
 */
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

function parseFlexibleDate(text) {
  if (!text) return null;
  const s = String(text);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function walkForEvents(node, out, depth = 0) {
  if (!node || depth > 8) return;
  if (Array.isArray(node)) {
    for (const n of node) walkForEvents(n, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;

  const title = node.title ?? node.name ?? node.summary ?? node.headline;
  const start = node.startDate ?? node.start_date ?? node.start ?? node.date ?? node.eventDate ?? node.publishDate;
  if (title && start) {
    const eventDate = parseFlexibleDate(start);
    if (eventDate && eventDate >= "2026-01-01" && eventDate <= "2027-12-31") {
      out.push({
        title: String(title).slice(0, 180),
        event_date: eventDate,
        source_url: node.url ?? node.link ?? node.href ?? null,
        confidence_score: platformConfidence("thrillshare"),
        platform: "thrillshare",
        raw_text: String(node.description ?? node.body ?? title).slice(0, 400),
        lane_id: classifySchoolLane(`${title} ${node.description ?? ""}`),
      });
    }
  }

  for (const v of Object.values(node)) {
    if (v && typeof v === "object") walkForEvents(v, out, depth + 1);
  }
}

export function discoverApptegyFeedUrls(html, pageUrl) {
  const urls = new Set();
  try {
    const base = new URL(pageUrl);
    for (const path of ["/rss.xml", "/feed", "/calendar/feed", "/events/feed"]) {
      urls.add(new URL(path, base).href);
    }
  } catch {
    /* ignore */
  }

  const re = /https?:\/\/[^"'\\s]+(?:apptegy|thrillshare|5il\.co)[^"'\\s]*/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.add(m[0]);

  return [...urls];
}

export function parseApptegyThrillshareHtml(html, sourceUrl) {
  const events = [];
  const jsonBlobs = html.match(/<script[^>]*>([\s\S]{50,80000}?)<\/script>/gi) ?? [];
  for (const blob of jsonBlobs) {
    if (!/event|calendar|thrillshare|apptegy/i.test(blob)) continue;
    const inner = blob.replace(/<\/?script[^>]*>/gi, "");
    if (!/[\[{]/.test(inner)) continue;
    try {
      const start = inner.indexOf("{");
      const arrStart = inner.indexOf("[");
      const idx = start >= 0 && (arrStart < 0 || start < arrStart) ? start : arrStart;
      if (idx < 0) continue;
      const json = JSON.parse(inner.slice(idx));
      walkForEvents(json, events);
    } catch {
      /* not JSON */
    }
  }

  const itemRe = /<item[\s\S]*?<\/item>/gi;
  let block;
  while ((block = itemRe.exec(html)) !== null) {
    const title = block[0].match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
    const pub = block[0].match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    const link = block[0].match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const eventDate = parseFlexibleDate(pub);
    if (title && eventDate && eventDate >= "2026-01-01" && eventDate <= "2027-12-31") {
      events.push({
        title: title.slice(0, 180),
        event_date: eventDate,
        source_url: link || sourceUrl,
        confidence_score: platformConfidence("rss"),
        platform: "rss",
        raw_text: title,
        lane_id: classifySchoolLane(title),
      });
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
