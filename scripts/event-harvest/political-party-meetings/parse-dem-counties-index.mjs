/**
 * Parse https://www.arkdems.org/counties/ county directory links.
 */

export function countySlug(county) {
  return county
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "-");
}

export function parseDemCountiesIndex(htmlOrText, counties = []) {
  const html = String(htmlOrText);
  const entries = [];
  const re = /https?:\/\/www\.arkdems\.org\/county\/([a-z0-9-]+)\/?/gi;
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1];
    const county =
      counties.find((c) => countySlug(c) === slug) ||
      slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    entries.push({ county, slug, url: `https://www.arkdems.org/county/${slug}/` });
  }
  const byCounty = new Map();
  for (const e of entries) {
    if (!byCounty.has(e.county)) byCounty.set(e.county, e);
  }
  return [...byCounty.values()];
}
