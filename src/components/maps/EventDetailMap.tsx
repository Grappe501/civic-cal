import { GoogleMap, MarkerF } from "@react-google-maps/api";
import type { CivicEvent } from "../../lib/types";
import { eventHasMapPin } from "../../lib/maps/mapTypes";
import { hasMapsApiKey, useGoogleMapsLoader } from "../../lib/maps/googleMapsLoader";
import { mapsUrl } from "../../lib/format";
import { cn } from "../../lib/cn";
import { AlertCircle, ExternalLink } from "lucide-react";

interface Props {
  event: CivicEvent;
  className?: string;
  height?: string;
  showReport?: boolean;
}

export function EventDetailMap({ event, className, height = "280px", showReport = true }: Props) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const external = mapsUrl(event);
  const hasPin = eventHasMapPin(event);

  if (event.isOnlineOnly) {
    return (
      <div className={cn("card text-sm text-ark-pine/70", className)}>
        Online event — no physical map location.
      </div>
    );
  }

  if (!hasMapsApiKey() || !hasPin) {
    return (
      <div className={cn("card space-y-2", className)}>
        <p className="text-sm text-ark-pine/70">
          {event.formattedAddress ?? [event.address, event.city, `${event.county} County, AR`].filter(Boolean).join(", ")}
        </p>
        {external && (
          <a href={external} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        )}
        {event.mapStatus === "manual_review" && (
          <p className="text-xs text-amber-700 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Location pending verification
          </p>
        )}
      </div>
    );
  }

  if (loadError || !isLoaded) {
    return <div className={cn("animate-pulse rounded-2xl bg-ark-wheat/50", className)} style={{ height }} />;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-2xl border border-ark-pine/10">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height }}
          center={{ lat: event.latitude!, lng: event.longitude! }}
          zoom={14}
          options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
        >
          <MarkerF position={{ lat: event.latitude!, lng: event.longitude! }} title={event.title} />
        </GoogleMap>
      </div>
      <p className="text-sm text-ark-pine/80">{event.formattedAddress ?? event.locationName}</p>
      <div className="flex flex-wrap gap-2">
        {external && (
          <a href={external} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-2">
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        )}
        {showReport && (
          <a href={`mailto:admin@example.com?subject=Location%20correction%3A%20${encodeURIComponent(event.title)}`} className="btn-secondary text-xs py-2">
            Report incorrect location
          </a>
        )}
      </div>
    </div>
  );
}
