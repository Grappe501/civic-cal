const { json } = require("./lib/db");
const { deterministicPublicDiscoverySearchServer } = require("./lib/public-discovery-ai-server");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { query, mode, sampleTitles = [] } = body;
  if (!query) return json(400, { error: "Missing query" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
      const system = `You are Arkansas Everywhere public discovery assistant. Help people explore events conversationally — NOT database filters.
Return JSON: { headline, summary, eventIds (empty array ok), followUpPrompts (string[]), mode }.
Use aggregate public geography only. Never infer individual voter preferences.`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify({ query, mode, sampleTitles }) },
          ],
          temperature: 0.4,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return json(200, { answer: { source: "openai", query, mode, eventIds: [], followUpPrompts: [], ...parsed } });
    } catch (err) {
      const fallback = deterministicPublicDiscoverySearchServer(query, mode || "citizen", sampleTitles);
      fallback.summary += ` (OpenAI fallback: ${err.message})`;
      return json(200, { answer: fallback });
    }
  }

  return json(200, { answer: deterministicPublicDiscoverySearchServer(query, mode || "citizen", sampleTitles) });
};
