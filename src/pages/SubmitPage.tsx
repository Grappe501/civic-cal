import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { CATEGORIES } from "../lib/categories";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import { submitEvent } from "../lib/api";
import type { EventCategory } from "../lib/types";

export function SubmitPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      await submitEvent({
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
        startAt,
        endAt,
        city: String(fd.get("city") || ""),
        county: String(fd.get("county")),
        address: String(fd.get("address") || ""),
        locationName: String(fd.get("locationName") || ""),
        category: String(fd.get("category")) as EventCategory,
        hostOrganization: String(fd.get("hostOrganization") || ""),
        contactName: String(fd.get("contactName") || ""),
        contactEmail: String(fd.get("contactEmail") || ""),
        websiteUrl: String(fd.get("websiteUrl") || ""),
        isRecurring: fd.get("isRecurring") === "on",
        isPublicGovernmentMeeting: fd.get("isPublicGovernmentMeeting") === "on",
        candidateRelevant: fd.get("candidateRelevant") === "on",
        isFamilyFriendly: fd.get("isFamilyFriendly") === "on",
        isFree: fd.get("isFree") === "on",
        submitterName: String(fd.get("contactName") || ""),
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
        <Link to="/" className="btn-primary mt-6 inline-flex">Browse events</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ark-pine">Submit an Arkansas Event</h1>
      <p className="mt-2 text-ark-pine/70">
        Community festivals, civic meetings, volunteer shifts — if it matters locally, list it here.
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
        <div>
          <label className="label" htmlFor="locationName">Venue / location name</label>
          <input id="locationName" name="locationName" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="address">Street address</label>
          <input id="address" name="address" className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="city">City</label>
            <input id="city" name="city" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="county">County *</label>
            <select id="county" name="county" required className="input">
              <option value="">Select county</option>
              {ARKANSAS_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
          {loading ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
