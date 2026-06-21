/**
 * Server-side Google Geocoding — never expose GOOGLE_MAPS_GEOCODING_API_KEY to client.
 */

function buildQuery({ address, locationName, city, county, state = "AR" }) {
  return [locationName, address, city, county ? `${county} County` : null, state, "USA"]
    .filter(Boolean)
    .join(", ");
}

function confidenceFromResult(result) {
  const types = result.types || [];
  if (types.includes("street_address") || types.includes("premise")) return "high";
  if (types.includes("locality") || types.includes("administrative_area_level_2")) return "medium";
  return "low";
}

async function geocodeAddress(input) {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      disabled: true,
      message: "Geocoding disabled — set GOOGLE_MAPS_GEOCODING_API_KEY on Netlify",
    };
  }

  const query = buildQuery(input);
  if (!query.replace(/[, USA]/g, "").trim()) {
    return { ok: false, message: "No address to geocode" };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "us");
  url.searchParams.set("components", "country:US|administrative_area:AR");

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status === "ZERO_RESULTS") {
    return { ok: false, message: "No results for this address", mapStatus: "manual_review" };
  }
  if (data.status !== "OK" || !data.results?.[0]) {
    return { ok: false, message: `Geocoder: ${data.status}`, mapStatus: "manual_review" };
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;

  return {
    ok: true,
    latitude: lat,
    longitude: lng,
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
    locationConfidence: confidenceFromResult(result),
    mapStatus: "geocoded",
  };
}

module.exports = { geocodeAddress, buildQuery };
