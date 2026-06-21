const { getClient, rowToEvent, json, parseFilters, buildWhere } = require("./lib/db");
const { isPubliclyVisibleEvent } = require("./lib/eventArchive");
const { loadBundledSeedEvents } = require("./lib/bundledSeed");

function loadSeedFallback() {
  return loadBundledSeedEvents();
}

function filterSeed(events, filters) {
  let list = events.filter((e) => (filters.status ? e.status === filters.status : e.status === "approved"));
  list = list.filter(isPubliclyVisibleEvent);

  if (filters.county) {
    list = list.filter((e) => e.county?.toLowerCase() === filters.county.toLowerCase());
  }
  if (filters.city) {
    list = list.filter((e) => e.city?.toLowerCase().includes(filters.city.toLowerCase()));
  }
  if (filters.category) {
    list = list.filter((e) => e.category === filters.category);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.locationName?.toLowerCase().includes(q),
    );
  }
  if (filters.civicOnly) {
    list = list.filter((e) => e.category === "civic_meeting" || e.isPublicGovernmentMeeting);
  }
  if (filters.familyFriendly) list = list.filter((e) => e.isFamilyFriendly);
  if (filters.freeOnly) list = list.filter((e) => e.isFree !== false);
  if (filters.candidateRelevant) list = list.filter((e) => e.candidateRelevant);
  if (filters.featured) list = list.filter((e) => e.featured);

  list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return list.slice(filters.offset, filters.offset + filters.limit);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const params = event.queryStringParameters || {};
  const filters = parseFilters(params);
  const slug = params.slug;

  const client = getClient();
  if (!client) {
    const seed = loadSeedFallback();
    if (slug) {
      const found = seed.find((e) => e.slug === slug);
      if (!found || !isPubliclyVisibleEvent(found)) return json(404, { error: "Not found" });
      return json(200, { event: found });
    }
    return json(200, { events: filterSeed(seed, filters), source: "seed" });
  }

  try {
    await client.connect();

    if (slug) {
      const res = await client.query(
        `SELECT * FROM civic_call.events WHERE slug = $1 AND status = 'approved' LIMIT 1`,
        [slug],
      );
      await client.end();
      if (!res.rows.length) return json(404, { error: "Not found" });
      const event = rowToEvent(res.rows[0]);
      if (!isPubliclyVisibleEvent(event)) return json(404, { error: "Not found" });
      return json(200, { event });
    }

    const { where, values, nextIndex } = buildWhere(filters, false);
    values.push(filters.limit, filters.offset);
    const res = await client.query(
      `SELECT * FROM civic_call.events ${where} ORDER BY start_at ASC LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      values,
    );
    await client.end();
    const events = res.rows.map(rowToEvent).filter(isPubliclyVisibleEvent);
    if (events.length === 0) {
      const seed = loadSeedFallback();
      return json(200, {
        events: filterSeed(seed, filters),
        source: "seed-fallback-empty-db",
      });
    }
    return json(200, { events, source: "database" });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    console.error(err);
    const seed = loadSeedFallback();
    return json(200, { events: filterSeed(seed, filters), source: "seed-fallback", error: err.message });
  }
};
