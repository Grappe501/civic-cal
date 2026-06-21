function inferIntent(query, mode) {
  const q = query.toLowerCase();
  if (/family|kids/.test(q)) return "family";
  if (/church|fish fry|dinner/.test(q)) return "church";
  if (/crowd|biggest|everyone/.test(q)) return "crowds";
  if (/race|5k|marathon/.test(q)) return "races";
  if (/candidate|showing up/.test(q)) return "candidates";
  if (mode === "candidate") return "candidate_plan";
  return "general";
}

function deterministicPublicDiscoverySearchServer(query, mode, sampleTitles) {
  const intent = inferIntent(query, mode);
  const headlines = {
    family: "Family-friendly picks across Arkansas",
    church: "Church dinners & community meals",
    crowds: "Events that draw the biggest crowds",
    races: "Arkansas race circuit",
    candidates: "Where candidates are showing up",
    candidate_plan: "High-value rooms for campaign presence",
    general: "Discoveries across Arkansas",
  };
  return {
    source: "deterministic",
    query,
    mode,
    headline: headlines[intent] || headlines.general,
    summary: `Based on ${sampleTitles.length} events in the feed. ${query} — verify details locally.`,
    eventIds: [],
    followUpPrompts: [
      "Where should I take my family this weekend?",
      "Show me hidden gems in North Arkansas.",
      "Find every race and 5K this month.",
    ],
  };
}

module.exports = { deterministicPublicDiscoverySearchServer };
