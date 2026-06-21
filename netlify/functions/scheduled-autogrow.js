const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

exports.handler = async () => {
  try {
    execSync("node scripts/run-with-h-drive-env.cjs node scripts/autogrow/run-daily-feed-scan.mjs", {
      cwd: ROOT,
      stdio: "pipe",
      timeout: 240000,
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true, task: "daily_feed_scan" }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e.message || e).slice(0, 300) }) };
  }
};

exports.config = {
  schedule: "0 6 * * *",
};
