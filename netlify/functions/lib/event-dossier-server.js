/** Server-side dossier builder mirror */
const DEFAULT_RESEARCH_TASKS = [
  { taskType: "verify_datetime", taskLabel: "Verify date and time from official source" },
  { taskType: "host_contact", taskLabel: "Find host contact (name, email, or phone)" },
  { taskType: "parking", taskLabel: "Confirm parking availability and instructions" },
  { taskType: "accessibility", taskLabel: "Confirm accessibility (ramps, seating, ADA)" },
  { taskType: "cost", taskLabel: "Confirm ticket or meal cost" },
  { taskType: "vendor_info", taskLabel: "Confirm vendor or booth options" },
  { taskType: "attendance_history", taskLabel: "Confirm typical crowd size and attendance history" },
  { taskType: "officials_attend", taskLabel: "Confirm whether public officials usually attend" },
];

function buildDeterministicDossierServer(eventPayload, feedback = []) {
  const event = eventPayload;
  const unanswered = DEFAULT_RESEARCH_TASKS.map((t) => t.taskLabel);
  const sourceLinks = event.websiteUrl
    ? [{ type: "official_event_site", label: "Event website", url: event.websiteUrl, trust: "medium" }]
    : [];

  const dossier = {
    eventId: event.id,
    hostOrganization: event.hostOrganization || null,
    officialWebsite: event.websiteUrl || null,
    sourceLinks,
    familyFriendly: event.isFamilyFriendly ?? null,
    ticketCost: event.isFree ? "Free (per calendar listing)" : null,
    candidateGuidance: "Confirm with a local contact before treating this as a campaign stop.",
    volunteerGuidance: "Confirm volunteer roles with host before deploying a team.",
    unansweredQuestions: unanswered,
    confirmedFacts: event.hostOrganization ? [`Host listed: ${event.hostOrganization}`] : [],
    likelyInferences: [],
    verificationStatus: "needs_review",
    confidenceScore: sourceLinks.length ? 20 : 10,
  };

  const tasks = DEFAULT_RESEARCH_TASKS.map((t) => ({
    eventId: event.id,
    taskType: t.taskType,
    taskLabel: t.taskLabel,
    status: "open",
  }));

  return { dossier, tasks, source: "deterministic" };
}

module.exports = { buildDeterministicDossierServer, DEFAULT_RESEARCH_TASKS };
