/**
 * Autogrow shared I/O and run logging.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DATA = path.join(ROOT, "data/autogrow");

export function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

export function writeJson(name, data) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(data, null, 2));
}

export function readFeedRegistries() {
  const county = JSON.parse(fs.readFileSync(path.join(ROOT, "data/feeds/county-feed-registry.json"), "utf8")).feeds ?? [];
  const city = JSON.parse(fs.readFileSync(path.join(ROOT, "data/feeds/city-feed-registry.json"), "utf8")).feeds ?? [];
  let institution = [];
  try {
    institution = JSON.parse(fs.readFileSync(path.join(ROOT, "data/feeds/institution-feed-registry.json"), "utf8")).feeds ?? [];
  } catch (_) {}
  return [...county, ...city, ...institution].filter((f) => f.attachment_status === "attached" && f.calendar_url);
}

export function appendRun(task, summary) {
  const runs = readJson("autogrow-runs.json");
  const entry = { id: `${task}-${Date.now()}`, task, at: new Date().toISOString(), ...summary };
  runs.runs = [entry, ...(runs.runs ?? [])].slice(0, 100);
  runs.lastRun = entry;
  runs.generatedAt = entry.at;
  writeJson("autogrow-runs.json", runs);
  return entry;
}

export function updateHealth(patch) {
  const health = readJson("autogrow-health.json");
  writeJson("autogrow-health.json", { ...health, ...patch, generatedAt: new Date().toISOString() });
}

export function loadStagedAutogrow() {
  const p = path.join(ROOT, "data/ingestion/autogrow-staged-candidates.json");
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { candidates: [] };
  }
}

export function saveStagedAutogrow(bundle) {
  const p = path.join(ROOT, "data/ingestion/autogrow-staged-candidates.json");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(bundle, null, 2));
}

export { ROOT, DATA };
