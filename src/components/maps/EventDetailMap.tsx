import { GoogleMap, MarkerF } from "@react-google-maps/api";
import type { CivicEvent } from "../../lib/types";
import { eventHasMapPin } from "../../lib/maps/mapTypes";
import { hasMapsApiKey, useGoogleMapsLoader } from "../../lib/maps/googleMapsLoader";
import { locationMapQuery, mapsEmbedUrl } from "../../lib/format";
import { cn } from "../../lib/cn";
import { AlertCircle } from "lucide-react";

interface Props {
  event: CivicEvent;
  className?: string;
  height?: string;
  showReport?: boolean;
}

function MapIframe({ src, title, height }: { src: string; title: string; height: string }) {
  return (
    <iframe
      title={title}
      src={src}
      width="100%"
      height={height}
      style={{ border: 0, display: "block" }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

export function EventDetailMap({ event, className, height = "280px", showReport = true }: Props) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const hasPin = eventHasMapPin(event);
  const embedSrc = mapsEmbedUrl(event);
  const query = locationMapQuery(event);
  const addressLine =
    event.formattedAddress ??
    [event.locationName, event.address, event.city, `${event.county} County, AR`].filter(Boolean).join(" · ");

  if (event.isOnlineOnly) {
    return (
      <div className={cn("card text-sm text-muted", className)}>
        Online event — no physical map location.
      </div>
    );
  }

  if (!query && !embedSrc) {
    return (
      <div className={cn("card text-sm text-muted", className)}>
        Location details not available yet.
      </div>
    );
  }

  const useInteractive = hasMapsApiKey() && hasPin && isLoaded && !loadError;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-2xl border border-ark-pine/10 bg-ark-wheat/20">
        {useInteractive ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height }}
            center={{ lat: event.latitude!, lng: event.longitude! }}
            zoom={14}
            options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
          >
            <MarkerF position={{ lat: event.latitude!, lng: event.longitude! }} title={event.title} />
          </GoogleMap>
        ) : embedSrc ? (
          <MapIframe src={embedSrc} title={`Map for ${event.title}`} height={height} />
        ) : (
          <div className="animate-pulse bg-ark-wheat/50" style={{ height }} />
        )}
      </div>

      {addressLine && <p className="text-sm text-muted">{addressLine}</p>}

      {event.mapStatus === "manual_review" && (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Location pending verification
        </p>
      )}

      {showReport && (
        <a
          href={`mailto:admin@example.com?subject=Location%20correction%3A%20${encodeURIComponent(event.title)}`}
          className="btn-secondary text-xs py-2 inline-flex"
        >
          Report incorrect location
        </a>
      )}
    </div>
  );
}
