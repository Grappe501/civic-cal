import countiesData from "../../data/arkansas-counties.json";

export const ARKANSAS_COUNTIES: string[] =
  (countiesData as { counties?: string[] }).counties ?? [];

export function countySlug(county: string): string {
  return county.toLowerCase().replace(/\s+/g, "-");
}

export function countyFromSlug(slug: string): string | undefined {
  return ARKANSAS_COUNTIES.find((c) => countySlug(c) === slug.toLowerCase());
}

export function formatCountyLabel(county: string): string {
  return `${county} County`;
}
