import { Link } from "react-router-dom";
import { Building2, CalendarHeart, HandHeart, MapPin, Users } from "lucide-react";
import { CIVIC_GLYPHS } from "../lib/glyphs/civicGlyphs";
import { CivicGlyph } from "../components/glyphs/CivicGlyph";
import { HOST_TYPE_LABELS, hostTypeToGlyphKind, type HostPortalType } from "../lib/hosts/hostTypes";

const HOST_TYPES: HostPortalType[] = [
  "church", "school", "college", "festival", "chamber", "rotary", "vfd", "library",
  "farm_bureau", "extension", "homemakers", "naacp", "four_h", "business", "nonprofit", "community",
  "candidate", "campaign",
];

export function HostPortalPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="section-kicker">Arkansas Everywhere · Host Portal</p>
      <h1 className="page-header">Manage your organization&apos;s calendar</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">
        Churches, schools, chambers, VFDs, Extension offices, festivals, and nonprofits — add events, recruit volunteers,
        and get discovered. Campaigns use a separate premium layer; this portal is for community hosts.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-10">
        {[
          { icon: CalendarHeart, title: "Add & edit events", body: "Publish to the statewide community calendar" },
          { icon: HandHeart, title: "Recruit volunteers", body: "Volunteers needed — for any event, not just campaigns" },
          { icon: Building2, title: "Claim your org page", body: "Link website, traditions, and upcoming activities" },
          { icon: Users, title: "Get discovered", body: "SEO + AI-friendly pages for your city and county" },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card">
            <Icon className="h-6 w-6 text-ark-sage mb-2" />
            <h2 className="font-semibold text-ark-pine">{title}</h2>
            <p className="text-sm text-muted mt-1">{body}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold mb-4">Who can host?</h2>
        <div className="flex flex-wrap gap-2">
          {HOST_TYPES.map((t) => (
              <span key={t} className="chip chip-muted inline-flex items-center gap-1.5">
                <CivicGlyph glyph={CIVIC_GLYPHS[hostTypeToGlyphKind(t)]} size="sm" />
                {HOST_TYPE_LABELS[t]}
              </span>
            ))}
        </div>
        <p className="text-xs text-muted mt-3">
          Political candidates and campaigns can publish community events here. For district intelligence, presence layers, and volunteer recruitment tools, use{" "}
          <Link to="/campaigns" className="underline">Campaign workspaces</Link>.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/host/dashboard" className="btn-primary">Open Host Dashboard</Link>
        <Link to="/submit" className="btn-secondary">Submit an event</Link>
        <Link to="/organizations" className="btn-secondary">Browse organizations</Link>
      </div>

      <section className="mt-12 card border-l-4 border-ark-sage">
        <h2 className="font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" /> The flywheel
        </h2>
        <p className="text-sm text-muted mt-2">
          Organizations add events → calendar grows → citizens use it → AI learns community patterns → campaigns subscribe →
          organizations gain visibility → more organizations join. Stronger than campaigns alone.
        </p>
      </section>
    </div>
  );
}
