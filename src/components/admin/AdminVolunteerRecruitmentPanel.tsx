import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../../lib/api";
import { listAllPublicVolunteerAsks } from "../../lib/campaigns/volunteerRecruitment";
import { listCampaignWorkspaces } from "../../lib/campaigns/workspaces";
import type { CivicEvent } from "../../lib/types";

interface Props {
  token: string;
}

export function AdminVolunteerRecruitmentPanel({ token: _token }: Props) {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error);
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("civic-presence-updated", handler);
    return () => window.removeEventListener("civic-presence-updated", handler);
  }, []);

  const asks = useMemo(() => listAllPublicVolunteerAsks(events), [events, tick]);
  const missingLinks = asks.filter((a) => !a.hasDestination);
  const byCampaign = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of asks) map.set(a.workspaceSlug, (map.get(a.workspaceSlug) ?? 0) + 1);
    return map;
  }, [asks]);

  const workspaces = listCampaignWorkspaces();

  return (
    <div className="space-y-6">
      <p className="text-sm text-ark-pine/60">
        Volunteer recruitment presence — public badges from localStorage demo plans. Supabase sync is next pass.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs font-bold uppercase text-muted">Public volunteer asks</p>
          <p className="text-2xl font-bold text-ark-pine mt-1">{asks.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-muted">Missing signup links</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{missingLinks.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-muted">Campaigns advertising</p>
          <p className="text-2xl font-bold text-ark-pine mt-1">{byCampaign.size}</p>
        </div>
      </div>

      <section className="card">
        <h3 className="font-semibold text-ark-pine">Campaigns advertising volunteers</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {workspaces.map((ws) => {
            const count = byCampaign.get(ws.slug) ?? 0;
            const defaultUrl = ws.defaultVolunteerSignupUrl || ws.mobilizeOrgUrl;
            return (
              <li key={ws.slug} className="flex flex-wrap justify-between gap-2 border-b border-ark-pine/5 pb-2">
                <span>{ws.campaignName}</span>
                <span className="text-xs text-muted">
                  {count} public ask{count === 1 ? "" : "s"}
                  {!defaultUrl && count > 0 && " · no default signup URL"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold text-ark-pine">Events with public volunteer asks</h3>
        {asks.length === 0 && <p className="text-sm text-muted mt-2">None yet — enable on campaign dashboards.</p>}
        <ul className="mt-3 space-y-2 text-sm max-h-80 overflow-y-auto">
          {asks.map((a) => (
            <li key={`${a.workspaceSlug}-${a.eventId}`} className="flex flex-wrap justify-between gap-2">
              <span>
                <strong>{a.eventTitle ?? a.eventId}</strong>
                <span className="text-muted"> · {a.campaignName}</span>
              </span>
              <span className={`text-xs ${a.hasDestination ? "text-emerald-700" : "text-amber-700"}`}>
                {a.hasDestination ? "Has destination" : "Badge with no destination"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
