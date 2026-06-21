import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin } from "lucide-react";
import { CATEGORIES } from "../lib/categories";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import { geocodeLocation, submitEvent } from "../lib/api";
import { EventDetailMap } from "../components/maps/EventDetailMap";
import type { CivicEvent, EventCategory } from "../lib/types";
import { scoreSubmissionRisk, type SubmissionTrustSignals } from "../lib/submitRiskScore";
import type { GeocodeResult } from "../lib/maps/mapTypes";

export function SubmitPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResult, setGeoResult] = useState<GeocodeResult | null>(null);
  const [riskPreview, setRiskPreview] = useState<ReturnType<typeof scoreSubmissionRisk> | null>(null);
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);

  const [loc, setLoc] = useState({
    locationName: "",
    address: "",
    city: "",
    county: "",
  });

  async function previewMap() {
    setGeoLoading(true);
    setGeoResult(null);
    try {
      const result = await geocodeLocation({
        ...loc,
        state: "AR",
      });
      setGeoResult(result);
    } finally {
      setGeoLoading(false);
    }
  }

  const previewEvent: CivicEvent | null =
    geoResult?.ok && geoResult.latitude
      ? {
          id: "preview",
          slug: "preview",
          title: "Preview location",
          startAt: new Date().toISOString(),
          county: loc.county || "Pulaski",
          category: "community",
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          formattedAddress: geoResult.formattedAddress,
          mapStatus: geoResult.mapStatus,
          locationConfidence: geoResult.locationConfidence,
          locationName: loc.locationName,
          address: loc.address,
          city: loc.city,
        }
      : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const startDate = String(fd.get("startDate"));
    const startTime = String(fd.get("startTime") || "12:00");
    const endDate = String(fd.get("endDate") || "");
    const endTime = String(fd.get("endTime") || "");

    const startAt = new Date(`${startDate}T${startTime}`).toISOString();
    const endAt = endDate ? new Date(`${endDate}T${endTime || startTime}`).toISOString() : undefined;

    try {
      const title = String(fd.get("title"));
      const description = String(fd.get("description") || "");
      const websiteUrl = String(fd.get("websiteUrl") || "");
      const trustSignals: SubmissionTrustSignals = {
        isHostOrganizer: fd.get("isHostOrganizer") === "on",
        attendedBefore: fd.get("attendedBefore") === "on",
        isPublicGovernmentMeeting: fd.get("isPublicGovernmentMeeting") === "on",
        isRecurringTradition: fd.get("isRecurringTradition") === "on",
        isOpenToPublic: fd.get("isOpenToPublic") === "on",
      };
      const risk = scoreSubmissionRisk({
        title,
        description,
        websiteUrl,
        startAt,
        city: loc.city,
        county: loc.county,
        address: loc.address,
        locationName: loc.locationName,
        trust: trustSignals,
      });
      setRiskPreview(risk);

      await submitEvent({
        title,
        description,
        startAt,
        endAt,
        city: loc.city,
        county: loc.county,
        state: "AR",
        address: loc.address,
        locationName: loc.locationName,
        category: String(fd.get("category")) as EventCategory,
        hostOrganization: String(fd.get("hostOrganization") || ""),
        contactName: String(fd.get("contactName") || ""),
        contactEmail: String(fd.get("contactEmail") || ""),
        websiteUrl,
        isRecurring: fd.get("isRecurring") === "on",
        isPublicGovernmentMeeting: fd.get("isPublicGovernmentMeeting") === "on",
        candidateRelevant: fd.get("candidateRelevant") === "on",
        isFamilyFriendly: fd.get("isFamilyFriendly") === "on",
        isFree: fd.get("isFree") === "on",
        isOnlineOnly,
        submitterName: String(fd.get("contactName") || ""),
        latitude: geoResult?.latitude,
        longitude: geoResult?.longitude,
        formattedAddress: geoResult?.formattedAddress,
        placeId: geoResult?.placeId,
        locationConfidence: geoResult?.locationConfidence,
        mapStatus: isOnlineOnly ? "online" : geoResult?.mapStatus ?? "pending",
        submissionTrust: trustSignals,
        spamRiskScore: risk.score,
        spamFlags: risk.flags,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-ark-sage" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ark-pine">Thanks — your event is under review.</h1>
        <p className="mt-2 text-ark-pine/70">
          Share this link with your county group so more people can add events.
        </p>
        <Link to="/map" className="btn-primary mt-6 inline-flex">See the statewide map</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ark-pine">Submit an Arkansas Event</h1>
      <p className="mt-2 text-ark-pine/70">
        Add your location so neighbors and organizers can find you on the map.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="title">Event title *</label>
          <input id="title" name="title" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="startDate">Start date *</label>
            <input id="startDate" name="startDate" type="date" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="startTime">Start time</label>
            <input id="startTime" name="startTime" type="time" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endDate">End date</label>
            <input id="endDate" name="endDate" type="date" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endTime">End time</label>
            <input id="endTime" name="endTime" type="time" className="input" />
          </div>
        </div>

        <fieldset className="space-y-3 border-t border-ark-pine/10 pt-4">
          <legend className="text-sm font-medium text-ark-pine mb-1">Location</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isOnlineOnly}
              onChange={(e) => setIsOnlineOnly(e.target.checked)}
              className="rounded border-ark-pine/30"
            />
            Online only (no map pin)
          </label>
          {!isOnlineOnly && (
            <>
              <div>
                <label className="label">Venue / location name</label>
                <input
                  className="input"
                  value={loc.locationName}
                  onChange={(e) => setLoc({ ...loc, locationName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Street address</label>
                <input className="input" value={loc.address} onChange={(e) => setLoc({ ...loc, address: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">City</label>
                  <input className="input" value={loc.city} onChange={(e) => setLoc({ ...loc, city: e.target.value })} />
                </div>
                <div>
                  <label className="label">County *</label>
                  <select
                    className="input"
                    required
                    value={loc.county}
                    onChange={(e) => setLoc({ ...loc, county: e.target.value })}
                  >
                    <option value="">Select county</option>
                    {ARKANSAS_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">State</label>
                <input className="input bg-ark-wheat/40" value="Arkansas (AR)" readOnly disabled />
              </div>
              <button
                type="button"
                onClick={previewMap}
                disabled={geoLoading || !loc.county}
                className="btn-secondary"
              >
                <MapPin className="h-4 w-4" />
                {geoLoading ? "Finding location…" : "Preview map location"}
              </button>
              {geoResult && !geoResult.ok && (
                <p className="text-sm text-amber-700">
                  {geoResult.message ?? "Could not geocode — you can still submit for manual review."}
                </p>
              )}
              {previewEvent && <EventDetailMap event={previewEvent} height="200px" showReport={false} />}
            </>
          )}
        </fieldset>

        <div>
          <label className="label" htmlFor="category">Category *</label>
          <select id="category" name="category" required className="input">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="hostOrganization">Host organization</label>
          <input id="hostOrganization" name="hostOrganization" className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="contactName">Contact name</label>
            <input id="contactName" name="contactName" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="contactEmail">Contact email</label>
            <input id="contactEmail" name="contactEmail" type="email" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="websiteUrl">Website or Facebook link</label>
          <input id="websiteUrl" name="websiteUrl" type="url" className="input" placeholder="https://" />
        </div>

        <fieldset className="space-y-2 border-t border-ark-pine/10 pt-4">
          <legend className="text-sm font-medium text-ark-pine mb-2">Trust signals (helps reviewers)</legend>
          {[
            ["isHostOrganizer", "I am the host/organizer"],
            ["attendedBefore", "I attended this event before"],
            ["isPublicGovernmentMeeting", "This is a public government meeting"],
            ["isRecurringTradition", "This is a recurring community tradition"],
            ["isOpenToPublic", "This is open to the public"],
          ].map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                defaultChecked={name === "isOpenToPublic"}
                className="rounded border-ark-pine/30"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 border-t border-ark-pine/10 pt-4">
          <legend className="text-sm font-medium text-ark-pine mb-2">Options</legend>
          {[
            ["isRecurring", "Is this recurring?"],
            ["isPublicGovernmentMeeting", "Public government meeting"],
            ["candidateRelevant", "Candidates should know about this"],
            ["isFamilyFriendly", "Family friendly"],
            ["isFree", "Free event"],
          ].map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} defaultChecked={name === "isFamilyFriendly" || name === "isFree"} className="rounded border-ark-pine/30" />
              {label}
            </label>
          ))}
        </fieldset>

        {riskPreview && riskPreview.score > 20 && (
          <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
            Submission flagged for enhanced review ({riskPreview.recommendation.replace("_", " ")}).
            {riskPreview.flags.length > 0 && ` Flags: ${riskPreview.flags.join(", ")}.`}
            {" "}Legitimate events are still welcome — a human will review.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading || !loc.county} className="btn-primary w-full sm:w-auto">
          {loading ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
