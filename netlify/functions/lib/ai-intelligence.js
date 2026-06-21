/**
 * Server-side event intelligence — OpenAI + deterministic fallback.
 * AI is advisory only; never auto-publishes.
 */

function hasDate(input) {
  return Boolean(input.eventDate || input.startAt);
}

function hasLocation(input) {
  return Boolean(input.city || input.county || input.venueName || input.address);
}

function crowdFromFeedback(feedback = []) {
  const crowds = feedback.map((f) => f.crowdSizeEstimate).filter((n) => typeof n === "number" && n > 0);
  if (!crowds.length) return { min: null, max: null };
  const avg = crowds.reduce((a, b) => a + b, 0) / crowds.length;
  return { min: Math.round(avg * 0.7), max: Math.round(avg * 1.3) };
}

function traditionFromFeedback(feedback = []) {
  const years = feedback.map((f) => f.traditionYears).filter((n) => typeof n === "number" && n > 0);
  if (!years.length) return 0;
  const max = Math.max(...years);
  if (max >= 50) return 95;
  if (max >= 25) return 85;
  if (max >= 10) return 70;
  if (max >= 5) return 55;
  return 40;
}

function scoreFromHeuristics(input, text) {
  let po = 45;
  let rd = 50;
  const layer = input.intelligenceLayer;
  if (layer === "community_church") {
    po += 30;
    rd += 35;
  } else if (layer === "community_identity") {
    po += 28;
    rd += 15;
  } else if (layer === "school_ecosystem") {
    po += 24;
    rd += 25;
  } else if (layer === "relationship") {
    po += 18;
    rd += 38;
  } else if (layer === "government") {
    po += 16;
    rd += 30;
  }
  if (/spaghetti|catholic point|fish fry|brisket|bbq dinner/.test(text)) {
    po += 25;
    rd += 30;
  }
  if (/rotary|farm bureau|vfw|legion|chamber/.test(text)) {
    rd += 25;
  }
  if (/fair|festival|parade|watermelon|tomato|peach/.test(text)) po += 20;
  if (/homecoming|rivalry|ffa|4-h/.test(text)) {
    po += 18;
    rd += 15;
  }
  if (input.isRecurring) po += 8;
  if (input.feedback?.some((f) => f.isGoodForCandidates)) {
    po += 12;
    rd += 8;
  }
  return {
    politicalOpportunityScore: Math.max(0, Math.min(100, po)),
    relationshipDensityScore: Math.max(0, Math.min(100, rd)),
  };
}

function usefulnessFromScores(po, rd) {
  const combined = po * 0.45 + rd * 0.55;
  if (combined >= 85) return "very_high";
  if (combined >= 70) return "high";
  if (combined >= 50) return "medium";
  return "low";
}

function buildDeterministicAssessment(input) {
  const text = `${input.title} ${input.description ?? ""} ${input.notes ?? ""}`.toLowerCase();
  const riskFlags = [];
  const verificationQuestions = [];
  const localIntelNeeded = [];
  const SPAM = /\b(casino|porn|xxx|escort|crypto pump|mlm)\b/i;

  if (!hasDate(input)) {
    riskFlags.push("missing_date");
    verificationQuestions.push("What is the confirmed date and start time?");
    localIntelNeeded.push("Confirm event date from organizer or public listing");
  }
  if (!hasLocation(input)) {
    riskFlags.push("missing_location");
    verificationQuestions.push("Where exactly does this event take place?");
    localIntelNeeded.push("Venue name and address");
  }
  if (!input.sourceUrl && !input.sourceName) {
    riskFlags.push("no_public_source");
    localIntelNeeded.push("Link to official site, parish bulletin, or public announcement");
  }
  if (SPAM.test(text)) riskFlags.push("suspicious_content");

  const { politicalOpportunityScore, relationshipDensityScore } = scoreFromHeuristics(input, text);
  const crowd = crowdFromFeedback(input.feedback);
  const traditionStrength = Math.max(traditionFromFeedback(input.feedback), input.isRecurring ? 45 : 0);

  let estimatedCrowdMin = crowd.min;
  let estimatedCrowdMax = crowd.max;
  if (estimatedCrowdMin == null) {
    if (/fair|festival|parade|homecoming|spaghetti|fish fry/.test(text)) {
      estimatedCrowdMin = 500;
      estimatedCrowdMax = 5000;
    } else if (/rotary|lions|chamber|quorum court|city council/.test(text)) {
      estimatedCrowdMin = 25;
      estimatedCrowdMax = 300;
    }
  }

  const candidateUsefulness = usefulnessFromScores(politicalOpportunityScore, relationshipDensityScore);
  const isLikelyReal = riskFlags.filter((f) => f !== "no_public_source").length < 2 && !SPAM.test(text);

  const whyFromFeedback = input.feedback?.find((f) => f.whyItMatters)?.whyItMatters;
  const whyItMatters =
    whyFromFeedback ||
    (input.isPublicGovernmentMeeting
      ? "Public government meeting — civic accountability touchpoint."
      : relationshipDensityScore >= 80
        ? "High relationship density — strong place to meet connected local leaders."
        : politicalOpportunityScore >= 75
          ? "Strong community gathering — good visibility for candidates and organizers."
          : "Community event — verify details before prioritizing.");

  const bestFor = [];
  if (candidateUsefulness !== "low") bestFor.push("candidate");
  if (/volunteer|fundraiser|fair|festival/.test(text)) bestFor.push("volunteers");
  if (input.isPublicGovernmentMeeting || input.intelligenceLayer === "government") bestFor.push("county leaders");
  if (/school|homecoming|pta|pto|ffa/.test(text)) bestFor.push("school board watchers");

  let confidenceScore = 50;
  if (hasDate(input) && hasLocation(input)) confidenceScore += 20;
  if (input.sourceUrl) confidenceScore += 15;
  if (input.feedback?.length) confidenceScore += 10;
  if (riskFlags.length) confidenceScore -= riskFlags.length * 8;
  confidenceScore = Math.max(10, Math.min(95, confidenceScore));

  const verificationStatus = isLikelyReal
    ? hasDate(input) && hasLocation(input)
      ? "pending"
      : "needs_verification"
    : "needs_verification";

  return {
    isLikelyReal,
    verificationQuestions,
    estimatedCrowdMin,
    estimatedCrowdMax,
    traditionStrength,
    politicalOpportunityScore,
    relationshipDensityScore,
    candidateUsefulness,
    bestFor,
    whyItMatters,
    localIntelNeeded,
    riskFlags,
    publicSummary: `${input.title}${input.county ? ` in ${input.county} County` : ""} — ${whyItMatters.split(".")[0]}.`,
    campaignNotes: `[Deterministic] PO ${politicalOpportunityScore}, RD ${relationshipDensityScore}. ${localIntelNeeded.length ? `Needs: ${localIntelNeeded.join("; ")}` : "Basic fields present."}`,
    confidenceScore,
    verificationStatus,
    source: "deterministic_fallback",
  };
}

const SYSTEM_PROMPT = `You assess Arkansas civic and community events for a nonpartisan public calendar.
Rules:
- Never invent facts. Separate verified facts from estimates.
- Mark uncertainty clearly in verificationQuestions and localIntelNeeded.
- Use local feedback when provided — treat it as community-sourced, not verified fact.
- Estimate crowd size only as a range with low confidence if no feedback.
- If missing source, date, or location, mark needs verification.
- Do not include political party preference or private voter data.
- Return ONLY valid JSON matching the schema requested.`;

async function callOpenAi(input, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const userPayload = {
    event: {
      title: input.title,
      description: input.description,
      category: input.category,
      city: input.city,
      county: input.county,
      eventDate: input.eventDate || input.startAt,
      venueName: input.venueName,
      address: input.address,
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      intelligenceLayer: input.intelligenceLayer,
      isRecurring: input.isRecurring,
      isPublicGovernmentMeeting: input.isPublicGovernmentMeeting,
      notes: input.notes,
    },
    communityFeedback: input.feedback ?? [],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Assess this Arkansas event. Return JSON with keys: isLikelyReal, verificationQuestions, estimatedCrowdMin, estimatedCrowdMax, traditionStrength (0-100), politicalOpportunityScore (0-100), relationshipDensityScore (0-100), candidateUsefulness (low|medium|high|very_high), bestFor (array), whyItMatters, localIntelNeeded, riskFlags, publicSummary, campaignNotes, confidenceScore (0-100).\n\n${JSON.stringify(userPayload)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[ai-intelligence] OpenAI error", res.status);
    return null;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function mergeOpenAi(raw, fallback) {
  if (!raw || typeof raw !== "object") return fallback;
  return {
    isLikelyReal: typeof raw.isLikelyReal === "boolean" ? raw.isLikelyReal : fallback.isLikelyReal,
    verificationQuestions: Array.isArray(raw.verificationQuestions) ? raw.verificationQuestions.map(String) : fallback.verificationQuestions,
    estimatedCrowdMin: typeof raw.estimatedCrowdMin === "number" ? raw.estimatedCrowdMin : fallback.estimatedCrowdMin,
    estimatedCrowdMax: typeof raw.estimatedCrowdMax === "number" ? raw.estimatedCrowdMax : fallback.estimatedCrowdMax,
    traditionStrength: typeof raw.traditionStrength === "number" ? raw.traditionStrength : fallback.traditionStrength,
    politicalOpportunityScore:
      typeof raw.politicalOpportunityScore === "number" ? raw.politicalOpportunityScore : fallback.politicalOpportunityScore,
    relationshipDensityScore:
      typeof raw.relationshipDensityScore === "number" ? raw.relationshipDensityScore : fallback.relationshipDensityScore,
    candidateUsefulness: ["low", "medium", "high", "very_high"].includes(raw.candidateUsefulness)
      ? raw.candidateUsefulness
      : fallback.candidateUsefulness,
    bestFor: Array.isArray(raw.bestFor) ? raw.bestFor.map(String) : fallback.bestFor,
    whyItMatters: typeof raw.whyItMatters === "string" ? raw.whyItMatters : fallback.whyItMatters,
    localIntelNeeded: Array.isArray(raw.localIntelNeeded) ? raw.localIntelNeeded.map(String) : fallback.localIntelNeeded,
    riskFlags: Array.isArray(raw.riskFlags) ? raw.riskFlags.map(String) : fallback.riskFlags,
    publicSummary: typeof raw.publicSummary === "string" ? raw.publicSummary : fallback.publicSummary,
    campaignNotes: typeof raw.campaignNotes === "string" ? raw.campaignNotes : fallback.campaignNotes,
    confidenceScore: typeof raw.confidenceScore === "number" ? raw.confidenceScore : fallback.confidenceScore,
    verificationStatus: fallback.verificationStatus,
    source: "openai",
    model: process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini",
  };
}

async function assessEvent(input) {
  const fallback = buildDeterministicAssessment(input);
  const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
  const raw = await callOpenAi(input, model);
  if (!raw) return fallback;
  return mergeOpenAi(raw, fallback);
}

module.exports = { assessEvent, buildDeterministicAssessment };
