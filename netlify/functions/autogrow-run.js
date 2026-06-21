const { execSync } = require("child_process");
const path = require("path");
const { json } = require("./lib/db");

const ROOT = path.resolve(__dirname, "../..");
const TASKS = {
  daily_feed_scan: "scripts/autogrow/run-daily-feed-scan.mjs",
  weekly_feed_discovery: "scripts/autogrow/run-weekly-feed-discovery.mjs",
  weekly_profile_refresh: "scripts/autogrow/run-profile-refresh.mjs",
  weekly_campaign_briefings: "scripts/autogrow/run-candidate-briefings.mjs",
};

function runScript(rel) {
  execSync(`node scripts/run-with-h-drive-env.cjs node ${rel}`, {
    cwd: ROOT,
    stdio: "pipe",
    timeout: 240000,
    env: process.env,
  });
}

async function handler(event) {
  const task = event.queryStringParameters?.task || (event.body ? JSON.parse(event.body).task : null);
  if (!task || !TASKS[task]) return json(400, { ok: false, error: "Unknown task" });

  try {
    runScript(TASKS[task]);
    return json(200, { ok: true, task });
  } catch (e) {
    return json(500, { ok: false, error: String(e.message || e).slice(0, 500) });
  }
}

exports.handler = handler;
