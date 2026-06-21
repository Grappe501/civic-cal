const fs = require("node:fs");
const path = require("node:path");
const { getClient, json } = require("./lib/db");

const SEED_PATH = path.join(__dirname, "..", "..", "data", "campaigns", "initial-campaign-workspaces.json");

function rowToWorkspace(row) {
  return {
    id: row.id,
    slug: row.slug,
    campaignName: row.campaign_name,
    candidateName: row.candidate_name,
    officeSought: row.office_sought,
    districtType: row.district_type,
    districtName: row.district_name,
    dashboardLabel: row.dashboard_label,
    counties: row.counties ?? [],
    cities: row.cities ?? [],
    districtScope: row.district_scope ?? {},
    dashboardTheme: row.dashboard_theme ?? {},
    notes: row.notes,
    isActive: row.is_active,
    accessMode: row.access_mode,
    googleCalendarStatus: row.google_calendar_status,
    mobilizeStatus: row.mobilize_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loadSeedFallback() {
  if (!fs.existsSync(SEED_PATH)) return [];
  const data = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  return (data.workspaces ?? []).map((w) => ({
    slug: w.slug,
    campaignName: w.campaign_name,
    candidateName: w.candidate_name,
    officeSought: w.office_sought,
    districtType: w.district_type,
    districtName: w.district_name,
    dashboardLabel: w.dashboard_label,
    counties: w.counties ?? [],
    cities: w.cities ?? [],
    districtScope: w.district_scope ?? {},
    dashboardTheme: w.dashboard_theme ?? {},
    notes: w.notes,
    isActive: w.is_active !== false,
    accessMode: w.access_mode ?? "private_admin",
    googleCalendarStatus: "not_connected",
    mobilizeStatus: "not_connected",
  }));
}

function checkAdmin(event) {
  const token = process.env.CIVIC_CALL_ADMIN_TOKEN;
  if (!token) return false;
  const auth = event.headers.authorization || event.headers.Authorization || "";
  return auth === `Bearer ${token}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }

  const params = event.queryStringParameters || {};
  const client = getClient();

  if (event.httpMethod === "GET") {
    if (client) {
      try {
        await client.connect();
        if (params.slug) {
          const res = await client.query(
            `SELECT * FROM civic_call.campaign_workspaces WHERE slug = $1 AND is_active = true LIMIT 1`,
            [params.slug],
          );
          await client.end();
          if (res.rows.length) return json(200, { workspace: rowToWorkspace(res.rows[0]), source: "database" });
        } else {
          const res = await client.query(
            `SELECT * FROM civic_call.campaign_workspaces WHERE is_active = true ORDER BY campaign_name`,
          );
          await client.end();
          return json(200, { workspaces: res.rows.map(rowToWorkspace), source: "database" });
        }
      } catch (err) {
        try {
          await client.end();
        } catch (_) {}
      }
    }

    const seeded = loadSeedFallback();
    if (params.slug) {
      const ws = seeded.find((w) => w.slug === params.slug);
      if (!ws) return json(404, { error: "Workspace not found" });
      return json(200, { workspace: ws, source: "seed_json" });
    }
    return json(200, { workspaces: seeded, source: "seed_json" });
  }

  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });
  if (!client) return json(503, { error: "DATABASE_URL not configured" });

  if (event.httpMethod === "PATCH") {
    const body = JSON.parse(event.body || "{}");
    const { slug, isActive, counties, cities, notes } = body;
    if (!slug) return json(400, { error: "Missing slug" });

    try {
      await client.connect();
      await client.query(
        `UPDATE civic_call.campaign_workspaces SET
          is_active = COALESCE($2, is_active),
          counties = COALESCE($3, counties),
          cities = COALESCE($4, cities),
          notes = COALESCE($5, notes),
          updated_at = now()
         WHERE slug = $1`,
        [slug, isActive, counties ? JSON.stringify(counties) : null, cities ? JSON.stringify(cities) : null, notes],
      );
      const res = await client.query(`SELECT * FROM civic_call.campaign_workspaces WHERE slug = $1`, [slug]);
      await client.end();
      return json(200, { workspace: rowToWorkspace(res.rows[0]) });
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      return json(500, { error: err.message });
    }
  }

  return json(405, { error: "Method not allowed" });
};
