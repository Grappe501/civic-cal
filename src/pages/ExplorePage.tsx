import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArkansasEventMap } from "../components/maps/ArkansasEventMap";
import { ExplorePromptBar } from "../components/discovery/ExplorePromptBar";
import { EventMapCard } from "../components/maps/EventMapCard";
import { fetchEvents } from "../lib/api";
import { exploreByIntent, eventsWithPublicPresence } from "../lib/discovery/eventDiscovery";
import type { ExploreIntent } from "../lib/discovery/types";
import type { CivicEvent } from "../lib/types";
import { getEventPresence } from "../lib/campaigns/presenceLayer";
import { PresenceLegend } from "../components/campaigns/PresenceLegend";
import { eventHasMapPin } from "../lib/maps/mapTypes";

export function ExplorePage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [intent, setIntent] = useState<ExploreIntent | null>(null);
  const [presenceLayer, setPresenceLayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CivicEvent | null>(null);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = intent ? exploreByIntent(events, intent) : events;
    if (presenceLayer && intent !== "candidate_presence") {
      list = eventsWithPublicPresence(list);
    }
    return list;
  }, [events, intent, presenceLayer]);

  const mappable = filtered.filter(eventHasMapPin);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="section-kicker">Explore Arkansas</p>
        <h1 className="page-header">Where is everybody going?</h1>
        <p className="text-muted mt-2 max-w-2xl">Click the map. Follow the crowds. Find hidden gems. See who&apos;s showing up.</p>
      </div>

      <ExplorePromptBar
        active={intent}
        onSelect={setIntent}
        showPresenceToggle
        presenceOn={presenceLayer || intent === "candidate_presence"}
        onPresenceToggle={(on) => {
          setPresenceLayer(on);
          if (on) setIntent("candidate_presence");
        }}
      />

      <PresenceLegend compact />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-6">
        <div>
          {loading ? (
            <div className="h-[min(70vh,620px)] animate-pulse rounded-2xl bg-ark-wheat/50" />
          ) : (
            <ArkansasEventMap
              events={filtered}
              height="min(70vh, 620px)"
              selectedSlug={selected?.slug}
              onSelectEvent={setSelected}
            />
          )}
          <p className="text-xs text-muted mt-2">{mappable.length} on map · {filtered.length} in view</p>
        </div>

        <aside className="space-y-3 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold text-sm sticky top-0 bg-ark-porch py-2">
            {intent ? "Explore results" : "All events"} ({filtered.length})
          </h2>
          {filtered.slice(0, 20).map((e) => {
            const presence = getEventPresence(e.id);
            return (
              <div key={e.id} className="relative cursor-pointer" onClick={() => setSelected(e)} role="presentation">
                {presence.publicBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {presence.publicBadges.slice(0, 2).map((b) => (
                      <span key={b.label} className="chip text-[9px] text-white py-0.5" style={{ backgroundColor: b.color }}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}
                <EventMapCard event={e} className={selected?.id === e.id ? "ring-2 ring-ark-rust" : undefined} />
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted">Try another explore prompt.</p>}
          <Link to="/safari" className="btn-secondary text-sm w-full justify-center">Event Safari →</Link>
        </aside>
      </div>
    </div>
  );
}
