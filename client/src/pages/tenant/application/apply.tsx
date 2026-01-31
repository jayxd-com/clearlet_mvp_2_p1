import { useLocation, useRoute } from "wouter";
import { useState } from "react";
import { Check, AlertCircle, Loader2, FileText, User, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TenantLayout } from "@/components/TenantLayout";
import { PremiumPageContainer } from "@/components/premium/PremiumPageContainer";
import { PremiumPageHeader } from "@/components/premium/PremiumPageHeader";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { PremiumProgressSteps } from "@/components/premium/PremiumProgressSteps";
import { PremiumDatePicker } from "@/components/premium/PremiumDatePicker";
import { PremiumInput } from "@/components/premium/PremiumInput";
import { PremiumLabel } from "@/components/premium/PremiumLabel";
import { PremiumTextarea } from "@/components/premium/PremiumTextarea";
import { PremiumStatusBadge } from "@/components/premium/PremiumStatusBadge";
import { useTenantScore } from "@/hooks/useTenantScore";
import { formatCents } from "@/lib/currency";

export default function ApplicationPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/tenant/application/apply/:id");
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"review" | "submit" | "success">("review");
  const [formData, setFormData] = useState({
    moveInDate: "2025-03-15",
    leaseLength: "12",
    message: "I'm very interested in this property and believe I'm a great fit as a tenant.",
    agreeTerms: false,
    shareIdDocument: false,
    shareIncomeDocument: false,
    shareEmploymentDocument: false,
    shareReferences: false,
    numberOfOccupants: "",
    hasPets: false,
    petType: "",
    petCount: "",
  });

  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: tenantScoreData } = useTenantScore();

  const isFullyVerified = (profile?.verificationScore || 0) === 100;
  const hasPetsFromProfile = profile?.hasPets || false;
  const petTypeFromProfile = profile?.petType || "";
  const petCountFromProfile = profile?.petCount || 0;
  const numberOfOccupantsFromProfile = profile?.numberOfOccupants || 1;

  const propertyId = params?.id ? parseInt(params.id) : null;

  const { data: property, isLoading: propertyLoading, error: propertyError } = trpc.properties.detail.useQuery(propertyId || 0, {
    enabled: !!propertyId && !!match,
  });

  const createApplicationMutation = trpc.applications.createApplication.useMutation({
    onSuccess: () => {
      setStep("success");
    },
    onError: (error) => {
      toast.error("Failed to submit application: " + error.message);
    },
  });

  const handleSubmit = () => {
    if (!formData.agreeTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    if (!propertyId || !property?.userId) {
      toast.error("Property or Landlord information missing.");
      return;
    }

    const shareIdDocument = isFullyVerified ? false : formData.shareIdDocument;
    const shareIncomeDocument = isFullyVerified ? false : formData.shareIncomeDocument;
    const shareEmploymentDocument = isFullyVerified ? false : formData.shareEmploymentDocument;
    const shareReferences = isFullyVerified ? false : formData.shareReferences;

    createApplicationMutation.mutate({
      propertyId: propertyId,
      landlordId: property.userId,
      moveInDate: formData.moveInDate,
      leaseLength: parseInt(formData.leaseLength),
      message: formData.message,
      shareIdDocument,
      shareIncomeDocument,
      shareEmploymentDocument,
      shareReferences,
      numberOfOccupants: parseInt(formData.numberOfOccupants || numberOfOccupantsFromProfile.toString()),
      hasPets: formData.hasPets || hasPetsFromProfile,
      petType: formData.petType || petTypeFromProfile,
      petCount: parseInt(formData.petCount || petCountFromProfile.toString()),
    });
  };

  if (!match || !propertyId) {
    return (
      <TenantLayout>
        <PremiumPageContainer>
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <AlertCircle className="h-16 w-16 text-red-400" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Invalid Route</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">The property ID is missing or invalid.</p>
            </div>
            <PremiumButton onClick={() => setLocation("/tenant/listings")}>
              Back to Listings
            </PremiumButton>
          </div>
        </PremiumPageContainer>
      </TenantLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <TenantLayout>
        <PremiumPageContainer>
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <User className="h-16 w-16 text-slate-400" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Please sign in to apply for this property.</p>
            </div>
            <PremiumButton onClick={() => setLocation("/signin")}>
              Sign In
            </PremiumButton>
          </div>
        </PremiumPageContainer>
      </TenantLayout>
    );
  }

  if (propertyLoading) {
    return (
      <TenantLayout>
        <PremiumPageContainer>
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Loading property details...</p>
          </div>
        </PremiumPageContainer>
      </TenantLayout>
    );
  }

  if (propertyError || !property) {
    return (
      <TenantLayout>
        <PremiumPageContainer>
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <AlertCircle className="h-16 w-16 text-red-400" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Property Unavailable</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">This property could not be found or is no longer available.</p>
            </div>
            <PremiumButton onClick={() => setLocation("/tenant/listings")}>
              Back to Listings
            </PremiumButton>
          </div>
        </PremiumPageContainer>
      </TenantLayout>
    );
  }

  const steps = [
    { label: "Review", status: step === "review" ? "current" : "completed" },
    { label: "Submit", status: step === "submit" ? "current" : step === "success" ? "completed" : "upcoming" },
    { label: "Done", status: step === "success" ? "completed" : "upcoming" },
  ];

  const currentStepIdx = step === "review" ? 0 : step === "submit" ? 1 : 2;

  return (
    <TenantLayout>
      <PremiumPageContainer maxWidth="5xl">
        <PremiumPageHeader
          title="Apply for Property"
          subtitle={property.title}
          icon={FileText}
          action={{
            label: "Back to Listings",
            onClick: () => setLocation("/tenant/listings"),
          }}
        />

        <div className="mb-8">
          <PremiumProgressSteps steps={steps as any} currentIdx={currentStepIdx} />
        </div>

        {step === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Application Form */}
              <PremiumCard title="Application Details" icon={FileText}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <PremiumDatePicker
                      label="Desired Move-in Date"
                      value={formData.moveInDate}
                      onChange={(date) => {
                        if (date) {
                          const offset = date.getTimezoneOffset();
                          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                          setFormData({ ...formData, moveInDate: localDate.toISOString().split("T")[0] });
                        } else {
                          setFormData({ ...formData, moveInDate: "" });
                        }
                      }}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <PremiumLabel>Lease Length</PremiumLabel>
                    <select
                      value={formData.leaseLength}
                      onChange={(e) => setFormData({ ...formData, leaseLength: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:outline-none transition-all font-bold text-slate-900 dark:text-white"
                    >
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                      <option value="24">24 months</option>
                    </select>
                  </div>
                  <div>
                    <PremiumLabel>Number of Occupants</PremiumLabel>
                    <PremiumInput
                      type="number"
                      min="1"
                      value={formData.numberOfOccupants || numberOfOccupantsFromProfile}
                      onChange={(e) => setFormData({ ...formData, numberOfOccupants: e.target.value })}
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                    <input
                      type="checkbox"
                      checked={formData.hasPets || hasPetsFromProfile}
                      onChange={(e) => setFormData({ ...formData, hasPets: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="font-bold group-hover:text-cyan-600 transition-colors">I have pets</span>
                  </label>

                  {(formData.hasPets || hasPetsFromProfile) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                      <div>
                        <PremiumLabel>Pet Type</PremiumLabel>
                        <PremiumInput
                          value={formData.petType || petTypeFromProfile}
                          onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                          placeholder="e.g. Dog"
                        />
                      </div>
                      <div>
                        <PremiumLabel>Number of Pets</PremiumLabel>
                        <PremiumInput
                          type="number"
                          min="1"
                          value={formData.petCount || petCountFromProfile}
                          onChange={(e) => setFormData({ ...formData, petCount: e.target.value })}
                          placeholder="e.g. 1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <PremiumLabel>Personal Message</PremiumLabel>
                  <PremiumTextarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell the landlord why you're a great fit..."
                    rows={4}
                  />
                </div>
              </PremiumCard>

              {/* Document Sharing */}
              {!isFullyVerified ? (
                <PremiumCard title="Share Documents" icon={ShieldCheck}>
                  <p className="text-sm text-slate-500 mb-4 font-medium">
                    Speed up your application by sharing verified documents.
                  </p>
                  <div className="space-y-3">
                    {[
                      { key: 'shareIdDocument', label: 'Share ID Document', desc: 'Passport or National ID' },
                      { key: 'shareIncomeDocument', label: 'Share Income Verification', desc: 'Pay stubs or employment letter' },
                      { key: 'shareEmploymentDocument', label: 'Share Employment Verification', desc: 'Current employer details' },
                      { key: 'shareReferences', label: 'Share References', desc: 'Previous landlord references' },
                    ].map((doc) => (
                      <label key={doc.key} className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all group">
                        <input
                          type="checkbox"
                          checked={(formData as any)[doc.key]}
                          onChange={(e) => setFormData({ ...formData, [doc.key]: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">{doc.label}</p>
                          <p className="text-xs text-slate-500">{doc.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </PremiumCard>
              ) : (
                <PremiumCard title="Privacy Protected" icon={ShieldCheck} className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-700 dark:text-green-400 mb-1">Your Documents Are Secure</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Because you are 100% verified, your actual documents are NOT shared. The landlord will only see your "Verified" badge and scores.
                      </p>
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* Terms */}
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    I agree to the terms and conditions and confirm that all information provided is accurate and truthful. I understand that providing false information may result in application rejection.
                  </span>
                </label>
              </div>

              <PremiumButton
                onClick={() => setStep("submit")}
                disabled={!formData.agreeTerms}
                className="w-full h-16 text-lg"
              >
                Continue to Submit <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <PremiumCard title="Property Summary" icon={FileText} className="lg:sticky lg:top-24">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
                    <p className="font-bold text-slate-900 dark:text-white">{property.address}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{property.city}, {property.zipCode}</p>
                  </div>
                  <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Rent</p>
                    <p className="text-3xl font-black text-cyan-500">{formatCents(property.rentPrice || 0, property.currency || "EUR")}<span className="text-sm font-medium text-slate-400">/mo</span></p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                    <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-black text-slate-400">Bed</p>
                      <p className="font-bold text-lg">{property.bedrooms}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-black text-slate-400">Bath</p>
                      <p className="font-bold text-lg">{property.bathrooms}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-black text-slate-400">Area</p>
                      <p className="font-bold text-lg">{property.squareFeet || '-'}m²</p>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              <PremiumCard title="Your Profile" icon={User}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Name</span>
                    <span className="font-bold">{user.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="font-bold">{user.email}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 font-medium">Verification</span>
                      <PremiumStatusBadge 
                        status={isFullyVerified ? "verified" : "pending"} 
                        label={isFullyVerified ? "Verified" : `${profile?.verificationScore || 0}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Tenant Score</span>
                      <span className="font-black text-purple-500 text-lg">{tenantScoreData?.totalScore || 0}/100</span>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </div>
          </div>
        )}

        {step === "submit" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <PremiumCard title="Confirm Submission" icon={Check}>
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FileText className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Ready to Submit?</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-lg">
                  Your application for <span className="font-bold text-slate-900 dark:text-white">{property.title}</span> is ready. The landlord will review your profile and details immediately.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 space-y-4 border-2 border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
                  <span className="text-slate-500 font-medium">Move-in Date</span>
                  <span className="font-bold text-lg">{formData.moveInDate}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
                  <span className="text-slate-500 font-medium">Lease Term</span>
                  <span className="font-bold text-lg">{formData.leaseLength} months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Monthly Rent</span>
                  <span className="font-black text-2xl text-cyan-600 dark:text-cyan-400">{formatCents(property.rentPrice || 0, property.currency || "EUR")}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <PremiumButton
                  variant="outline"
                  onClick={() => setStep("review")}
                  disabled={createApplicationMutation.isPending}
                  className="flex-1"
                >
                  Edit Details
                </PremiumButton>
                <PremiumButton
                  onClick={handleSubmit}
                  isLoading={createApplicationMutation.isPending}
                  className="flex-1 shadow-xl shadow-cyan-500/20"
                >
                  Submit Application
                </PremiumButton>
              </div>
            </PremiumCard>
          </div>
        )}

        {step === "success" && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500 shadow-2xl shadow-green-500/20">
              <Check className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Application Sent!</h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                The landlord has been notified. You can track the status of your application in your dashboard.
              </p>
            </div>

            <PremiumCard title="Next Steps">
              <div className="space-y-6 text-left p-2">
                {[
                  "Landlord reviews your verified profile",
                  "You receive a notification when they respond",
                  "Schedule a viewing or discuss terms",
                  "Sign the digital contract and move in"
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-sm font-black shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium text-lg">{item}</p>
                  </div>
                ))}
              </div>
            </PremiumCard>

            <div className="flex gap-4">
              <PremiumButton
                variant="outline"
                onClick={() => setLocation("/tenant/applications")}
                className="flex-1"
              >
                View My Applications
              </PremiumButton>
              <PremiumButton
                onClick={() => setLocation("/tenant/listings")}
                className="flex-1"
              >
                Back to Listings
              </PremiumButton>
            </div>
          </div>
        )}
      </PremiumPageContainer>
    </TenantLayout>
  );
}