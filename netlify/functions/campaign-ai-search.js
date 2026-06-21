const { getClient, json } = require("./lib/db");
const { deterministicStrategicSearch } = require("./lib/campaign-search-server");

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

  const { workspaceSlug, queryText, context } = body;
  if (!workspaceSlug || !queryText) {
    return json(400, { error: "Missing workspaceSlug or queryText" });
  }

  const client = getClient();
  let workspaceId = null;

  if (client) {
    try {
      await client.connect();
      const ws = await client.query(
        `SELECT id, slug, campaign_name, candidate_name, office_sought, district_type, district_name,
                counties, cities, district_scope, dashboard_theme
         FROM civic_call.campaign_workspaces WHERE slug = $1 LIMIT 1`,
        [workspaceSlug],
      );
      if (ws.rows.length) workspaceId = ws.rows[0].id;
    } catch (_) {}
  }

  let answer;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      answer = await runOpenAiSearch(openaiKey, queryText, context);
    } catch (err) {
      answer = deterministicStrategicSearch(queryText, context);
      answer.risks = [...(answer.risks || []), `OpenAI fallback: ${err.message}`];
    }
  } else {
    answer = deterministicStrategicSearch(queryText, context);
  }

  if (client && workspaceId) {
    try {
      await client.query(
        `INSERT INTO civic_call.campaign_ai_queries (workspace_id, query_text, query_context, answer_json)
         VALUES ($1, $2, $3, $4)`,
        [workspaceId, queryText, JSON.stringify(context || {}), JSON.stringify(answer)],
      );
      await client.end();
    } catch (_) {
      try {
        await client.end();
      } catch (_) {}
    }
  } else if (client) {
    try {
      await client.end();
    } catch (_) {}
  }

  return json(200, { answer });
};

async function runOpenAiSearch(apiKey, queryText, context) {
  const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
  const workspace = context?.workspace || {};
  const events = (context?.events || []).slice(0, 40);

  const system = `You are an Arkansas campaign event strategist. AI is advisory only — never auto-publish events.
Return JSON only with keys: summary, recommendedEvents (array of {eventId,title,city,county,eventDate,whyItMatters,suggestedRole,poScore,rdScore}), calendarGaps (string[]), suggestedRoles (string[]), risks (string[]), localIntelNeeded (string[]), nextActions (string[]).
Candidate: ${workspace.candidateName || "Unknown"}. Office: ${workspace.officeSought || ""}. District: ${workspace.districtName || ""}.`;

  const user = `Query: ${queryText}

Available events (sample):
${events.map((e) => `- ${e.id}: ${e.title} | ${e.city || ""} ${e.county || ""} | PO ${e.politicalOpportunityScore ?? "?"} RD ${e.relationshipDensityScore ?? "?"}`).join("\n")}

Gap hints: ${(context?.gapSummary || []).join("; ") || "none"}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  return { source: "openai", query: queryText, ...parsed };
}
