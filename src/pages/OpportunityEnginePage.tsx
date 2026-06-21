import { Link } from "react-router-dom";
import { Brain, Shield, Sparkles, Users } from "lucide-react";

export function OpportunityEnginePage() {
  const scores = [
    { name: "Political Opportunity (PO)", desc: "Where should leaders be visible? Breadth, civic weight, festival/meeting importance." },
    { name: "Relationship Density (RD)", desc: "Influence per attendee — Rotary breakfast beats county fair for connected locals." },
    { name: "Tradition Strength", desc: "How entrenched is this event in community memory? Years running, annual return." },
    { name: "Civic Importance", desc: "Government accountability, public hearings, school board — civic duty layer." },
    { name: "Crowd Estimate", desc: "Range only, confidence-labeled. Community feedback improves accuracy." },
    { name: "Local Confidence", desc: "Verified source + date + location + ambassador feedback." },
    { name: "Verification Status", desc: "pending → needs_verification → verified. AI never auto-publishes." },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-ark-sage flex items-center gap-2">
        <Brain className="h-4 w-4" /> Opportunity Engine
      </p>
      <h1 className="font-display text-3xl font-bold text-ark-pine mt-1">How we score Arkansas events</h1>
      <p className="mt-3 text-ark-pine/70 max-w-2xl">
        Civic-Cal is a living intelligence network — not just a calendar. Scores combine public sources, five intelligence layers,
        community feedback, and optional AI advisory analysis. Nothing publishes without human review.
      </p>

      <div className="mt-10 grid gap-4">
        {scores.map((s) => (
          <div key={s.name} className="card">
            <h2 className="font-semibold text-ark-pine">{s.name}</h2>
            <p className="text-sm text-ark-pine/70 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 card bg-ark-pine/5">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-ark-sage" /> Safety principles
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-ark-pine/80 list-disc pl-5">
          <li>AI is advisory — operators approve every public listing.</li>
          <li>No private political preference data stored.</li>
          <li>Public sources only — no logged-in social scraping.</li>
          <li>Community feedback goes to review before affecting scores.</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/organizers" className="btn-primary">
          <Sparkles className="h-4 w-4" /> Organizer intelligence
        </Link>
        <Link to="/help-build-the-calendar" className="btn-secondary">
          <Users className="h-4 w-4" /> Become a contributor
        </Link>
      </div>
    </div>
  );
}
