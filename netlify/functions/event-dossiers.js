const { getClient, json } = require("./lib/db");
const { buildDeterministicDossierServer } = require("./lib/event-dossier-server");

function checkAdmin(event) {
  const token = process.env.CIVIC_CALL_ADMIN_TOKEN;
  if (!token) return false;
  const auth = event.headers.authorization || event.headers.Authorization || "";
  return auth === `Bearer ${token}`;
}

function rowToDossier(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    hostOrganization: row.host_organization,
    hostContacts: row.host_contacts ?? [],
    officialWebsite: row.official_website,
    socialLinks: row.social_links ?? [],
    sourceLinks: row.source_links ?? [],
    ticketCost: row.ticket_cost,
    vendorOptions: row.vendor_options,
    sponsorOptions: row.sponsor_options,
    parkingInfo: row.parking_info,
    accessibilityInfo: row.accessibility_info,
    indoorOutdoor: row.indoor_outdoor,
    foodAvailable: row.food_available,
    restroomInfo: row.restroom_info,
    familyFriendly: row.family_friendly,
    expectedAttendanceMin: row.expected_attendance_min,
    expectedAttendanceMax: row.expected_attendance_max,
    historicalNotes: row.historical_notes,
    yearsRunning: row.years_running,
    recurringPattern: row.recurring_pattern,
    candidateGuidance: row.candidate_guidance,
    volunteerGuidance: row.volunteer_guidance,
    localCustoms: row.local_customs,
    whatToWear: row.what_to_wear,
    arrivalAdvice: row.arrival_advice,
    bestTimeToArrive: row.best_time_to_arrive,
    campaignRiskNotes: row.campaign_risk_notes,
    eventFormat: row.event_format,
    unansweredQuestions: row.unanswered_questions ?? [],
    confirmedFacts: row.confirmed_facts ?? [],
    likelyInferences: row.likely_inferences ?? [],
    verificationStatus: row.verification_status,
    confidenceScore: row.confidence_score,
    lastResearchedAt: row.last_researched_at,
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    taskType: row.task_type,
    taskLabel: row.task_label,
    status: row.status,
    assignedTo: row.assigned_to,
    resultNotes: row.result_notes,
    sourceUrl: row.source_url,
  };
}

async function loadTasks(client, eventId) {
  const res = await client.query(
    `SELECT * FROM civic_call.event_research_tasks WHERE event_id = $1 ORDER BY created_at`,
    [eventId],
  );
  return res.rows.map(rowToTask);
}

async function resolveEventId(client, { eventId, slug }) {
  if (eventId) return eventId;
  if (slug) {
    const r = await client.query(`SELECT id FROM civic_call.events WHERE slug = $1 LIMIT 1`, [slug]);
    return r.rows[0]?.id ?? null;
  }
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }

  const params = event.queryStringParameters || {};
  const isAdmin = checkAdmin(event);
  const client = getClient();

  if (event.httpMethod === "GET") {
    if (params.adminSection && !isAdmin) return json(401, { error: "Unauthorized" });

    if (!client) {
      if (params.adminSection) return json(200, { dossiers: [], source: "no_database" });
      return json(404, { error: "No dossier — database not configured", source: "no_database" });
    }

    try {
      await client.connect();

      if (params.adminSection) {
        let query = `SELECT d.*, e.title, e.slug, e.county, e.city, e.start_at
          FROM civic_call.event_intelligence_dossiers d
          JOIN civic_call.events e ON e.id = d.event_id
          WHERE 1=1`;
        const section = params.adminSection;
        if (section === "missing") {
          const missing = await client.query(
            `SELECT e.id, e.title, e.slug, e.county, e.city, e.start_at
             FROM civic_call.events e
             LEFT JOIN civic_call.event_intelligence_dossiers d ON d.event_id = e.id
             WHERE e.status = 'approved' AND d.id IS NULL
             ORDER BY e.start_at DESC LIMIT 50`,
          );
          await client.end();
          return json(200, { events: missing.rows, section });
        }
        if (section === "needs_research") query += ` AND d.verification_status = 'needs_review'`;
        if (section === "low_confidence") query += ` AND d.confidence_score < 40`;
        if (section === "recent") query += ` AND d.updated_at > now() - interval '7 days'`;
        query += ` ORDER BY d.updated_at DESC LIMIT 50`;
        const res = await client.query(query);
        await client.end();
        return json(200, { dossiers: res.rows.map(rowToDossier), section });
      }

      const eventId = await resolveEventId(client, params);
      if (!eventId) {
        await client.end();
        return json(404, { error: "Event not found" });
      }

      const dRes = await client.query(
        `SELECT * FROM civic_call.event_intelligence_dossiers WHERE event_id = $1 LIMIT 1`,
        [eventId],
      );
      const tasks = await loadTasks(client, eventId);
      await client.end();

      if (!dRes.rows.length) {
        return json(404, { error: "No dossier yet", eventId });
      }

      return json(200, {
        dossier: rowToDossier(dRes.rows[0]),
        tasks,
        source: "database",
      });
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      return json(500, { error: err.message });
    }
  }

  if (!isAdmin) return json(401, { error: "Unauthorized" });

  if (!client) return json(503, { error: "DATABASE_URL not configured" });

  try {
    await client.connect();

    if (event.httpMethod === "PATCH") {
      const body = JSON.parse(event.body || "{}");
      const { eventId, dossier, action } = body;
      if (!eventId) return json(400, { error: "Missing eventId" });

      if (action === "mark_verified") {
        await client.query(
          `UPDATE civic_call.event_intelligence_dossiers SET verification_status = 'verified', updated_at = now() WHERE event_id = $1`,
          [eventId],
        );
      } else if (dossier) {
        await client.query(
          `INSERT INTO civic_call.event_intelligence_dossiers (
            event_id, host_organization, official_website, source_links, ticket_cost,
            parking_info, accessibility_info, indoor_outdoor, food_available, family_friendly,
            expected_attendance_min, expected_attendance_max, historical_notes, years_running,
            candidate_guidance, volunteer_guidance, local_customs, what_to_wear, arrival_advice,
            best_time_to_arrive, campaign_risk_notes, event_format, unanswered_questions,
            confirmed_facts, likely_inferences, verification_status, confidence_score, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,now())
          ON CONFLICT (event_id) DO UPDATE SET
            host_organization = EXCLUDED.host_organization,
            official_website = EXCLUDED.official_website,
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
            updated_at = now()`,
          [
            eventId,
            dossier.hostOrganization,
            dossier.officialWebsite,
            JSON.stringify(dossier.sourceLinks ?? []),
            dossier.ticketCost,
            dossier.parkingInfo,
            dossier.accessibilityInfo,
            dossier.indoorOutdoor,
            dossier.foodAvailable,
            dossier.familyFriendly,
            dossier.expectedAttendanceMin,
            dossier.expectedAttendanceMax,
            dossier.historicalNotes,
            dossier.yearsRunning,
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
      }

      const dRes = await client.query(
        `SELECT * FROM civic_call.event_intelligence_dossiers WHERE event_id = $1`,
        [eventId],
      );
      await client.end();
      return json(200, { dossier: rowToDossier(dRes.rows[0]) });
    }

    await client.end();
    return json(405, { error: "Method not allowed" });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    return json(500, { error: err.message });
  }
};
