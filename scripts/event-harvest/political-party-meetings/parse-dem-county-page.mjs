/**
 * Parse Democratic county committee page HTML (arkdems.org/county/{slug}/).
 */

function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractSection(text, heading) {
  const patterns = [
    new RegExp(`${heading}\\s*([\\s\\S]*?)(?:Useful Links|Contact County|County Chair|Election Commissioner|Meeting Info|$)`, "i"),
    new RegExp(`##\\s*${heading}\\s*\\n+([\\s\\S]*?)(?:##|$)`, "i"),
    new RegExp(`#\\s*${heading}\\s*\\n+([\\s\\S]*?)(?:#|$)`, "i"),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const val = m?.[1]?.trim().replace(/\s+/g, " ");
    if (val && val.length > 1 && val.length < 400) return val;
  }
  return null;
}

function parseVenueAndCity(meetingInfo) {
  if (!meetingInfo) return { venue: null, city: null };
  const inCity = meetingInfo.match(/\bin\s+([A-Za-z .'-]+)$/i);
  const city = inCity?.[1]?.trim() ?? null;
  const atMatch = meetingInfo.match(/\bat\s+(.+?)(?:\s+in\s+[A-Za-z .'-]+)?$/i);
  let venue = atMatch?.[1]?.trim() ?? null;
  if (venue && city && venue.toLowerCase().endsWith(` in ${city.toLowerCase()}`)) {
    venue = venue.slice(0, -(` in ${city}`).length).trim();
  }
  return { venue, city };
}

const MEETING_PATTERNS = [
  /((?:monthly|weekly|bi-?weekly)\s+(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|last)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^.]{0,160})/i,
  /((?:\d+(?:st|nd|rd|th)|first|second|third|fourth|last)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^.]{0,160})/i,
  /((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]{0,120})/i,
  /(meets?\s+(?:every|each|monthly|weekly)[^.]{0,120})/i,
];

export function cleanMeetingInfo(info) {
  if (!info) return null;
  const cleaned = info.replace(/\s*#+\s*$/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned || /^contact county party$/i.test(cleaned)) return null;
  return cleaned;
}

export function parseDemCountyPageText(htmlOrText, county, url) {
  const text = htmlOrText.includes("<") ? htmlToText(htmlOrText) : String(htmlOrText);
  if (/just a moment|cloudflare|enable javascript|access denied/i.test(text)) {
    return { county, url, meeting_info: null, fetch_blocked: true, chair: null, venue: null, city: null, election_commissioner: null };
  }

  let meeting_info = extractSection(text, "Meeting Info");
  if (!meeting_info) {
    const mdMeeting = text.match(/Meeting Info\s*\n+\s*([^\n#]{8,220})/i);
    if (mdMeeting) meeting_info = mdMeeting[1].trim();
  }
  meeting_info = cleanMeetingInfo(meeting_info);
  if (!meeting_info) {
    for (const re of MEETING_PATTERNS) {
      const m = text.match(re);
      if (m) {
        meeting_info = m[1].trim().replace(/\s+/g, " ");
        break;
      }
    }
  }

  const chairBlock = extractSection(text, "County Chair") || text;
  const chairMatch =
    chairBlock.match(/County Chair\s*([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){0,3})/) ||
    text.match(/County Chair\s*([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){0,3})/);
  const electionMatch = text.match(/Election Commissioner\s*([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){0,3})/);

  const { venue, city } = parseVenueAndCity(meeting_info);

  return {
    county,
    url,
    meeting_info,
    fetch_blocked: false,
    chair: chairMatch?.[1]?.trim() ?? null,
    election_commissioner: electionMatch?.[1]?.trim() ?? null,
    venue,
    city,
    raw_excerpt: text.slice(0, 900),
  };
}

export function demCountyToRecord(parsed) {
  return {
    id: `dem-${parsed.county.toLowerCase().replace(/\s+/g, "-")}`,
    party_label: "Democratic",
    organization: "Democratic Party of Arkansas",
    county: parsed.county,
    chair: parsed.chair,
    election_commissioner: parsed.election_commissioner ?? null,
    recurrence_text: parsed.meeting_info,
    venue: parsed.venue,
    city: parsed.city,
    meeting_name: `${parsed.county} County Democratic Committee Meeting`,
    meeting_subtype: "county_party_committee",
    source_url: parsed.url,
    discovered_by: parsed.fetch_blocked ? "harvest:party-meetings:dpa-template" : "harvest:party-meetings:dpa",
    confidence_score: parsed.meeting_info ? 75 : parsed.fetch_blocked ? 25 : 30,
    raw_excerpt: parsed.raw_excerpt?.slice(0, 500) ?? null,
    verification_status: parsed.meeting_info ? "needs_verification" : "needs_review",
    page_discovered: true,
    fetch_blocked: parsed.fetch_blocked ?? false,
  };
}
