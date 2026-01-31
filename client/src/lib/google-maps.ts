/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || "";

if (typeof window !== "undefined") {
  (window as any).initGoogleMaps = () => {};
}

export function loadMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Check if Maps is already fully loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // 2. Define/Hook into the callback
    const existingCallback = (window as any).initGoogleMaps;
    (window as any).initGoogleMaps = () => {
      if (existingCallback) existingCallback();
      resolve();
    };
    
    // 3. Check for existing script
    const existingScript = document.querySelector('script[src*="maps/api/js"]');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
           reject(new Error("Google Maps script loaded but libraries not found (timeout)"));
        }
      }, 10000);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("[GoogleMaps] No API Key found (VITE_GOOGLE_MAPS_API_KEY).");
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}
