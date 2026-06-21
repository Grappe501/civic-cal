import { Link, NavLink } from "react-router-dom";
import { CalendarDays, CalendarHeart, MapPin, PlusCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { launchFlags } from "../lib/launch/launchFlags";

type NavItem = { to: string; label: string; always?: boolean; flag?: keyof typeof launchFlags };

const navItems: NavItem[] = [
  { to: "/calendar/month", label: "Calendar", always: true },
  { to: "/", label: "Discover", flag: "showDiscoverNav" },
  { to: "/explore", label: "Explore", flag: "showExploreNav" },
  { to: "/map", label: "Map", flag: "showMapNav" },
  { to: "/student-service", label: "Student service", flag: "showStudentServicesNav" },
  { to: "/organizations", label: "Organizations", flag: "showOrganizationsNav" },
  { to: "/host", label: "Host", always: true },
  { to: "/races", label: "Races", flag: "showRacesNav" },
  { to: "/counties", label: "Counties", always: true },
];

function visibleNavItems(): NavItem[] {
  return navItems.filter((item) => item.always || (item.flag && launchFlags[item.flag]));
}

type FooterLink = { to: string; label: string; flag?: keyof typeof launchFlags; always?: boolean };

const footerLinks: FooterLink[] = [
  { to: "/submit", label: "Submit an event", always: true },
  { to: "/calendar/month", label: "Community calendar", always: true },
  { to: "/explore", label: "Explore Arkansas", flag: "showExploreNav" },
  { to: "/student-service", label: "Student service match", flag: "showStudentServicesNav" },
  { to: "/calendar/dates", label: "Important Arkansas dates", always: true },
  { to: "/host", label: "Host portal", always: true },
  { to: "/organizations", label: "Organizations", flag: "showOrganizationsNav" },
  { to: "/campaigns", label: "Campaign workspaces", flag: "showCampaignWorkspacesNav" },
  { to: "/safari", label: "Event Safari", flag: "showExploreNav" },
  { to: "/races", label: "Race Circuit", flag: "showRacesNav" },
  { to: "/map", label: "Event map", flag: "showMapNav" },
  { to: "/admin", label: "Admin review", always: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const nav = visibleNavItems();

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
              <p className="text-caption">Arkansas Community Calendar · all 75 counties</p>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
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
              A statewide community calendar being built county by county — festivals, fairs, school events, and local
              gatherings across all 75 Arkansas counties.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-2">Quick links</p>
            <ul className="space-y-1 text-ark-wheat/70">
              {footerLinks
                .filter((l) => l.always || (l.flag && launchFlags[l.flag]))
                .map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          <div className="text-sm text-ark-wheat/60">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar-first public preview
            </p>
            <p className="mt-1">More discovery surfaces return as event density grows.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
