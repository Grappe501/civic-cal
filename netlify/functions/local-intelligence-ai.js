const { json } = require("./lib/db");
const { deterministicLocalSummaryServer } = require("./lib/local-intelligence-ai-server");

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

  const ctx = body.context;
  if (!ctx?.workspace) return json(400, { error: "Missing context.workspace" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
      const system = `You are an Arkansas campaign local intelligence advisor. CANDIDATE-ONLY advisory.
Rules: aggregate public geography data only; NEVER infer individual voter preferences or micro-target voters.
Separate facts from estimates. Label uncertainty. Return JSON with: whyItMatters, eventsThatMatter (string[]), calendarGaps (string[]), electionContext, relationshipGuidance, questionsForLocals (string[]), confidenceNotes, missingData (string[]).`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(ctx) },
          ],
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return json(200, { summary: { source: "openai", ...parsed } });
    } catch (err) {
      const fallback = deterministicLocalSummaryServer(ctx);
      fallback.confidenceNotes += ` (OpenAI fallback: ${err.message})`;
      return json(200, { summary: fallback });
    }
  }

  return json(200, { summary: deterministicLocalSummaryServer(ctx) });
};
