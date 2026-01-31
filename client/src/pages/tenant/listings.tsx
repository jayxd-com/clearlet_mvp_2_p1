import { useLocation } from "wouter";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin,
  Heart,
  Search,
  Filter,
  Grid,
  List,
  Bed,
  Bath,
  SlidersHorizontal,
  Map as MapIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PremiumPageHeader } from "@/components/premium/PremiumPageHeader";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/Map";

import { FilterControls } from "./FilterControls";
import { formatCents } from "@/lib/currency";

export default function ListingsPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState(() => {
    if (typeof window === "undefined") return {
      location: "",
      minPrice: 0,
      maxPrice: 15000,
      bedrooms: 0,
      minArea: 0,
    };
    
    const params = new URLSearchParams(window.location.search);
    return {
      location: params.get("city") || "",
      minPrice: Number(params.get("minPrice")) || 0,
      maxPrice: Number(params.get("maxPrice")) || 15000,
      bedrooms: Number(params.get("bedrooms")) || 0,
      minArea: Number(params.get("minArea")) || 0,
    };
  });

  // Fetch all active properties
  const { data: propertiesData, isLoading, error: propertiesError } = trpc.properties.getProperties.useQuery({
    city: searchFilters.location || undefined,
    maxPrice: searchFilters.maxPrice > 0 ? searchFilters.maxPrice : undefined,
    bedrooms: searchFilters.bedrooms > 0 ? searchFilters.bedrooms : undefined,
    minArea: searchFilters.minArea > 0 ? searchFilters.minArea : undefined,
  });

  const utils = trpc.useUtils();
  const { data: savedPropertiesData } = trpc.properties.getSaved.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [optimisticSavedIds, setOptimisticSavedIds] = useState<Set<number>>(new Set());

  const savedPropertyIds = useMemo(() => {
    const serverIds = new Set<number>();
    if (isAuthenticated && savedPropertiesData) {
      savedPropertiesData.forEach((sp: any) => {
        serverIds.add(sp.property.id);
      });
    }
    return new Set([...serverIds, ...optimisticSavedIds]);
  }, [isAuthenticated, savedPropertiesData, optimisticSavedIds]);

  const toggleSavedMutation = trpc.properties.toggleSaved.useMutation({
    onMutate: async (propertyId) => {
      await utils.properties.getSaved.cancel();
      const previousSaved = utils.properties.getSaved.getData();
      setOptimisticSavedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(propertyId)) newSet.delete(propertyId);
        else newSet.add(propertyId);
        return newSet;
      });
      return { previousSaved };
    },
    onSuccess: async (data) => {
      await utils.properties.getSaved.invalidate();
      toast.success(data.saved ? "Property saved!" : "Property removed from saved");
      setOptimisticSavedIds(new Set());
    },
    onError: (error, propertyId, context) => {
      if (context?.previousSaved) utils.properties.getSaved.setData(undefined, context.previousSaved);
      setOptimisticSavedIds(new Set());
      toast.error(error.message || "Failed to save property");
    },
  });

  const properties = useMemo(() => {
    if (!propertiesData) return [];
    return propertiesData.map((prop: any) => {
      let images: string[] = [];
      if (prop.images) {
        if (typeof prop.images === 'string') {
          try { images = JSON.parse(prop.images); } catch { if (prop.images.trim()) images = [prop.images]; }
        } else if (Array.isArray(prop.images)) {
          images = prop.images;
        }
      }

      return {
        id: prop.id,
        title: prop.title || "Untitled Property",
        price: prop.rentPrice || 0,
        currency: prop.currency || "EUR",
        location: `${prop.city || ""}, ${prop.country || ""}`.trim() || "Location not specified",
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0,
        area: prop.squareFeet || 0,
        image: images.length > 0 ? images[0] : null,
        landlord: prop.user?.name || prop.landlord?.name || prop.user?.email || "Landlord",
        verified: prop.verifiedLandlord || false,
        applicationsOpen: prop.status === "active",
        latitude: Number(prop.latitude),
        longitude: Number(prop.longitude),
      };
    });
  }, [propertiesData]);

  // Update map markers when properties change
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (properties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    properties.forEach((property: any) => {
      if (property.latitude && property.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: property.latitude, lng: property.longitude },
          map: mapInstance,
          title: property.title,
          label: {
            text: formatCents(property.price, property.currency),
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
            className: "bg-slate-900 px-2 py-1 rounded-lg"
          },
        });

        // Add click listener
        marker.addListener("click", () => {
          // Scroll property into view or highlight it
          const element = document.getElementById(`property-card-${property.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-cyan-400');
            setTimeout(() => element.classList.remove('ring-4', 'ring-cyan-400'), 2000);
          }
          if (mobileView === "map") {
             setLocation(isAuthenticated ? `/tenant/listings/${property.id}` : `/property/${property.id}`);
          }
        });

        markersRef.current.push(marker);
        bounds.extend({ lat: property.latitude, lng: property.longitude });
        hasValidCoords = true;
      }
    });

    if (hasValidCoords && mapInstance) {
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, properties, mobileView]);

  const handleFavoriteClick = (propertyId: number) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to save properties");
      setLocation("/signin");
      return;
    }
    toggleSavedMutation.mutate(propertyId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      
      {/* Page Header (Mobile & Desktop shared) */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-0">
        <PremiumPageHeader
          title="Find Your Home"
          subtitle={isLoading ? "Loading properties..." : `${properties.length} properties available`}
          icon={Search}
        />

        {/* Mobile Controls (Visible on small screens) */}
        <div className="lg:hidden flex flex-col gap-4 mb-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-end">
            <button
              onClick={() => setMobileView("list")}
              className={cn(
                "p-2 rounded-md transition-all",
                mobileView === "list" ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500"
              )}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileView("map")}
              className={cn(
                "p-2 rounded-md transition-all",
                mobileView === "map" ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500"
              )}
            >
              <MapIcon className="h-5 w-5" />
            </button>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-12 border-2 rounded-xl">
                <SlidersHorizontal className="h-4 w-4" />
                Filters & Search
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto rounded-t-3xl">
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterControls searchFilters={searchFilters} setSearchFilters={setSearchFilters} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Header Content (Filters & Toggle) */}
        <div className="hidden lg:block mb-8">
              <PremiumCard title="Filters" className="mb-6" contentClassName="p-4">
                <FilterControls searchFilters={searchFilters} setSearchFilters={setSearchFilters} />
              </PremiumCard>

          <div className="flex items-center justify-between mb-6 px-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {properties.length} properties
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-lg transition-colors border-2", viewMode === "grid" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300")}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-lg transition-colors border-2", viewMode === "list" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300")}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Mobile Map View */}
        {mobileView === "map" && (
          <div className="lg:hidden h-[60vh] rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 mb-6">
            <MapView 
              onMapReady={setMapInstance} 
              className="w-full h-full"
              initialZoom={12}
            />
          </div>
        )}

        {/* Error Display */}
        {propertiesError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Properties</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">{propertiesError.message || "Failed to fetch properties."}</p>
                <Button onClick={() => window.location.reload()} variant="destructive" size="sm">Retry</Button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Layout */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading properties...</p>
          </div>
        ) : properties.length > 0 ? (
          <div className={cn(
            "w-full",
            viewMode === "list" ? "flex flex-col lg:flex-row gap-8" : ""
          )}>
            {/* Map Column (Inside container, Left side in List View) */}
            {viewMode === "list" && (
              <div className="hidden lg:block lg:w-1/2 h-[600px] sticky top-24 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                <MapView 
                  onMapReady={setMapInstance} 
                  className="w-full h-full"
                  initialZoom={12}
                />
              </div>
            )}

            {/* List Column */}
            <div className={cn(
              "w-full",
              viewMode === "list" ? "lg:w-1/2" : "",
              mobileView === "map" ? "hidden lg:block" : "block"
            )}>
              <div className={cn(
                "grid gap-6",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {properties.map((property: any) => (
                  <div
                    key={property.id}
                    id={`property-card-${property.id}`}
                    className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl transition-all cursor-pointer flex flex-col scroll-mt-24"
                    onClick={() => setLocation(isAuthenticated ? `/tenant/listings/${property.id}` : `/property/${property.id}`)}
                  >
                    <div className="relative overflow-hidden bg-accent aspect-video">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                          <MapPin className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-md z-10">
                        <span className="text-cyan-400 font-bold text-sm">{formatCents(property.price, property.currency)}/mo</span>
                      </div>
                      {isAuthenticated && user && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFavoriteClick(property.id);
                          }}
                          className="absolute top-3 left-3 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full hover:bg-red-400/20 transition-colors shadow-md z-10"
                        >
                          <Heart className={cn("h-5 w-5 transition-colors", savedPropertyIds.has(property.id) ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-400 hover:text-red-500')} />
                        </button>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-auto">
                        <div className="flex items-center gap-1"><Bed className="h-4 w-4" /> <span>{property.bedrooms} bed</span></div>
                        <div className="flex items-center gap-1"><Bath className="h-4 w-4" /> <span>{property.bathrooms} bath</span></div>
                        {property.area > 0 && <span>{property.area} m²</span>}
                      </div>
                      
                      {property.applicationsOpen && (
                        <div className="mt-3 inline-block self-start rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-500">Available</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl border-dashed">
            <Search className="h-16 w-16 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No properties match your filters</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">Try adjusting your search criteria to find what you're looking for.</p>
            <Button onClick={() => setSearchFilters({ location: "", minPrice: 0, maxPrice: 15000, bedrooms: 0, minArea: 0 })}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}