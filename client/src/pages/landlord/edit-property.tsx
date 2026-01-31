import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect, useRef } from "react";
import { 
  Loader2, 
  Upload, 
  X, 
  MapPin, 
  Home, 
  Check, 
  ArrowLeft, 
  Bed, 
  Bath, 
  Sparkles,
  Info,
  Euro,
  Navigation
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Use Premium Components
import { 
  PremiumCard, 
  PremiumInput, 
  PremiumLabel, 
  PremiumTextarea, 
  PremiumButton,
  PremiumProgressSteps,
  PremiumPageHeader,
  PremiumPageContainer
} from "@/components/premium";

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";

type FormStep = "details" | "images" | "amenities" | "review";

const AMENITIES_OPTIONS = [
  "WiFi", "Parking", "Air Conditioning", "Heating", "Washer", "Dryer", "Dishwasher",
  "Kitchen", "Balcony", "Garden", "Gym", "Pool", "Pet Friendly", "Elevator", "Security",
];

export default function EditPropertyPage() {
  const { t } = useLanguage();
  const [, params] = useRoute("/landlord/edit-property/:id");
  const propertyId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<FormStep>("details");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { data: property, isLoading: propertyLoading } = trpc.properties.detail.useQuery(
    propertyId!,
    { enabled: !!propertyId }
  );

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 0,
    rentPrice: 0,
    currency: "EUR",
    amenities: [],
    checklistTemplateId: undefined,
  });

  const { data: checklistTemplates } = trpc.checklist.getTemplates.useQuery();

  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    // Extract address components
    let streetNumber = "";
    let route = "";
    let city = "";
    let zipCode = "";
    let country = "";

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) streetNumber = component.long_name;
      if (types.includes("route")) route = component.long_name;
      if (types.includes("locality")) city = component.long_name;
      if (types.includes("postal_code")) zipCode = component.long_name;
      if (types.includes("country")) country = component.long_name;
    });

    if (!city) {
      place.address_components?.forEach((component) => {
         if (component.types.includes("administrative_area_level_2")) city = component.long_name;
      });
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setCoordinates({ lat, lng });
    
    setFormData((prev: any) => ({
      ...prev,
      address: `${route} ${streetNumber}`.trim() || place.formatted_address?.split(",")[0] || "",
      city: city,
      zipCode: zipCode,
      country: country || prev.country,
    }));

    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(17);
      
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = new window.google!.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat, lng },
        title: place.name || "Property Location",
      });
    }
  };

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        description: property.description || "",
        address: property.address || "",
        city: property.city || "",
        country: property.country || "",
        zipCode: property.zipCode || "",
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        squareFeet: property.squareFeet || 0,
        rentPrice: property.rentPrice ? Math.floor(property.rentPrice / 100) : 0,
        currency: property.currency || "EUR",
        amenities: Array.isArray(property.amenities) ? property.amenities : 
                   typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : [],
        checklistTemplateId: property.checklistTemplateId,
      });

      if (Array.isArray(property.images)) {
        setImagePreviews(property.images);
      } else if (typeof property.images === 'string') {
        setImagePreviews(JSON.parse(property.images));
      }

      if (property.latitude && property.longitude) {
        setCoordinates({
          lat: parseFloat(property.latitude.toString()),
          lng: parseFloat(property.longitude.toString()),
        });
      }
    }
  }, [property]);

  const updatePropertyMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Property updated successfully!");
      setLocation("/landlord/properties");
    },
    onError: (err) => toast.error(err.message || "Failed to update"),
  });

  const uploadImageMutation = trpc.uploads.uploadImage.useMutation();

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: ["bedrooms", "bathrooms", "squareFeet", "rentPrice"].includes(name)
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev: any) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a: string) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") {
      if (!formData.title || !formData.address || !formData.city || !formData.rentPrice) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (formData.rentPrice <= 0) {
        toast.error("Rent must be greater than 0");
        return;
      }
      return setStep("images");
    }
    if (step === "images") return setStep("amenities");
    if (step === "amenities") return setStep("review");

    setUploading(true);
    try {
      // Filter existing URLs
      const existingImages = imagePreviews.filter(url => typeof url === 'string' && url.startsWith('http'));
      const uploadedImageUrls = [...existingImages];
      
      for (const file of images) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const res = await uploadImageMutation.mutateAsync({
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
        });
        if (res.url) uploadedImageUrls.push(res.url);
      }

      await updatePropertyMutation.mutateAsync({
        id: propertyId!,
        data: {
          ...formData,
          rentPrice: formData.rentPrice * 100,
          images: uploadedImageUrls,
          latitude: coordinates?.lat.toString(),
          longitude: coordinates?.lng.toString(),
        }
      });
    } catch (error) {
      toast.error("Failed to update listing");
    } finally {
      setUploading(false);
    }
  };

  if (propertyLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
    </div>
  );

  const steps = ["details", "images", "amenities", "review"] as const;
  const currentIdx = steps.indexOf(step);

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader 
        title="Edit Property"
        subtitle="Update your listing details"
        icon={Home}
        action={{
          label: "Back to Properties",
          onClick: () => setLocation("/landlord/properties"),
          icon: ArrowLeft
        }}
      />

      <PremiumProgressSteps 
        steps={steps} 
        currentIdx={currentIdx} 
        className="mb-12"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: DETAILS */}
        {step === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PremiumCard title="Basic Information" icon={Info}>
                <div className="space-y-6">
                  <div>
                    <PremiumLabel required>Property Title</PremiumLabel>
                    <PremiumInput 
                      name="title" 
                      value={formData.title} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div>
                    <PremiumLabel>Description</PremiumLabel>
                    <PremiumTextarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      rows={6} 
                    />
                  </div>
                  <div className="space-y-6">
                    <div>
                      <PremiumLabel required>Address</PremiumLabel>
                      <PremiumInput 
                        ref={addressInputRef}
                        name="address" 
                        icon={MapPin}
                        iconClassName="text-cyan-500"
                        value={formData.address} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <PremiumLabel required>City</PremiumLabel>
                        <PremiumInput 
                          name="city" 
                          value={formData.city} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div>
                        <PremiumLabel required>Zip Code</PremiumLabel>
                        <PremiumInput 
                          name="zipCode" 
                          value={formData.zipCode} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div>
                        <PremiumLabel required>Country</PremiumLabel>
                        <PremiumInput 
                          name="country" 
                          value={formData.country} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              <PremiumCard title="Pin Location" icon={Navigation}>
                <div className="h-[400px] border-2 border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden relative shadow-inner">
                  <MapView 
                    initialCenter={coordinates || undefined} 
                    onMapReady={(map) => {
                      mapRef.current = map;
                      
                      // Initialize Autocomplete
                      if (addressInputRef.current && window.google) {
                        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
                          types: ["address"],
                          fields: ["address_components", "geometry", "formatted_address", "name"],
                        });
                        
                        autocomplete.addListener("place_changed", () => {
                          const place = autocomplete.getPlace();
                          handleAddressSelect(place);
                        });
                      }

                      // Add initial marker if coordinates exist
                      if (coordinates && window.google) {
                         new window.google.maps.marker.AdvancedMarkerElement({
                            map,
                            position: coordinates,
                            title: formData.title,
                         });
                      }
                      
                      map.addListener('click', (e: any) => {
                        if (e.latLng) {
                          const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                          setCoordinates(coords);
                          
                          if (markerRef.current) markerRef.current.map = null;
                          markerRef.current = new window.google!.maps.marker.AdvancedMarkerElement({
                            map,
                            position: coords,
                            title: formData.title || 'Property Location',
                          });
                        }
                      });
                    }} 
                  />
                </div>
              </PremiumCard>
            </div>

            <div className="space-y-8">
              <PremiumCard title="Key Features" icon={Sparkles}>
                <div className="space-y-6">
                  <div>
                    <PremiumLabel>Bedrooms</PremiumLabel>
                    <PremiumInput 
                      type="number" 
                      name="bedrooms" 
                      icon={Bed}
                      value={formData.bedrooms} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <PremiumLabel>Bathrooms</PremiumLabel>
                    <PremiumInput 
                      type="number" 
                      name="bathrooms" 
                      icon={Bath}
                      value={formData.bathrooms} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <PremiumLabel>Monthly Rent</PremiumLabel>
                    <div className="flex gap-2">
                      <div className="w-24">
                        <Select 
                          value={formData.currency} 
                          onValueChange={(val) => setFormData({...formData, currency: val})}
                        >
                          <SelectTrigger className="h-14 border-2 rounded-xl font-bold">
                            <SelectValue placeholder="EUR" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <PremiumInput 
                          type="number" 
                          name="rentPrice" 
                          value={formData.rentPrice} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              <PremiumButton type="submit" className="w-full">
                Continue to Images
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 2: IMAGES */}
        {step === "images" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard title="Property Gallery" headerClassName="text-center">
              <div className="space-y-8">
                <div 
                  className="border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-16 text-center hover:border-cyan-400 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 group" 
                  onClick={() => document.getElementById('img-input')?.click()}
                >
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-cyan-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Upload Photos</p>
                  <input id="img-input" type="file" multiple className="hidden" onChange={handleImageChange} accept="image/*" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {imagePreviews.map((p, i) => (
                    <div key={i} className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 relative group shadow-md">
                      <img src={p} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button"
                          className="bg-red-500 text-white rounded-xl p-3 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform" 
                          onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PremiumCard>

            <div className="flex gap-4">
              <PremiumButton variant="outline" onClick={() => setStep("details")} className="flex-1 h-16">
                Back
              </PremiumButton>
              <PremiumButton type="submit" className="flex-[2] h-16">
                Continue to Amenities
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 3: AMENITIES */}
        {step === "amenities" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard title="Amenities">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES_OPTIONS.map(a => (
                  <button 
                    key={a} 
                    type="button" 
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "h-14 rounded-2xl border-2 font-black text-[11px] uppercase tracking-widest transition-all",
                      formData.amenities.includes(a) 
                        ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]" 
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-cyan-400/50"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </PremiumCard>

            <PremiumCard 
              title="Move-In Checklist" 
              description="Select a checklist template for future tenants to complete upon move-in."
              icon={Check}
            >
              <div className="space-y-4">
                {checklistTemplates && checklistTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, checklistTemplateId: null })}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all",
                        !formData.checklistTemplateId
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-300"
                      )}
                    >
                      <p className="font-bold text-slate-900 dark:text-white">None / Default</p>
                      <p className="text-xs text-slate-500 mt-1">No specific template attached.</p>
                    </button>
                    {checklistTemplates.map((template: any) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, checklistTemplateId: template.id })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all",
                          formData.checklistTemplateId === template.id
                            ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-300"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{template.name}</p>
                          {template.isDefault && (
                            <Badge className="bg-slate-100 text-slate-600 border-none">Default</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 capitalize">{template.propertyType}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 font-medium text-sm">No templates found.</p>
                    <button 
                      type="button"
                      className="text-cyan-600 font-bold text-sm mt-2 hover:underline"
                      onClick={() => window.open('/landlord/checklist-templates', '_blank')}
                    >
                      Create a Template
                    </button>
                  </div>
                )}
              </div>
            </PremiumCard>

            <div className="flex gap-4">
              <PremiumButton variant="outline" onClick={() => setStep("images")} className="flex-1 h-16">
                Back
              </PremiumButton>
              <PremiumButton type="submit" className="flex-[2] h-16">
                Review Changes
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === "review" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard title="Review Changes">
              <div className="space-y-6">
                <div>
                  <PremiumLabel>Title</PremiumLabel>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight mt-1">{formData.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <PremiumLabel>Rent</PremiumLabel>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{formatCurrency(formData.rentPrice, formData.currency)}</p>
                  </div>
                  <div>
                    <PremiumLabel>Location</PremiumLabel>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mt-1">{formData.address}, {formData.city}</p>
                  </div>
                </div>
              </div>
            </PremiumCard>

            <div className="flex gap-4">
              <PremiumButton variant="outline" onClick={() => setStep("amenities")} className="flex-1 h-16">
                Back
              </PremiumButton>
              <PremiumButton 
                onClick={handleSubmit} 
                isLoading={uploading || updatePropertyMutation.isPending} 
                className={cn(
                  "flex-[2] h-16 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl transition-all shadow-cyan-500/20",
                  !(uploading || updatePropertyMutation.isPending) && "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 active:scale-95"
                )}
              >
                {uploading ? "Uploading..." : "Save Changes"}
              </PremiumButton>
            </div>
          </div>
        )}
      </form>
    </PremiumPageContainer>
  );
}