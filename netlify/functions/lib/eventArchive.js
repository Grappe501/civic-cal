const { endOfDay, parseISO } = require("date-fns");
const { toZonedTime, fromZonedTime } = require("date-fns-tz");

const DEFAULT_TZ = "America/Chicago";

function publicVisibilityCutoff(event) {
  const tz = event.timezone || DEFAULT_TZ;
  if (event.endAt) return parseISO(event.endAt);

  const start = parseISO(event.startAt);
  const zonedStart = toZonedTime(start, tz);
  return fromZonedTime(endOfDay(zonedStart), tz);
}

function isEventPastForPublic(event, now = new Date()) {
  if (event.status === "archived") return true;
  return now.getTime() > publicVisibilityCutoff(event).getTime();
}

function isPubliclyVisibleEvent(event, now = new Date()) {
  const status = event.status || "approved";
  if (status !== "approved") return false;
  return !isEventPastForPublic(event, now);
}

module.exports = { publicVisibilityCutoff, isEventPastForPublic, isPubliclyVisibleEvent };
