import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { loadMapScript } from "@/lib/google-maps";

interface FilterControlsProps {
  searchFilters: {
    location: string;
    minPrice: number;
    maxPrice: number;
    bedrooms: number;
    minArea: number;
  };
  setSearchFilters: React.Dispatch<React.SetStateAction<{
    location: string;
    minPrice: number;
    maxPrice: number;
    bedrooms: number;
    minArea: number;
  }>>;
}

export function FilterControls({ searchFilters, setSearchFilters }: FilterControlsProps) {
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMapScript().then(() => {
      if (!locationInputRef.current || !window.google) return;

      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['(cities)'],
        fields: ['name', 'formatted_address', 'geometry'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.name) {
          setSearchFilters(prev => ({ ...prev, location: place.name || "" }));
        }
      });
    }).catch(err => console.error("Failed to load Google Maps for autocomplete", err));
  }, [setSearchFilters]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
          <input
            ref={locationInputRef}
            type="text"
            placeholder="City or area"
            value={searchFilters.location}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Min Price (€)</label>
          <input
            type="number"
            placeholder="Min"
            value={searchFilters.minPrice}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, minPrice: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Price (€)</label>
          <input
            type="number"
            placeholder="Max"
            value={searchFilters.maxPrice}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) || 15000 }))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bedrooms</label>
          <select
            value={searchFilters.bedrooms}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-cyan-400 focus:outline-none"
          >
            <option value="0">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </div>

        {/* Min Area */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Min Area (m²)</label>
          <input
            type="number"
            placeholder="Min area"
            value={searchFilters.minArea}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, minArea: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          onClick={() => setSearchFilters({ location: "", minPrice: 0, maxPrice: 15000, bedrooms: 0, minArea: 0 })}
          className="text-xs"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
