import { useEffect, useState } from "react";
import { fetchAdminEvents } from "../../lib/api";
import { fetchAdminDossiers, runDossierResearch, updateDossier } from "../../lib/api-event-dossier";
import type { CivicEvent } from "../../lib/types";
import type { EventIntelligenceDossier } from "../../lib/intelligence/eventDossierTypes";
import { formatEventRange } from "../../lib/format";

type Section = "missing" | "needs_research" | "low_confidence" | "recent";

interface Props {
  token: string;
}

export function AdminEventDossiersPanel({ token }: Props) {
  const [section, setSection] = useState<Section>("needs_research");
  const [dossiers, setDossiers] = useState<EventIntelligenceDossier[]>([]);
  const [missingEvents, setMissingEvents] = useState<{ id: string; title: string; slug: string; county?: string }[]>([]);
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load(s: Section = section) {
    setLoading(true);
    try {
      const data = await fetchAdminDossiers(token, s);
      if (s === "missing") {
        setMissingEvents(data.events ?? []);
        setDossiers([]);
      } else {
        setDossiers(data.dossiers ?? []);
        setMissingEvents([]);
      }
      const ev = await fetchAdminEvents(token, "approved");
      setEvents(ev.slice(0, 100));
    } catch (_) {
      setDossiers([]);
      setMissingEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(section);
  }, [section]);

  async function handleResearch(ev: CivicEvent) {
    setBusy(ev.id);
    try {
      await runDossierResearch(token, ev);
      await load(section);
    } finally {
      setBusy(null);
    }
  }

  async function handleVerify(eventId: string) {
    setBusy(eventId);
    try {
      await updateDossier(token, eventId, {}, "mark_verified");
      await load(section);
    } finally {
      setBusy(null);
    }
  }

  const sections: { id: Section; label: string }[] = [
    { id: "missing", label: "Missing dossiers" },
    { id: "needs_research", label: "Needs research" },
    { id: "low_confidence", label: "Low confidence" },
    { id: "recent", label: "Recently updated" },
  ];

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Event intelligence dossiers — AI assists research; humans verify before public confidence rises.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={section === s.id ? "chip chip-active" : "chip chip-muted"}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading dossiers…</p>
      ) : section === "missing" ? (
        <div className="space-y-3">
          {missingEvents.map((e) => {
            const ev = events.find((x) => x.id === e.id) || ({ ...e, startAt: "", county: e.county || "", category: "community" } as CivicEvent);
            return (
              <div key={e.id} className="card card-elevated">
                <h3 className="font-semibold text-ark-pine">{e.title}</h3>
                <p className="text-xs text-muted">{e.slug}</p>
                <button
                  type="button"
                  disabled={busy === e.id}
                  className="btn-primary text-xs py-2 mt-3"
                  onClick={() => handleResearch(ev)}
                >
                  {busy === e.id ? "Researching…" : "Run AI dossier research"}
                </button>
              </div>
            );
          })}
          {missingEvents.length === 0 && <p className="text-muted">All approved events have dossiers (or DB unavailable).</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {dossiers.map((d) => (
            <div key={d.eventId} className="card card-elevated">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ark-pine">Event {d.eventId.slice(0, 8)}…</h3>
                  <p className="text-xs text-muted">
                    Confidence {d.confidenceScore}% · {d.verificationStatus}
                  </p>
                </div>
                <span className="chip chip-muted">{d.unansweredQuestions?.length ?? 0} open questions</span>
              </div>
              {d.candidateGuidance && <p className="text-sm text-muted mt-2 line-clamp-2">{d.candidateGuidance}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === d.eventId}
                  className="btn-secondary text-xs py-2"
                  onClick={() => {
                    const ev = events.find((x) => x.id === d.eventId);
                    if (ev) handleResearch(ev);
                  }}
                >
                  Re-run research
                </button>
                <button
                  type="button"
                  disabled={busy === d.eventId}
                  className="btn-primary text-xs py-2"
                  onClick={() => handleVerify(d.eventId)}
                >
                  Mark verified
                </button>
              </div>
            </div>
          ))}
          {dossiers.length === 0 && <p className="text-muted">No dossiers in this section.</p>}
        </div>
      )}

      <div className="card mt-6">
        <h3 className="font-semibold text-ark-pine">Quick research — approved events</h3>
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {events.slice(0, 15).map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-ark-pine/5 pb-2">
              <div>
                <span className="font-medium">{e.title}</span>
                <span className="text-xs text-muted block">{formatEventRange(e)}</span>
              </div>
              <button
                type="button"
                disabled={busy === e.id}
                className="btn-secondary text-xs py-1.5"
                onClick={() => handleResearch(e)}
              >
                Research
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
