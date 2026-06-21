function deterministicLocalSummaryServer(ctx) {
  const city = ctx.cityDossier;
  const county = ctx.countyDossier;
  const place = city?.city || county?.county || "this area";
  const events = ctx.events || [];

  return {
    source: "deterministic",
    whyItMatters: `${place} — campaign local intelligence brief for ${ctx.workspace?.candidateName || "candidate"}.`,
    eventsThatMatter: ["Church dinners", "County fairs", "Government meetings", "School events"],
    calendarGaps: events.length ? [`${events.length} events in feed`] : ["No events indexed yet"],
    electionContext: city
      ? `Baseline ${city.sosBaselineVotes} → target ${city.sosTargetVotes} (placeholder SOS math)`
      : "County election math in dossier",
    relationshipGuidance: "Prioritize recurring traditions and handshake rooms.",
    questionsForLocals: ["Who hosts the biggest community meal?", "Which meeting matters most?"],
    confidenceNotes: `Confidence ${city?.confidenceScore || county?.confidenceScore || 20}%`,
    missingData: ["Census ACS full import", "BLS QCEW county employment"],
  };
}

module.exports = { deterministicLocalSummaryServer };
