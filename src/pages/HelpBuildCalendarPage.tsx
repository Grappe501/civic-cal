import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Users } from "lucide-react";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import { signupContributor } from "../lib/api-contributors";

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
      <p className="text-sm font-medium uppercase tracking-wide text-ark-sage">County ambassadors</p>
      <h1 className="font-display text-3xl font-bold text-ark-pine mt-1">Help build the calendar</h1>
      <p className="mt-3 text-ark-pine/70 max-w-2xl">
        Every county has traditions outsiders miss — spaghetti dinners, livestock shows, VFD fish fries, school homecomings.
        Recruit local eyes in every community.
      </p>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card">
          <Users className="h-6 w-6 text-ark-rust" />
          <h2 className="font-semibold mt-2">Become a county calendar contributor</h2>
          <p className="text-sm text-ark-pine/60 mt-1">Track public events in your county — churches, schools, city hall, festivals.</p>
        </div>
        <div className="card">
          <MapPin className="h-6 w-6 text-ark-sage" />
          <h2 className="font-semibold mt-2">Share recurring traditions</h2>
          <p className="text-sm text-ark-pine/60 mt-1">Annual dinners, fairs, and rivalry games that define your town.</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">What makes a high-value event?</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-ark-pine/80">
          {HIGH_VALUE.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-ark-sage">•</span> {item}
            </li>
          ))}
        </ul>
      </section>

      {done ? (
        <div className="card mt-10 text-center py-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-ark-sage" />
          <p className="font-semibold mt-4">You're signed up — thank you!</p>
          <Link to="/submit" className="btn-primary mt-4 inline-flex">Submit an event now</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card mt-10 space-y-4">
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Signing up…" : "Join as contributor"}
          </button>
        </form>
      )}
    </div>
  );
}
