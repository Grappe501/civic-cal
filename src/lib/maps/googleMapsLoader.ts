import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("marker" | "places")[] = ["marker"];

export function useGoogleMapsLoader() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  return useJsApiLoader({
    id: "civic-cal-maps",
    googleMapsApiKey: apiKey,
    libraries,
  });
}

export function hasMapsApiKey(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}
