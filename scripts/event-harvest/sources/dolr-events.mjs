import fs from "node:fs";
import { ensureDirs, loadJson, writeJson, STAGED_FILE, RAW_DIR, nowIso } from "../lib/paths.mjs";
import { normalizeFromFlagship } from "../normalize-event-candidate.mjs";
import { dedupeCandidates } from "../lib/dedupe-logic.mjs";

ensureDirs();

const DOLR_EVENTS_URL = "https://www.dolr.org/events";

async function fetchPublicHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "ArkansasEverywhere-Harvester/1.0 (public civic calendar; contact: admin)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractDolrEventLinks(html) {
  const links = [];
  const re = /href="(\/events\/[^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const path = m[1];
    if (!links.includes(path)) links.push(path);
  }
  return links.slice(0, 20);
}

function loadExistingStaged() {
  if (!fs.existsSync(STAGED_FILE)) return [];
  return JSON.parse(fs.readFileSync(STAGED_FILE, "utf8")).candidates ?? [];
}

async function main() {
  const flagship = loadJson("data/ingestion/flagship-recurring-events.json");
  const fromFlagship = flagship.events.map(normalizeFromFlagship);

  let fromDolr = [];
  try {
    const html = await fetchPublicHtml(DOLR_EVENTS_URL);
    const links = extractDolrEventLinks(html);
    writeJson(`${RAW_DIR}/dolr-events-${nowIso().slice(0, 10)}.json`, {
      fetchedAt: nowIso(),
      url: DOLR_EVENTS_URL,
      linkCount: links.length,
      links: links.map((p) => `https://www.dolr.org${p}`),
    });

    for (const link of links) {
      if (/st-joseph|spaghetti|catholic-point|center-ridge/i.test(link)) {
        fromDolr.push({
          ...normalizeFromFlagship(flagship.events.find((e) => e.id.includes("st-joseph"))),
          source_url: link,
          review_status: "verified_flagship",
          confidence_score: 95,
        });
      }
    }
    console.log(`[harvest:flagship] DOLR fetch OK — ${links.length} event links found`);
  } catch (e) {
    console.warn(`[harvest:flagship] DOLR fetch skipped: ${e.message}`);
  }

  const merged = dedupeCandidates([...loadExistingStaged(), ...fromFlagship, ...fromDolr]);
  writeJson(STAGED_FILE, {
    generatedAt: nowIso(),
    count: merged.length,
    candidates: merged,
  });
  console.log(`[harvest:flagship] ${merged.length} staged candidates → ${STAGED_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
