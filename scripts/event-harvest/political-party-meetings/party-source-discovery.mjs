#!/usr/bin/env node
/**
 * Discover additional public party source URLs (county pages, calendars).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = path.join(ROOT, "data/event-harvest/political-party-source-registry.json");
const OUT = path.join(ROOT, "data/ingestion/political-party-source-discovery.json");

const ARKANSAS_COUNTIES = JSON.parse(fs.readFileSync(path.join(ROOT, "data/arkansas-counties.json"), "utf8")).counties;

function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const discovered = [];

  for (const county of ARKANSAS_COUNTIES) {
    const slug = county.toLowerCase().replace(/\s+/g, "-");
    discovered.push({
      county,
      party_label: "Democratic",
      url: `https://www.arkdems.org/county/${slug}/`,
      source_type: "political_party_public_page",
      discovery_method: "url_template",
      trust: "medium",
    });
  }

  for (const s of registry.sources ?? []) {
    discovered.push({ ...s, discovery_method: "registry_seed" });
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: discovered.length, sources: discovered }, null, 2),
  );

  console.log(`[discover:party-sources] ${discovered.length} source targets → ${OUT}`);
}

main();
