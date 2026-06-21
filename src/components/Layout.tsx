import { Link, NavLink } from "react-router-dom";
import { CalendarHeart, MapPin, PlusCircle } from "lucide-react";
import { cn } from "../lib/cn";

const nav = [
  { to: "/", label: "Discover" },
  { to: "/explore", label: "Explore" },
  { to: "/map", label: "Map" },
  { to: "/student-service", label: "Student service" },
  { to: "/organizations", label: "Organizations" },
  { to: "/host", label: "Host" },
  { to: "/races", label: "Races" },
  { to: "/counties", label: "Counties" },
  { to: "/submit", label: "Submit", highlight: true as const },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-ark-pine/10 bg-ark-porch/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ark-pine text-ark-wheat shadow-inner">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-ark-pine group-hover:text-ark-rust transition">
                Arkansas Everywhere
              </p>
              <p className="text-caption">Community calendar · all 75 counties</p>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.filter((item) => !("highlight" in item)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition",
                    isActive ? "bg-ark-pine text-white" : "text-muted hover:bg-ark-wheat hover:text-[var(--text-secondary)]",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/submit" className="btn-primary shrink-0 text-xs sm:text-sm">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Submit an Arkansas Event</span>
            <span className="sm:hidden">Submit</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-ark-pine/10 bg-ark-pine text-ark-wheat/90">
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold flex items-center gap-2">
              <CalendarHeart className="h-5 w-5" />
              Arkansas Everywhere
            </p>
            <p className="mt-2 text-sm text-ark-wheat/70">
              Arkansas Community Calendar — festivals, church dinners, school events, races, and gatherings in every county.
              Campaign tools are a premium layer for organizers who opt in.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-2">Quick links</p>
            <ul className="space-y-1 text-ark-wheat/70">
              <li><Link to="/submit" className="hover:text-white">Submit an event</Link></li>
              <li><Link to="/explore" className="hover:text-white">Explore Arkansas</Link></li>
              <li><Link to="/student-service" className="hover:text-white">Student service match</Link></li>
              <li><Link to="/calendar/dates" className="hover:text-white">Important Arkansas dates</Link></li>
              <li><Link to="/host" className="hover:text-white">Host portal</Link></li>
              <li><Link to="/organizations" className="hover:text-white">Organizations</Link></li>
              <li><Link to="/campaigns" className="hover:text-white">Campaign workspaces</Link></li>
              <li><Link to="/safari" className="hover:text-white">Event Safari</Link></li>
              <li><Link to="/races" className="hover:text-white">Race Circuit</Link></li>
              <li><Link to="/map" className="hover:text-white">Event map</Link></li>
              <li><Link to="/admin" className="hover:text-white">Admin review</Link></li>
            </ul>
          </div>
          <div className="text-sm text-ark-wheat/60">
            <p>Standalone civic lane — firewalled from campaign systems.</p>
            <p className="mt-1">Share your county calendar with local leaders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
