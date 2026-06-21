import { slugKey } from "./paths.mjs";

export function dedupeCandidates(candidates) {
  const seen = new Map();
  const out = [];

  for (const c of candidates) {
    const key = slugKey(c.title, c.city, c.event_date);
    if (seen.has(key)) {
      const existing = seen.get(key);
      existing.notes = [existing.notes, `Possible duplicate: ${c.source_url || c.title}`]
        .filter(Boolean)
        .join(" | ");
      continue;
    }
    seen.set(key, c);
    out.push(c);
  }

  return out;
}
