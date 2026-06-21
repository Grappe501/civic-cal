import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck, ExternalLink } from "lucide-react";
import { fetchEvents } from "../lib/api";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import {
  listPublicStudentServiceOpportunities,
} from "../lib/student-service/studentServiceEngine";
import {
  SERVICE_CATEGORY_LABELS,
  ARKANSAS_SERVICE_HOUR_REQUIREMENT,
  type ServiceCategory,
} from "../lib/student-service/studentServiceTypes";
import { StudentServiceBadge } from "../components/student-service/StudentServiceBadge";
import type { CivicEvent } from "../lib/types";

export function StudentServicePage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [minHours, setMinHours] = useState<number | "">("");

  useEffect(() => {
    document.title = "Student Service Match | Arkansas Everywhere";
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error);
  }, []);

  const opportunities = useMemo(
    () =>
      listPublicStudentServiceOpportunities(events, {
        county: county || undefined,
        city: city || undefined,
        category: category || undefined,
        minHours: minHours === "" ? undefined : minHours,
        verifiedOnly: true,
      }),
    [events, county, city, category, minHours],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-3xl mb-10">
        <p className="text-sm text-sky-800 font-medium uppercase tracking-wide flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Arkansas student community service
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ark-pine mt-2">
          Find verified volunteer opportunities
        </h1>
        <p className="text-ark-pine/80 mt-3 leading-relaxed">
          Beginning with the <strong>2026–2027 graduating class</strong>, Arkansas public high school students must
          complete <strong>{ARKANSAS_SERVICE_HOUR_REQUIREMENT.hours} documented community service hours</strong> in
          grades {ARKANSAS_SERVICE_HOUR_REQUIREMENT.grades} to graduate.
        </p>
        <a
          href={ARKANSAS_SERVICE_HOUR_REQUIREMENT.ruleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-sky-800 mt-2 hover:underline"
        >
          Read the official rule <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="card bg-sky-50/60 border-sky-200/50 mb-8 flex gap-3">
        <ShieldCheck className="h-8 w-8 text-sky-700 shrink-0" />
        <div className="text-sm text-ark-pine/85 space-y-1">
          <p className="font-semibold text-ark-pine">Safety & privacy</p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs md:text-sm">
            <li>Students connect only through <strong>verified organizations</strong> in this network.</li>
            <li>No direct minor-to-unknown-adult matching.</li>
            <li>Student contact info is <strong>never</strong> posted publicly.</li>
            <li>Signup routes through organization volunteer pages or a parent/guardian review form.</li>
            <li>Work with your school counselor to document approved hours.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <select className="input text-sm" value={county} onChange={(e) => setCounty(e.target.value)}>
          <option value="">All counties</option>
          {ARKANSAS_COUNTIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input className="input text-sm" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <select className="input text-sm" value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory | "")}>
          <option value="">All categories</option>
          {(Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[]).map((k) => (
            <option key={k} value={k}>{SERVICE_CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <input className="input text-sm" type="number" min={1} placeholder="Min hours" value={minHours} onChange={(e) => setMinHours(e.target.value ? Number(e.target.value) : "")} />
      </div>

      <p className="text-sm text-muted mb-4">{opportunities.length} verified opportunities</p>

      {opportunities.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ark-pine/70">No verified opportunities match these filters yet.</p>
          <Link to="/organizations" className="btn-primary mt-4 inline-flex">Browse organizations</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {opportunities.map((o) => (
            <article key={o.id} className="card hover:border-sky-300/50 transition">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-semibold text-ark-pine">{o.title}</h2>
                <StudentServiceBadge opportunity={o} />
              </div>
              <p className="text-xs text-muted mt-1">
                {SERVICE_CATEGORY_LABELS[o.serviceCategory]} · {o.city ? `${o.city}, ` : ""}{o.county} County
                {o.estimatedHours != null && ` · ~${o.estimatedHours} hours`}
                {o.recurring && " · Recurring"}
              </p>
              {o.description && <p className="text-sm text-ark-pine/75 mt-2">{o.description}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="chip chip-muted text-[10px]">Verified organization</span>
                {o.eligibleGrades && <span className="chip chip-muted text-[10px]">Grades {o.eligibleGrades}</span>}
              </div>
              {(o.signupUrl ?? o.sourceUrl) && (
                <a href={o.signupUrl ?? o.sourceUrl!} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs mt-4 inline-flex">
                  Organization signup <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
