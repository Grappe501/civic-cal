#!/usr/bin/env node
/**
 * Pass 32 — Festival density discovery: research queue + optional live search.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCitySearchQueries, buildCountyFestivalQueries } from "./festival-identity-patterns.mjs";
import { searchWeb, hasSearchProvider } from "../lib/search-provider.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TOP200 = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
const OUT = path.join(ROOT, "data/ingestion/pass32-festival-research-queue.json");
const DISCOVERED = path.join(ROOT, "data/ingestion/pass32-festival-discovered-candidates.json");
const CITY_LIMIT = Number(process.env.FESTIVAL_CITY_LIMIT ?? 250);
const QUERY_LIMIT = Number(process.env.FESTIVAL_QUERY_LIMIT ?? 5);
const DELAY_MS = Number(process.env.FESTIVAL_SEARCH_DELAY_MS ?? 300);

function loadTop250() {
  const top200 = JSON.parse(fs.readFileSync(TOP200, "utf8"));
  const cities = [...(top200.cities ?? [])];
  const counties = JSON.parse(fs.readFileSync(path.join(ROOT, "data/arkansas-counties.json"), "utf8")).counties;
  const seen = new Set(cities.map((c) => `${c.city}|${c.county}`));
  for (const county of counties) {
    if (cities.length >= CITY_LIMIT) break;
    cities.push({ city: `${county} County`, county, region: "Arkansas", priority_rank: cities.length + 1 });
    seen.add(`${county} County|${county}`);
  }
  return cities.slice(0, CITY_LIMIT);
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function parseDateFromSnippet(text) {
  const m = String(text).match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  for (let i = 0; i < months.length; i++) {
    const re = new RegExp(`${months[i]}\\s+(\\d{1,2})(?:,?\\s*(20\\d{2}))?`, "i");
    const hit = text.match(re);
    if (hit) {
      const year = hit[2] || "2026";
      return `${year}-${String(i + 1).padStart(2, "0")}-${hit[1].padStart(2, "0")}`;
    }
  }
  return null;
}

function hitToCandidate(hit, cityRow, query) {
  const title = hit.title?.replace(/\s*[-|].*$/, "").trim();
  if (!title || title.length < 4) return null;
  if (!/festival|fair|parade|rodeo|market|cookoff|jubilee|celebration|fest\b/i.test(`${title} ${hit.snippet}`)) return null;
  const event_date = parseDateFromSnippet(`${hit.snippet} ${hit.title}`);
  return {
    id: slugify(`${title}-${cityRow.city}-${event_date || "tbd"}`),
    title,
    event_date,
    city: cityRow.city,
    county: cityRow.county,
    source_url: hit.url,
    source_type: "web_search_discovery",
    source_confidence: event_date ? "medium" : "low",
    description: hit.snippet?.slice(0, 400) ?? null,
    discovered_by: "pass32_festival_density",
    search_query: query,
    review_status: event_date ? "needs_verification" : "research_task",
  };
}

async function main() {
  const cities = loadTop250();
  const queue = [];
  const discovered = [];
  const searchEnabled = hasSearchProvider();

  for (const cityRow of cities) {
    const queries = [...buildCitySearchQueries(cityRow.city), ...buildCountyFestivalQueries(cityRow.county)];
    for (const q of queries) {
      queue.push({
        city: cityRow.city,
        county: cityRow.county,
        query: q,
        priority: "high",
        pass: "32",
        status: "open",
        queuedAt: new Date().toISOString(),
      });
    }

    if (searchEnabled) {
      for (const q of queries.slice(0, QUERY_LIMIT)) {
        try {
          const results = await searchWeb(q, { limit: 5 });
          for (const hit of results ?? []) {
            const c = hitToCandidate(hit, cityRow, q);
            if (c) discovered.push(c);
          }
          await new Promise((r) => setTimeout(r, DELAY_MS));
        } catch {
          /* skip */
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        pass: "32",
        generatedAt: new Date().toISOString(),
        citiesScanned: cities.length,
        searchEnabled,
        queryCount: queue.length,
        discoveredCount: discovered.length,
        queue: queue.slice(0, 5000),
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    DISCOVERED,
    JSON.stringify({ pass: "32", generatedAt: new Date().toISOString(), candidates: discovered }, null, 2),
  );

  console.log(
    `[festival:discover-density] cities:${cities.length} queries:${queue.length} discovered:${discovered.length} search:${searchEnabled ? "on" : "plan-only"}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
