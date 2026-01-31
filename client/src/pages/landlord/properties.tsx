import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { MapPin, Bed, Bath, Eye, Users, Edit, Trash2, Plus, Search, Loader2, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PremiumPageHeader, PremiumPageContainer, PremiumInput, PremiumPropertyCard } from "@/components/premium";

export default function LandlordPropertiesPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: propertiesData, isLoading, refetch } = trpc.properties.myListings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: applicationsData } = trpc.landlord.getRecentApplications.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteProperty = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Property deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete property: ${error.message || "Unknown error"}`);
    },
  });

  const filteredProperties = useMemo(() => {
    if (!propertiesData) return [];
    return propertiesData.filter((p: any) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || p.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [propertiesData, searchQuery, filterStatus]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader
        title="Your Properties"
        subtitle={`${filteredProperties.length} listings found`}
        icon={Home}
        action={{
          label: "New Property",
          onClick: () => setLocation("/landlord/create-listing"),
          icon: Plus
        }}
      />

      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <PremiumInput
              placeholder="Search properties by title or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
            {["all", "active", "inactive", "rented", "pending_verification"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 h-11 rounded-xl font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property: any) => {
              // Approximate application count for this property
              const appCount = applicationsData?.filter((item: any) => item.property.id === property.id).length;
              
              return (
                <PremiumPropertyCard 
                  key={property.id} 
                  property={property} 
                  onDelete={(id) => deleteProperty.mutate(id)}
                  isDeleting={deleteProperty.isPending}
                  applicationCount={appCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
            <Home className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-700 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No properties found</h3>
            <p className="text-slate-500 font-medium mb-8">Try adjusting your filters or search query.</p>
            <Button
              onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
              variant="outline"
              className="border-2 font-bold px-8 h-12 rounded-xl"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </PremiumPageContainer>
  );
}