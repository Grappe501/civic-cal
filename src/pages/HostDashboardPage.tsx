import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, PlusCircle } from "lucide-react";
import { CivicGlyph } from "../components/glyphs/CivicGlyph";
import { CIVIC_GLYPHS } from "../lib/glyphs/civicGlyphs";
import {
  clearHostProfile,
  loadHostProfile,
  saveHostProfile,
} from "../lib/hosts/hostStore";
import {
  HOST_TYPE_LABELS,
  hostTypeToGlyphKind,
  type HostPortalType,
  type HostProfile,
} from "../lib/hosts/hostTypes";
import { getOrganizationBySlug, organizationPath } from "../lib/organizations/publicOrganizationDirectory";

const HOST_TYPES = Object.keys(HOST_TYPE_LABELS) as HostPortalType[];

export function HostDashboardPage() {
  const [profile, setProfile] = useState<HostProfile | null>(() => loadHostProfile());
  const [form, setForm] = useState({
    hostType: "church" as HostPortalType,
    displayName: "",
    county: "",
    city: "",
    website: "",
    volunteerPageUrl: "",
    organizationSlug: "",
  });

  useEffect(() => {
    if (profile) return;
    setForm((f) => ({ ...f, displayName: f.displayName || "" }));
  }, [profile]);

  function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim() || !form.county.trim()) return;
    const next: HostProfile = {
      id: `host-${Date.now()}`,
      hostType: form.hostType,
      displayName: form.displayName.trim(),
      county: form.county.trim(),
      city: form.city.trim() || null,
      website: form.website.trim() || null,
      volunteerPageUrl: form.volunteerPageUrl.trim() || null,
      organizationSlug: form.organizationSlug.trim() || null,
      createdAt: new Date().toISOString(),
    };
    saveHostProfile(next);
    setProfile(next);
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Link to="/host" className="text-sm text-muted hover:underline">← Host portal</Link>
        <h1 className="font-display text-2xl font-bold mt-4">Set up your host profile</h1>
        <p className="text-sm text-muted mt-2">Demo mode — stored locally until host accounts sync to Supabase.</p>
        <form onSubmit={handleSetup} className="mt-6 space-y-3">
          <select className="input" value={form.hostType} onChange={(e) => setForm({ ...form, hostType: e.target.value as HostPortalType })}>
            {HOST_TYPES.map((t) => (
              <option key={t} value={t}>{HOST_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input className="input" placeholder="Organization name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          <input className="input" placeholder="County" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} required />
          <input className="input" placeholder="City (optional)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input" type="url" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <input className="input" type="url" placeholder="Volunteer page URL" value={form.volunteerPageUrl} onChange={(e) => setForm({ ...form, volunteerPageUrl: e.target.value })} />
          <input className="input" placeholder="Organization slug to claim (optional)" value={form.organizationSlug} onChange={(e) => setForm({ ...form, organizationSlug: e.target.value })} />
          <button type="submit" className="btn-primary w-full">Create host profile</button>
        </form>
      </div>
    );
  }

  const glyph = CIVIC_GLYPHS[hostTypeToGlyphKind(profile.hostType)];
  const linkedOrg = profile.organizationSlug ? getOrganizationBySlug(profile.organizationSlug) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CivicGlyph glyph={glyph} size="lg" />
          <div>
            <p className="text-xs uppercase text-muted">Host dashboard</p>
            <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-muted">{HOST_TYPE_LABELS[profile.hostType]} · {profile.city ? `${profile.city}, ` : ""}{profile.county} County</p>
          </div>
        </div>
        <button type="button" className="btn-secondary text-xs" onClick={() => { clearHostProfile(); setProfile(null); }}>
          Sign out (demo)
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        <Link to="/submit" className="card hover:border-ark-sage flex flex-col gap-2">
          <PlusCircle className="h-6 w-6 text-ark-rust" />
          <span className="font-semibold">Add event</span>
          <span className="text-xs text-muted">Submit to community calendar review</span>
        </Link>
        <div className="card">
          <Building2 className="h-6 w-6 text-ark-sage mb-2" />
          <span className="font-semibold">Organization page</span>
          {linkedOrg ? (
            <Link to={organizationPath(linkedOrg.slug)} className="text-xs text-ark-rust mt-1 block hover:underline">View public profile →</Link>
          ) : (
            <Link to="/organizations" className="text-xs text-muted mt-1 block hover:underline">Claim organization →</Link>
          )}
        </div>
        <div className="card">
          <span className="font-semibold">Volunteer recruitment</span>
          <p className="text-xs text-muted mt-1">Enable on any event you host via event detail (host controls) or after submit.</p>
        </div>
      </div>

      <section className="card mt-8">
        <h2 className="font-semibold">Coming next</h2>
        <ul className="text-sm text-muted mt-2 space-y-1 list-disc list-inside">
          <li>Edit & manage submitted events</li>
          <li>Recurring traditions publisher</li>
          <li>Embed calendar on your website</li>
          <li>Google Calendar sync</li>
          <li>Attendance interest tracking</li>
        </ul>
      </section>
    </div>
  );
}
