const { getClient, json } = require("./lib/db");
const { isPubliclyVisibleEvent } = require("./lib/eventArchive");
const { loadBundledSeedEvents } = require("./lib/bundledSeed.cjs");

exports.handler = async () => {
  const bundled = loadBundledSeedEvents();
  const seedVisible = bundled.filter(isPubliclyVisibleEvent).length;

  const client = getClient();
  let dbConnected = false;
  let dbTotal = 0;
  let dbVisible = 0;

  if (client) {
    try {
      await client.connect();
      dbConnected = true;
      const all = await client.query(`SELECT status, start_at, end_at, all_day, timezone FROM civic_call.events LIMIT 5000`);
      dbTotal = all.rows.length;
      dbVisible = all.rows
        .map((r) => ({
          status: r.status,
          startAt: r.start_at,
          endAt: r.end_at,
          allDay: r.all_day,
          timezone: r.timezone,
        }))
        .filter(isPubliclyVisibleEvent).length;
      await client.end();
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      return json(200, {
        dbConnected: false,
        dbError: err.message,
        bundledSeedCount: bundled.length,
        bundledSeedVisible: seedVisible,
        databaseUrlDetected: Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
      });
    }
  }

  return json(200, {
    dbConnected,
    dbTotal,
    dbVisible,
    bundledSeedCount: bundled.length,
    bundledSeedVisible: seedVisible,
    databaseUrlDetected: Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
    recommendedSource: dbVisible > 0 ? "database" : seedVisible > 0 ? "bundled-seed" : "none",
  });
};
