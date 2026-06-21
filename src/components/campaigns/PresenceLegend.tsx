import { Eye, HandHeart, UserCheck, Users } from "lucide-react";

export function PresenceLegend({ compact }: { compact?: boolean }) {
  const items = [
    { icon: UserCheck, label: "Candidate attending", color: "#1B4332", border: "border-emerald-700" },
    { icon: HandHeart, label: "Volunteers needed", color: "#BC4749", border: "border-rose-700" },
    { icon: Users, label: "Surrogate attending", color: "#2D6A4F", border: "border-teal-700" },
    { icon: Eye, label: "Multiple campaigns watching", color: "#1A1F2E", border: "border-slate-700" },
  ];

  return (
    <div className={`presence-legend ${compact ? "presence-legend-compact" : ""}`} aria-label="Candidate presence legend">
      {!compact && <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Map legend</p>}
      <ul className="flex flex-wrap gap-2">
        {items.map(({ icon: Icon, label, color, border }) => (
          <li key={label} className={`presence-legend-item chip chip-muted text-[10px] gap-1.5 border ${border}`}>
            <span className="presence-legend-swatch inline-flex items-center justify-center rounded-full w-4 h-4 shrink-0" style={{ backgroundColor: color }}>
              <Icon className="h-2.5 w-2.5 text-white" aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
