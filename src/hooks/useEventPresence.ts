import { useEffect, useState } from "react";
import { getEventPresence, type EventPresence } from "../lib/campaigns/presenceLayer";

const EMPTY: EventPresence = {
  eventId: "",
  attendingCampaigns: [],
  volunteerNeeds: [],
  surrogatePlans: [],
  watchingCampaigns: 0,
  publicBadges: [],
};

export function useEventPresence(eventId: string): EventPresence {
  const [presence, setPresence] = useState(() => (eventId ? getEventPresence(eventId) : EMPTY));

  useEffect(() => {
    if (!eventId) return;
    setPresence(getEventPresence(eventId));
    const handler = () => setPresence(getEventPresence(eventId));
    window.addEventListener("civic-presence-updated", handler);
    return () => window.removeEventListener("civic-presence-updated", handler);
  }, [eventId]);

  return presence;
}
