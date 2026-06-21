/**
 * Pass 27 — infer city / district label from ADE school name.
 */
export function extractCityFromSchoolName(schoolName) {
  if (!schoolName) return null;
  let n = String(schoolName).trim();
  n = n.replace(/^ACADEMIES AT /i, "").replace(/^THE /i, "");

  const patterns = [
    /^(.+?)\s+(HIGH|SENIOR|JUNIOR|MIDDLE|SECONDARY)\s+(SCHOOL|HIGH)\b/i,
    /^(.+?)\s+HIGH\s+SCHOOL\b/i,
    /^(.+?)\s+SCHOOL\b/i,
  ];
  for (const re of patterns) {
    const m = n.match(re);
    if (m?.[1]) {
      return m[1]
        .replace(/\s+(COUNTY|CENTRAL|EAST|WEST|NORTH|SOUTH|UPPER|LOWER)$/i, "")
        .trim();
    }
  }
  return null;
}

export function leaPrefixFromId(id) {
  const m = String(id).match(/^ade-(\d{4})/);
  return m?.[1] ?? null;
}

export function slugCity(city) {
  return String(city ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-|-$/g, "");
}
