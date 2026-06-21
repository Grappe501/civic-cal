#!/usr/bin/env node
/**
 * Pass 32 — Harvest source-backed events from Arkansas.com tourism calendar (Jina reader).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TOP200 = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
const OUT = path.join(ROOT, "data/ingestion/pass32-arkansas-tourism-events.json");
const JINA = "https://r.jina.ai/";
const DELAY_MS = Number(process.env.TOURISM_FETCH_DELAY_MS ?? 400);
const PAGE_LIMIT = Number(process.env.TOURISM_PAGE_LIMIT ?? 12);

const LIST_URLS = [
  "https://www.arkansas.com/experiences/discover/event-calendar",
  "https://www.arkansas.com/events/family",
  "https://www.arkansas.com/natural-state/events",
];

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function loadCityCountyMap() {
  const top200 = JSON.parse(fs.readFileSync(TOP200, "utf8"));
  const map = new Map();
  for (const row of top200.cities ?? []) {
    map.set(row.city.toLowerCase(), row.county);
  }
  return map;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseMonthDayYear(token) {
  const m = token.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (!m) return null;
  const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!mon) return null;
  const year = m[3] || "2026";
  return `${year}-${pad(mon)}-${pad(Number(m[2]))}`;
}

function parseDateRange(text) {
  const t = String(text).trim();
  const crossYear = t.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2})\s+(\d{4})$/,
  );
  if (crossYear) {
    const sm = MONTHS[crossYear[1].slice(0, 3).toLowerCase()];
    const em = MONTHS[crossYear[3].slice(0, 3).toLowerCase()];
    if (sm && em) {
      return {
        start: `${crossYear[5]}-${pad(sm)}-${pad(Number(crossYear[2]))}`,
        end: `${crossYear[5]}-${pad(em)}-${pad(Number(crossYear[4]))}`,
      };
    }
  }
  const sameMonth = t.match(/^([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*(\d{1,2})\s+(\d{4})$/);
  if (sameMonth) {
    const mon = MONTHS[sameMonth[1].slice(0, 3).toLowerCase()];
    if (mon) {
      return {
        start: `${sameMonth[4]}-${pad(mon)}-${pad(Number(sameMonth[2]))}`,
        end: `${sameMonth[4]}-${pad(mon)}-${pad(Number(sameMonth[3]))}`,
      };
    }
  }
  const single = parseMonthDayYear(t);
  if (single) return { start: single, end: single };
  return null;
}

function parseCityFromAddress(line) {
  const hit = String(line).match(/,\s*([A-Za-z .'-]+),\s*AR(?:\s+\d{5})?\b/i);
  if (hit) return hit[1].trim().replace(/^,\s*/, "");
  const alt = String(line).match(/\b([A-Za-z .'-]+),\s*AR\b/);
  return alt ? alt[1].trim() : null;
}

function isFestivalLike(title, description) {
  const blob = `${title} ${description}`;
  return /festival|fair|parade|rodeo|jubilee|celebration|fest\b|cook-?off|cookoff|market|homecoming|founders|heritage|watermelon|tomato|peach|crawfish|chili|bbq|block party|fish fry|chicken fry|ren fest|renaissance/i.test(
    blob,
  );
}

function parseEventsFromMarkdown(md, categoryHint) {
  const events = [];
  const re = /### \[([^\]]+)\]\((https:\/\/www\.arkansas\.com[^)]+)\)/g;
  let match;
  while ((match = re.exec(md)) !== null) {
    const title = match[1].trim();
    const source_url = match[2].trim();
    const before = md.slice(Math.max(0, match.index - 500), match.index);
    const after = md.slice(match.index, match.index + 1200);
    const dateHit = before.match(
      /([A-Za-z]{3,9}\s+\d{1,2}(?:\s*-\s*(?:[A-Za-z]{3,9}\s+)?\d{1,2})?\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2}(?:\s*-\s*[A-Za-z]{3,9}\s+\d{1,2})?\s+\d{4})/,
    );
    const range = dateHit ? parseDateRange(dateHit[1]) : null;
    const addressLine =
      after.split("\n").find((l) => /,\s*AR\b/i.test(l) && !l.startsWith("###")) ?? "";
    const description = after
      .split("\n")
      .slice(2, 6)
      .join(" ")
      .trim();
    const city = parseCityFromAddress(addressLine);
    if (!title || !city || !range?.start) continue;
    if (!isFestivalLike(title, description) && categoryHint !== "family") continue;
    events.push({
      title,
      event_date: range.start,
      end_date: range.end || range.start,
      city,
      venue: addressLine.split(",")[0]?.trim() || null,
      address: addressLine.trim(),
      source_url,
      description: description.slice(0, 500) || null,
      harvest_category: /fair|rodeo/i.test(title) ? "county_fair" : "festival",
      category: "community",
      is_recurring_annual: /annual|\d+(st|nd|rd|th)\s/i.test(title),
      host_organization: title,
    });
  }
  return events;
}

async function fetchMarkdown(url) {
  const res = await fetch(`${JINA}${url}`, { headers: { Accept: "text/plain" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const cityCounty = loadCityCountyMap();
  const byKey = new Map();
  const fetchLog = [];

  for (const base of LIST_URLS) {
    for (let page = 0; page < PAGE_LIMIT; page++) {
      const url = page === 0 ? base : `${base}${base.includes("?") ? "&" : "?"}page=${page}`;
      try {
        const md = await fetchMarkdown(url);
        const parsed = parseEventsFromMarkdown(md, base.includes("family") ? "family" : "festival");
        fetchLog.push({ url, parsed: parsed.length, len: md.length });
        for (const ev of parsed) {
          const county = cityCounty.get(ev.city.toLowerCase()) ?? "Unknown";
          const key = slugify(`${ev.title}-${ev.event_date}-${ev.city}`);
          if (!byKey.has(key)) byKey.set(key, { ...ev, county, id: key });
        }
        await sleep(DELAY_MS);
      } catch (e) {
        fetchLog.push({ url, error: e.message });
      }
    }
  }

  const events = [...byKey.values()];
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        pass: "32",
        generatedAt: new Date().toISOString(),
        source: "arkansas.com_tourism",
        eventCount: events.length,
        fetchLog,
        events,
      },
      null,
      2,
    ),
  );
  console.log(`[harvest:arkansas-tourism] festivals/events parsed:${events.length} pages:${fetchLog.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
