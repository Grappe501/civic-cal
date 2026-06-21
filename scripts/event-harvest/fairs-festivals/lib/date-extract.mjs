/**
 * Extract dated festival occurrences from public HTML/text (no invented dates).
 */

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
const MONTH_MAP = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function toIso(y, m, d) {
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function monthNum(name) {
  return MONTH_MAP[String(name).toLowerCase()] ?? null;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetaContent(html) {
  const bits = [];
  const re = /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) bits.push(`${m[1]}: ${m[2]}`);
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) bits.push(title[1]);
  return bits.join(" ");
}

function parseJsonLdEvents(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1]);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const node of nodes) {
        if (!node || (node["@type"] !== "Event" && !String(node["@type"] || "").includes("Event"))) continue;
        const start = node.startDate || node.start_date;
        const end = node.endDate || node.end_date;
        if (!start) continue;
        const startDate = String(start).slice(0, 10);
        const endDate = end ? String(end).slice(0, 10) : startDate;
        out.push({ startDate, endDate, title: node.name || null, source: "json_ld" });
      }
    } catch {
      /* skip malformed */
    }
  }
  return out;
}

function extractNumericRanges(text, defaultYear = 2026) {
  const found = [];
  const patterns = [
    // June 26-28, 2026 | June 26–28, 2026
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})\\s*[–\\-&]\\s*(\\d{1,2}),?\\s*(20\\d{2})\\b`, "gi"),
    // May 1, 2 & 3, 2026
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2}),?\\s+(\\d{1,2})\\s*&\\s*(\\d{1,2}),?\\s*(20\\d{2})\\b`, "gi"),
    // October 7-11, 2026
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})\\s*[–\\-]\\s*(\\d{1,2}),?\\s*(20\\d{2})\\b`, "gi"),
    // 10/7–10/11/26
    /\b(\d{1,2})\/(\d{1,2})\s*[–\-]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g,
    // May 7-9, 2026 (same month dash)
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})\\s*[–\\-]\\s*(\\d{1,2}),?\\s*(20\\d{2})\\b`, "gi"),
    // August 6–8, 2026 with en-dash in prose
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})\\s*–\\s*(\\d{1,2}),?\\s*(20\\d{2})\\b`, "gi"),
    // ONSITE: October 8-10, 2026
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})\\s*[–\\-]\\s*(\\d{1,2}),?\\s*(20\\d{2})\\b`, "gi"),
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.length === 5 && /^\d/.test(m[1])) {
        const y = m[5].length === 2 ? 2000 + Number(m[5]) : Number(m[5]);
        const start = toIso(y, Number(m[1]), Number(m[2]));
        const end = toIso(y, Number(m[3]), Number(m[4]));
        if (start && end) found.push({ startDate: start, endDate: end, source: "numeric_slash" });
        continue;
      }
      const mon = monthNum(m[1]);
      const y = Number(m[m.length - 1]);
      if (!mon || !y) continue;
      if (m.length === 5 && m[3] && !String(m[3]).includes("20")) {
        // May 1, 2 & 3, 2026
        const d1 = Number(m[2]);
        const d3 = Number(m[4]);
        const start = toIso(y, mon, d1);
        const end = toIso(y, mon, d3);
        if (start && end) found.push({ startDate: start, endDate: end, source: "month_range_amp" });
      } else {
        const d1 = Number(m[2]);
        const d2 = Number(m[3]);
        const start = toIso(y, mon, d1);
        const end = toIso(y, mon, d2);
        if (start && end) found.push({ startDate: start, endDate: end, source: "month_range" });
      }
    }
  }

  // Single-day with year: Friday, June 26th
  const singleRe = new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(20\\d{2})\\b`, "gi");
  let sm;
  while ((sm = singleRe.exec(text))) {
    const mon = monthNum(sm[1]);
    const iso = toIso(Number(sm[3]), mon, Number(sm[2]));
    if (iso) found.push({ startDate: iso, endDate: iso, source: "single_day" });
  }

  if (!found.length && defaultYear) {
    // Same patterns without year — only if year appears elsewhere in text
    if (!/\b20\d{2}\b/.test(text)) return found;
    const yMatch = text.match(/\b(20\d{2})\b/);
    const y = yMatch ? Number(yMatch[1]) : defaultYear;
    const noYear = new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})\\s*[–\\-]\\s*(\\d{1,2})\\b`, "gi");
    let nm;
    while ((nm = noYear.exec(text))) {
      const mon = monthNum(nm[1]);
      const start = toIso(y, mon, Number(nm[2]));
      const end = toIso(y, mon, Number(nm[3]));
      if (start && end) found.push({ startDate: start, endDate: end, source: "month_range_inferred_year" });
    }
  }

  return found;
}

export function extractDatesFromHtml(html, opts = {}) {
  const text = `${stripTags(html)} ${extractMetaContent(html)}`;
  const jsonLd = parseJsonLdEvents(html);
  const ranges = extractNumericRanges(text, opts.defaultYear ?? 2026);
  const combined = [...jsonLd, ...ranges];
  const seen = new Set();
  return combined.filter((r) => {
    const key = `${r.startDate}|${r.endDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const y = Number(r.startDate.slice(0, 4));
    if (y < 2025 || y > 2027) return false;
    return true;
  });
}

export function pickBestDateRange(ranges, titleHint = "") {
  if (!ranges.length) return null;
  const scored = ranges.map((r) => {
    let score = 0;
    if (r.startDate.startsWith("2026")) score += 10;
    const span = (new Date(r.endDate) - new Date(r.startDate)) / 86400000;
    if (span >= 1 && span <= 14) score += 10;
    if (r.source === "json_ld") score += 12;
    if (r.source === "month_range" || r.source === "month_range_amp" || r.source === "month_range_inferred_year")
      score += 8;
    if (r.source === "single_day") score -= 8;

    const month = Number(r.startDate.slice(5, 7));
    if (/grape|watermelon|peach|tomato|crawdad|bean|pickle/i.test(titleHint) && month < 5) score -= 20;
    if (/blues|hillberry|scotsfest|bikes.*blues/i.test(titleHint) && month >= 1 && month <= 6) score -= 15;

    return { ...r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored[0].score < 3) return null;
  return scored[0];
}
