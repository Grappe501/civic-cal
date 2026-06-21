import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Search, Share2, Users } from "lucide-react";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import { signupContributor } from "../lib/api-contributors";
import { fetchEvents } from "../lib/api";

const CONTRIBUTOR_CHECKLIST = [
  "Church dinners & fish fries",
  "County fairs & heritage festivals",
  "City council & quorum court meetings",
  "School board meetings",
  "Rivalry football & homecoming games",
  "Volunteer fire department fundraisers",
  "Chamber breakfasts & Rotary meetings",
  "Farmers markets & library events",
];

const INTEL_PROMPTS = [
  "Which events does every serious candidate need to attend in your town?",
  "Which church/community meals are the biggest?",
  "Which rivalry games draw the whole town?",
  "Which events are not online but everyone knows about?",
  "Who should we contact to verify this?",
];

const HIGH_VALUE = [
  "Community church dinners & fish fries",
  "County fairs and heritage festivals",
  "Rivalry football & homecoming",
  "Farm Bureau, Rotary, VFW, volunteer fire fundraisers",
  "Public government meetings & hearings",
  "Library and extension office programs",
];

export function HelpBuildCalendarPage() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intelDone, setIntelDone] = useState(false);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [townSearch, setTownSearch] = useState("");
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchEvents>>>([]);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(() => setEvents([]));
  }, []);

  const countiesWithEvents = useMemo(() => new Set(events.map((e) => e.county).filter(Boolean)), [events]);
  const emptyCounties = useMemo(
    () => ARKANSAS_COUNTIES.filter((c) => !countiesWithEvents.has(c)),
    [countiesWithEvents],
  );
  const filteredTowns = useMemo(() => {
    const q = townSearch.trim().toLowerCase();
    if (!q) return [];
    return ARKANSAS_COUNTIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [townSearch]);

  async function onIntelSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIntelLoading(true);
    setIntelError(null);
    const fd = new FormData(e.currentTarget);
    const answers = INTEL_PROMPTS.map((q, i) => `${q}\n${String(fd.get(`intel_${i}`) || "").trim()}`).join("\n\n");
    try {
      await signupContributor({
        name: String(fd.get("intel_name")),
        email: String(fd.get("intel_email")),
        county: String(fd.get("intel_county")),
        city: String(fd.get("intel_city") || "") || undefined,
        role: "local_campaign_intel",
        helpAreas: `[Campaign presence intel]\n${answers}`,
      });
      setIntelDone(true);
    } catch (err) {
      setIntelError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setIntelLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await signupContributor({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        county: String(fd.get("county")),
        city: String(fd.get("city") || "") || undefined,
        role: String(fd.get("role") || "") || undefined,
        helpAreas: String(fd.get("helpAreas") || "") || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="section-kicker">County ambassadors</p>
      <h1 className="page-header mt-1">Help us fill the map</h1>
      <p className="mt-3 text-muted max-w-2xl text-base">
        Every county has traditions outsiders miss — spaghetti dinners, livestock shows, VFD fish fries, school homecomings.
        Recruit local eyes in every community.
      </p>

      <section className="mt-10 card card-elevated">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-ark-rust" />
          <h2 className="font-display text-lg font-semibold">Find your town</h2>
        </div>
        <input
          className="input mt-3"
          placeholder="Search county or community…"
          value={townSearch}
          onChange={(e) => setTownSearch(e.target.value)}
        />
        {filteredTowns.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {filteredTowns.map((c) => (
              <li key={c}>
                <Link
                  to={`/map?county=${encodeURIComponent(c)}`}
                  className="chip chip-muted hover:bg-ark-sage/20 transition"
                >
                  {c} County
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-ark-sage" /> Counties with no events yet
        </h2>
        <p className="text-sm text-muted mt-1">{emptyCounties.length} of {ARKANSAS_COUNTIES.length} counties need contributors.</p>
        <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {emptyCounties.slice(0, 40).map((c) => (
            <Link
              key={c}
              to={`/map?county=${encodeURIComponent(c)}`}
              className="chip chip-muted inline-flex items-center gap-1 hover:border-ark-rust/40"
            >
              {c}
              <Share2 className="h-3 w-3 opacity-60" />
            </Link>
          ))}
        </div>
        {emptyCounties.length > 40 && (
          <p className="text-xs text-muted mt-2">+ {emptyCounties.length - 40} more — search above to find yours.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Contributor checklist</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-ark-pine/85">
          {CONTRIBUTOR_CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2 items-start">
              <CheckCircle2 className="h-4 w-4 text-ark-sage shrink-0 mt-0.5" /> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card card-elevated">
          <Users className="h-6 w-6 text-ark-rust" />
          <h2 className="font-semibold mt-2">Become a county calendar contributor</h2>
          <p className="text-sm text-muted mt-1">Track public events in your county — churches, schools, city hall, festivals.</p>
        </div>
        <div className="card card-elevated">
          <MapPin className="h-6 w-6 text-ark-sage" />
          <h2 className="font-semibold mt-2">Share recurring traditions</h2>
          <p className="text-sm text-muted mt-1">Annual dinners, fairs, and rivalry games that define your town.</p>
        </div>
      </section>

      <section className="mt-10 card card-elevated border-l-4 border-l-ark-rust">
        <h2 className="font-display text-lg font-semibold">Help campaigns know where to show up</h2>
        <p className="text-sm text-muted mt-2">
          Local knowledge goes to trusted contributor review — campaigns use this to decide attendance, surrogates, and volunteer deployment.
        </p>
        {intelDone ? (
          <p className="mt-4 text-sm text-ark-sage font-medium">Thank you — your local intel helps Arkansas campaigns show up in the right rooms.</p>
        ) : (
          <form onSubmit={onIntelSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name *</label>
                <input name="intel_name" required className="input" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input name="intel_email" type="email" required className="input" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">County *</label>
                <select name="intel_county" required className="input">
                  <option value="">Select</option>
                  {ARKANSAS_COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input name="intel_city" className="input" />
              </div>
            </div>
            {INTEL_PROMPTS.map((prompt, i) => (
              <div key={prompt}>
                <label className="label text-xs">{prompt}</label>
                <textarea name={`intel_${i}`} rows={2} className="input text-sm" />
              </div>
            ))}
            {intelError && <p className="text-sm text-red-700">{intelError}</p>}
            <button type="submit" disabled={intelLoading} className="btn-primary">
              {intelLoading ? "Sending…" : "Share local campaign intel"}
            </button>
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">What makes a high-value event?</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-ark-pine/85">
          {HIGH_VALUE.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-ark-sage font-bold">•</span> {item}
            </li>
          ))}
        </ul>
      </section>

      {done ? (
        <div className="card card-elevated mt-10 text-center py-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-ark-sage" />
          <p className="font-semibold mt-4 text-ark-pine">You're signed up — thank you!</p>
          <Link to="/submit" className="btn-primary mt-4 inline-flex">Submit an event now</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card card-elevated mt-10 space-y-4">
          <h2 className="font-display text-lg font-semibold">Ambassador signup</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input name="email" type="email" required className="input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">County *</label>
              <select name="county" required className="input">
                <option value="">Select</option>
                {ARKANSAS_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">City</label>
              <input name="city" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Role (optional)</label>
            <input name="role" className="input" placeholder="Teacher, deacon, chamber member…" />
          </div>
          <div>
            <label className="label">What can you help track?</label>
            <textarea name="helpAreas" rows={3} className="input" placeholder="Churches, schools, city hall, festivals, civic groups…" />
          </div>
          {error && <p className="text-sm text-red-700 font-medium">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Signing up…" : "Join as contributor"}
          </button>
        </form>
      )}
    </div>
  );
}
