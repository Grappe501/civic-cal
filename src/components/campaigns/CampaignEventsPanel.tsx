import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import {
  CAMPAIGN_EVENT_TYPE_LABELS,
  type CampaignEventType,
  type ScheduleConflict,
} from "../../lib/campaigns/campaignEventTypes";
import { addCampaignEvent, deleteCampaignEvent, loadCampaignEvents } from "../../lib/campaigns/campaignEventsStore";

interface Props {
  workspace: CampaignWorkspace;
  events: ReturnType<typeof loadCampaignEvents>;
  conflicts: ScheduleConflict[];
  onChange: () => void;
  themePrimary: string;
}

const TYPES = Object.keys(CAMPAIGN_EVENT_TYPE_LABELS) as CampaignEventType[];

export function CampaignEventsPanel({ workspace, events, conflicts, onChange, themePrimary }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<CampaignEventType>("fundraiser");
  const [startAt, setStartAt] = useState("");
  const [county, setCounty] = useState(workspace.counties[0] ?? "");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startAt) return;
    addCampaignEvent(workspace.slug, {
      title: title.trim(),
      eventType,
      startAt: new Date(startAt).toISOString(),
      county,
      candidateAttending: true,
    });
    setTitle("");
    setStartAt("");
    setOpen(false);
    onChange();
  }

  return (
    <div className="card card-elevated">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-display font-semibold" style={{ color: themePrimary }}>Campaign events</h3>
          <p className="text-xs text-muted mt-1">Your layer beside community calendar — fundraisers, town halls, phone banks</p>
        </div>
        <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="mt-3 space-y-2">
          {conflicts.slice(0, 3).map((c) => (
            <div key={`${c.campaignEvent.id}-${c.communityEvent.id}`} className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-950 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Potential conflict detected</p>
                <p className="mt-0.5">{c.message}</p>
                <Link to={`/event/${c.communityEvent.slug}`} className="underline mt-1 inline-block">View community event</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <form onSubmit={handleAdd} className="mt-3 space-y-2 border-t border-ark-pine/10 pt-3">
          <input className="input text-sm" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <select className="input text-sm" value={eventType} onChange={(e) => setEventType(e.target.value as CampaignEventType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{CAMPAIGN_EVENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input type="datetime-local" className="input text-sm" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          <input className="input text-sm" placeholder="County" value={county} onChange={(e) => setCounty(e.target.value)} />
          <button type="submit" className="btn-primary text-sm w-full">Save campaign event</button>
        </form>
      )}

      <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
        {events.length === 0 && <li className="text-xs text-muted">No campaign events yet — add fundraisers, town halls, phone banks</li>}
        {events.map((ev) => (
          <li key={ev.id} className="flex justify-between gap-2 text-sm border-b border-ark-pine/5 pb-2">
            <div>
              <span className="chip chip-muted text-[9px] mr-1">{CAMPAIGN_EVENT_TYPE_LABELS[ev.eventType]}</span>
              <span className="font-medium">{ev.title}</span>
              <p className="text-xs text-muted">{ev.startAt ? format(parseISO(ev.startAt), "EEE MMM d · h:mm a") : ""}{ev.county ? ` · ${ev.county} County` : ""}</p>
            </div>
            <button type="button" className="text-red-600 hover:text-red-800" onClick={() => { deleteCampaignEvent(workspace.slug, ev.id); onChange(); }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
