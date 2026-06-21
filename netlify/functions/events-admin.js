const { getClient, rowToEvent, json, parseFilters, buildWhere } = require("./lib/db");

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
  if (!checkAdmin(event)) {
    return json(401, { error: "Unauthorized" });
  }

  const client = getClient();
  if (!client) {
    return json(503, { error: "DATABASE_URL not configured" });
  }

  try {
    await client.connect();

    if (event.httpMethod === "GET") {
      const filters = parseFilters(event.queryStringParameters || {});
      filters.status = event.queryStringParameters?.status || "pending";
      const { where, values, nextIndex } = buildWhere(filters, true);
      values.push(filters.limit, filters.offset);
      const res = await client.query(
        `SELECT * FROM civic_call.events ${where} ORDER BY created_at DESC LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
        values,
      );
      await client.end();
      return json(200, { events: res.rows.map(rowToEvent) });
    }

    if (event.httpMethod === "PATCH") {
      const body = JSON.parse(event.body || "{}");
      const { id, action, ...updates } = body;
      if (!id) return json(400, { error: "Missing id" });

      if (action === "approve") {
        await client.query(
          `UPDATE civic_call.events SET status = 'approved', reviewed_at = now(), updated_at = now() WHERE id = $1`,
          [id],
        );
      } else if (action === "reject") {
        await client.query(
          `UPDATE civic_call.events SET status = 'rejected', reviewed_at = now(), updated_at = now(), admin_notes = $2 WHERE id = $1`,
          [id, updates.adminNotes || null],
        );
      } else if (action === "feature") {
        await client.query(
          `UPDATE civic_call.events SET featured = $2, high_civic_value = $3, updated_at = now() WHERE id = $1`,
          [id, updates.featured ?? true, updates.highCivicValue ?? false],
        );
      } else {
        await client.end();
        return json(400, { error: "Unknown action" });
      }

      const res = await client.query(`SELECT * FROM civic_call.events WHERE id = $1`, [id]);
      await client.end();
      return json(200, { event: rowToEvent(res.rows[0]) });
    }

    await client.end();
    return json(405, { error: "Method not allowed" });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    console.error(err);
    return json(500, { error: err.message });
  }
};
