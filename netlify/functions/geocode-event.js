const { geocodeAddress } = require("./lib/geocode");
const { json } = require("./lib/db");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (body.onlineOnly) {
    return json(200, { ok: true, mapStatus: "online", message: "Online event — no map pin" });
  }

  try {
    const result = await geocodeAddress({
      address: body.address,
      locationName: body.locationName,
      city: body.city,
      county: body.county,
      state: body.state || "AR",
    });
    return json(result.ok || result.disabled ? 200 : 422, result);
  } catch {
    return json(500, { ok: false, message: "Geocoding error" });
  }
};
