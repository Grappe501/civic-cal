const fs = require("node:fs");
const path = require("node:path");
const { json } = require("./lib/db");

const SEED_PATH = path.join(__dirname, "..", "..", "data", "districts", "arkansas-districts-seed.json");

function loadSeed() {
  if (!fs.existsSync(SEED_PATH)) return [];
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf8")).districts ?? [];
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  const params = event.queryStringParameters || {};
  const seeded = loadSeed();

  if (params.slug) {
    const d = seeded.find((x) => x.slug === params.slug);
    if (!d) return json(404, { error: "District not found" });
    return json(200, { district: d, source: "seed_json" });
  }

  if (params.type && params.code) {
    const d = seeded.find(
      (x) => x.districtType === params.type && x.districtCode.toUpperCase() === params.code.toUpperCase(),
    );
    if (!d) return json(404, { error: "District not found" });
    return json(200, { district: d, source: "seed_json" });
  }

  return json(200, { districts: seeded, source: "seed_json" });
};
