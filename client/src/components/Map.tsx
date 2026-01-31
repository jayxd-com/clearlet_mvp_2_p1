/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || "";

// Define a global callback for Google Maps
if (typeof window !== "undefined") {
  (window as any).initGoogleMaps = () => {};
}

function loadMapScript() {
  return new Promise((resolve, reject) => {
    // 1. Check if Maps is already fully loaded
    if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
      resolve(null);
      return;
    }

    // 2. Define/Hook into the callback
    const existingCallback = (window as any).initGoogleMaps;
    (window as any).initGoogleMaps = () => {
      if (existingCallback) existingCallback();
      resolve(null);
    };
    
    // 3. Check for existing script
    const existingScript = document.querySelector('script[src*="maps/api/js"]');
    if (existingScript) {
      // If script exists but maps isn't ready, the callback should eventually fire.
      // But if the callback already fired before we got here, we might hang.
      // So we also poll as a backup.
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.Map) {
           reject(new Error("Google Maps script loaded but google.maps.Map not found (timeout)"));
        }
      }, 10000);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("[MapView] No Google Maps API Key found in environment variables (VITE_GOOGLE_MAPS_API_KEY).");
    } else {
      console.log("[MapView] Loading Google Maps with API Key: " + GOOGLE_MAPS_API_KEY.substring(0, 5) + "...");
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

interface MapProps {
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  className?: string;
}

export function MapView({
  initialCenter = { lat: 40.4168, lng: -3.7038 }, // Madrid
  initialZoom = 13,
  onMapReady,
  className,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onMapReadyPersist = usePersistFn(onMapReady || (() => {}));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    loadMapScript().then(() => {
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
        });
        onMapReadyPersist(mapRef.current);
      }
    }).catch(err => {
      console.error("[MapView] Failed to load Google Maps:", err);
    });
  }, [initialCenter, initialZoom, onMapReadyPersist]);

  return (
    <div 
      ref={mapContainerRef} 
      className={cn("w-full h-full min-h-[300px] rounded-lg", className)} 
    />
  );
}
