import { useLocation, useRoute } from "wouter";
import { useState, useMemo } from "react";
import {
  MapPin,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Wifi,
  ParkingCircle,
  Utensils,
  Sofa,
  Wind,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  Check,
  X,
  Loader2,
  Bed,
  Bath,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PropertyGallery } from "@/components/PropertyGallery";
import { ViewingRequestForm } from "@/components/ViewingRequestForm";
import { toast } from "sonner";
import { getCurrencySymbol, formatCents } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ListingDetailPage() {
  const [matchTenant, paramsTenant] = useRoute("/tenant/listings/:id");
  const [matchPublic, paramsPublic] = useRoute("/property/:id");
  const match = matchTenant || matchPublic;
  const params = matchTenant ? paramsTenant : paramsPublic;
  
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const propertyId = params?.id ? parseInt(params.id) : null;

  // Fetch property data from database
  const { data: propertyData, isLoading } = trpc.properties.detail.useQuery(propertyId || 0, {
    enabled: !!propertyId && !!match,
    retry: 1,
  });

  // Get saved properties to check if this property is saved
  const { data: savedPropertiesData, refetch: refetchSaved } = trpc.properties.getSaved.useQuery(undefined, {
    enabled: isAuthenticated && !!propertyId,
  });

  // Check if property is saved
  const isSaved = useMemo(() => {
    if (!isAuthenticated || !savedPropertiesData || !propertyId) return false;
    return savedPropertiesData.some((sp: any) => sp.property?.id === propertyId);
  }, [isAuthenticated, savedPropertiesData, propertyId]);

  // Toggle saved mutation
  const toggleSavedMutation = trpc.properties.toggleSaved.useMutation({
    onSuccess: async (data) => {
      await refetchSaved();
      if (data.saved) {
        toast.success("Property saved!");
      } else {
        toast.success("Property removed from saved");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save property");
    },
  });

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Property not found</p>
          <button
            onClick={() => setLocation("/tenant/listings")}
            className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  // Helper to safely parse JSON that might be double encoded or malformed
  const safeParseArray = (input: any): string[] => {
    if (!input) return [];

    if (Array.isArray(input)) return input;

    if (typeof input === 'string') {
      try {
        let parsed = JSON.parse(input);

        // Handle double-encoded JSON (string inside string)
        if (typeof parsed === 'string') {
          try {
            const nested = JSON.parse(parsed);
            if (Array.isArray(nested)) {
              parsed = nested;
            }
          } catch {
            // It was just a string, keep parsed as is
          }
        }

        if (Array.isArray(parsed)) {
          return parsed;
        } else if (typeof parsed === 'string') {
          return [parsed];
        }
      } catch (e) {
        // If JSON parse fails, check if it looks like an array with single quotes
        const trimmed = input.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const fixed = trimmed.replace(/'/g, '"');
            const parsed = JSON.parse(fixed);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // Failed to fix quotes
          }
        }
        // If all else fails, treat as single item if not empty
        if (trimmed) return [trimmed];
      }
    }

    return [];
  };

  // Parse images from database
  const images = safeParseArray(propertyData.images);

  // Parse amenities from database
  const amenitiesArray = safeParseArray(propertyData.amenities);

  // Helper to format amenity name
  const formatAmenityName = (name: string) => {
    if (!name) return "";
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Map amenities to UI format
  const amenityIcons: { [key: string]: any } = {
    'WiFi': Wifi,
    'Wifi': Wifi,
    'Parking': ParkingCircle,
    'Kitchen': Utensils,
    'Living Room': Sofa,
    'AC': Wind,
    'Air Conditioning': Wind,
    'air_conditioning': Wind,
    'Electricity Included': Zap,
    'Electricity': Zap,
    'Balcony': Wind,
    'balcony': Wind,
    'Furnished': Sofa,
    'furnished': Sofa,
  };

  const amenities = amenitiesArray.map((name: string) => {
    const formattedName = formatAmenityName(name);
    return {
      name: formattedName,
      icon: amenityIcons[name] || amenityIcons[formattedName] || Wifi,
      available: true,
    };
  });

  // Get landlord/user information
  const landlord = propertyData.user || propertyData.landlord || {};
  const landlordName = landlord.name || landlord.email || "Landlord";
  const landlordEmail = landlord.email || "";
  const landlordPhone = landlord.phone || "";
  const landlordImage = landlord.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${landlordName}`;

  // Get landlord's property count (would need separate query, using placeholder for now)
  const landlordPropertiesCount = 0; // TODO: Could fetch this separately if needed

  // Calculate price from cents
  const rentPrice = propertyData.rentPrice ? Math.floor(propertyData.rentPrice / 100) : 0;
  const currency = propertyData.currency || "EUR";
  const currencySymbol = getCurrencySymbol(currency);

  // Format address
  const address = propertyData.address || `${propertyData.city || ""}, ${propertyData.country || ""}`.trim();

  // Transform property data to match UI structure
  const property = {
    id: propertyData.id,
    title: propertyData.title || "Untitled Property",
    price: rentPrice,
    location: `${propertyData.city || ""}, ${propertyData.country || ""}`.trim(),
    address: address,
    description: propertyData.description || "No description available.",
    images: images.length > 0 ? images : [],
    bedrooms: propertyData.bedrooms || 0,
    bathrooms: propertyData.bathrooms || 0,
    area: propertyData.squareFeet || 0,
    floor: null, // Not in database schema
    furnished: null, // Not in database schema
    petFriendly: propertyData.allowPets || false,
    moveInDate: null, // Not in database schema
    leaseLength: null, // Not in database schema
    amenities: amenities,
    landlord: {
      id: landlord.id || propertyData.userId || 0,
      name: landlordName,
      email: landlordEmail,
      phone: landlordPhone,
      image: landlordImage,
      verified: propertyData.verifiedLandlord || false,
      verificationScore: propertyData.verifiedLandlord ? 95 : 0,
      propertiesCount: landlordPropertiesCount,
      responseTime: "Usually responds within 24 hours",
    },
    requirements: [
      { label: "Monthly Income", value: `${formatCents((propertyData.rentPrice || 0) * 3, currency)}+`, met: true },
      { label: "Employment Contract", value: "Required", met: true },
      { label: "References", value: "Preferred", met: false },
      { label: "Deposit", value: formatCents((propertyData.rentPrice || 0) * 2, currency), met: true },
    ],
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to save properties");
      setLocation("/signin");
      return;
    }
    if (propertyId) {
      toggleSavedMutation.mutate(propertyId);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 backdrop-blur px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shadow-sm">
        {isAuthenticated ? (
          <button
            onClick={() => setLocation("/tenant/listings")}
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-cyan-400 dark:hover:text-cyan-400 transition-colors cursor-pointer font-medium"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        ) : (
          <div /> // Spacer to keep title centered
        )}
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Property Details</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavoriteClick}
            disabled={toggleSavedMutation.isPending}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSaved
                ? "bg-red-400/20 text-red-400 hover:bg-red-400/30"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard!");
            }}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Image Gallery */}
        <PropertyGallery images={property.images} propertyTitle={property.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">{property.title}</h1>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-4">
                <MapPin className="h-5 w-5 text-cyan-400" />
                <span>{property.address}</span>
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {formatCents(propertyData.rentPrice || 0, currency)}
                <span className="text-lg text-slate-600 dark:text-slate-400 font-normal">/month</span>
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Bedrooms", value: property.bedrooms },
                { label: "Bathrooms", value: property.bathrooms },
                { label: "Area", value: property.area > 0 ? `${property.area}m²` : "N/A" },
                { label: "Status", value: propertyData.status === "active" ? "Available" : propertyData.status || "N/A" },
              ].map((detail) => (
                <div key={detail.label} className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{detail.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{detail.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">About this property</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div
                      key={amenity.name}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                        amenity.available
                          ? "border-green-400/30 bg-green-400/10"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${amenity.available ? "text-green-400" : "text-slate-400 dark:text-slate-500"}`} />
                      <span className={amenity.available ? "text-green-400 font-medium" : "text-slate-600 dark:text-slate-400"}>{amenity.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Tenant Requirements</h2>
              <div className="space-y-3">
                {property.requirements.map((req) => (
                  <div
                    key={req.label}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{req.label}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{req.value}</p>
                    </div>
                    {req.met ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Landlord Card */}
            <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Landlord Information</h3>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={property.landlord.image}
                  alt={property.landlord.name}
                  className="w-12 h-12 rounded-full border-2 border-border"
                />
                <div className="flex-1">
                  <p className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    {property.landlord.name}
                    {property.landlord.verified && (
                      <Check className="h-4 w-4 text-green-400" />
                    )}
                  </p>
                  {property.landlord.propertiesCount > 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {property.landlord.propertiesCount} {property.landlord.propertiesCount === 1 ? 'property' : 'properties'}
                    </p>
                  ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                      Property Owner
                  </p>
                  )}
                </div>
              </div>

              {property.landlord.verified && (
                <div className="mb-4 p-3 rounded-lg bg-green-400/10 border-2 border-green-400/20">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-green-400">
                    {property.landlord.verificationScore}%
                  </span>{" "}
                    verified landlord
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {property.landlord.responseTime}
                </p>
              </div>
              )}

              <div className="space-y-2 mb-4">
                {property.landlord.phone && (
                <a
                  href={`tel:${property.landlord.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  {property.landlord.phone}
                </a>
                )}
                {property.landlord.email && (
                <a
                  href={`mailto:${property.landlord.email}`}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  {property.landlord.email}
                </a>
                )}
                {!property.landlord.phone && !property.landlord.email && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                    Contact information not available
                  </p>
                )}
              </div>

              {isAuthenticated && user && (
                <div className="space-y-3">
                  <ViewingRequestForm
                    propertyId={property.id}
                    propertyTitle={property.title}
                  />
                  <button
                    onClick={() => {
                      const landlordId = property.landlord.id;
                      if (landlordId) {
                        setLocation(`/tenant/messages?userId=${landlordId}&propertyId=${property.id}`);
                      } else {
                        toast.error("Landlord information not available");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-2 border-slate-200 dark:border-slate-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Landlord
                  </button>
                </div>
              )}
            </div>

            {/* Application Card */}
            <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Ready to apply?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {isAuthenticated ? "Your verified profile makes applying quick and easy." : "Sign in to your ClearLet account to start your application."}
              </p>
              {!isAuthenticated ? (
                <Button 
                  onClick={() => setLocation("/signin")}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-all shadow-md cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                >
                  Sign In to Apply
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    if (user?.verificationStatus !== 'verified') {
                      toast.error("You must verify your profile before applying.");
                      setLocation("/tenant/settings");
                      return;
                    }
                    setLocation(`/tenant/application/apply/${property.id}`);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg font-medium transition-all shadow-md cursor-pointer",
                    user?.verificationStatus === 'verified'
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                  )}
                >
                  {user?.verificationStatus === 'verified' ? "Apply Now" : "Verify Profile to Apply"}
                </Button>
              )}
            </div>

            <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Property Details</h3>
              <div className="space-y-3 text-sm">
                {property.moveInDate && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Available from</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(property.moveInDate).toLocaleDateString()}
                  </p>
                </div>
                )}
                {property.leaseLength && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Lease length</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{property.leaseLength}</p>
                </div>
                )}
                {property.furnished !== null && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Furnished</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {property.furnished ? "Yes" : "No"}
                  </p>
                </div>
                )}
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Pet friendly</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {property.petFriendly ? "Yes" : "No"}
                  </p>
                </div>
                {propertyData.zipCode && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">ZIP Code</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{propertyData.zipCode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
