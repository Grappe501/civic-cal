import type { GeocodeInput, GeocodeResult } from "./mapTypes";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

/** Client-side wrapper — geocoding runs server-side only. */
export async function geocodeLocation(input: GeocodeInput): Promise<GeocodeResult> {
  try {
    const res = await fetch(`${fnBase}/geocode-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as GeocodeResult;
    if (!res.ok) {
      return { ok: false, message: data.message ?? "Geocoding failed" };
    }
    return data;
  } catch {
    return { ok: false, message: "Geocoding unavailable" };
  }
}

export function buildLocationQuery(input: GeocodeInput): string {
  return [
    input.locationName,
    input.address,
    input.city,
    input.county ? `${input.county} County` : null,
    input.state ?? "AR",
    "USA",
  ]
    .filter(Boolean)
    .join(", ");
}
