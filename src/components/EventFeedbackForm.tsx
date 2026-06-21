import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import { submitEventFeedback } from "../lib/api-feedback";

interface Props {
  eventId: string;
  eventSlug?: string;
  eventCounty?: string;
  eventCity?: string | null;
}

export function EventFeedbackForm({ eventId, eventSlug, eventCounty, eventCity }: Props) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await submitEventFeedback({
        eventId: /^[0-9a-f-]{36}$/i.test(eventId) ? eventId : undefined,
        eventSlug,
        submitterName: String(fd.get("name") || "") || undefined,
        submitterEmail: String(fd.get("email") || "") || undefined,
        submitterCity: String(fd.get("city") || eventCity || "") || undefined,
        submitterCounty: String(fd.get("county") || eventCounty || "") || undefined,
        attendedBefore: fd.get("attendedBefore") === "on",
        crowdSizeEstimate: Number(fd.get("crowdSize")) || undefined,
        traditionYears: Number(fd.get("traditionYears")) || undefined,
        isGoodForCandidates: fd.get("goodForCandidates") === "yes" ? true : fd.get("goodForCandidates") === "no" ? false : undefined,
        whyItMatters: String(fd.get("whyItMatters") || "") || undefined,
        correctionNotes: String(fd.get("correction") || "") || undefined,
        localNotes: String(fd.get("outsiderNotes") || "") || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit feedback");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card bg-ark-sage/10 border-ark-sage/30">
        <CheckCircle2 className="h-8 w-8 text-ark-sage" />
        <p className="font-medium text-ark-pine mt-2">Thank you — your local knowledge is in review.</p>
        <p className="text-sm text-ark-pine/60 mt-1">Community feedback helps verify traditions and crowd estimates.</p>
      </div>
    );
  }

  return (
    <section className="card mt-8 border-l-4 border-l-ark-sage">
      <h2 className="font-display text-lg font-semibold text-ark-pine">Know this event?</h2>
      <p className="text-sm text-ark-pine/60 mt-1">
        Help Arkansas verify what matters — attendance, tradition, and whether leaders should show up.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="attendedBefore" className="rounded border-ark-pine/30" />
          I have attended before
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Estimated crowd size</label>
            <input name="crowdSize" type="number" min={1} className="input" placeholder="e.g. 800" />
          </div>
          <div>
            <label className="label">Years this tradition has run</label>
            <input name="traditionYears" type="number" min={1} className="input" placeholder="e.g. 25" />
          </div>
        </div>
        <div>
          <label className="label">Good place for candidates & community leaders?</label>
          <select name="goodForCandidates" className="input">
            <option value="">Not sure</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="label">What should outsiders know?</label>
          <textarea name="outsiderNotes" rows={2} className="input" />
        </div>
        <div>
          <label className="label">Why it matters locally</label>
          <textarea name="whyItMatters" rows={2} className="input" />
        </div>
        <div>
          <label className="label">Correction (date, location, name)</label>
          <textarea name="correction" rows={2} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Your name (optional)</label>
            <input name="name" className="input" />
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input name="email" type="email" className="input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">City</label>
            <input name="city" defaultValue={eventCity ?? ""} className="input" />
          </div>
          <div>
            <label className="label">County</label>
            <select name="county" defaultValue={eventCounty ?? ""} className="input">
              <option value="">Select</option>
              {ARKANSAS_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Sending…" : "Share local knowledge"}
        </button>
      </form>
    </section>
  );
}
