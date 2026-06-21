import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../../lib/api";
import {
  listPendingVerificationOpportunities,
  listPublicStudentServiceOpportunities,
  loadStudentServiceInterests,
  listVerifiedEntities,
  listOrganizationsRequestingEligibility,
  countiesWithServiceGaps,
  setOpportunityOverride,
  setOrganizationVerification,
} from "../../lib/student-service/studentServiceEngine";
import { SERVICE_CATEGORY_LABELS } from "../../lib/student-service/studentServiceTypes";
import type { CivicEvent } from "../../lib/types";

interface Props {
  token: string;
}

export function AdminStudentServicePanel({ token: _token }: Props) {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error);
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("civic-student-service-updated", handler);
    return () => window.removeEventListener("civic-student-service-updated", handler);
  }, []);

  const verified = useMemo(() => listPublicStudentServiceOpportunities(events), [events, tick]);
  const pending = useMemo(() => listPendingVerificationOpportunities(events), [events, tick]);
  const interests = useMemo(() => loadStudentServiceInterests(), [tick]);
  const entities = useMemo(() => listVerifiedEntities(), [tick]);
  const requesting = useMemo(() => listOrganizationsRequestingEligibility(), [tick]);
  const gaps = useMemo(() => countiesWithServiceGaps(events), [events, tick]);
  const missingUrls = verified.filter((o) => !o.signupUrl && !o.contactUrl && !o.sourceUrl);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-soft">
        Student service matching — verified entities only. Interest submissions stay private (localStorage demo).
      </p>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card"><p className="text-xs font-bold uppercase text-muted">Verified opportunities</p><p className="text-2xl font-bold mt-1">{verified.length}</p></div>
        <div className="card"><p className="text-xs font-bold uppercase text-muted">Needs verification</p><p className="text-2xl font-bold text-amber-800 mt-1">{pending.length}</p></div>
        <div className="card"><p className="text-xs font-bold uppercase text-muted">Interest submissions</p><p className="text-2xl font-bold mt-1">{interests.length}</p></div>
        <div className="card"><p className="text-xs font-bold uppercase text-muted">Missing signup URL</p><p className="text-2xl font-bold text-amber-800 mt-1">{missingUrls.length}</p></div>
      </div>

      <section className="card">
        <h3 className="font-semibold">Opportunities needing verification</h3>
        {pending.length === 0 && <p className="text-sm text-muted mt-2">None pending.</p>}
        <ul className="mt-3 space-y-2 text-sm max-h-64 overflow-y-auto">
          {pending.map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2 border-b border-ark-pine/5 pb-2">
              <span><strong>{o.title}</strong> · {SERVICE_CATEGORY_LABELS[o.serviceCategory]} · {o.county}</span>
              <span className="flex gap-1">
                <button type="button" className="chip text-xs bg-emerald-700 text-white" onClick={() => setOpportunityOverride(o.id, { verificationStatus: "verified", verifiedEntity: true })}>Verify</button>
                <button type="button" className="chip text-xs bg-red-700 text-white" onClick={() => setOpportunityOverride(o.id, { verificationStatus: "rejected", verifiedEntity: false })}>Reject</button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold">Student interest submissions</h3>
        {interests.length === 0 && <p className="text-sm text-muted mt-2">None yet.</p>}
        <ul className="mt-3 space-y-2 text-sm max-h-48 overflow-y-auto">
          {interests.map((i) => (
            <li key={i.id} className="border-b border-ark-pine/5 pb-2">
              <strong>{i.studentFirstName ?? "Student"}</strong> · {i.parentGuardianEmail} · {i.schoolName ?? "School n/a"}
              <span className="text-muted"> · {i.status} · {new Date(i.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold">Organizations requesting student-service eligibility</h3>
        {requesting.length === 0 && <p className="text-sm text-muted mt-2">None flagged.</p>}
        <ul className="mt-3 space-y-2 text-sm">
          {requesting.map((o) => (
            <li key={o.slug} className="flex justify-between gap-2">
              <span>{o.name} · {o.county}</span>
              <button type="button" className="chip text-xs bg-emerald-700 text-white" onClick={() => setOrganizationVerification(o.slug, { verified: true, studentServiceEligible: true, verificationStatus: "verified" })}>Verify entity</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold">Verified entities ({entities.length})</h3>
        <ul className="mt-3 space-y-1 text-sm max-h-40 overflow-y-auto">
          {entities.map((e) => (
            <li key={e.organizationSlug}>{e.organizationSlug} · {e.verificationStatus}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold">County coverage gaps</h3>
        <p className="text-xs text-muted mt-1">Counties with events but no verified student-service opportunities yet.</p>
        <p className="text-sm mt-2">{gaps.slice(0, 20).join(", ") || "None — all event counties covered"}</p>
      </section>
    </div>
  );
}
