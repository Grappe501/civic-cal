export type MapStatus = "pending" | "geocoded" | "manual_review" | "verified" | "online" | "disabled";

export type LocationConfidence = "high" | "medium" | "low" | "manual" | "unknown";

export interface GeocodeInput {
  address?: string;
  locationName?: string;
  city?: string;
  county?: string;
  state?: string;
}

export interface GeocodeResult {
  ok: boolean;
  disabled?: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  locationConfidence?: LocationConfidence;
  mapStatus?: MapStatus;
  message?: string;
}

export interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
}

/** Default view — Little Rock area, statewide visible at zoom 7 */
export const ARKANSAS_MAP_DEFAULT: MapViewport = {
  center: { lat: 34.7465, lng: -92.2896 },
  zoom: 7,
};

export const ARKANSAS_BOUNDS = {
  north: 36.5,
  south: 33.0,
  east: -89.6,
  west: -94.6,
};

export function eventHasMapPin(event: {
  latitude?: number | null;
  longitude?: number | null;
  isOnlineOnly?: boolean;
}): boolean {
  return (
    !event.isOnlineOnly &&
    typeof event.latitude === "number" &&
    typeof event.longitude === "number" &&
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude)
  );
}
