import { useEffect, useMemo, useState } from "react";
import { adminAction, fetchAdminEvents, fetchAdminMapReview } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { formatEventRange } from "../lib/format";
import type { CivicEvent } from "../lib/types";
import { eventHasMapPin } from "../lib/maps/mapTypes";

import { AdminIntelligencePanel } from "../components/admin/AdminIntelligencePanel";
import { AdminCampaignWorkspacesPanel } from "../components/admin/AdminCampaignWorkspacesPanel";

import { AdminEventDossiersPanel } from "../components/admin/AdminEventDossiersPanel";

import { AdminLocalIntelligencePanel } from "../components/admin/AdminLocalIntelligencePanel";

type Tab = "pending" | "map" | "intelligence" | "dossiers" | "local_intel" | "campaigns";

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("civic-admin-token") ?? "");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState<Record<string, { lat: string; lng: string }>>({});

  async function load(t: string, activeTab: Tab = tab) {
    try {
      if (activeTab !== "intelligence" && activeTab !== "campaigns" && activeTab !== "dossiers" && activeTab !== "local_intel") {
        const data =
          activeTab === "map" ? await fetchAdminMapReview(t) : await fetchAdminEvents(t, "pending");
        setEvents(data);
      } else {
        await fetchAdminEvents(t, "pending");
      }
      setAuthed(true);
      sessionStorage.setItem("civic-admin-token", t);
      setError(null);
    } catch {
      setAuthed(false);
      setError("Invalid admin token");
    }
  }

  useEffect(() => {
    if (token) load(token);
  }, []);

  useEffect(() => {
    if (authed && token) load(token, tab);
  }, [tab]);

  async function act(id: string, action: "approve" | "reject" | "feature" | "geocode" | "set_coordinates", extra?: Record<string, unknown>) {
    await adminAction(token, id, action, extra);
    if (tab === "map" && action !== "approve") {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...(extra as object) } : e)));
      await load(token, tab);
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  }

  const mapStats = useMemo(() => {
    const missing = events.filter((e) => !eventHasMapPin(e) && !e.isOnlineOnly).length;
    const low = events.filter((e) => e.locationConfidence === "low").length;
    return { missing, low };
  }, [events]);

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-2xl font-bold text-ark-pine">Admin review</h1>
        <p className="mt-2 text-sm text-ark-pine/70">Pending submissions and map location review.</p>
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
      <div className="flex flex-wrap gap-2 mb-6">
        {(["pending", "map", "intelligence", "dossiers", "local_intel", "campaigns"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? "chip bg-ark-pine text-white" : "chip bg-ark-wheat text-ark-pine"}
          >
            {t === "pending"
              ? "Pending submissions"
              : t === "map"
                ? "Map review"
                : t === "intelligence"
                  ? "Event Intelligence"
                  : t === "dossiers"
                    ? "Event Dossiers"
                    : t === "local_intel"
                      ? "Local Intelligence"
                      : "Campaign workspaces"}
          </button>
        ))}
      </div>

      {tab === "map" && (
        <p className="text-sm text-ark-pine/60 mb-4">
          {mapStats.missing} missing coordinates · {mapStats.low} low confidence
        </p>
      )}

      <h1 className="font-display text-2xl font-bold text-ark-pine">
        {tab === "pending"
          ? `Pending (${events.length})`
          : tab === "map"
            ? `Map review (${events.length})`
            : tab === "intelligence"
              ? "Event Intelligence"
              : tab === "dossiers"
                ? "Event Dossiers"
                : tab === "local_intel"
                  ? "Local Intelligence"
                  : tab === "campaigns"
                  ? "Campaign workspaces"
                  : `Map review (${events.length})`}
      </h1>

      {tab === "intelligence" ? (
        <div className="mt-6">
          <AdminIntelligencePanel token={token} />
        </div>
      ) : tab === "dossiers" ? (
        <div className="mt-6">
          <AdminEventDossiersPanel token={token} />
        </div>
      ) : tab === "local_intel" ? (
        <div className="mt-6">
          <AdminLocalIntelligencePanel />
        </div>
      ) : tab === "campaigns" ? (
        <div className="mt-6">
          <AdminCampaignWorkspacesPanel token={token} />
        </div>
      ) : (
      <div className="mt-6 space-y-4">
        {events.map((e) => (
          <div key={e.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-ark-pine">{e.title}</h2>
                <p className="text-sm text-ark-pine/60">
                  {formatEventRange(e)} · {e.county} County
                  {e.mapStatus && ` · map: ${e.mapStatus}`}
                </p>
              </div>
              <CategoryBadge category={e.category} />
            </div>
            {e.description && <p className="mt-2 text-sm text-ark-pine/70">{e.description}</p>}
            {tab === "map" && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  className="input text-xs"
                  placeholder="Latitude"
                  value={manualCoords[e.id]?.lat ?? (e.latitude?.toString() ?? "")}
                  onChange={(ev) =>
                    setManualCoords((prev) => ({
                      ...prev,
                      [e.id]: { lat: ev.target.value, lng: prev[e.id]?.lng ?? "" },
                    }))
                  }
                />
                <input
                  className="input text-xs"
                  placeholder="Longitude"
                  value={manualCoords[e.id]?.lng ?? (e.longitude?.toString() ?? "")}
                  onChange={(ev) =>
                    setManualCoords((prev) => ({
                      ...prev,
                      [e.id]: { lat: prev[e.id]?.lat ?? "", lng: ev.target.value },
                    }))
                  }
                />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {tab === "pending" && (
                <>
                  <button type="button" className="btn-primary text-xs py-2" onClick={() => act(e.id, "approve")}>
                    Approve
                  </button>
                  <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(e.id, "reject")}>
                    Reject
                  </button>
                  <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(e.id, "feature")}>
                    Feature
                  </button>
                </>
              )}
              {tab === "map" && (
                <>
                  <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(e.id, "geocode")}>
                    Retry geocode
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-xs py-2"
                    onClick={() =>
                      act(e.id, "set_coordinates", {
                        latitude: manualCoords[e.id]?.lat ?? e.latitude,
                        longitude: manualCoords[e.id]?.lng ?? e.longitude,
                      })
                    }
                  >
                    Save coordinates
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-ark-pine/60">Queue is clear.</p>}
      </div>
      )}
    </div>
  );
}
