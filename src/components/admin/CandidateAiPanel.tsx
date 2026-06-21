import { useState } from "react";
import type { IngestionCandidate } from "../../lib/intelligence/types";
import type { EventIntelligenceAssessment } from "../../lib/ai/eventIntelligence";
import { scoreEventWithAi } from "../../lib/api-ai";
import { candidateAdminAction } from "../../lib/api-ingestion";

interface Props {
  token: string;
  candidate: IngestionCandidate;
  onAction: () => void;
}

export function CandidateAiPanel({ token, candidate, onAction }: Props) {
  const [assessment, setAssessment] = useState<EventIntelligenceAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCampaignNotes, setShowCampaignNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScore(action?: "mark_verified" | "request_intel" | "reject_spam") {
    setLoading(true);
    setError(null);
    try {
      const res = await scoreEventWithAi(token, {
        eventPayload: {
          title: candidate.title,
          description: candidate.description,
          category: candidate.category,
          city: candidate.city,
          county: candidate.county,
          event_date: candidate.eventDate,
          venue_name: candidate.venueName,
          address: candidate.address,
          source_url: candidate.sourceUrl,
          source_name: candidate.sourceName,
          intelligence_layer: candidate.intelligenceLayer,
          is_recurring_annual: candidate.isRecurringAnnual,
          notes: candidate.notes,
        },
        candidateId: candidate.id.match(/^[0-9a-f-]{36}$/i) ? candidate.id : undefined,
        action,
      });
      setAssessment(res.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    try {
      await candidateAdminAction(token, candidate.id, "approve_to_events");
    } catch (_) {}
    onAction();
  }

  async function reject() {
    try {
      await candidateAdminAction(token, candidate.id, "reject");
    } catch (_) {}
    onAction();
  }

  const a = assessment;

  return (
    <div className="mt-3 border-t border-ark-pine/10 pt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={loading} className="btn-primary text-xs py-2" onClick={() => runScore()}>
          {loading ? "Scoring…" : "Score with AI"}
        </button>
        <button type="button" disabled={loading} className="btn-secondary text-xs py-2" onClick={() => runScore()}>
          Re-score with latest feedback
        </button>
        {a && (
          <button type="button" className="btn-secondary text-xs py-2" onClick={() => setShowCampaignNotes((v) => !v)}>
            {showCampaignNotes ? "Hide" : "View"} AI assessment
          </button>
        )}
        <button type="button" disabled={loading} className="btn-secondary text-xs py-2" onClick={() => runScore("mark_verified")}>
          Mark verified
        </button>
        <button type="button" disabled={loading} className="btn-secondary text-xs py-2" onClick={() => runScore("request_intel")}>
          Request more local intel
        </button>
        <button type="button" className="btn-primary text-xs py-2" onClick={approve}>
          Approve to calendar
        </button>
        <button type="button" className="btn-secondary text-xs py-2" onClick={() => runScore("reject_spam")}>
          Reject spam
        </button>
        <button type="button" className="btn-secondary text-xs py-2" onClick={reject}>
          Reject
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {a && showCampaignNotes && (
        <div className="mt-4 p-4 rounded-xl bg-ark-wheat/40 text-sm space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="chip text-xs">{a.source === "openai" ? "OpenAI advisory" : "Deterministic fallback"}</span>
            <span className="chip text-xs">Realness: {a.isLikelyReal ? "Likely real" : "Needs verification"}</span>
            <span className="chip text-xs">Confidence {a.confidenceScore}%</span>
            <span className="chip text-xs">Tradition {a.traditionStrength}</span>
            <span className="chip text-xs">Usefulness: {a.candidateUsefulness}</span>
          </div>
          {a.estimatedCrowdMin != null && (
            <p>
              <strong>Crowd estimate:</strong> {a.estimatedCrowdMin}–{a.estimatedCrowdMax ?? "?"} (estimated)
            </p>
          )}
          <p><strong>Public summary:</strong> {a.publicSummary}</p>
          <p><strong>Why it matters:</strong> {a.whyItMatters}</p>
          {a.localIntelNeeded.length > 0 && (
            <p><strong>Local info still needed:</strong> {a.localIntelNeeded.join("; ")}</p>
          )}
          {a.verificationQuestions.length > 0 && (
            <p><strong>Verification questions:</strong> {a.verificationQuestions.join("; ")}</p>
          )}
          {a.riskFlags.length > 0 && (
            <p className="text-amber-800"><strong>Risk flags:</strong> {a.riskFlags.join(", ")}</p>
          )}
          <p className="text-ark-pine/70 border-t pt-2"><strong>Campaign notes (admin):</strong> {a.campaignNotes}</p>
        </div>
      )}
    </div>
  );
}
