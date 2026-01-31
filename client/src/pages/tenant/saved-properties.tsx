import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, Bed, Bath, Home as HomeIcon, Heart, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function SavedPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const { data: savedProperties, isLoading, error, refetch } = trpc.properties.getSaved.useQuery(undefined, {
    enabled: !!user,
  });

  const toggleSavedMutation = trpc.properties.toggleSaved.useMutation({
    onSuccess: () => {
      toast.success("Property removed from saved");
      refetch();
    },
  });

  // Debug logging
  console.log("[Saved Properties] User:", user);
  console.log("[Saved Properties] User ID:", user?.id);
  console.log("[Saved Properties] Data:", savedProperties);
  console.log("[Saved Properties] Length:", savedProperties?.length);
  console.log("[Saved Properties] Is Loading:", isLoading);
  console.log("[Saved Properties] Error:", error);
  
  // Log the structure of saved properties if they exist
  if (savedProperties && savedProperties.length > 0) {
    console.log("[Saved Properties] First item structure:", savedProperties[0]);
    console.log("[Saved Properties] First property:", savedProperties[0]?.property);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600 dark:text-slate-400" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/signin"; // Updated path
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Heart className="h-10 w-10" />
                Saved Properties
              </h1>
              <p className="text-lg text-purple-100">
                Your favorite properties saved for later
              </p>
            </div>
            {selectedForCompare.length >= 2 && (
              <Button 
                onClick={() => {
                  if (selectedForCompare.length > 3) {
                    toast.error("You can only compare up to 3 properties");
                    return;
                  }
                  setLocation(`/tenant/compare?ids=${selectedForCompare.join(',')}`);
                }}
                className="bg-white dark:bg-slate-100 hover:bg-slate-100 dark:hover:bg-slate-200 text-slate-900 font-medium shadow-lg"
              >
                <ArrowRightLeft className="h-5 w-5 mr-2" />
                Compare ({selectedForCompare.length})
              </Button>
            )}
          </div>
        </div>

        {!savedProperties || savedProperties.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-lg">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No Saved Properties</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium mb-6">
              Start saving properties you like to view them here later
            </p>
            <Button
              onClick={() => setLocation("/tenant/listings")} // Updated path
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium"
            >
              Browse Properties
            </Button>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map(({ property, savedAt }: any) => {
                // Parse images - handle both JSON string and array formats
                let images: string[] = [];
                if (property.images) {
                  if (typeof property.images === 'string') {
                    try {
                      images = JSON.parse(property.images);
                    } catch {
                      if (property.images.trim()) {
                        images = [property.images];
                      }
                    }
                  } else if (Array.isArray(property.images)) {
                    images = property.images;
                  }
                }
                const firstImage = images.length > 0 ? images[0] : null;
                const price = property.rentPrice ? Math.floor(property.rentPrice / 100) : 0;

                return (
                  <div
                    key={property.id}
                    className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setLocation(`/property/${property.id}`)}
                  >
                    {/* Property Image */}
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HomeIcon className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-md">
                        <span className="text-cyan-400 font-semibold text-sm">
                          €{price.toLocaleString()}/mo
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSavedMutation.mutate(property.id);
                        }}
                        className="absolute bottom-3 left-3 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full hover:bg-red-500/20 transition-colors shadow-md"
                        disabled={toggleSavedMutation.isPending}
                      >
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                      </button>
                    </div>

                    {/* Property Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                        {property.title || "Untitled Property"}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{property.city || ""}, {property.country || ""}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms || 0} bed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms || 0} bath</span>
                        </div>
                        {property.squareFeet && property.squareFeet > 0 && (
                          <span>{property.squareFeet} sqft</span>
                        )}
                      </div>

                      {property.status === "active" && (
                        <div className="mt-3 inline-block rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400">
                          Available
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Saved {new Date(savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
