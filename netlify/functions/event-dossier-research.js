const { getClient, json } = require("./lib/db");
const { buildDeterministicDossierServer } = require("./lib/event-dossier-server");

function checkAdmin(event) {
  const token = process.env.CIVIC_CALL_ADMIN_TOKEN;
  if (!token) return false;
  const auth = event.headers.authorization || event.headers.Authorization || "";
  return auth === `Bearer ${token}`;
}

async function loadFeedback(client, eventId) {
  const res = await client.query(
    `SELECT crowd_size_estimate, tradition_years, local_notes, why_it_matters, is_good_for_candidates
     FROM civic_call.event_feedback WHERE event_id = $1 AND review_status != 'rejected' ORDER BY created_at DESC LIMIT 10`,
    [eventId],
  );
  return res.rows.map((r) => ({
    crowdSizeEstimate: r.crowd_size_estimate,
    traditionYears: r.tradition_years,
    localNotes: r.local_notes,
    whyItMatters: r.why_it_matters,
    isGoodForCandidates: r.is_good_for_candidates,
  }));
}

async function storeDossier(client, eventId, dossier, tasks) {
  await client.query(
    `INSERT INTO civic_call.event_intelligence_dossiers (
      event_id, host_organization, host_contacts, official_website, social_links, source_links,
      ticket_cost, vendor_options, sponsor_options, parking_info, accessibility_info,
      indoor_outdoor, food_available, restroom_info, family_friendly,
      expected_attendance_min, expected_attendance_max, historical_notes, years_running,
      recurring_pattern, candidate_guidance, volunteer_guidance, local_customs, what_to_wear,
      arrival_advice, best_time_to_arrive, campaign_risk_notes, event_format,
      unanswered_questions, confirmed_facts, likely_inferences, verification_status,
      confidence_score, last_researched_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,now(),now()
    )
    ON CONFLICT (event_id) DO UPDATE SET
      host_organization = EXCLUDED.host_organization,
      source_links = EXCLUDED.source_links,
      ticket_cost = EXCLUDED.ticket_cost,
      parking_info = EXCLUDED.parking_info,
      accessibility_info = EXCLUDED.accessibility_info,
      indoor_outdoor = EXCLUDED.indoor_outdoor,
      food_available = EXCLUDED.food_available,
      family_friendly = EXCLUDED.family_friendly,
      expected_attendance_min = EXCLUDED.expected_attendance_min,
      expected_attendance_max = EXCLUDED.expected_attendance_max,
      historical_notes = EXCLUDED.historical_notes,
      years_running = EXCLUDED.years_running,
      candidate_guidance = EXCLUDED.candidate_guidance,
      volunteer_guidance = EXCLUDED.volunteer_guidance,
      local_customs = EXCLUDED.local_customs,
      what_to_wear = EXCLUDED.what_to_wear,
      arrival_advice = EXCLUDED.arrival_advice,
      best_time_to_arrive = EXCLUDED.best_time_to_arrive,
      campaign_risk_notes = EXCLUDED.campaign_risk_notes,
      event_format = EXCLUDED.event_format,
      unanswered_questions = EXCLUDED.unanswered_questions,
      confirmed_facts = EXCLUDED.confirmed_facts,
      likely_inferences = EXCLUDED.likely_inferences,
      verification_status = EXCLUDED.verification_status,
      confidence_score = EXCLUDED.confidence_score,
      last_researched_at = now(),
      updated_at = now()`,
    [
      eventId,
      dossier.hostOrganization,
      JSON.stringify(dossier.hostContacts ?? []),
      dossier.officialWebsite,
      JSON.stringify(dossier.socialLinks ?? []),
      JSON.stringify(dossier.sourceLinks ?? []),
      dossier.ticketCost,
      dossier.vendorOptions,
      dossier.sponsorOptions,
      dossier.parkingInfo,
      dossier.accessibilityInfo,
      dossier.indoorOutdoor,
      dossier.foodAvailable,
      dossier.restroomInfo,
      dossier.familyFriendly,
      dossier.expectedAttendanceMin,
      dossier.expectedAttendanceMax,
      dossier.historicalNotes,
      dossier.yearsRunning,
      dossier.recurringPattern,
      dossier.candidateGuidance,
      dossier.volunteerGuidance,
      dossier.localCustoms,
      dossier.whatToWear,
      dossier.arrivalAdvice,
      dossier.bestTimeToArrive,
      dossier.campaignRiskNotes,
      dossier.eventFormat,
      JSON.stringify(dossier.unansweredQuestions ?? []),
      JSON.stringify(dossier.confirmedFacts ?? []),
      JSON.stringify(dossier.likelyInferences ?? []),
      dossier.verificationStatus ?? "needs_review",
      dossier.confidenceScore ?? 0,
    ],
  );

  await client.query(`DELETE FROM civic_call.event_research_tasks WHERE event_id = $1`, [eventId]);
  for (const t of tasks) {
    await client.query(
      `INSERT INTO civic_call.event_research_tasks (event_id, task_type, task_label, status)
       VALUES ($1,$2,$3,$4)`,
      [eventId, t.taskType, t.taskLabel, t.status || "open"],
    );
  }
}

async function runOpenAiResearch(eventPayload, feedback) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
  const system = `You are an Arkansas civic event research assistant. NEVER invent facts.
Only use provided event data, public source links, and community feedback.
Return JSON with: dossier (object matching intelligence fields), confirmedFacts (string[]), likelyInferences (string[]), unansweredQuestions (string[]), researchTasks ({taskType, taskLabel}[]).
Allowed source types only: official sites, city/county calendars, church pages, public Facebook, chamber, school, newspaper, Eventbrite, library, fair sites.
Mark low confidence when uncertain. Separate confirmed vs inferred.`;

  const user = JSON.stringify({ event: eventPayload, feedback }, null, 2);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
  const parsed = JSON.parse(data.choices[0].message.content);
  const d = parsed.dossier || parsed;
  return {
    dossier: {
      eventId: eventPayload.id,
      hostOrganization: d.hostOrganization ?? eventPayload.hostOrganization,
      officialWebsite: d.officialWebsite ?? eventPayload.websiteUrl,
      sourceLinks: d.sourceLinks ?? [],
      ticketCost: d.ticketCost,
      parkingInfo: d.parkingInfo,
      accessibilityInfo: d.accessibilityInfo,
      indoorOutdoor: d.indoorOutdoor,
      foodAvailable: d.foodAvailable,
      familyFriendly: d.familyFriendly ?? eventPayload.isFamilyFriendly,
      expectedAttendanceMin: d.expectedAttendanceMin,
      expectedAttendanceMax: d.expectedAttendanceMax,
      historicalNotes: d.historicalNotes,
      yearsRunning: d.yearsRunning,
      candidateGuidance: d.candidateGuidance,
      volunteerGuidance: d.volunteerGuidance,
      localCustoms: d.localCustoms,
      whatToWear: d.whatToWear,
      arrivalAdvice: d.arrivalAdvice,
      bestTimeToArrive: d.bestTimeToArrive,
      campaignRiskNotes: d.campaignRiskNotes,
      eventFormat: d.eventFormat,
      unansweredQuestions: parsed.unansweredQuestions ?? d.unansweredQuestions ?? [],
      confirmedFacts: parsed.confirmedFacts ?? [],
      likelyInferences: parsed.likelyInferences ?? [],
      verificationStatus: "needs_review",
      confidenceScore: Math.min(85, 30 + (parsed.confirmedFacts?.length ?? 0) * 8),
    },
    tasks: (parsed.researchTasks ?? []).map((t) => ({
      eventId: eventPayload.id,
      taskType: t.taskType,
      taskLabel: t.taskLabel,
      status: "open",
    })),
    source: "openai",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const eventPayload = body.event || body.eventPayload;
  if (!eventPayload?.id) return json(400, { error: "Missing event.id" });

  const client = getClient();
  let feedback = body.feedback || [];

  if (client) {
    try {
      await client.connect();
      feedback = await loadFeedback(client, eventPayload.id);
    } catch (_) {}
  }

  let result;
  try {
    result = await runOpenAiResearch(eventPayload, feedback);
  } catch (err) {
    result = buildDeterministicDossierServer(eventPayload, feedback);
    result.error = err.message;
  }

  if (!result) {
    result = buildDeterministicDossierServer(eventPayload, feedback);
  }

  if (client) {
    try {
      await storeDossier(client, eventPayload.id, result.dossier, result.tasks);
      await client.end();
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      return json(200, { ...result, stored: false, error: err.message });
    }
  }

  return json(200, { ...result, stored: Boolean(client), aiEnabled: Boolean(process.env.OPENAI_API_KEY) });
};
