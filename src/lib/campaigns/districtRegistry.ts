import seedBundle from "../../../data/districts/arkansas-districts-seed.json";
import centroidsBundle from "../../../data/districts/county-centroids.json";
import type { DistrictType } from "./types";
import type { GeoGeometry } from "./geoUtils";

export type BoundaryPrecisionLevel = "full" | "partial" | "county_fallback" | "geojson";

export interface DistrictBoundaryDefinition {
  districtType: DistrictType | "statewide";
  districtCode: string;
  name: string;
  slug: string;
  countiesWhole: string[];
  countiesPartial: string[];
  cities: string[];
  nearCounties: string[];
  centroid?: { lat: number; lng: number };
  nearRadiusMiles: number;
  geojson?: GeoGeometry;
  boundaryPrecision: BoundaryPrecisionLevel;
  boundarySource?: string;
}

interface RawDistrict {
  districtType: string;
  districtCode: string;
  name: string;
  slug: string;
  countiesWhole?: string[];
  countiesPartial?: string[];
  cities?: string[];
  nearCounties?: string[];
  centroid?: { lat: number; lng: number };
  nearRadiusMiles?: number;
  geojson?: GeoGeometry;
  boundaryPrecision?: BoundaryPrecisionLevel;
  boundarySource?: string;
}

const COUNTY_CENTROIDS = new Map<string, { lat: number; lng: number }>();
for (const c of (centroidsBundle as { counties?: { name: string; centroid: { lat: number; lng: number } }[] }).counties ?? []) {
  COUNTY_CENTROIDS.set(c.name.toLowerCase(), c.centroid);
}

function mapRaw(raw: RawDistrict): DistrictBoundaryDefinition {
  return {
    districtType: raw.districtType as DistrictBoundaryDefinition["districtType"],
    districtCode: raw.districtCode,
    name: raw.name,
    slug: raw.slug,
    countiesWhole: raw.countiesWhole ?? [],
    countiesPartial: raw.countiesPartial ?? [],
    cities: raw.cities ?? [],
    nearCounties: raw.nearCounties ?? [],
    centroid: raw.centroid,
    nearRadiusMiles: raw.nearRadiusMiles ?? 35,
    geojson: raw.geojson,
    boundaryPrecision: raw.boundaryPrecision ?? "county_fallback",
    boundarySource: raw.boundarySource,
  };
}

let cache: DistrictBoundaryDefinition[] | null = null;

export function listDistrictBoundaries(): DistrictBoundaryDefinition[] {
  if (!cache) {
    cache = ((seedBundle as { districts?: RawDistrict[] }).districts ?? []).map(mapRaw);
  }
  return cache;
}

export function getDistrictBoundary(districtType: string, districtCode: string): DistrictBoundaryDefinition | null {
  return (
    listDistrictBoundaries().find(
      (d) => d.districtType === districtType && d.districtCode.toUpperCase() === districtCode.toUpperCase(),
    ) ?? null
  );
}

export function getDistrictBoundaryBySlug(slug: string): DistrictBoundaryDefinition | null {
  return listDistrictBoundaries().find((d) => d.slug === slug) ?? null;
}

export function resolveWorkspaceBoundary(scope: {
  mode: DistrictType;
  districtCode?: string;
  districtBoundarySlug?: string;
}): DistrictBoundaryDefinition | null {
  if (scope.districtBoundarySlug) {
    return getDistrictBoundaryBySlug(scope.districtBoundarySlug);
  }
  if (scope.districtCode) {
    const mode = scope.mode === "statewide" ? "statewide" : scope.mode;
    return getDistrictBoundary(mode, scope.districtCode);
  }
  if (scope.mode === "statewide") {
    return getDistrictBoundary("statewide", "AR-STATEWIDE");
  }
  if (scope.mode === "county" && scope.districtCode) {
    return getDistrictBoundary("county", scope.districtCode);
  }
  return null;
}

export function getCountyCentroid(county: string): { lat: number; lng: number } | null {
  return COUNTY_CENTROIDS.get(county.toLowerCase()) ?? null;
}

/** Build a single-county boundary on the fly */
export function countyBoundary(countyName: string): DistrictBoundaryDefinition {
  const centroid = getCountyCentroid(countyName);
  return {
    districtType: "county",
    districtCode: countyName.toUpperCase().replace(/\s+/g, "-"),
    name: `${countyName} County`,
    slug: `county-${countyName.toLowerCase().replace(/\s+/g, "-")}`,
    countiesWhole: [countyName],
    countiesPartial: [],
    cities: [],
    nearCounties: [],
    centroid: centroid ?? undefined,
    nearRadiusMiles: 20,
    boundaryPrecision: "full",
    boundarySource: "county_whole",
  };
}

export function cityBoundary(cityName: string, countyName?: string): DistrictBoundaryDefinition {
  return {
    districtType: "city",
    districtCode: cityName.toUpperCase().replace(/\s+/g, "-"),
    name: cityName,
    slug: `city-${cityName.toLowerCase().replace(/\s+/g, "-")}`,
    countiesWhole: countyName ? [countyName] : [],
    countiesPartial: [],
    cities: [cityName],
    nearCounties: countyName ? [] : [],
    nearRadiusMiles: 15,
    boundaryPrecision: "county_fallback",
    boundarySource: "city_name_match",
  };
}
