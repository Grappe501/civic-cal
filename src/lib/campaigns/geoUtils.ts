/** Geo helpers for district boundary engine */

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Ray-casting point-in-polygon for [lng, lat] rings */
export function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export type GeoPolygon = { type: "Polygon"; coordinates: number[][][] };
export type GeoMultiPolygon = { type: "MultiPolygon"; coordinates: number[][][][] };
export type GeoGeometry = GeoPolygon | GeoMultiPolygon;

export function pointInGeoJson(lng: number, lat: number, geojson: GeoGeometry): boolean {
  if (geojson.type === "Polygon") {
    const [outer, ...holes] = geojson.coordinates;
    if (!pointInRing(lng, lat, outer)) return false;
    for (const hole of holes) {
      if (pointInRing(lng, lat, hole)) return false;
    }
    return true;
  }
  if (geojson.type === "MultiPolygon") {
    return geojson.coordinates.some(([outer, ...holes]) => {
      if (!pointInRing(lng, lat, outer)) return false;
      for (const hole of holes) {
        if (pointInRing(lng, lat, hole)) return false;
      }
      return true;
    });
  }
  return false;
}

export function normalizeCounty(name?: string | null): string {
  return (name ?? "").trim().toLowerCase();
}

export function normalizeCity(name?: string | null): string {
  return (name ?? "").trim().toLowerCase();
}
