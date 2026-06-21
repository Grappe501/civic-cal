const { json } = require("./lib/db");
const { runAiBrain } = require("./lib/ai-brain-server");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { question, mode = "admin", campaignSlug, county, city } = body;
  if (!question || typeof question !== "string") {
    return json(400, { error: "Missing question" });
  }
  if (!["public", "admin", "campaign"].includes(mode)) {
    return json(400, { error: "Invalid mode — use public, admin, or campaign" });
  }

  try {
    const result = await runAiBrain({ question, mode, campaignSlug, county, city });
    return json(200, result);
  } catch (err) {
    return json(500, { error: err.message });
  }
};
