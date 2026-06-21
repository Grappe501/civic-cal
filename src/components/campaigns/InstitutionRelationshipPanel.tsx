import { format, parseISO } from "date-fns";
import type { InstitutionRelationshipStatus } from "../../lib/institutions/institutionRelationshipTypes";
import { INSTITUTION_KIND_LABELS } from "../../lib/institutions/institutionRelationshipTypes";
import { logInstitutionTouchpoint } from "../../lib/institutions/institutionRelationshipStore";
import type { CampaignWorkspace } from "../../lib/campaigns/types";

interface Props {
  workspace: CampaignWorkspace;
  statuses: InstitutionRelationshipStatus[];
  onUpdate: () => void;
  themePrimary: string;
}

export function InstitutionRelationshipPanel({ workspace, statuses, onUpdate, themePrimary }: Props) {
  const low = statuses.filter((s) => s.scoreLabel === "low").slice(0, 6);

  function logAttendance(s: InstitutionRelationshipStatus) {
    logInstitutionTouchpoint(workspace.slug, {
      institutionId: s.institutionId,
      institutionName: s.institutionName,
      kind: s.kind,
      county: s.county,
      city: s.city,
      attendedAt: new Date().toISOString().slice(0, 10),
      note: "Manual log from dashboard",
    });
    onUpdate();
  }

  return (
    <div className="card card-elevated">
      <h3 className="font-display font-semibold" style={{ color: themePrimary }}>Institution relationships</h3>
      <p className="text-xs text-muted mt-1">Institutions, not people — Rotary, Farm Bureau, churches, schools</p>

      <ul className="mt-4 space-y-3 max-h-64 overflow-y-auto">
        {low.map((s) => (
          <li key={s.institutionId} className="text-sm border-b border-ark-pine/5 pb-2">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-ark-pine">{INSTITUTION_KIND_LABELS[s.kind]}</span>
              <span className={`chip text-[9px] ${s.scoreLabel === "low" ? "bg-amber-100 text-amber-900" : "chip-muted"}`}>
                {s.scoreLabel} · {s.relationshipScore}
              </span>
            </div>
            <p className="text-xs text-muted truncate">{s.institutionName}</p>
            <p className="text-xs mt-1">
              Events attended: {s.eventsAttended}
              {s.lastAttendedAt ? ` · Last: ${format(parseISO(s.lastAttendedAt), "MMM yyyy")}` : " · Never logged"}
            </p>
            {s.recommendedAction && <p className="text-xs text-ark-sage mt-1">{s.recommendedAction}</p>}
            <button type="button" className="text-[10px] text-ark-rust hover:underline mt-1" onClick={() => logAttendance(s)}>
              Log attendance
            </button>
          </li>
        ))}
        {low.length === 0 && <li className="text-xs text-muted">All tracked institutions developing or strong — keep showing up.</li>}
      </ul>
    </div>
  );
}
