import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EventCard } from "../components/EventCard";
import { EventSafariWizard } from "../components/discovery/EventSafariWizard";
import { fetchEvents } from "../lib/api";
import { filterSafari } from "../lib/discovery/eventDiscovery";
import type { SafariPreferences } from "../lib/discovery/types";

export function SafariPage() {
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchEvents>>>([]);
  const [prefs, setPrefs] = useState<SafariPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => (prefs ? filterSafari(events, prefs) : []), [events, prefs]);

  if (!prefs) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <EventSafariWizard onComplete={setPrefs} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <button type="button" className="text-sm text-ark-sage hover:underline" onClick={() => setPrefs(null)}>
        ← New safari
      </button>
      <h1 className="font-display text-2xl font-bold text-ark-pine mt-4">Your Event Safari</h1>
      <p className="text-muted text-sm mt-1">{results.length} events matched your hunt</p>

      {loading ? (
        <div className="mt-8 h-48 animate-pulse bg-ark-wheat/50 rounded-2xl" />
      ) : results.length === 0 ? (
        <div className="card mt-8 text-center py-12">
          <p className="text-ark-pine/70">No matches yet — the calendar is still growing.</p>
          <Link to="/submit" className="btn-primary mt-4 inline-flex">Submit an event</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {results.map((e) => (
            <EventCard key={e.id} event={e} compact />
          ))}
        </div>
      )}
    </div>
  );
}
