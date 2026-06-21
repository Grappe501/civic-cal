import fs from "node:fs";
import { STAGED_FILE, writeJson, nowIso } from "./lib/paths.mjs";
import { dedupeCandidates } from "./lib/dedupe-logic.mjs";

if (!fs.existsSync(STAGED_FILE)) {
  console.error("[harvest:dedupe] No staged file — run harvest:flagship first");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(STAGED_FILE, "utf8"));
const deduped = dedupeCandidates(data.candidates ?? []);
writeJson(STAGED_FILE, { ...data, generatedAt: nowIso(), count: deduped.length, candidates: deduped });
console.log(`[harvest:dedupe] ${data.candidates?.length ?? 0} → ${deduped.length}`);
