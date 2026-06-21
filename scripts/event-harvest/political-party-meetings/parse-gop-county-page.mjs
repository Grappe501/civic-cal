/**
 * Parse Arkansas GOP county committee page HTML into meeting records.
 * Source: https://www.arkansasgop.org/countygop.html (public)
 */

function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8203;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const COUNTY_BLOCK_RE =
  /(?:^|\n)\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+[Cc]ounty(?:\s*\([^)]*\))?(?:\s*\([^)]*\))?\s*\n+\s*Chair:\s*([^\n]+)\s*\n+\s*(?:Meeting Information|MEETING INFORMATION|meeting information)\s*\n+([\s\S]*?)(?=\n\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?\s+[Cc]ounty(?:\s*\(|$|\n)|$)/gi;

export function parseGopCountyPageText(htmlOrText) {
  let text = htmlOrText.includes("<") ? htmlToText(htmlOrText) : String(htmlOrText);
  text = text.replace(/\b(?:FIRST|SECOND|THIRD|FOURTH)\s+DISTRICT\b/gi, "\n");
  const records = [];

  let match;
  while ((match = COUNTY_BLOCK_RE.exec(text)) !== null) {
    const county = match[1].trim().replace(/\s+/g, " ");
    const chair = match[2].trim().replace(/\s+/g, " ");
    const infoRaw = match[3].trim().replace(/\s+/g, " ");

    if (/district/i.test(county) || county.split(/\s+/).length > 3) continue;

    if (/awaiting committee confirmation/i.test(infoRaw)) {
      records.push(makeRecord(county, chair, "Awaiting committee confirmation", null, null, null, match[0], 25));
      continue;
    }

    const { recurrence, venue, address, city } = splitVenue(infoRaw);
    records.push(makeRecord(county, chair, recurrence, venue, address, city, match[0], null));
  }

  return dedupeByCounty(records);
}

function makeRecord(county, chair, recurrence, venue, address, city, excerpt, confidenceOverride) {
  return {
    id: `gop-${slug(county)}${/awaiting/i.test(recurrence) ? "-awaiting" : ""}`,
    party_label: "Republican",
    organization: "Republican Party of Arkansas",
    county,
    chair,
    recurrence_text: recurrence,
    venue,
    address,
    city: city || guessCity(address, county),
    meeting_name: `${county} County Republican Committee Meeting`,
    meeting_subtype: "county_party_committee",
    source_url: "https://www.arkansasgop.org/countygop.html",
    discovered_by: "harvest:party-meetings:gop",
    confidence_score: confidenceOverride ?? (recurrence ? 70 : 40),
    raw_excerpt: excerpt.slice(0, 500),
    verification_status: /awaiting/i.test(recurrence) ? "needs_review" : "needs_verification",
  };
}

function splitVenue(infoRaw) {
  const meal = infoRaw.match(/meal at[^,]+,\s*meeting at[^.]+\d{1,2}(?::\d{2})?\s*(?:am|pm)/i);
  const recurrenceMatch = infoRaw.match(
    /((?:\d+(?:st|nd|rd|th)|first|second|third|fourth|last)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]*?)?)/i,
  );
  let recurrence = meal ? meal[0] : recurrenceMatch ? recurrenceMatch[1].trim() : infoRaw.slice(0, 80);
  let rest = infoRaw.replace(recurrence, "").trim();

  const addressMatch = rest.match(/(\d+[^,]+,\s*[A-Za-z\s]+,\s*AR\s*\d{5})/i)
    || rest.match(/(\d+[^,]+,\s*[A-Za-z\s]+,\s*AR\b[^,]*)/i);
  const address = addressMatch ? addressMatch[1].trim() : null;
  let venue = rest;
  if (address) venue = rest.replace(address, "").trim();

  venue = venue.replace(/^[,.\s]+|[,.\s]+$/g, "").slice(0, 180) || null;
  const city = address ? address.split(",")[1]?.trim() ?? null : null;

  return { recurrence, venue, address, city };
}

function guessCity(address, county) {
  if (!address) return null;
  const parts = address.split(",");
  if (parts.length >= 2) return parts[parts.length - 2]?.trim() ?? null;
  return null;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dedupeByCounty(records) {
  const seen = new Set();
  return records.filter((r) => {
    const key = `${r.county}:${r.party_label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
