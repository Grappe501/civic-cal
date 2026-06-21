#!/usr/bin/env node
/** Pass 24 — weekly wrapper around feed discovery (Pass 23C). */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendRun, updateHealth, readJson } from "./lib/autogrow-io.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const config = readJson("autogrow-config.json");
const limit = config.limits?.weeklyDiscoveryVerifyLimit ?? 400;

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

async function main() {
  run("node", ["scripts/run-with-h-drive-env.cjs", "node", "scripts/feeds/discover-feed-urls.mjs"], {
    FEED_DISCOVER_VERIFY_LIMIT: String(limit),
  });
  run("node", ["scripts/run-with-h-drive-env.cjs", "node", "scripts/feeds/apply-feed-discovery.mjs"]);
  run("node", ["scripts/run-with-h-drive-env.cjs", "node", "scripts/feeds/build-feed-attachment-report.mjs"]);

  let coverageGained = 0;
  try {
    const report = JSON.parse(fs.readFileSync(path.join(ROOT, "data/feeds/feed-attachment-report.json"), "utf8"));
    coverageGained = report.metrics?.feedsAttached ?? 0;
  } catch (_) {}

  appendRun("weekly_feed_discovery", { coverageGained, verifyLimit: limit });
  updateHealth({ lastWeeklyDiscovery: new Date().toISOString(), coverageGained, status: "idle" });
  console.log("[autogrow:weekly-discovery] complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
