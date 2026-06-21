/**
 * Parse Democratic county committee page HTML (when fetch succeeds).
 * Cloudflare may block automated fetch — caller should handle failures.
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
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const MEETING_PATTERNS = [
  /((?:monthly|weekly|bi-?weekly)?\s*(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|last)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^.]{0,120})/i,
  /((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]{0,80})/i,
  /(meets?\s+(?:every|each|monthly|weekly)[^.]{0,100})/i,
];

const VENUE_HINT = /(?:at|@)\s+([A-Z][^.]{5,80})/i;

export function parseDemCountyPageText(htmlOrText, county, url) {
  const text = htmlOrText.includes("<") ? htmlToText(htmlOrText) : String(htmlOrText);
  if (/just a moment|cloudflare|enable javascript/i.test(text)) {
    return { county, url, meeting_info: null, fetch_blocked: true, chair: null, venue: null };
  }

  let meeting_info = null;
  for (const re of MEETING_PATTERNS) {
    const m = text.match(re);
    if (m) {
      meeting_info = m[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  const chairMatch = text.match(/(?:county\s+)?chair(?:person)?:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const venueMatch = text.match(VENUE_HINT);

  return {
    county,
    url,
    meeting_info,
    fetch_blocked: false,
    chair: chairMatch?.[1]?.trim() ?? null,
    venue: venueMatch?.[1]?.trim() ?? null,
    raw_excerpt: text.slice(0, 600),
  };
}

export function demCountyToRecord(parsed) {
  return {
    id: `dem-${parsed.county.toLowerCase().replace(/\s+/g, "-")}`,
    party_label: "Democratic",
    organization: "Democratic Party of Arkansas",
    county: parsed.county,
    chair: parsed.chair,
    recurrence_text: parsed.meeting_info,
    venue: parsed.venue,
    meeting_name: `${parsed.county} County Democratic Committee Meeting`,
    meeting_subtype: "county_party_committee",
    source_url: parsed.url,
    discovered_by: parsed.fetch_blocked ? "harvest:party-meetings:dpa-template" : "harvest:party-meetings:dpa",
    confidence_score: parsed.meeting_info ? 65 : parsed.fetch_blocked ? 25 : 30,
    raw_excerpt: parsed.raw_excerpt?.slice(0, 500) ?? null,
    verification_status: parsed.meeting_info ? "needs_verification" : "needs_review",
    page_discovered: true,
    fetch_blocked: parsed.fetch_blocked ?? false,
  };
}
