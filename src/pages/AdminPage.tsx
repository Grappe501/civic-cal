import { useEffect, useState } from "react";
import { adminAction, fetchAdminEvents } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { formatEventRange } from "../lib/format";
import type { CivicEvent } from "../lib/types";

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("civic-admin-token") ?? "");
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(t: string) {
    try {
      const data = await fetchAdminEvents(t, "pending");
      setEvents(data);
      setAuthed(true);
      sessionStorage.setItem("civic-admin-token", t);
    } catch {
      setAuthed(false);
      setError("Invalid admin token");
    }
  }

  useEffect(() => {
    if (token) load(token);
  }, []);

  async function act(id: string, action: "approve" | "reject" | "feature") {
    await adminAction(token, id, action);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-2xl font-bold text-ark-pine">Admin review</h1>
        <p className="mt-2 text-sm text-ark-pine/70">Pending submissions — approve, reject, or feature.</p>
        <input
          type="password"
          className="input mt-4"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button type="button" className="btn-primary mt-4" onClick={() => load(token)}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ark-pine">Pending submissions ({events.length})</h1>
      <div className="mt-6 space-y-4">
        {events.map((e) => (
          <div key={e.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-ark-pine">{e.title}</h2>
                <p className="text-sm text-ark-pine/60">{formatEventRange(e)} · {e.county} County</p>
              </div>
              <CategoryBadge category={e.category} />
            </div>
            {e.description && <p className="mt-2 text-sm text-ark-pine/70">{e.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary text-xs py-2" onClick={() => act(e.id, "approve")}>
                Approve
              </button>
              <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(e.id, "reject")}>
                Reject
              </button>
              <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(e.id, "feature")}>
                Feature
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-ark-pine/60">Queue is clear.</p>}
      </div>
    </div>
  );
}
