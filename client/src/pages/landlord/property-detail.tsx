import { useLocation, useRoute } from "wouter";
import { useState, useMemo } from "react";
import {
  Loader2,
  MapPin,
  Bed,
  Bath,
  Home,
  Edit,
  Trash2,
  Calendar,
  ChevronLeft,
  Users,
  Square,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Share2,
  AlertTriangle,
  Star,
  Plus,
  Info,
  Sparkles
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PropertyGallery } from "@/components/PropertyGallery";
import { ViewingAvailabilityCalendar } from "@/components/ViewingAvailabilityCalendar";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PremiumCard,
  PremiumButton,
  PremiumStatCard,
  PropertyStatusBadge
} from "@/components/premium";
import {
  AlertDialog,  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LandlordPropertyDetailPage() {
  const [, params] = useRoute("/landlord/properties/:id");
  const propertyId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: propertyData, isLoading, refetch } = trpc.properties.detail.useQuery(propertyId || 0, {
    enabled: !!propertyId && isAuthenticated,
  });

  const { data: applicationsData } = trpc.landlord.getRecentApplications.useQuery(undefined, {
    enabled: !!propertyId && isAuthenticated,
  });

  const { data: propertyStats } = trpc.viewing.getPropertyStats.useQuery(
    { propertyId: propertyId || 0 },
    { enabled: !!propertyId && isAuthenticated }
  );

  const deleteProperty = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Property deleted successfully");
      setLocation("/landlord/properties");
    }
  });

  const toggleStatus = trpc.properties.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success("Property status updated");
      refetch();
    },
  });

  // Filter applications for this property
  const propertyApplications = useMemo(() => {
    if (!applicationsData || !propertyId) return [];
    return applicationsData.filter((item: any) => item.property.id === propertyId);
  }, [applicationsData, propertyId]);

  const pendingApps = useMemo(() =>
    propertyApplications.filter((item: any) => item.application.status === "pending"),
  [propertyApplications]);

  // Helper to safely parse JSON
  const safeParseArray = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        let parsed = JSON.parse(input);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const images = useMemo(() => safeParseArray(propertyData?.images), [propertyData]);
  const amenitiesArray = useMemo(() => safeParseArray(propertyData?.amenities), [propertyData]);

  const amenities = amenitiesArray.map((name: string) => {
    const formattedName = name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return {
      name: formattedName,
      icon: CheckCircle,
    };
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!propertyData) return <div className="p-8 text-center text-red-500 font-bold">Property not found</div>;

  const rentPrice = propertyData.rentPrice ? Math.floor(propertyData.rentPrice / 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-8 py-6 sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-white/90 dark:bg-slate-800/90">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setLocation("/landlord/properties")}
            className="flex items-center gap-2 text-slate-500 hover:text-cyan-500 transition-colors group mb-4 font-bold uppercase text-[10px] tracking-widest"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {propertyData.title}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="h-4 w-4 text-cyan-500" />
                {propertyData.address}, {propertyData.city}, {propertyData.country}
              </div>
              <div className="flex gap-2">
                <PropertyStatusBadge status={propertyData.status} />
                {propertyData.verifiedLandlord && (
                    <PropertyStatusBadge status="verified" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className={cn(
                  "border-2 border-slate-200 dark:border-slate-700 font-bold rounded-xl h-11 px-6 bg-white dark:bg-slate-800 transition-colors",
                  user?.verificationStatus === 'verified' 
                    ? "hover:bg-slate-50 dark:hover:bg-slate-700" 
                    : "opacity-50 cursor-not-allowed" // Visually disabled but clickable for toast
                )}
                onClick={() => {
                  if (user?.verificationStatus !== 'verified') {
                    toast.error("You must verify your profile to activate listings.");
                    return;
                  }
                  toggleStatus.mutate({
                    id: propertyData.id,
                    status: propertyData.status === 'active' ? 'inactive' : 'active'
                  });
                }}
                disabled={toggleStatus.isPending || propertyData.status === 'pending_verification'}
                title={user?.verificationStatus !== 'verified' ? "Complete profile verification to activate" : ""}
              >
                {propertyData.status === "active" ? (
                  <><EyeOff className="h-4 w-4 mr-2" /> Deactivate</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" /> Activate</>
                )}
              </Button>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-cyan-500/20"
                onClick={() => setLocation(`/landlord/edit-property/${propertyData.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Property
              </Button>
              <Button
                variant="ghost"
                className="w-11 h-11 p-0 bg-red-400/10 text-red-500 hover:bg-red-400/20 hover:text-red-600 rounded-xl"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl bg-white dark:bg-slate-800 py-0 gap-0">
              <PropertyGallery images={images} propertyTitle={propertyData.title} />
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Bedrooms", value: propertyData.bedrooms, icon: Bed },
                { label: "Bathrooms", value: propertyData.bathrooms, icon: Bath },
                { label: "Area", value: propertyData.squareFeet ? `${propertyData.squareFeet} m²` : "N/A", icon: Square },
                { label: "Property Type", value: "Apartment", icon: Home },
              ].map((detail, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center transition-all hover:border-cyan-400 group shadow-sm">
                  <detail.icon className="h-4 w-4 text-cyan-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{detail.label}</p>
                  <p className="font-bold text-slate-900 dark:text-white">{detail.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <PremiumCard title="About Property" icon={Info}>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">
                {propertyData.description || "No description provided."}
              </p>
            </PremiumCard>

            {/* Amenities */}
            <PremiumCard title="Amenities" icon={Sparkles}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {amenities.length > 0 ? amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 transition-all hover:border-cyan-400/50">
                    <amenity.icon className="h-3 w-3 md:h-5 md:w-5 text-cyan-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs md:text-sm">{amenity.name}</span>
                  </div>
                )) : (
                  <p className="text-slate-500 col-span-full">No amenities listed.</p>
                )}
              </div>
            </PremiumCard>

            {/* Location & Map */}
            <PremiumCard title="Location" icon={MapPin} contentClassName="p-0">
              <div className="p-6 border-b-2 border-slate-100 dark:border-slate-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <MapPin className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{propertyData.address}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{propertyData.city}, {propertyData.country} {propertyData.zipCode}</p>
                  </div>
                </div>
              </div>
              <div className="h-[400px] w-full relative">
                <MapView
                  initialCenter={{
                    lat: Number(propertyData.latitude) || 40.4168,
                    lng: Number(propertyData.longitude) || -3.7038
                  }}
                  initialZoom={15}
                  className="h-full w-full"
                  onMapReady={(map) => {
                    if (propertyData.latitude && propertyData.longitude) {
                      new window.google!.maps.marker.AdvancedMarkerElement({
                        map,
                        position: {
                          lat: Number(propertyData.latitude),
                          lng: Number(propertyData.longitude)
                        },
                        title: propertyData.title,
                      });
                    }
                  }}
                />
              </div>
            </PremiumCard>

            {/* Tenant Feedback Section */}
            {propertyStats?.feedback && propertyStats.feedback.length > 0 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 py-0 overflow-hidden gap-0 shadow-sm">
                <CardHeader className="border-b-2 border-slate-50 dark:border-slate-700/50 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tenant Feedback</CardTitle>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-black text-sm">{propertyStats.averageRating}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
                    {propertyStats.feedback.slice(0, 3).map((f: any) => (
                      <div key={f.id} className="p-6 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn("h-3 w-3", s <= f.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200 dark:text-slate-700")} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(f.date), "MMM d, yyyy")}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">"{f.comment || "No comment provided."}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-8">
            {/* Viewing Calendar */}
            <PremiumCard
              title="Viewing Availability"
              icon={Calendar}
              cta={
                <button
                  onClick={() => (window as any).openAddAvailability?.()}
                  className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add New
                </button>
              }
            >
              <ViewingAvailabilityCalendar
                propertyId={propertyData.id}
                propertyTitle={propertyData.title}
              />
            </PremiumCard>

            {/* Recent Leads */}
            <PremiumCard
              title="Recent Leads"
              icon={Users}
              cta={
                <button
                  onClick={() => setLocation("/landlord/applications")}
                  className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-600 transition-colors"
                >
                  View All
                </button>
              }
            >
              <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
                {propertyApplications.length > 0 ? propertyApplications.slice(0, 5).map((item: any) => (
                  <div
                    key={item.application.id}
                    className="p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    onClick={() => setLocation(`/landlord/applications/${item.application.id}`)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">{item.tenant.name}</p>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest border-none px-2 py-1 rounded-lg",
                        item.application.status === 'accepted' || item.application.status === 'approved'
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : item.application.status === 'pending'
                          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        {item.application.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.application.createdAt).toLocaleDateString()}</span>
                      {item.application.moveInDate && <span className="flex items-center gap-1"><Home className="h-3 w-3" /> {new Date(item.application.moveInDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center">
                    <Users className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No applications yet</p>
                  </div>
                )}
              </div>
            </PremiumCard>

            {/* Quick Actions */}
            <PremiumCard title="Quick Actions" icon={Edit}>
              <div className="space-y-3">
                <PremiumButton
                  variant="outline"
                  className="w-full justify-start h-12 rounded-xl"
                  onClick={() => setLocation(`/landlord/edit-property/${propertyData.id}`)}
                >
                  <Edit className="h-4 w-4 mr-3 text-cyan-500" /> Edit Property
                </PremiumButton>
                <PremiumButton
                  variant="outline"
                  className="w-full justify-start h-12 rounded-xl"
                  onClick={() => setLocation("/landlord/applications")}
                >
                  <Users className="h-4 w-4 mr-3 text-blue-500" /> View Applications
                </PremiumButton>
                <PremiumButton
                  variant="outline"
                  className="w-full justify-start h-12 rounded-xl"
                  onClick={() => {
                    const url = window.location.href.replace('/landlord/properties/', '/property/');
                    navigator.clipboard.writeText(url);
                    toast.success("Public listing link copied!");
                  }}
                >
                  <Share2 className="h-4 w-4 mr-3 text-purple-500" /> Share Listing
                </PremiumButton>
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Delete Property?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
              Are you sure you want to delete "{propertyData.title}"? This action will permanently remove the listing and all associated applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="border-2 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl px-8"
              onClick={() => deleteProperty.mutate(propertyData.id)}
              disabled={deleteProperty.isPending}
            >
              {deleteProperty.isPending ? "Deleting..." : "Delete Property"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
