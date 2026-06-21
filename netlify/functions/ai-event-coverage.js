const { json } = require("./lib/db");

function ruleRecurrence(text) {
  const t = String(text || "").toLowerCase();
  if (/awaiting committee confirmation/i.test(t)) {
    return { confidence: 20, ambiguous: true, uncertainty: ["awaiting_confirmation"], missingFields: ["recurrence", "venue"] };
  }
  const ord = t.match(/(1st|2nd|3rd|4th|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  const time = t.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (ord) {
    return {
      recurrence: { pattern: "monthly", weekOfMonth: ord[1] === "last" ? -1 : parseInt(ord[1], 10) || null, weekday: ord[2], time: time ? time[1] : null },
      confidence: 75,
      ambiguous: false,
      uncertainty: [],
      missingFields: time ? [] : ["time"],
    };
  }
  return { recurrence: null, confidence: 25, ambiguous: true, uncertainty: ["unparsed"], missingFields: ["recurrence", "time", "venue"] };
}

function ruleVerify(candidate, excerpt) {
  const text = `${excerpt || ""} ${candidate.rawText || ""} ${candidate.notes || ""}`.toLowerCase();
  const confirmed = [];
  if (candidate.county && text.includes(String(candidate.county).toLowerCase())) confirmed.push("county");
  if (candidate.sourceUrl) confirmed.push("source_url");
  if (candidate.venueName && text.includes(String(candidate.venueName).toLowerCase().slice(0, 10))) confirmed.push("venue");
  return {
    supported: confirmed.includes("source_url") && confirmed.length >= 2,
    confirmedFields: confirmed,
    inferredFields: [],
    missingFields: candidate.eventDate ? [] : ["next_date"],
    confidence: Math.min(100, confirmed.length * 25),
    warnings: /awaiting/i.test(text) ? ["Source awaiting confirmation"] : [],
    summary: `Rule-based verification: ${confirmed.length} confirmed fields.`,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { task, rawText, candidate, countyCoverage, candidates, sourceExcerpt } = body;
  const openaiKey = process.env.OPENAI_API_KEY;

  async function openAiJson(system, user) {
    const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  }

  const neutralSystem =
    "You are a neutral Arkansas civic calendar coverage assistant. Never invent events. Never rank parties. Separate facts from inference. Return JSON only.";

  try {
    if (task === "recurrence_extraction") {
      if (openaiKey) {
        const result = await openAiJson(
          neutralSystem,
          JSON.stringify({ task: "recurrence_extraction", rawText, schema: "recurrence-extraction" }),
        );
        return json(200, { result, source: "openai" });
      }
      return json(200, { result: ruleRecurrence(rawText), source: "rules" });
    }

    if (task === "source_verification") {
      if (openaiKey) {
        const result = await openAiJson(neutralSystem, JSON.stringify({ task: "source_verification", candidate, sourceExcerpt }));
        return json(200, { result, source: "openai" });
      }
      return json(200, { result: ruleVerify(candidate || {}, sourceExcerpt), source: "rules" });
    }

    if (task === "lane_gap") {
      const thin = (countyCoverage?.lanes || []).filter((l) => l.coveragePercent < 40).map((l) => l.shortName);
      const searches = thin.map((l) => `${countyCoverage.county} County Arkansas ${l} calendar`);
      if (openaiKey) {
        const result = await openAiJson(neutralSystem, JSON.stringify({ task: "lane_gap", countyCoverage }));
        return json(200, { result, source: "openai" });
      }
      return json(200, { result: { thinLanes: thin, recommendedSearches: searches, notes: ["Advisory only"] }, source: "rules" });
    }

    if (task === "admin_batch_summary") {
      const list = candidates || [];
      const ready = list.filter((c) => c.eventDate && (c.confidenceScore || 0) >= 70).map((c) => c.title);
      const review = list.filter((c) => !ready.includes(c.title)).map((c) => c.title);
      if (openaiKey) {
        const result = await openAiJson(neutralSystem, JSON.stringify({ task: "admin_batch_summary", count: list.length, sample: list.slice(0, 20) }));
        return json(200, { result, source: "openai" });
      }
      return json(200, { result: { readyToApprove: ready.slice(0, 10), needsReview: review.slice(0, 10), possibleDuplicates: [], highConfidenceRecurring: [] }, source: "rules" });
    }

    return json(400, { error: "Unknown task" });
  } catch (err) {
    return json(500, { error: String(err.message || err) });
  }
};
