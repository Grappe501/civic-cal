import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvents } from "../lib/api";
import { scoreEventIntelligence } from "../lib/intelligence/eventOpportunityScore";
import { inferIntelligenceLayer } from "../lib/intelligence/eventLayers";
import type { CivicEvent } from "../lib/types";
import {
  DISTRICT_TYPE_LABELS,
  filterEventsInDistrict,
  loadDemoWorkspace,
  loadEventPlans,
  PLAN_STATUS_LABELS,
  saveDemoWorkspace,
  saveEventPlan,
  type CampaignEventPlan,
  type CampaignWorkspace,
  type DistrictType,
  type PlanStatus,
} from "../lib/campaign/demoStore";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import { formatEventRange } from "../lib/format";
import { GoogleCalendarRail, MobilizeRail } from "../components/integrations/IntegrationRails";
import { LayerBadge, DensityBadge } from "../components/intelligence/LayerBadge";
import { isThisWeek, isWeekend } from "date-fns";

function eventIntel(e: CivicEvent) {
  const layer = e.intelligenceLayer ?? inferIntelligenceLayer(`${e.title} ${e.description ?? ""}`, e.category);
  return scoreEventIntelligence({
    title: e.title,
    category: e.category,
    intelligenceLayer: layer,
    description: e.description ?? undefined,
    isPublicGovernmentMeeting: e.isPublicGovernmentMeeting,
    candidateRelevant: e.candidateRelevant,
  });
}

type ViewTab = "week" | "weekend" | "opportunity" | "density" | "gov" | "church" | "school" | "festivals";

export function CampaignDemoPage() {
  const [ws, setWs] = useState<CampaignWorkspace>(() => loadDemoWorkspace());
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [plans, setPlans] = useState<Record<string, CampaignEventPlan>>(() => loadEventPlans());
  const [tab, setTab] = useState<ViewTab>("week");

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error);
  }, []);

  const inDistrict = useMemo(() => filterEventsInDistrict(events, ws), [events, ws]);

  const scored = useMemo(
    () =>
      inDistrict.map((e) => ({
        event: e,
        intel: eventIntel(e),
        layer: e.intelligenceLayer ?? inferIntelligenceLayer(`${e.title} ${e.description ?? ""}`, e.category),
      })),
    [inDistrict],
  );

  const filtered = useMemo(() => {
    switch (tab) {
      case "week":
        return scored.filter(({ event }) => isThisWeek(new Date(event.startAt), { weekStartsOn: 0 }));
      case "weekend":
        return scored.filter(({ event }) => isWeekend(new Date(event.startAt)));
      case "opportunity":
        return [...scored].sort((a, b) => b.intel.politicalOpportunityScore - a.intel.politicalOpportunityScore);
      case "density":
        return [...scored].sort((a, b) => b.intel.relationshipDensityScore - a.intel.relationshipDensityScore);
      case "gov":
        return scored.filter(({ layer, event }) => layer === "government" || event.category === "civic_meeting");
      case "church":
        return scored.filter(({ layer }) => layer === "community_church");
      case "school":
        return scored.filter(({ layer }) => layer === "school_ecosystem");
      case "festivals":
        return scored.filter(({ layer }) => layer === "community_identity");
      default:
        return scored;
    }
  }, [scored, tab]);

  function updateWorkspace(patch: Partial<CampaignWorkspace>) {
    const next = { ...ws, ...patch };
    setWs(next);
    saveDemoWorkspace(next);
  }

  function setPlan(eventId: string, planStatus: PlanStatus) {
    const existing = plans[eventId];
    const plan: CampaignEventPlan = {
      ...existing,
      eventId,
      planStatus,
      candidateAttending: planStatus === "attending" || planStatus === "candidate_should_attend",
      needsVolunteers: planStatus === "needs_volunteers",
    };
    saveEventPlan(eventId, plan);
    setPlans({ ...plans, [eventId]: plan });
  }

  const tabs: { id: ViewTab; label: string }[] = [
    { id: "week", label: "This week" },
    { id: "weekend", label: "This weekend" },
    { id: "opportunity", label: "Highest opportunity" },
    { id: "density", label: "Highest RD" },
    { id: "gov", label: "Government" },
    { id: "church", label: "Church meals" },
    { id: "school", label: "School/sports" },
    { id: "festivals", label: "Festivals/fairs" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/campaigns" className="text-sm text-ark-sage hover:underline">← Campaign overview</Link>
      <h1 className="font-display text-2xl font-bold text-ark-pine mt-2">{ws.campaignName}</h1>
      <p className="text-sm text-ark-pine/60">Demo workspace — plans saved in this browser only</p>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-4">
          <h2 className="font-semibold">District setup</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">District type</label>
              <select
                className="input"
                value={ws.districtType}
                onChange={(e) => updateWorkspace({ districtType: e.target.value as DistrictType })}
              >
                {Object.entries(DISTRICT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">District name</label>
              <input
                className="input"
                value={ws.districtName ?? ""}
                onChange={(e) => updateWorkspace({ districtName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Counties (comma-separated)</label>
            <input
              className="input"
              value={ws.counties.join(", ")}
              onChange={(e) =>
                updateWorkspace({
                  counties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              list="county-list"
            />
            <datalist id="county-list">
              {ARKANSAS_COUNTIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-ark-pine/50">{inDistrict.length} events in selected area</p>
        </div>
        <div className="space-y-4">
          <GoogleCalendarRail />
          <MobilizeRail />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mt-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "chip bg-ark-rust text-white" : "chip bg-ark-wheat text-ark-pine"}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.slice(0, 20).map(({ event, intel, layer }) => (
          <div key={event.id} className="card">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <Link to={`/event/${event.slug}`} className="font-semibold text-ark-pine hover:text-ark-rust">
                  {event.title}
                </Link>
                <p className="text-xs text-ark-pine/50 mt-1">
                  {formatEventRange(event)} · {event.city || event.county} County
                </p>
              </div>
              <div className="flex flex-wrap gap-1 items-start">
                <LayerBadge layer={layer} compact />
                <span className="chip bg-ark-rust/15 text-ark-rust text-xs">PO {intel.politicalOpportunityScore}</span>
                <DensityBadge score={intel.relationshipDensityScore} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(PLAN_STATUS_LABELS) as PlanStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPlan(event.id, status)}
                  className={
                    plans[event.id]?.planStatus === status
                      ? "chip bg-ark-pine text-white text-xs"
                      : "chip bg-ark-wheat text-ark-pine text-xs"
                  }
                >
                  {PLAN_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-ark-pine/60">No events match this view in your district.</p>}
      </div>
    </div>
  );
}
