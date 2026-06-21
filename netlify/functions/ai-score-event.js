const { getClient, json } = require("./lib/db");
const { assessEvent } = require("./lib/ai-intelligence");

function checkAdmin(event) {
  const token = process.env.CIVIC_CALL_ADMIN_TOKEN;
  if (!token) return false;
  const auth = event.headers.authorization || event.headers.Authorization || "";
  return auth === `Bearer ${token}`;
}

function rowToAssessment(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    candidateId: row.candidate_id,
    sourceType: row.source_type,
    model: row.model,
    assessment: row.assessment_json,
    opportunityScore: row.opportunity_score,
    relationshipDensityScore: row.relationship_density_score,
    estimatedCrowdMin: row.estimated_crowd_min,
    estimatedCrowdMax: row.estimated_crowd_max,
    confidenceScore: row.confidence_score,
    verificationStatus: row.verification_status,
    publicSummary: row.public_summary,
    organizerNotes: row.organizer_notes,
    campaignNotes: row.campaign_notes,
    createdAt: row.created_at,
  };
}

async function loadFeedback(client, eventId) {
  if (!eventId || !client) return [];
  const res = await client.query(
    `SELECT crowd_size_estimate, tradition_years, is_good_for_candidates, why_it_matters, local_notes, correction_notes
     FROM civic_call.event_feedback WHERE event_id = $1 AND review_status != 'rejected' ORDER BY created_at DESC LIMIT 20`,
    [eventId],
  );
  return res.rows.map((r) => ({
    crowdSizeEstimate: r.crowd_size_estimate,
    traditionYears: r.tradition_years,
    isGoodForCandidates: r.is_good_for_candidates,
    whyItMatters: r.why_it_matters,
    localNotes: r.local_notes,
    correctionNotes: r.correction_notes,
  }));
}

async function storeAssessment(client, { eventId, candidateId, sourceType, assessment }) {
  const res = await client.query(
    `INSERT INTO civic_call.event_ai_assessments (
      event_id, candidate_id, source_type, model, assessment_json,
      opportunity_score, relationship_density_score,
      estimated_crowd_min, estimated_crowd_max, confidence_score,
      verification_status, public_summary, campaign_notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      eventId || null,
      candidateId || null,
      sourceType || "admin_score",
      assessment.model || assessment.source,
      JSON.stringify(assessment),
      assessment.politicalOpportunityScore,
      assessment.relationshipDensityScore,
      assessment.estimatedCrowdMin,
      assessment.estimatedCrowdMax,
      assessment.confidenceScore,
      assessment.verificationStatus || "pending",
      assessment.publicSummary,
      assessment.campaignNotes,
    ],
  );
  return res.rows[0];
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }

  const isAdmin = checkAdmin(event);

  if (event.httpMethod === "GET") {
    if (!isAdmin) return json(401, { error: "Unauthorized" });
    const params = event.queryStringParameters || {};
    const client = getClient();
    if (!client) return json(200, { assessments: [], source: "no_database" });

    try {
      await client.connect();
      let query = `SELECT * FROM civic_call.event_ai_assessments WHERE 1=1`;
      const values = [];
      if (params.eventId) {
        values.push(params.eventId);
        query += ` AND event_id = $${values.length}`;
      }
      if (params.candidateId) {
        values.push(params.candidateId);
        query += ` AND candidate_id = $${values.length}`;
      }
      query += ` ORDER BY created_at DESC LIMIT 5`;
      const res = await client.query(query, values);
      await client.end();
      return json(200, { assessments: res.rows.map(rowToAssessment) });
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      return json(500, { error: err.message });
    }
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!isAdmin) return json(401, { error: "Unauthorized — admin token required for AI scoring" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const payload = body.eventPayload || body;
  const client = getClient();
  let feedback = body.feedback || [];
  let dbConnected = false;

  if (client) {
    try {
      await client.connect();
      dbConnected = true;
      if (body.eventId) feedback = await loadFeedback(client, body.eventId);
    } catch (_) {}
  }
  const input = {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    city: payload.city,
    county: payload.county,
    eventDate: payload.eventDate || payload.event_date,
    startAt: payload.startAt || payload.start_at,
    venueName: payload.venueName || payload.venue_name,
    address: payload.address,
    sourceUrl: payload.sourceUrl || payload.source_url,
    sourceName: payload.sourceName || payload.source_name,
    sourceType: payload.sourceType || payload.source_type,
    intelligenceLayer: payload.intelligenceLayer || payload.intelligence_layer,
    isRecurring: payload.isRecurring ?? payload.is_recurring_annual,
    isPublicGovernmentMeeting: payload.isPublicGovernmentMeeting,
    notes: payload.notes,
    feedback,
  };

  const assessment = await assessEvent(input);

  if (body.action === "mark_verified") {
    assessment.verificationStatus = "verified";
  } else if (body.action === "request_intel") {
    assessment.verificationStatus = "needs_verification";
    if (!assessment.localIntelNeeded.includes("Community ambassador verification requested")) {
      assessment.localIntelNeeded.push("Community ambassador verification requested");
    }
  } else if (body.action === "reject_spam") {
    assessment.verificationStatus = "rejected";
    assessment.riskFlags.push("admin_rejected_spam");
  }

  let stored = null;
  if (client && dbConnected) {
    try {
      stored = await storeAssessment(client, {
        eventId: body.eventId || null,
        candidateId: body.candidateId || null,
        sourceType: body.sourceType || "admin_score",
        assessment,
      });
      await client.end();
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      return json(200, { assessment, stored: false, error: err.message });
    }
  }

  return json(200, {
    assessment,
    stored: Boolean(stored),
    assessmentId: stored?.id,
    aiEnabled: Boolean(process.env.OPENAI_API_KEY),
  });
};
