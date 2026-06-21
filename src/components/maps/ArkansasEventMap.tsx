import { useCallback, useMemo, useState } from "react";
import { GoogleMap, MarkerF, MarkerClustererF } from "@react-google-maps/api";
import type { CivicEvent } from "../../lib/types";
import { categoryLabel } from "../../lib/categories";
import { ARKANSAS_MAP_DEFAULT, ARKANSAS_BOUNDS, eventHasMapPin } from "../../lib/maps/mapTypes";
import { hasMapsApiKey, useGoogleMapsLoader } from "../../lib/maps/googleMapsLoader";
import { EventMapCard } from "./EventMapCard";
import { cn } from "../../lib/cn";
import { MapPin } from "lucide-react";

const mapStyles = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#7BAFD4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F5E6D3" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#6B8F71" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#2D4A3E" }] },
];

const CATEGORY_PIN: Record<string, string> = {
  civic_meeting: "#2D4A3E",
  candidate_event: "#B84A32",
  community: "#6B8F71",
  faith_meal: "#C4785A",
  school: "#7BAFD4",
  volunteer: "#047857",
  government_deadline: "#475569",
  culture: "#6d28d9",
  small_business: "#b45309",
};

interface Props {
  events: CivicEvent[];
  className?: string;
  height?: string;
  selectedSlug?: string | null;
  onSelectEvent?: (event: CivicEvent | null) => void;
  compact?: boolean;
}

export function ArkansasEventMap({
  events,
  className,
  height = "520px",
  selectedSlug,
  onSelectEvent,
  compact,
}: Props) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [internalSelected, setInternalSelected] = useState<CivicEvent | null>(null);

  const mappable = useMemo(() => events.filter(eventHasMapPin), [events]);

  const selected =
    events.find((e) => e.slug === selectedSlug) ??
    internalSelected ??
    null;

  const onMarkerClick = useCallback(
    (ev: CivicEvent) => {
      setInternalSelected(ev);
      onSelectEvent?.(ev);
    },
    [onSelectEvent],
  );

  if (!hasMapsApiKey()) {
    return (
      <div
        className={cn("flex flex-col items-center justify-center rounded-2xl bg-ark-wheat/60 border border-ark-pine/10", className)}
        style={{ height }}
      >
        <MapPin className="h-10 w-10 text-ark-pine/40" />
        <p className="mt-2 text-sm text-ark-pine/70 px-6 text-center">
          Map preview requires <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY</code> in Netlify env.
        </p>
        <p className="text-xs text-ark-pine/50 mt-1">{mappable.length} events have coordinates when geocoding is enabled.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-red-50 text-red-700 text-sm", className)} style={{ height }}>
        Map failed to load — check API key restrictions.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={cn("animate-pulse rounded-2xl bg-ark-wheat/50", className)} style={{ height }} />;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-ark-pine/10 shadow-inner", className)}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={selected ? { lat: selected.latitude!, lng: selected.longitude! } : ARKANSAS_MAP_DEFAULT.center}
        zoom={selected ? 12 : ARKANSAS_MAP_DEFAULT.zoom}
        options={{
          styles: mapStyles,
          restriction: { latLngBounds: ARKANSAS_BOUNDS, strictBounds: false },
          mapTypeControl: false,
          streetViewControl: !compact,
          fullscreenControl: !compact,
        }}
        onClick={() => {
          setInternalSelected(null);
          onSelectEvent?.(null);
        }}
      >
        <MarkerClustererF>
          {(clusterer) => (
            <>
              {mappable.map((ev) => (
                <MarkerF
                  key={ev.id}
                  clusterer={clusterer}
                  position={{ lat: ev.latitude!, lng: ev.longitude! }}
                  title={ev.title}
                  onClick={() => onMarkerClick(ev)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: selected?.id === ev.id ? 11 : 8,
                    fillColor: CATEGORY_PIN[ev.category] ?? "#2D4A3E",
                    fillOpacity: 0.95,
                    strokeColor: "#FAF7F2",
                    strokeWeight: 2,
                  }}
                />
              ))}
            </>
          )}
        </MarkerClustererF>
      </GoogleMap>

      {selected && !compact && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10">
          <EventMapCard event={selected} onClose={() => { setInternalSelected(null); onSelectEvent?.(null); }} />
        </div>
      )}

      {mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-ark-pine/20 backdrop-blur-[1px]">
          <p className="rounded-xl bg-white/95 px-4 py-3 text-sm text-ark-pine shadow">
            No mapped events yet — submit one with an address to light up the map.
          </p>
        </div>
      )}

      {!compact && mappable.length > 0 && (
        <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-ark-pine shadow">
          {categoryLabel(mappable[0]?.category ?? "community")} · {mappable.length} pins
        </div>
      )}
    </div>
  );
}
