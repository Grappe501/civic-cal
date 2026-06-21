import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";
const STORAGE_KEY = "civic-candidate-beta-token";

interface Props {
  children: React.ReactNode;
  title?: string;
}

export function BetaPasswordGate({ children, title = "Candidate dashboard (beta)" }: Props) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [authed, setAuthed] = useState(() => Boolean(sessionStorage.getItem(STORAGE_KEY)));
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${fnBase}/candidate-dashboard-gate`)
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${fnBase}/candidate-dashboard-gate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        sessionStorage.setItem(STORAGE_KEY, data.token);
        setAuthed(true);
        setPassword("");
      } else if (data.error === "not_configured") {
        setError("Beta password not configured on server.");
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Could not reach auth service. Run Netlify dev or set env locally.");
    } finally {
      setBusy(false);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card-readable text-center">
        <Lock className="h-10 w-10 mx-auto text-ark-pine mb-4" />
        <h1 className="font-display text-xl font-bold text-ark-pine">{title}</h1>
        <p className="text-sm text-muted mt-2">
          Beta access only. Neutral campaign planning tools — not public endorsements.
        </p>

        {configured === false && (
          <div className="mt-4 text-left text-sm bg-ark-wheat/60 border border-ark-sage/30 rounded-lg p-4">
            <p className="font-semibold text-ark-pine">Setup required</p>
            <p className="text-muted mt-1">
              Add <code className="text-xs">CANDIDATE_DASHBOARD_BETA_PASSWORD</code> to Netlify environment variables or{" "}
              <code className="text-xs">.env.local</code> for local Netlify dev. Do not commit the password value.
            </p>
          </div>
        )}

        {configured !== false && (
          <form onSubmit={submit} className="mt-6 space-y-3 text-left">
            <label className="block text-xs font-bold uppercase text-muted">Beta password</label>
            <input
              type="password"
              className="input-readable w-full"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy || !password}>
              {busy ? "Checking…" : "Unlock dashboard"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function clearCandidateBetaSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}
