import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { PremiumInput } from "@/components/premium/PremiumInput";
import { PremiumLabel } from "@/components/premium/PremiumLabel";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { PremiumTextarea } from "@/components/premium/PremiumTextarea";
import { PremiumPageHeader } from "@/components/premium/PremiumPageHeader";
import { PremiumPageContainer } from "@/components/premium/PremiumPageContainer";
import { PremiumStatusBadge } from "@/components/premium/PremiumStatusBadge";
import { User, Save, Loader2, FileText, Eye, MapPin, Briefcase, ShieldCheck, Mail, Phone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import ImageUpload from "@/components/ImageUpload";
import { DOCUMENT_CONFIG } from "@/lib/imageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PremiumDocumentViewer } from "@/components/premium/PremiumDocumentViewer";
import { loadMapScript } from "@/lib/google-maps";

export default function ProfileSettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; fileName: string; type?: string } | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  
  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, { 
    enabled: !!user,
    refetchInterval: 5000 
  });
  const { data: userDocuments, refetch: refetchDocuments } = trpc.uploads.getMyDocuments.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const uploadDocumentMutation = trpc.uploads.verificationDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded!");
      refetchDocuments();
    },
  });
  
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    address: "",
    city: "",
    country: "",
    hasPets: false,
    petType: "",
    petCount: 0,
    numberOfOccupants: 1,
    occupantDetails: "",
    dniNie: "",
    companyName: "",
    annualSalary: "",
    rentalHistory: "",
    employmentStatus: "",
  });
  
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "",
        hasPets: profile.hasPets || false,
        petType: profile.petType || "",
        petCount: profile.petCount || 0,
        numberOfOccupants: profile.numberOfOccupants || 1,
        occupantDetails: profile.occupantDetails || "",
        dniNie: profile.dniNie || "",
        companyName: profile.companyName || "",
        annualSalary: profile.annualSalary ? (profile.annualSalary / 100).toString() : "",
        rentalHistory: profile.rentalHistory?.toString() || "",
        employmentStatus: profile.employmentStatus || "",
      });
    }
  }, [profile]);

  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    // Extract address components
    let streetNumber = "";
    let route = "";
    let city = "";
    let country = "";

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) streetNumber = component.long_name;
      if (types.includes("route")) route = component.long_name;
      if (types.includes("locality")) city = component.long_name;
      if (types.includes("country")) country = component.long_name;
    });

    if (!city) {
      place.address_components?.forEach((component) => {
        if (component.types.includes("administrative_area_level_2")) city = component.long_name;
      });
    }
    
    setFormData((prev: any) => ({
      ...prev,
      address: `${route} ${streetNumber}`.trim() || place.formatted_address?.split(",")[0] || "",
      city: city,
      country: country || prev.country,
    }));
  };

  useEffect(() => {
    loadMapScript().then(() => {
      if (window.google) {
        // Initialize Address Autocomplete
        if (addressInputRef.current) {
          const addressAutocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            types: ["address"],
            fields: ["address_components", "geometry", "formatted_address", "name"],
          });
          
          addressAutocomplete.addListener("place_changed", () => {
            const place = addressAutocomplete.getPlace();
            handleAddressSelect(place);
          });
        }

        // Initialize City Autocomplete
        if (cityInputRef.current) {
          const cityAutocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current, {
            types: ["(cities)"],
            fields: ["name", "address_components", "geometry"],
          });

          cityAutocomplete.addListener("place_changed", () => {
            const place = cityAutocomplete.getPlace();
            if (place.name) {
              setFormData((prev: any) => ({ ...prev, city: place.name }));
            }
            // Optional: Extract country if needed
            let country = "";
            place.address_components?.forEach((component) => {
              if (component.types.includes("country")) country = component.long_name;
            });
            if (country) {
              setFormData((prev: any) => ({ ...prev, country: country }));
            }
          });
        }
      }
    }).catch(err => console.error("Failed to load Google Maps", err));
  }, []);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload: any = {
      ...formData,
      annualSalary: formData.annualSalary ? Math.round(parseFloat(formData.annualSalary) * 100) : undefined,
      rentalHistory: formData.rentalHistory ? parseInt(formData.rentalHistory) : undefined,
    };
    if (payload.employmentStatus === "") delete payload.employmentStatus;
    updateProfile.mutate(payload);
  };

  const handleViewDocument = async (doc: any) => {
    try {
      toast.loading("Preparing document preview...");
      const url = await utils.uploads.downloadDocument.fetch(doc.id);
      
      if (url) {
        setPreviewDocument({
          url,
          fileName: doc.fileName || "Document",
          // Basic detection since MIME type isn't in DB for verification docs
          type: (doc.fileName || "").toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"
        });
        toast.dismiss();
      } else {
        toast.error("Could not generate secure viewing link");
      }
    } catch (error: any) {
      console.error("View document error:", error);
      toast.error("Failed to load document");
    }
  };

  if (!user) return <div className="p-8 text-center">Please sign in</div>;

  return (
    <PremiumPageContainer>
      <div className="space-y-8">
        {/* Header */}
        <PremiumPageHeader 
          title="Profile Settings" 
          subtitle="Manage your account information and verification documents"
          icon={User}
        />

        <div className="grid gap-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-end mb-2">
              <PremiumStatusBadge 
                status={profile?.verificationStatus || user?.verificationStatus || "unverified"} 
                className="text-sm px-3 py-1"
                label={(profile?.verificationStatus || user?.verificationStatus) === "verified" ? "Verified Profile" : (profile?.verificationStatus || user?.verificationStatus) === "pending" ? "Verification Pending" : "Unverified Profile"}
              />
            </div>
            {/* Personal Information */}
            <PremiumCard title="Personal Information" icon={User} description="Update your basic profile details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <PremiumLabel>Full Name</PremiumLabel>
                  <PremiumInput 
                    icon={User}
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <PremiumLabel>Email Address</PremiumLabel>
                  <PremiumInput 
                    icon={Mail}
                    value={formData.email} 
                    disabled 
                    className="bg-slate-100 dark:bg-slate-800/50 opacity-70" 
                  />
                </div>
                <div className="space-y-2">
                  <PremiumLabel>Phone Number</PremiumLabel>
                  <PremiumInput 
                    icon={Phone}
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+34 600 000 000" 
                  />
                </div>
                <div className="space-y-2">
                  <PremiumLabel>DNI / NIE</PremiumLabel>
                  <PremiumInput 
                    icon={ShieldCheck}
                    value={formData.dniNie} 
                    onChange={(e) => setFormData({...formData, dniNie: e.target.value})} 
                    placeholder="12345678A" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <PremiumLabel>Bio / Introduction</PremiumLabel>
                  <PremiumTextarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                    rows={4} 
                    placeholder="A short description about yourself to help landlords get to know you..." 
                  />
                </div>
              </div>
            </PremiumCard>

            {/* Location */}
            <PremiumCard title="Location" icon={MapPin} description="Where are you currently based?">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <PremiumLabel>Current Address</PremiumLabel>
                  <PremiumInput 
                    ref={addressInputRef}
                    icon={MapPin}
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <PremiumLabel>City</PremiumLabel>
                  <PremiumInput 
                    ref={cityInputRef}
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
              </div>
            </PremiumCard>

            {/* Employment & Financial (Tenant Only) */}
            {user.userType === "tenant" && (
              <PremiumCard title="Employment & Financial" icon={Briefcase} description="These details help verify your affordability score">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <PremiumLabel>Employment Status</PremiumLabel>
                    <Select 
                      value={formData.employmentStatus || ""} 
                      onValueChange={(val) => setFormData({...formData, employmentStatus: val})}
                    >
                      <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-base">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2">
                        <SelectItem value="employed" className="font-bold">Employed</SelectItem>
                        <SelectItem value="self-employed" className="font-bold">Self-employed</SelectItem>
                        <SelectItem value="student" className="font-bold">Student</SelectItem>
                        <SelectItem value="unemployed" className="font-bold">Unemployed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <PremiumLabel>Annual Salary (€)</PremiumLabel>
                    <PremiumInput 
                      icon={CreditCard}
                      type="number" 
                      value={formData.annualSalary} 
                      onChange={(e) => setFormData({...formData, annualSalary: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <PremiumLabel>Rental History (Months)</PremiumLabel>
                    <PremiumInput 
                      icon={FileText}
                      type="number" 
                      value={formData.rentalHistory} 
                      onChange={(e) => setFormData({...formData, rentalHistory: e.target.value})} 
                    />
                  </div>
                </div>
              </PremiumCard>
            )}

            {/* Bottom Save Button */}
            <div className="flex justify-end pt-4">
              <PremiumButton 
                type="submit" 
                disabled={updateProfile.isPending} 
                className="h-12 px-8 normal-case tracking-normal rounded-xl"
              >
                {updateProfile.isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                Save Profile Changes
              </PremiumButton>
            </div>
          </form>

            {/* Verification Documents (Tenant & Landlord) */}
            <PremiumCard 
              title="Verification Documents" 
              icon={ShieldCheck} 
              description="Upload required documents to verify your identity"
              cta={
                <PremiumButton 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                  className="h-10 rounded-xl px-4 normal-case tracking-normal"
                >
                  {showDocumentUpload ? "Hide Uploader" : "Upload New"}
                </PremiumButton>
              }
            >
              {showDocumentUpload && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  {(user.userType === "tenant" ? ["id", "income", "employment", "reference"] : ["id"]).map((type) => (
                    <div key={type} className="space-y-3">
                      <PremiumLabel className="text-cyan-600 dark:text-cyan-400">{type} Proof</PremiumLabel>
                      <ImageUpload
                        config={DOCUMENT_CONFIG}
                        label={`Upload ${type}`}
                        onUpload={async (file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            uploadDocumentMutation.mutate({
                              documentType: type as any,
                              fileName: file.name,
                              fileData: reader.result as string,
                              mimeType: file.type
                            });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(user.userType === "tenant" ? ["id", "income", "employment", "reference"] : ["id"]).map((type) => {
                  const doc = userDocuments?.find((d: any) => d.documentType === type);
                  return (
                    <div key={type} className="p-6 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 hover:border-cyan-400 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:shadow-md transition-all">
                          <FileText className="h-6 w-6 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tight">{type}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px] font-medium">{doc ? doc.fileName : "Not uploaded yet"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc ? (
                          <>
                            <PremiumStatusBadge status={doc.verificationStatus} />
                            <PremiumButton 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewDocument(doc)} 
                              className="text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                            >
                              <Eye className="h-5 w-5" />
                            </PremiumButton>
                          </>
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700 mr-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
        </div>

        {/* Preview Dialog */}
        <PremiumDocumentViewer
          open={!!previewDocument}
          onOpenChange={(open) => !open && setPreviewDocument(null)}
          url={previewDocument?.url || null}
          fileName={previewDocument?.fileName}
          type={previewDocument?.type}
        />
      </div>
    </PremiumPageContainer>
  );
}
