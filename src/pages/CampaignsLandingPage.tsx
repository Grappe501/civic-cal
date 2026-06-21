import { Link } from "react-router-dom";
import { BarChart3, Calendar, MapPin, Shield } from "lucide-react";

export function CampaignsLandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-ark-sage">Campaign workspace</p>
      <h1 className="font-display text-3xl font-bold text-ark-pine mt-1">Where should your campaign show up?</h1>
      <p className="mt-3 text-ark-pine/70 max-w-2xl">
        Filter Arkansas civic intelligence by district, save plans for each event, and prepare volunteer staffing —
        without auto-syncing to Google Calendar or Mobilize until you explicitly approve.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { icon: MapPin, title: "District filter", desc: "County, city, or statewide — real boundary GIS coming next pass." },
          { icon: BarChart3, title: "Opportunity views", desc: "This week, highest PO/RD, government, church meals, school sports." },
          { icon: Calendar, title: "Integrations (planned)", desc: "Google Calendar & Mobilize rails — disabled until OAuth + explicit user action." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card">
            <Icon className="h-6 w-6 text-ark-rust" />
            <h2 className="font-semibold mt-2">{title}</h2>
            <p className="text-sm text-ark-pine/60 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 card bg-ark-wheat/30">
        <Shield className="h-5 w-5 text-ark-pine" />
        <p className="text-sm text-ark-pine/80 mt-2">
          Demo mode stores plans in your browser only. No auth, no political preference data, no automatic calendar writes.
        </p>
      </section>

      <Link to="/campaigns/demo" className="btn-primary mt-8 inline-flex">
        Open demo dashboard
      </Link>
    </div>
  );
}
