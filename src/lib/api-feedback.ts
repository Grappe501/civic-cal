const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export interface EventFeedbackPayload {
  eventId?: string;
  eventSlug?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterCity?: string;
  submitterCounty?: string;
  attendedBefore?: boolean;
  crowdSizeEstimate?: number;
  traditionYears?: number;
  localNotes?: string;
  isGoodForCandidates?: boolean;
  whyItMatters?: string;
  correctionNotes?: string;
}

export async function submitEventFeedback(payload: EventFeedbackPayload): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${fnBase}/event-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Feedback failed");
  return data;
}
