/**
 * Server-side deterministic strategic search (mirrors src/lib/ai/campaignSearchPlanner.ts)
 */

function inferIntent(query) {
  const q = query.toLowerCase();
  if (/weekend|this week|next week/.test(q)) return "weekend";
  if (/gap|missing|no event|empty/.test(q)) return "gaps";
  if (/volunteer|deploy|staff/.test(q)) return "volunteers";
  if (/church|fish fry|spaghetti|dinner/.test(q)) return "church";
  if (/high.?rd|relationship|density/.test(q)) return "rd";
  if (/worth the trip|outside|statewide/.test(q)) return "worth_trip";
  if (/county|no presence/.test(q)) return "county_coverage";
  if (/school board|candidate/.test(q)) return "school_gov";
  if (/100\+|crowd|people|attendance/.test(q)) return "crowd";
  if (/early voting|election/.test(q)) return "election";
  return "general";
}

function scoreEventForQuery(event, intent) {
  const text = `${event.title} ${event.description || ""} ${event.category || ""}`.toLowerCase();
  let score = (event.politicalOpportunityScore ?? 50) * 0.4 + (event.relationshipDensityScore ?? 50) * 0.4;
  if (intent === "church" && /church|fish fry|spaghetti|bbq|dinner/.test(text)) score += 40;
  if (intent === "volunteers" && /fair|festival|parade|homecoming/.test(text)) score += 25;
  if (intent === "school_gov" && /school board|city council|quorum/.test(text)) score += 35;
  if (intent === "rd" && (event.relationshipDensityScore ?? 0) >= 75) score += 30;
  return score;
}

function deterministicStrategicSearch(queryText, context) {
  const intent = inferIntent(queryText);
  const workspace = context?.workspace || {};
  const events = context?.events || [];
  const gapSummary = context?.gapSummary || [];

  const scoped = events.filter((e) => {
    if (workspace.districtType === "statewide") return true;
    const counties = workspace.districtScope?.counties || workspace.counties || [];
    if (counties.length && e.county) return counties.includes(e.county);
    return true;
  });

  const ranked = scoped
    .map((e) => ({ event: e, score: scoreEventForQuery(e, intent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const recommendedEvents = ranked.map(({ event, score }) => ({
    eventId: event.id,
    title: event.title,
    city: event.city,
    county: event.county,
    eventDate: event.startAt?.slice?.(0, 10) || event.eventDate,
    whyItMatters: score >= 70 ? "Strong fit for query intent and district scope." : "Matches scoped filters.",
    suggestedRole: intent === "volunteers" ? "volunteers" : "candidate",
    poScore: event.politicalOpportunityScore,
    rdScore: event.relationshipDensityScore,
  }));

  return {
    source: "deterministic",
    query: queryText,
    summary: `Strategic scan (${intent}) for ${workspace.candidateName || "campaign"}: ${recommendedEvents.length} events.`,
    recommendedEvents,
    calendarGaps: gapSummary.length ? gapSummary : [],
    suggestedRoles: ["Candidate should attend", "Surrogate if unavailable", "Volunteers for visibility"],
    risks: ["Deterministic mode — set OPENAI_API_KEY for deeper reasoning."],
    localIntelNeeded: recommendedEvents.slice(0, 2).map((e) => `Verify ${e.title}`),
    nextActions: [
      recommendedEvents[0] ? `Plan attendance for "${recommendedEvents[0].title}"` : "Submit or harvest more events.",
      "Review Strategy Panel gaps.",
    ],
  };
}

module.exports = { deterministicStrategicSearch };
