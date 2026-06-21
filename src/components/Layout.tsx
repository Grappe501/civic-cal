import { Link, NavLink } from "react-router-dom";
import { CalendarHeart, MapPin, PlusCircle } from "lucide-react";
import { cn } from "../lib/cn";

const nav = [
  { to: "/", label: "Discover" },
  { to: "/explore", label: "Explore" },
  { to: "/map", label: "Map" },
  { to: "/races", label: "Races" },
  { to: "/safari", label: "Safari" },
  { to: "/campaigns", label: "Campaigns" },
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
              <p className="text-xs text-ark-pine/60">Every town matters</p>
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
                    isActive ? "bg-ark-pine text-white" : "text-ark-pine/70 hover:bg-ark-wheat hover:text-ark-pine",
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
              A statewide civic + community calendar. Open to the public — built for organizers,
              candidates, churches, schools, and neighbors.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-2">Quick links</p>
            <ul className="space-y-1 text-ark-wheat/70">
              <li><Link to="/submit" className="hover:text-white">Submit an event</Link></li>
              <li><Link to="/explore" className="hover:text-white">Explore Arkansas</Link></li>
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
