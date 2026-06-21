import { useEffect, useState } from "react";
import { loadPersonalityMode, PERSONALITY_LABELS, savePersonalityMode } from "../../lib/discovery/personalityStore";
import type { PersonalityMode } from "../../lib/discovery/types";
import { cn } from "../../lib/cn";

const MODES: PersonalityMode[] = ["citizen", "candidate", "organizer", "volunteer_seeker"];

interface Props {
  value?: PersonalityMode;
  onChange?: (mode: PersonalityMode) => void;
}

export function PersonalityModeToggle({ value, onChange }: Props) {
  const [mode, setMode] = useState<PersonalityMode>(() => value ?? loadPersonalityMode());

  useEffect(() => {
    if (value) setMode(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: Event) => setMode((e as CustomEvent<PersonalityMode>).detail);
    window.addEventListener("civic-personality-changed", handler);
    return () => window.removeEventListener("civic-personality-changed", handler);
  }, []);

  function select(m: PersonalityMode) {
    setMode(m);
    savePersonalityMode(m);
    onChange?.(m);
  }

  return (
    <div className="personality-toggle">
      <p className="text-sm font-medium text-muted mb-2">Who are you exploring as?</p>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => select(m)}
            className={cn(
              "personality-pill",
              mode === m ? "personality-pill-active" : "personality-pill-idle",
            )}
            title={PERSONALITY_LABELS[m].subtitle}
          >
            {PERSONALITY_LABELS[m].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">{PERSONALITY_LABELS[mode].subtitle}</p>
    </div>
  );
}
