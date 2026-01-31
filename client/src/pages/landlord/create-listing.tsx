import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
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
  Navigation,
  FileText
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, formatCents } from "@/lib/currency";

// Use our new Premium Components
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

type FormStep = "details" | "images" | "amenities" | "verification" | "review";

const AMENITIES_OPTIONS = [
  "WiFi", "Parking", "Air Conditioning", "Heating", "Washer", "Dryer", "Dishwasher",
  "Kitchen", "Balcony", "Garden", "Gym", "Pool", "Pet Friendly", "Elevator", "Security",
];

export default function CreateListingPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<FormStep>("details");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [latitude, setLatitude] = useState<string>("40.4168");
  const [longitude, setLongitude] = useState<string>("-3.7038");
  const [ownershipDoc, setOwnershipDoc] = useState<File | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

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

  const createPropertyMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success(t("operationSuccessful"));
      setLocation("/landlord/properties");
    },
    onError: (err) => {
      toast.error(err.message || t("error"));
    }
  });

  const uploadImageMutation = trpc.uploads.uploadImage.useMutation();
  const createDocumentMutation = trpc.documentVault.create.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: ["bedrooms", "bathrooms", "squareFeet", "rentPrice"].includes(name)
        ? parseInt(value) || 0
        : value,
    }));
  };

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

    // Fallback for city if locality is missing
    if (!city) {
      place.address_components?.forEach((component) => {
         if (component.types.includes("administrative_area_level_2")) city = component.long_name;
      });
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setCoordinates({ lat, lng });
    setLatitude(lat.toString());
    setLongitude(lng.toString());

    setFormData((prev: any) => ({
      ...prev,
      address: `${route} ${streetNumber}`.trim() || place.formatted_address?.split(",")[0] || "",
      city: city,
      zipCode: zipCode,
      country: country || prev.country,
    }));

    // Update Map
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
    setImages(prev => prev.filter((_, i) => i !== index));
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
        toast.error(t("pleaseEnterValue"));
        return;
      }
      if (formData.rentPrice <= 0) {
        toast.error("Rent must be greater than 0");
        return;
      }
      return setStep("images");
    }
    
    if (step === "images") {
      if (images.length === 0) {
        toast.error("Please upload at least one image");
        return;
      }
      return setStep("amenities");
    }
    
    if (step === "amenities") return setStep("verification");
    if (step === "verification") return setStep("review");

    setUploading(true);
    try {
      // 1. Upload Images
      const uploadedImageUrls: string[] = [];
      toast.info(`Uploading ${images.length} images...`);
      
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

      // 2. Create Property
      const property = await createPropertyMutation.mutateAsync({
        ...formData,
        rentPrice: formData.rentPrice * 100, // Convert to cents
        images: uploadedImageUrls,
        latitude: coordinates?.lat.toString() || latitude,
        longitude: coordinates?.lng.toString() || longitude,
      });

      // 3. Upload Ownership Proof (if provided)
      if (ownershipDoc && property) {
        toast.info("Uploading verification document...");
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(ownershipDoc);
        });

        const res = await uploadImageMutation.mutateAsync({
          fileName: ownershipDoc.name,
          fileData: base64Data,
          mimeType: ownershipDoc.type,
        });

        if (res.url) {
          await createDocumentMutation.mutateAsync({
            propertyId: property.id, // Link to the new property
            fileName: ownershipDoc.name,
            fileUrl: res.url,
            fileKey: res.key || "",
            fileSize: ownershipDoc.size,
            mimeType: ownershipDoc.type,
            category: "certificate", // Ownership proof
            description: "Property Ownership Proof",
          });
        }
      }

    } catch (error) {
      toast.error(t("error"));
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    t("createListing.step.details"), 
    t("createListing.step.images"), 
    t("createListing.step.amenities"),
    "Verification",
    t("createListing.step.review")
  ] as const;
  const currentIdx = ["details", "images", "amenities", "verification", "review"].indexOf(step);

  // Expose the open function to window for the header button to call
  useEffect(() => {
    (window as any).openAddAvailability = () => {}; 
    return () => { delete (window as any).openAddAvailability; };
  }, []);

  return (
    <PremiumPageContainer maxWidth="7xl">
      {/* Premium Header Component */}
      <PremiumPageHeader 
        title={t("createListing.title")}
        subtitle={t("createListing.subtitle")}
        icon={Home}
        action={{
          label: t("createListing.backToDashboard"),
          onClick: () => setLocation("/landlord/properties"),
          icon: ArrowLeft
        }}
      />

      {/* Progress Steps Indicator */}
      <PremiumProgressSteps 
        steps={steps} 
        currentIdx={currentIdx} 
        className="mb-12"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: PROPERTY DETAILS */}
        {step === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PremiumCard 
                title={t("createListing.basicInfo")} 
                description={t("createListing.basicInfoDesc")}
                icon={Info}
              >
                                  <div className="space-y-6">
                                    <div>
                                      <PremiumLabel required>{t("createListing.propertyTitle")}</PremiumLabel>
                                      <PremiumInput 
                                        name="title" 
                                        value={formData.title} 
                                        onChange={handleInputChange} 
                                        placeholder={t("createListing.propertyTitlePlaceholder")}
                                        required 
                                      />
                                    </div>
                
                                    <div>
                                      <PremiumLabel>{t("createListing.description")}</PremiumLabel>
                                      <PremiumTextarea 
                                        name="description" 
                                        value={formData.description} 
                                        onChange={handleInputChange} 
                                        placeholder={t("createListing.descriptionPlaceholder")}
                                        rows={6}
                                      />
                                    </div>
                
                                    {/* Address Section */}
                                    <div className="space-y-6">
                                      <div>
                                        <PremiumLabel required>{t("createListing.address")}</PremiumLabel>
                                        <PremiumInput 
                                          ref={addressInputRef}
                                          name="address" 
                                          icon={MapPin}
                                          iconClassName="text-cyan-500"
                                          value={formData.address} 
                                          onChange={handleInputChange} 
                                          placeholder={t("createListing.addressPlaceholder")}
                                          required 
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                          <PremiumLabel required>{t("createListing.city")}</PremiumLabel>
                                          <PremiumInput 
                                            name="city" 
                                            value={formData.city} 
                                            onChange={handleInputChange} 
                                            placeholder={t("createListing.cityPlaceholder")}
                                            required 
                                          />
                                        </div>
                                        <div>
                                          <PremiumLabel required>{t("postalCode")}</PremiumLabel>
                                          <PremiumInput 
                                            name="zipCode" 
                                            value={formData.zipCode} 
                                            onChange={handleInputChange} 
                                            placeholder="28001"
                                            required 
                                          />
                                        </div>
                                        <div>
                                          <PremiumLabel required>{t("country")}</PremiumLabel>
                                          <PremiumInput 
                                            name="country" 
                                            value={formData.country} 
                                            onChange={handleInputChange} 
                                            placeholder={t("country")}
                                            required 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>              </PremiumCard>

              <PremiumCard 
                title={t("createListing.pinLocation")} 
                description={t("createListing.pinLocationDesc")}
                icon={Navigation}
              >
                <div className="h-[400px] border-2 border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden relative shadow-inner">
                  <MapView 
                    initialCenter={{ lat: parseFloat(latitude), lng: parseFloat(longitude) }}
                    onMapReady={(map) => {
                      mapRef.current = map;
                      
                      // Initialize Autocomplete
                      if (addressInputRef.current) {
                        const autocomplete = new window.google!.maps.places.Autocomplete(addressInputRef.current, {
                          types: ["address"],
                          fields: ["address_components", "geometry", "formatted_address", "name"],
                        });
                        
                        autocomplete.addListener("place_changed", () => {
                          const place = autocomplete.getPlace();
                          handleAddressSelect(place);
                        });
                      }

                      map.addListener('click', (e: any) => {
                        if (e.latLng) {
                          const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                          setCoordinates(coords);
                          setLatitude(coords.lat.toString());
                          setLongitude(coords.lng.toString());
                          
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
                  <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border-2 border-cyan-500/20 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{t("createListing.currentCoordinates")}</p>
                    <p className="text-xs font-bold font-mono text-cyan-600">
                      {latitude.slice(0, 8)}, {longitude.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            </div>

            <div className="space-y-8">
              <PremiumCard title={t("createListing.keyFeatures")} icon={Sparkles}>
                <div className="space-y-6">
                  <div>
                    <PremiumLabel>{t("createListing.bedrooms")}</PremiumLabel>
                    <PremiumInput 
                      type="number" 
                      name="bedrooms" 
                      icon={Bed}
                      value={formData.bedrooms} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <PremiumLabel>{t("createListing.bathrooms")}</PremiumLabel>
                    <PremiumInput 
                      type="number" 
                      name="bathrooms" 
                      icon={Bath}
                      value={formData.bathrooms} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <PremiumLabel>{t("createListing.monthlyRent")}</PremiumLabel>
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
                          placeholder="1200"
                          className="text-green-600 dark:text-green-400"
                          required 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              <div className="p-6 bg-cyan-500/10 border-2 border-cyan-500/20 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <Info className="h-5 w-5" />
                  <span className="font-black uppercase text-xs tracking-widest">{t("createListing.proTipTitle")}</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("createListing.proTipDesc")}
                </p>
              </div>

              <PremiumButton type="submit" className="w-full">
                {t("createListing.continueToImages")}
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 2: IMAGES */}
        {step === "images" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard title={t("createListing.propertyGallery")} description={t("createListing.propertyGalleryDesc")} headerClassName="text-center">
              <div className="space-y-8">
                <div 
                  className="border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-16 text-center hover:border-cyan-400 dark:hover:border-cyan-400/50 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 group" 
                  onClick={() => document.getElementById('img-input')?.click()}
                >
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-cyan-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t("createListing.uploadPhotos")}</p>
                  <p className="text-slate-500 font-medium">{t("createListing.uploadPhotosDesc")}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">{t("createListing.uploadLimitNote")}</p>
                  <input id="img-input" type="file" multiple className="hidden" onChange={handleImageChange} accept="image/*" />
                </div>

                {imagePreviews.length > 0 && (
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
                        {i === 0 && (
                          <Badge className="absolute top-3 left-3 bg-cyan-500 text-white font-black uppercase text-[9px] tracking-widest border-none">{t("createListing.mainCover")}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PremiumCard>

            <div className="flex gap-4">
              <PremiumButton variant="outline" onClick={() => setStep("details")} className="flex-1 h-16">
                {t("back")}
              </PremiumButton>
              <PremiumButton type="submit" className="flex-[2] h-16">
                {t("createListing.continueToAmenities")}
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 3: AMENITIES */}
        {step === "amenities" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard 
              title={t("createListing.selectAmenities")} 
              description={t("createListing.selectAmenitiesDesc")}
              cta={
                <button 
                  type="button"
                  onClick={() => {
                    const allSelected = formData.amenities.length === AMENITIES_OPTIONS.length;
                    setFormData({
                      ...formData, 
                      amenities: allSelected ? [] : [...AMENITIES_OPTIONS]
                    });
                  }}
                  className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-600 transition-colors"
                >
                  {formData.amenities.length === AMENITIES_OPTIONS.length ? t("deselectAll") : t("selectAll")}
                </button>
              }
            >
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
                      onClick={() => setFormData({ ...formData, checklistTemplateId: undefined })}
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
                {t("back")}
              </PremiumButton>
              <PremiumButton type="submit" className="flex-[2] h-16">
                Continue to Verification
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 4: VERIFICATION */}
        {step === "verification" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard 
              title="Verification Documents" 
              description="Upload proof of ownership to get your property verified faster."
              icon={FileText}
            >
              <div className="space-y-6">
                <div 
                  className="border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center hover:border-cyan-400 dark:hover:border-cyan-400/50 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 group"
                  onClick={() => document.getElementById('doc-input')?.click()}
                >
                  {ownershipDoc ? (
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
                        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{ownershipDoc.name}</p>
                      <p className="text-sm text-slate-500">{(ownershipDoc.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        type="button"
                        className="mt-4 text-xs font-black text-red-500 uppercase tracking-widest hover:underline"
                        onClick={(e) => { e.stopPropagation(); setOwnershipDoc(null); }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <Upload className="h-10 w-10 text-cyan-500" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Upload Ownership Proof</p>
                      <p className="text-slate-500 font-medium">Nota Simple, IBI Receipt, or Deed</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">PDF, JPG, PNG • MAX 10MB</p>
                    </>
                  )}
                  <input 
                    id="doc-input" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) setOwnershipDoc(e.target.files[0]);
                    }} 
                    accept=".pdf,image/*" 
                  />
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-bold mb-1">Why upload this?</p>
                  <p>Verified properties get 3x more views and higher trust from tenants. We verify ownership manually within 24h.</p>
                </div>
              </div>
            </PremiumCard>

            <div className="flex gap-4">
              <PremiumButton variant="outline" onClick={() => setStep("amenities")} className="flex-1 h-16">
                {t("back")}
              </PremiumButton>
              <PremiumButton type="submit" className="flex-[2] h-16">
                {t("createListing.reviewListing")}
              </PremiumButton>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {step === "review" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <PremiumCard title={t("createListing.finalReview")} description={t("createListing.verifyBeforePublish")}>
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <PremiumLabel>{t("createListing.propertyTitle")}</PremiumLabel>
                      <p className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight mt-1">{formData.title}</p>
                    </div>
                    <div>
                      <PremiumLabel>{t("createListing.pinLocation")}</PremiumLabel>
                      <p className="font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-500" />
                        {formData.address}, {formData.city}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <PremiumLabel>{t("createListing.monthlyRent")}</PremiumLabel>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{formatCurrency(formData.rentPrice, formData.currency)}</p>
                      </div>
                      <div>
                        <PremiumLabel>{t("createListing.size")}</PremiumLabel>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{formData.bedrooms} {t("createListing.bedBath")} {formData.bathrooms}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <PremiumLabel>{t("createListing.step.images")} ({imagePreviews.length})</PremiumLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.slice(0, 6).map((p, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 relative">
                          <img src={p} className="w-full h-full object-cover" />
                          {i === 5 && imagePreviews.length > 6 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-black text-sm">+{imagePreviews.length - 6}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                  <div className="pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                    <PremiumLabel className="mb-4">{t("createListing.step.amenities")}</PremiumLabel>
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities.map((a: string) => (
                        <Badge key={a} variant="outline" className="bg-slate-50 dark:bg-slate-900/50 border-2 font-bold px-4 py-1.5 rounded-xl text-slate-600 dark:text-slate-400">{a}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                    <PremiumLabel className="mb-4">Verification</PremiumLabel>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      {ownershipDoc ? (
                        <>
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">Ownership Proof Attached</p>
                            <p className="text-xs text-slate-500">{ownershipDoc.name}</p>
                          </div>
                          <Badge className="ml-auto bg-green-500 text-white font-black uppercase text-[10px]">Ready to Verify</Badge>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
                            <Info className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">No Verification Document</p>
                            <p className="text-xs text-slate-500">Property will be listed as Unverified</p>
                          </div>
                        </>
                      )}
                                      </div>
                                    </div>
                                  </div>
                                </PremiumCard>
            <div className="flex gap-4">
              <PremiumButton variant="outline" onClick={() => setStep("verification")} className="flex-1 h-16">
                {t("back")}
              </PremiumButton>
              <PremiumButton 
                onClick={handleSubmit} 
                isLoading={uploading || createPropertyMutation.isPending} 
                className={cn(
                  "flex-[2] h-16 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl transition-all shadow-cyan-500/20",
                  !(uploading || createPropertyMutation.isPending) && "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 active:scale-95"
                )}
              >
                {uploading || createPropertyMutation.isPending ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {t("createListing.publishingListing")}
                  </span>
                ) : (
                  t("createListing.publishListing")
                )}
              </PremiumButton>
            </div>
          </div>
        )}
      </form>
    </PremiumPageContainer>
  );
}