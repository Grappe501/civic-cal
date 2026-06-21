import { useState } from "react";
import { ExternalLink, GraduationCap, ShieldCheck } from "lucide-react";
import type { StudentServiceOpportunity } from "../../lib/student-service/studentServiceTypes";
import { SERVICE_CATEGORY_LABELS, ARKANSAS_SERVICE_HOUR_REQUIREMENT } from "../../lib/student-service/studentServiceTypes";
import { saveStudentServiceInterest } from "../../lib/student-service/studentServiceEngine";

interface Props {
  opportunity: StudentServiceOpportunity;
  compact?: boolean;
}

export function StudentServiceBadge({ opportunity, compact }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  if (!opportunity.verifiedEntity || opportunity.verificationStatus !== "verified") return null;

  const dest = opportunity.signupUrl ?? opportunity.contactUrl ?? opportunity.sourceUrl;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (dest) {
      window.open(dest, "_blank", "noopener,noreferrer");
    } else {
      setFormOpen(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="student-service-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-sky-700 text-white shadow-sm hover:brightness-110"
        title="Verified organization — student service eligible"
      >
        <GraduationCap className="h-3 w-3" aria-hidden />
        {compact ? "Student service" : "Student service eligible"}
        {opportunity.estimatedHours != null && !compact && (
          <span className="opacity-90">· ~{opportunity.estimatedHours}h</span>
        )}
      </button>
      {formOpen && (
        <StudentServiceInterestModal opportunity={opportunity} onClose={() => setFormOpen(false)} />
      )}
    </>
  );
}

export function StudentServiceInterestModal({
  opportunity,
  onClose,
}: {
  opportunity: StudentServiceOpportunity;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    studentFirstName: "",
    parentGuardianEmail: "",
    schoolName: "",
    city: "",
    county: opportunity.county,
    requestedHours: "",
    message: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveStudentServiceInterest({
      opportunityId: opportunity.id,
      studentFirstName: form.studentFirstName || null,
      parentGuardianEmail: form.parentGuardianEmail || null,
      schoolName: form.schoolName || null,
      city: form.city || null,
      county: form.county || null,
      requestedHours: form.requestedHours ? Number(form.requestedHours) : null,
      message: form.message || null,
    });
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <>
            <h3 className="font-semibold text-ark-pine">Request submitted safely</h3>
            <p className="text-sm text-ark-pine/70 mt-2">
              Your interest was routed for host/admin review. A parent or guardian should follow up with the
              verified organization — student contact info is not posted publicly.
            </p>
            <button type="button" className="btn-primary mt-4 w-full" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-ark-pine flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-700" />
              Request info — {opportunity.title}
            </h3>
            <p className="text-xs text-muted mt-2">
              Parent/guardian or school counselor should coordinate with the verified organization.
              Do not share personal contact details publicly.
            </p>
            <form className="mt-4 space-y-3" onSubmit={submit}>
              <input className="input text-sm" placeholder="Student first name (optional)" value={form.studentFirstName} onChange={(e) => setForm({ ...form, studentFirstName: e.target.value })} />
              <input className="input text-sm" type="email" required placeholder="Parent/guardian email" value={form.parentGuardianEmail} onChange={(e) => setForm({ ...form, parentGuardianEmail: e.target.value })} />
              <input className="input text-sm" placeholder="School name" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
              <input className="input text-sm" placeholder="Hours requested" type="number" min={1} max={75} value={form.requestedHours} onChange={(e) => setForm({ ...form, requestedHours: e.target.value })} />
              <textarea className="input text-sm min-h-[80px]" placeholder="Message for organization (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button type="submit" className="btn-primary w-full">Submit for review</button>
              <button type="button" className="btn-secondary w-full" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

interface BlockProps {
  county?: string;
  city?: string;
  organizationSlug?: string;
  opportunities: StudentServiceOpportunity[];
  limit?: number;
}

export function StudentServiceBlock({ county, city, organizationSlug, opportunities, limit = 4 }: BlockProps) {
  const filtered = opportunities
    .filter((o) => {
      if (organizationSlug && o.organizationSlug !== organizationSlug) return false;
      if (county && o.county.toLowerCase() !== county.toLowerCase()) return false;
      if (city && !o.city?.toLowerCase().includes(city.toLowerCase())) return false;
      return true;
    })
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="card bg-sky-50/80 border-sky-200/60 mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sky-800 flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" /> Student service opportunities
          </p>
          <p className="text-sm text-ark-pine/75 mt-1">
            Verified organizations only · {ARKANSAS_SERVICE_HOUR_REQUIREMENT.hours}-hour graduation requirement (class of 2027+)
          </p>
        </div>
        <a href="/student-service" className="btn-secondary text-xs py-1.5">Browse all</a>
      </div>
      <ul className="mt-4 space-y-3">
        {filtered.map((o) => (
          <li key={o.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-sky-100 pb-2 last:border-0">
            <div>
              <p className="font-medium text-sm text-ark-pine">{o.title}</p>
              <p className="text-xs text-muted">
                {SERVICE_CATEGORY_LABELS[o.serviceCategory]} · {o.city ? `${o.city}, ` : ""}{o.county} County
                {o.estimatedHours != null && ` · ~${o.estimatedHours} hrs`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StudentServiceBadge opportunity={o} compact />
              {(o.signupUrl ?? o.sourceUrl) && (
                <a href={o.signupUrl ?? o.sourceUrl!} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-800 hover:underline inline-flex items-center gap-0.5">
                  Sign up <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted mt-3">
        Students connect through verified organizations — not direct matching with unknown adults.
        Parent/guardian and school documentation required per{" "}
        <a href={ARKANSAS_SERVICE_HOUR_REQUIREMENT.ruleUrl} target="_blank" rel="noopener noreferrer" className="underline">Arkansas rules</a>.
      </p>
    </section>
  );
}
