// Lightweight singleton loader for the Google Maps JavaScript API.
// Injects the <script> tag once and resolves when window.google.maps is ready.
// No npm dependency — matches the project's existing pattern of loading external
// scripts/styles directly.

export const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

export const DEFAULT_CENTER = {
  lat: Number(process.env.REACT_APP_MAP_DEFAULT_LAT) || 28.0339, // Algeria
  lng: Number(process.env.REACT_APP_MAP_DEFAULT_LNG) || 1.6596,
};

export const DEFAULT_ZOOM = Number(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 6;

/** True when a Google Maps API key is configured. */
export const mapsConfigured = () => MAPS_API_KEY.trim().length > 0;

/** Builds a "directions/search on Google Maps" URL that needs no API key. */
export const googleMapsLink = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

let loadPromise = null;

/**
 * Loads the Google Maps JS API exactly once.
 * @returns {Promise<typeof window.google.maps>} resolves with the maps namespace.
 */
export function loadGoogleMaps() {
  if (typeof window !== "undefined" && window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!mapsConfigured()) {
    return Promise.reject(
      new Error("لم يتم ضبط مفتاح خرائط غوغل. أضف REACT_APP_GOOGLE_MAPS_API_KEY في ملف .env")
    );
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", () => {
        loadPromise = null;
        reject(new Error("تعذّر تحميل خرائط غوغل"));
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_API_KEY)}` +
      `&libraries=marker&language=ar&region=DZ`;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("تعذّر تحميل خرائط غوغل"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
