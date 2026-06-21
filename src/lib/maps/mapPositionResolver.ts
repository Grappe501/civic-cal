import type { CivicEvent } from "../types";
import { getCountyCentroid } from "../campaigns/districtRegistry";
import { eventHasMapPin } from "./mapTypes";

export type MapPosition = {
  lat: number;
  lng: number;
  source: "geocoded" | "county_centroid" | "city_jitter";
};

/** Resolve map position — geocoded pin or county centroid fallback with jitter. */
export function resolveEventMapPosition(event: CivicEvent, index = 0): MapPosition | null {
  if (event.isOnlineOnly) return null;
  if (eventHasMapPin(event)) {
    return { lat: event.latitude!, lng: event.longitude!, source: "geocoded" };
  }
  const county = event.county?.replace(/\s+County$/i, "").trim();
  if (!county) return null;
  const centroid = getCountyCentroid(county);
  if (!centroid) return null;
  const jitter = ((index % 7) - 3) * 0.04;
  const jitterLng = ((index % 5) - 2) * 0.05;
  return {
    lat: centroid.lat + jitter,
    lng: centroid.lng + jitterLng,
    source: "county_centroid",
  };
}

export function eventsWithMapPositions(events: CivicEvent[]): { event: CivicEvent; position: MapPosition }[] {
  return events
    .map((event, index) => {
      const position = resolveEventMapPosition(event, index);
      return position ? { event, position } : null;
    })
    .filter(Boolean) as { event: CivicEvent; position: MapPosition }[];
}
