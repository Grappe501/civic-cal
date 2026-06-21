/**
 * Parse Libertarian Party of Arkansas public events page.
 */

function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseLibertarianEventsPage(htmlOrText) {
  const text = htmlOrText.includes("<") ? htmlToText(htmlOrText) : String(htmlOrText);
  const records = [];

  const eventBlocks = text.split(/(?=\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b)/i);
  for (const block of eventBlocks) {
    if (block.length < 20) continue;
    const titleMatch = block.match(/^([A-Za-z0-9][^.]{8,80})/);
    const dateMatch = block.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/i);
    const timeMatch = block.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i);
    const locMatch = block.match(/(?:@|at)\s+([A-Z][^,]{5,60}(?:,\s*AR)?)/i);
    const countyMatch = block.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+County/i);

    if (!titleMatch && !dateMatch) continue;

    const title = (titleMatch?.[1] ?? "Libertarian Party of Arkansas Event").trim();
    records.push({
      id: `lpar-${slug(title)}`,
      party_label: "Libertarian",
      organization: "Libertarian Party of Arkansas",
      county: countyMatch?.[1] ?? "Statewide",
      city: null,
      meeting_name: title,
      meeting_subtype: "party_event",
      recurrence_text: dateMatch ? `${dateMatch[0]}${timeMatch ? " " + timeMatch[0] : ""}` : null,
      next_date: dateMatch ? normalizeDate(dateMatch[0]) : null,
      venue: locMatch?.[1] ?? null,
      source_url: "https://www.lpar.org/events/",
      discovered_by: "harvest:party-meetings:lpar",
      confidence_score: dateMatch ? 60 : 35,
      raw_excerpt: block.slice(0, 300),
      verification_status: "needs_verification",
    });
  }

  if (!records.length && text.length > 100 && !/no upcoming events/i.test(text)) {
    records.push({
      id: "lpar-affiliate-statewide",
      party_label: "Libertarian",
      organization: "Libertarian Party of Arkansas",
      county: "Statewide",
      meeting_name: "Libertarian Party of Arkansas — public events",
      meeting_subtype: "party_affiliate",
      recurrence_text: null,
      source_url: "https://www.lpar.org/events/",
      discovered_by: "harvest:party-meetings:lpar",
      confidence_score: 40,
      raw_excerpt: text.slice(0, 400),
      verification_status: "needs_review",
      notes: "Affiliate page indexed — parse individual events when listed.",
    });
  }

  return dedupe(records);
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function normalizeDate(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function dedupe(records) {
  const seen = new Set();
  return records.filter((r) => {
    const key = `${r.county}:${r.meeting_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
