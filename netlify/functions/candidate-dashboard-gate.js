const { json } = require("./lib/db");

const SESSION_PREFIX = "civic-candidate-beta:";

function checkConfigured() {
  return Boolean(process.env.CANDIDATE_DASHBOARD_BETA_PASSWORD?.length);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }

  if (event.httpMethod === "GET") {
    return json(200, {
      configured: checkConfigured(),
      hint: checkConfigured()
        ? "POST password to unlock candidate dashboards for this browser session."
        : "Set CANDIDATE_DASHBOARD_BETA_PASSWORD in Netlify env (never commit the value).",
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!checkConfigured()) {
    return json(503, { ok: false, error: "not_configured" });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (_) {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const password = body.password ?? "";
  if (password !== process.env.CANDIDATE_DASHBOARD_BETA_PASSWORD) {
    return json(401, { ok: false, error: "invalid_password" });
  }

  const token = Buffer.from(`${SESSION_PREFIX}${Date.now()}`).toString("base64url");
  return json(200, { ok: true, token });
};
