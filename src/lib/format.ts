import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import type { CivicEvent } from "./types";

const TZ = "America/Chicago";

export function formatEventDate(event: CivicEvent): string {
  if (event.dateTbd) return "Date TBD — check official schedule";
  const start = parseISO(event.startAt);
  const datePart = formatInTimeZone(start, event.timezone || TZ, "EEE, MMM d, yyyy");
  if (event.allDay) return datePart;
  const timePart = formatInTimeZone(start, event.timezone || TZ, "h:mm a");
  return `${datePart} · ${timePart}`;
}

export function formatEventRange(event: CivicEvent): string {
  if (!event.endAt || event.dateTbd) return formatEventDate(event);
  const start = parseISO(event.startAt);
  const end = parseISO(event.endAt);
  const sameDay =
    formatInTimeZone(start, TZ, "yyyy-MM-dd") === formatInTimeZone(end, TZ, "yyyy-MM-dd");
  if (sameDay && !event.allDay) {
    return `${formatInTimeZone(start, TZ, "EEE, MMM d")} · ${formatInTimeZone(start, TZ, "h:mm a")} – ${formatInTimeZone(end, TZ, "h:mm a")}`;
  }
  return `${formatEventDate(event)} – ${formatInTimeZone(end, TZ, "MMM d")}`;
}

export function mapsUrl(event: CivicEvent): string | null {
  const q = locationMapQuery(event);
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Address or lat,lng string for map embed/search */
export function locationMapQuery(event: CivicEvent): string | null {
  if (
    typeof event.latitude === "number" &&
    typeof event.longitude === "number" &&
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude)
  ) {
    return `${event.latitude},${event.longitude}`;
  }
  const q = [event.address, event.locationName, event.city, `${event.county} County, AR`]
    .filter(Boolean)
    .join(", ");
  return q.trim() || null;
}

/** Google Maps iframe embed — works without Maps JavaScript API on the page */
export function mapsEmbedUrl(event: CivicEvent): string | null {
  const q = locationMapQuery(event);
  if (!q) return null;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (key?.trim()) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key.trim())}&q=${encodeURIComponent(q)}&zoom=14`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=14&output=embed`;
}

export function buildIcs(event: CivicEvent): string {
  const uid = `${event.slug}@arkansas-everywhere`;
  const dtStart = event.startAt.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dtEnd = (event.endAt || event.startAt).replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Arkansas Everywhere//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
    event.locationName ? `LOCATION:${escapeIcs(event.locationName)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadIcs(event: CivicEvent) {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.slug}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function shareEventUrl(event: CivicEvent): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/event/${event.slug}`;
}
