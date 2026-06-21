import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { SafariDriveTime, SafariInterest, SafariPreferences } from "../../lib/discovery/types";
import { cn } from "../../lib/cn";

const DRIVE_OPTIONS: { id: SafariDriveTime; label: string }[] = [
  { id: "15", label: "15 min" },
  { id: "30", label: "30 min" },
  { id: "60", label: "1 hour" },
  { id: "120", label: "2 hours" },
  { id: "anywhere", label: "Anywhere" },
];

const INTERESTS: { id: SafariInterest; label: string; emoji: string }[] = [
  { id: "food", label: "Food", emoji: "🍔" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "community", label: "Community", emoji: "🎪" },
  { id: "politics", label: "Politics", emoji: "🏛" },
  { id: "sports", label: "Sports", emoji: "🏈" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "faith", label: "Faith", emoji: "⛪" },
  { id: "kids", label: "Kids", emoji: "👨‍👩‍👧" },
  { id: "volunteer", label: "Volunteer", emoji: "🤝" },
];

interface Props {
  onComplete: (prefs: SafariPreferences) => void;
}

export function EventSafariWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [driveTime, setDriveTime] = useState<SafariDriveTime>("60");
  const [interests, setInterests] = useState<SafariInterest[]>([]);

  function toggleInterest(id: SafariInterest) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="safari-wizard card card-elevated max-w-2xl mx-auto">
      <p className="section-kicker">Event Safari</p>
      <h1 className="font-display text-2xl font-bold text-ark-pine mt-1">Hunt for Arkansas events</h1>
      <p className="text-sm text-muted mt-2">Answer a few questions — we&apos;ll surface discoveries, not spreadsheets.</p>

      <div className="safari-steps mt-6 flex gap-2">
        {[0, 1, 2].map((s) => (
          <div key={s} className={cn("safari-step-dot", step >= s && "safari-step-dot-active")} />
        ))}
      </div>

      {step === 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg">How far are you willing to drive?</h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {DRIVE_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDriveTime(o.id)}
                className={cn("chip text-sm py-2 px-4", driveTime === o.id ? "bg-ark-pine text-white" : "bg-ark-wheat")}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary mt-8" onClick={() => setStep(1)}>
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg">Looking for…</h2>
          <div className="discovery-chip-grid mt-4">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => toggleInterest(i.id)}
                className={cn("discovery-chip discovery-chip-sm", interests.includes(i.id) && "discovery-chip-active")}
              >
                <span className="discovery-chip-emoji">{i.emoji}</span>
                <span className="discovery-chip-label">{i.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-8">
            <button type="button" className="btn-secondary" onClick={() => setStep(0)}>Back</button>
            <button type="button" className="btn-primary" onClick={() => setStep(2)} disabled={interests.length === 0}>
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg">Ready to explore</h2>
          <p className="text-sm text-muted mt-2">
            Driving up to {DRIVE_OPTIONS.find((d) => d.id === driveTime)?.label} · {interests.length} interests selected
          </p>
          <button
            type="button"
            className="btn-primary mt-6 w-full sm:w-auto"
            onClick={() => onComplete({ driveTime, interests })}
          >
            Show me events
          </button>
        </div>
      )}
    </div>
  );
}
