const { json } = require("./lib/db");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { county, countyCoverage, knownInstitutions, attachedFeeds } = body;
  const openaiKey = process.env.OPENAI_API_KEY;

  const ruleResult = {
    county,
    institutions: countyCoverage?.institutions ?? knownInstitutions ?? 0,
    feedsAttached: countyCoverage?.feedsAttached ?? attachedFeeds ?? 0,
    feedsMissing: countyCoverage?.feedsMissing ?? null,
    coveragePercent: countyCoverage?.coveragePercent ?? null,
    highestProbabilityFeeds: [
      `${county} County Library`,
      `${county} County school district calendar`,
      `${county} County Cooperative Extension`,
      `${county} County parks and recreation`,
      `Major ${county} County church calendars`,
    ],
    recommendedSearches: [
      `site:.k12.ar.us ${county} County Arkansas calendar`,
      `${county} County Arkansas library events`,
      `${county} County Arkansas extension 4-H calendar`,
    ],
    expectedAnnualYield: 84,
    notes: ["Advisory only — attach verified public calendar URLs.", "Do not invent events."],
  };

  if (!openaiKey) return json(200, { result: ruleResult, source: "rules" });

  try {
    const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a neutral Arkansas civic feed discovery assistant. Recommend public calendar sources to attach. Never invent events. Return JSON with highestProbabilityFeeds, recommendedSearches, expectedAnnualYield, notes.",
          },
          { role: "user", content: JSON.stringify({ task: "feed_discovery", county, countyCoverage, knownInstitutions, attachedFeeds }) },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return json(200, { result: JSON.parse(data.choices[0].message.content), source: "openai" });
  } catch (err) {
    return json(200, { result: ruleResult, source: "rules", fallback: String(err.message || err) });
  }
};
