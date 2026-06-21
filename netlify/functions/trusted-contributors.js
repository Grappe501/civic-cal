const { getClient, json } = require("./lib/db");

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

  const { name, email, county } = body;
  if (!name || !email || !county) {
    return json(400, { error: "Name, email, and county are required" });
  }

  const client = getClient();
  if (!client) {
    return json(201, {
      ok: true,
      message: "Thanks — we'll follow up when contributor onboarding is live.",
      demo: true,
    });
  }

  try {
    await client.connect();
    await client.query(
      `INSERT INTO civic_call.trusted_contributors (name, email, city, county, role, help_areas, trust_level)
       VALUES ($1,$2,$3,$4,$5,$6,'new')
       ON CONFLICT (email) DO UPDATE SET
         city = EXCLUDED.city,
         county = EXCLUDED.county,
         role = EXCLUDED.role,
         help_areas = EXCLUDED.help_areas`,
      [name, email.toLowerCase().trim(), body.city || null, county, body.role || null, body.helpAreas || null],
    );
    await client.end();
    return json(201, {
      ok: true,
      message: "You're on the list — thank you for helping build Arkansas's civic calendar.",
    });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    console.error(err);
    return json(500, { error: "Signup failed" });
  }
};
