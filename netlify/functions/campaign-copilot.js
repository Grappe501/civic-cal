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

  const { task, eventTitle, recommendation, factors, warnings, confidence } = body;
  const openaiKey = process.env.OPENAI_API_KEY;

  const rule = {
    explanation: `${recommendation} for "${eventTitle}" based on: ${(factors || []).join("; ") || "public event data"}. ${(warnings || []).join(" ") || ""} Confidence: ${confidence || "medium"}.`,
    uncertainty: warnings?.length ? warnings : ["Verify attendance and venue locally"],
    suggestedNextStep: "Confirm with local organizer before updating plan status.",
  };

  if (!openaiKey || task !== "explain_recommendation") {
    return json(200, { result: rule, source: "rules" });
  }

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
              "Campaign logistics copilot. Use only provided facts. Label uncertainty. Never invent attendance or voter behavior. Return JSON with explanation, uncertainty array, suggestedNextStep.",
          },
          { role: "user", content: JSON.stringify(body) },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return json(200, { result: JSON.parse(data.choices[0].message.content), source: "openai" });
  } catch (err) {
    return json(200, { result: rule, source: "rules", fallback: String(err.message || err) });
  }
};
