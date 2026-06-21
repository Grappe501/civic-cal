import { Link } from "react-router-dom";
import { Anchor, Flame, MapPin, UtensilsCrossed, Users } from "lucide-react";
import type { CommunityAnchorsSnapshot } from "../../lib/institutions/communityAnchorTypes";
import { ATTENDANCE_SIGNAL_LABELS, FOOD_TRAIL_LABELS } from "../../lib/institutions/communityAnchorTypes";
import { formatAnchorSourcingLine } from "../../lib/institutions/communityAnchorEngine";

interface Props {
  anchors: CommunityAnchorsSnapshot;
  themePrimary?: string;
}

export function CommunityAnchorsPanel({ anchors, themePrimary = "#2d5016" }: Props) {
  const { anchorCounts, eventSourcing, countyCoverageScore } = anchors;
  const ext = anchors.extensionOffices[0];
  const topSourcing = eventSourcing.filter((r) => r.eventsSourced > 0 || r.anchorCount > 0).slice(0, 8);

  return (
    <section className="card card-elevated mt-6 community-anchors-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="intel-section-title">
            <Anchor className="h-5 w-5" /> Community Anchors
          </h2>
          <p className="text-xs text-muted mt-1">
            Trust × relationships × leadership — Extension, Homemakers, VFDs, parades, food trail
          </p>
        </div>
        <span className="chip chip-muted text-[10px]">County coverage {countyCoverageScore}%</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4 text-sm">
        {[
          ["Churches", anchorCounts.churches],
          ["Schools", anchorCounts.schools],
          ["VFDs", anchorCounts.vfds],
          ["4-H / Extension", anchorCounts.extensionOffices + anchorCounts.fourHClubs],
          ["Homemaker clubs", anchorCounts.homemakerClubs],
          ["Libraries", anchorCounts.libraries],
          ["Chambers", anchorCounts.chambers],
          ["Farm Bureau", anchorCounts.farmBureau],
        ].map(([label, count]) => (
          <div key={label} className="intel-data-card">
            <dt className="intel-data-label">{label}</dt>
            <dd className="intel-data-value">{count}</dd>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-kicker mb-2">Events sourced by anchor</h3>
        <ul className="text-sm space-y-1 text-muted">
          {topSourcing.map((row) => (
            <li key={row.kind} className="flex flex-wrap gap-x-2">
              <span>{formatAnchorSourcingLine(row)}</span>
              {row.influenceNote && <span className="text-xs text-ark-sage">— {row.influenceNote}</span>}
            </li>
          ))}
        </ul>
      </div>

      {ext && (
        <div className="mt-6 rounded-lg border border-ark-pine/10 p-4 bg-ark-wheat/30">
          <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: themePrimary }}>
            <MapPin className="h-4 w-4" /> Cooperative Extension Office
          </h3>
          <p className="text-sm mt-1">{ext.officeName}</p>
          {ext.address && <p className="text-xs text-muted">{ext.address}</p>}
          <p className="text-xs mt-2 text-muted">
            Harvest targets: {ext.harvestTargets.slice(0, 4).join(" · ")}…
          </p>
        </div>
      )}

      {anchors.homemakerClubs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-kicker mb-2 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Extension Homemaker clubs
          </h3>
          <ul className="text-sm space-y-1">
            {anchors.homemakerClubs.slice(0, 5).map((c) => (
              <li key={c.id} className="text-muted">
                {c.clubName}
                {c.meetingSchedule ? ` · ${c.meetingSchedule}` : " · schedule pending"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {anchors.vfds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-kicker mb-2 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> Volunteer fire departments
          </h3>
          <ul className="text-sm space-y-1">
            {anchors.vfds.slice(0, 6).map((v) => (
              <li key={v.id} className="text-muted">
                {v.name} · {v.city}
              </li>
            ))}
            {anchors.vfds.length > 6 && <li className="text-xs text-muted">+{anchors.vfds.length - 6} more in county</li>}
          </ul>
        </div>
      )}

      {anchors.parades.length > 0 && (
        <div className="mt-4">
          <h3 className="text-kicker mb-2">Parades</h3>
          <ul className="text-sm space-y-1.5">
            {anchors.parades.slice(0, 5).map((p) => (
              <li key={p.eventTitle}>
                {p.slug ? (
                  <Link to={`/event/${p.slug}`} className="font-medium hover:underline">{p.eventTitle}</Link>
                ) : (
                  p.eventTitle
                )}
                <span className="text-xs text-muted ml-2 capitalize">{p.paradeType.replace("_", " ")}</span>
                {(p.floatOpportunity || p.boothOpportunity) && (
                  <span className="text-[10px] chip chip-muted ml-1">Float / booth opportunity</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {anchors.foodEvents.length > 0 && (
        <div className="mt-4">
          <h3 className="text-kicker mb-2 flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5" /> Arkansas Food Trail (county)
          </h3>
          <ul className="text-sm space-y-1">
            {anchors.foodEvents.slice(0, 6).map((f) => (
              <li key={f.title}>
                {f.slug ? <Link to={`/event/${f.slug}`} className="hover:underline">{f.title}</Link> : f.title}
                <span className="text-xs text-muted ml-2">{FOOD_TRAIL_LABELS[f.category]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {anchors.topAttendanceSignals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ark-pine/10">
          <h3 className="text-kicker mb-2">Community attendance signals</h3>
          <p className="text-xs text-muted mb-2">A 150-person Homemaker event may outrank a 500-person generic festival</p>
          <div className="flex flex-wrap gap-2">
            {anchors.topAttendanceSignals.map((s) => (
              <span key={s.signal} className="chip chip-muted text-[10px]">
                {ATTENDANCE_SIGNAL_LABELS[s.signal]} · {s.eventCount} events · influence {s.influenceScore}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
