import type { EventIntelligenceAssessment } from "./ai/eventIntelligence";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export async function scoreEventWithAi(
  token: string,
  payload: {
    eventPayload: Record<string, unknown>;
    eventId?: string;
    candidateId?: string;
    action?: "mark_verified" | "request_intel" | "reject_spam";
  },
): Promise<{ assessment: EventIntelligenceAssessment; stored: boolean; aiEnabled: boolean }> {
  const res = await fetch(`${fnBase}/ai-score-event`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI scoring failed");
  return data;
}

export async function fetchAiAssessments(
  token: string,
  params: { eventId?: string; candidateId?: string },
): Promise<{ assessments: Array<{ assessment: EventIntelligenceAssessment; createdAt: string }> }> {
  const q = new URLSearchParams();
  if (params.eventId) q.set("eventId", params.eventId);
  if (params.candidateId) q.set("candidateId", params.candidateId);
  const res = await fetch(`${fnBase}/ai-score-event?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load assessments");
  return res.json();
}
