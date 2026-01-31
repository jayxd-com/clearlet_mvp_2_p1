import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Eye,
  Building2,
  Users,
  FileText,
  User,
  Search,
  Loader2, 
  MapPin,
  Sparkles,
  Euro,
  Home,
  ShieldCheck,
  Briefcase,
  FileCheck,
  Download,
  FilePlus,
  CheckSquare
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumPageHeader, PremiumPageContainer, PremiumStatCard, PremiumButton, PremiumCard, PremiumInput, PremiumLabel, PremiumStatusBadge, PremiumDocumentViewer } from "@/components/premium";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatCents, formatCurrency } from "@/lib/currency";

export default function LandlordApplicationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string, fileName: string, type?: string } | null>(null);
  
  // Generate Dialog State
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [contractLanguage, setContractLanguage] = useState<string>("en");

  const utils = trpc.useUtils();

  const { data: applications, isLoading, refetch } = trpc.applications.landlordApplications.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: properties } = trpc.properties.myListings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: templates } = trpc.contractTemplates.getUserTemplates.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch full details when an app is selected
  const { data: applicationDetails, isLoading: isLoadingDetails } = trpc.applications.landlordApplicationDetails.useQuery(
    { applicationId: selectedAppId! },
    { enabled: !!selectedAppId }
  );

  const updateStatus = trpc.applications.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Application status updated");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  const createContract = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contract generated successfully");
      setShowGenerateDialog(false);
      setSelectedAppId(null);
      setLocation("/landlord/contracts");
    },
    onError: (err) => toast.error(err.message || "Failed to generate contract")
  });

  const handleGenerateContract = () => {
    if (!applicationDetails || !applicationDetails.property) {
      toast.error("Missing property details");
      return;
    }
    
    const template = templates?.find((t: any) => t.id === selectedTemplateId);
    const startDate = applicationDetails.moveInDate ? new Date(applicationDetails.moveInDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (applicationDetails.leaseLength || 12));
    
    createContract.mutate({
      propertyId: applicationDetails.propertyId,
      tenantId: applicationDetails.userId,
      applicationId: applicationDetails.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthlyRent: applicationDetails.property.rentPrice || 0,
      securityDeposit: (applicationDetails.property.rentPrice || 0) * 2, // Default 2 months
      terms: template?.terms,
      specialConditions: template?.specialConditions,
      templateId: selectedTemplateId || undefined,
      sendImmediately: false,
      language: contractLanguage as "en" | "es",
    });
  };

  const handleViewDocument = async (docId: number, fileName: string, type?: string) => {
    try {
      toast.loading("Opening document...");
      const url = await utils.uploads.downloadDocument.fetch(docId);
      toast.dismiss();
      if (url) {
        setViewingDoc({ url, fileName, type });
      } else {
        toast.error("Could not load document");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to open document");
    }
  };

  const filteredApps = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app: any) => {
      const matchesSearch = app.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.property.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProperty = propertyFilter === "all" || app.property.id === parseInt(propertyFilter);
      return matchesSearch && matchesProperty;
    });
  }, [applications, searchQuery, propertyFilter]);

  const stats = useMemo(() => {
    if (!applications) return { total: 0, pending: 0, accepted: 0 };
    return {
      total: applications.length,
      pending: applications.filter((a: any) => a.application.status === 'pending').length,
      accepted: applications.filter((a: any) => a.application.status === 'accepted').length,
    };
  }, [applications]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching applications...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader
        title="Application Reviews"
        subtitle="Manage and evaluate potential tenants for your properties"
        icon={FileText}
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <PremiumStatCard
            label="Total Received"
            value={stats.total}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
          <PremiumStatCard
            label="Pending Review"
            value={stats.pending}
            icon={Clock}
            color="text-yellow-500"
            bg="bg-yellow-50 dark:bg-yellow-900/20"
          />
          <PremiumStatCard
            label="Accepted"
            value={stats.accepted}
            icon={CheckCircle}
            color="text-green-500"
            bg="bg-green-50 dark:bg-green-900/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <PremiumInput
              placeholder="Search by tenant name or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full md:w-72">
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All Properties" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold">All Properties</SelectItem>
                {properties?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()} className="font-bold">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Applications List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredApps.length > 0 ? filteredApps.map((app: any) => (
            <Card key={app.application.id} className="border-2 border-slate-100 dark:border-slate-700 hover:border-cyan-400/50 transition-all overflow-hidden bg-white dark:bg-slate-800/50 py-0 gap-0 shadow-sm group">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-cyan-500 transition-colors">
                            {app.tenant.name}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
                            <MapPin className="h-3 w-3 text-cyan-500" />
                            {app.property.title}
                          </div>
                        </div>
                      </div>
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none",
                        app.application.status === 'accepted' ? "bg-green-500/10 text-green-600" :
                        app.application.status === 'pending' ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-red-500/10 text-red-600"
                      )}>
                        {app.application.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <PremiumLabel className="text-[9px] mb-1">ClearLet Score</PremiumLabel>
                        <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-black">
                          <Sparkles className="h-3.5 w-3.5" />
                          {app.tenant.tenantScore || 0}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <PremiumLabel className="text-[9px] mb-1">Monthly Income</PremiumLabel>
                        <div className="text-slate-900 dark:text-white font-black text-sm">
                          {formatCurrency(app.tenant.monthlyIncome || 0, "EUR")}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <PremiumLabel className="text-[9px] mb-1">Move-in Date</PremiumLabel>
                        <div className="text-slate-900 dark:text-white font-bold text-sm">
                          {app.application.moveInDate ? format(new Date(app.application.moveInDate), "MMM do, yyyy") : "ASAP"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <PremiumLabel className="text-[9px] mb-1">Submitted</PremiumLabel>
                        <div className="text-slate-900 dark:text-white font-bold text-sm">
                          {format(new Date(app.application.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 min-w-[140px] items-center md:items-end">
                    <PremiumButton 
                      variant="outline" 
                      size="sm"
                      className="w-full md:w-32 rounded-xl border-2"
                      onClick={() => setSelectedAppId(app.application.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </PremiumButton>
                    {app.application.status === 'pending' && (
                      <PremiumButton 
                        size="sm"
                        className="w-full md:w-32 rounded-xl bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
                        onClick={() => updateStatus.mutate({ applicationId: app.application.id, status: 'accepted' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Accept
                      </PremiumButton>
                    )}
                    {app.application.status === 'accepted' && (
                      <PremiumButton 
                        size="sm"
                        className={cn(
                          "w-full md:w-32 rounded-xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20",
                          app.contract && (app.contract.status === 'fully_signed' || app.contract.status === 'active') && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => {
                          setSelectedAppId(app.application.id);
                          setShowGenerateDialog(true);
                        }}
                        disabled={app.contract && (app.contract.status === 'fully_signed' || app.contract.status === 'active')}
                      >
                        <FilePlus className="h-4 w-4 mr-2" /> Contract
                      </PremiumButton>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-32 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              <Users className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-700 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No applications found</h3>
              <p className="text-slate-500 font-medium">Try adjusting your filters or property selection.</p>
            </div>
          )}
        </div>
      </div>

      {/* Application Details Modal */}
      <Dialog open={!!selectedAppId && !showGenerateDialog} onOpenChange={(open) => !open && setSelectedAppId(null)}>
        <DialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 z-10 backdrop-blur-xl shrink-0">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Application Details</DialogTitle>
            {applicationDetails && (
              <p className="text-slate-500 font-medium text-sm">
                For property: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{applicationDetails.propertyTitle}</span>
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoadingDetails || !applicationDetails ? (
              <div className="p-20 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading application data...</p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-slate-50/30 dark:bg-slate-900/10">
                {/* Tenant Header */}
                <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shrink-0">
                    <User className="h-10 w-10" />
                  </div>
                  <div className="text-center flex-1 min-w-0 w-full">
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{applicationDetails.tenantName}</h4>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium truncate max-w-full">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate">{applicationDetails.tenantEmail}</span>
                      </div>
                      {applicationDetails.tenantPhone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium truncate max-w-full">
                          <Users className="h-4 w-4 shrink-0" />
                          <span className="truncate">{applicationDetails.tenantPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <PremiumStatusBadge status={applicationDetails.verificationStatus} label={applicationDetails.verificationStatus === 'verified' ? 'Verified Identity' : 'Unverified'} className="justify-center w-full sm:w-auto" />
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest text-center border border-slate-200 dark:border-slate-600">
                      ID: #{applicationDetails.userId}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Financials */}
                  <PremiumCard title="Rental & Financial" icon={Euro}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black text-slate-400 uppercase">Lease Term</span>
                        <span className="font-bold text-slate-900 dark:text-white">{applicationDetails.leaseLength} Months</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black text-slate-400 uppercase">Move-in Date</span>
                        <span className="font-bold text-slate-900 dark:text-white">{applicationDetails.moveInDate ? format(new Date(applicationDetails.moveInDate), "PPP") : 'ASAP'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Occupants</span>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-cyan-500" />
                          <span className="font-bold text-slate-900 dark:text-white">{applicationDetails.numberOfOccupants || 1} Person(s)</span>
                        </div>
                      </div>
                    </div>
                  </PremiumCard>

                  {/* Pet Info */}
                  <PremiumCard title="Pet Information" icon={Home}>
                    {applicationDetails.hasPets ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-black text-slate-400 uppercase">Pet Type</span>
                          <span className="font-bold text-slate-900 dark:text-white capitalize">{applicationDetails.petType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase">Count</span>
                          <span className="font-bold text-slate-900 dark:text-white">{applicationDetails.petCount}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                        <Home className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No pets declared</p>
                      </div>
                    )}
                  </PremiumCard>
                </div>

                {/* Message */}
                <PremiumCard title="Personal Message" icon={MessageSquare}>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-100 dark:border-slate-800 italic text-slate-600 dark:text-slate-300 leading-relaxed relative">
                    <span className="absolute top-2 left-2 text-4xl text-slate-200 dark:text-slate-800 font-serif leading-none">"</span>
                    <p className="relative z-10 px-4">{applicationDetails.message || "No message provided."}</p>
                  </div>
                </PremiumCard>

                {/* Documents */}
                <PremiumCard title="Shared Documents" icon={ShieldCheck} description="Documents shared by the tenant for verification">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { type: 'id', label: 'ID Verification', shared: applicationDetails.shareIdDocument },
                      { type: 'income', label: 'Income Proof', shared: applicationDetails.shareIncomeDocument },
                      { type: 'employment', label: 'Employment Proof', shared: applicationDetails.shareEmploymentDocument },
                      { type: 'reference', label: 'References', shared: applicationDetails.shareReferences },
                    ].filter(d => d.shared).map((docInfo) => {
                      // Find actual document in the list
                      const doc = applicationDetails.documents?.find((d: any) => d.documentType === docInfo.type);
                      
                      return (
                        <div key={docInfo.type} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-400/50 transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                              <FileCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{docInfo.label}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate">{doc ? 'Available' : 'Pending Upload'}</p>
                            </div>
                          </div>
                          {doc && (
                            <PremiumButton size="icon" variant="ghost" onClick={() => handleViewDocument(doc.id, doc.fileName || docInfo.label, doc.mimeType)} className="h-8 w-8 shrink-0">
                              <Eye className="h-4 w-4" />
                            </PremiumButton>
                          )}
                        </div>
                      );
                    })}
                    
                    {(!applicationDetails.shareIdDocument && !applicationDetails.shareIncomeDocument && !applicationDetails.shareEmploymentDocument && !applicationDetails.shareReferences) && (
                      <div className="col-span-full py-8 text-center text-slate-500">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No documents shared with this application.</p>
                      </div>
                    )}
                  </div>
                </PremiumCard>
              </div>
            )}
          </div>

          {applicationDetails && (
            <div className="p-6 sm:p-8 border-t-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex flex-col gap-4 shrink-0 items-center">
              {applicationDetails.status === 'pending' ? (
                <>
                  <PremiumButton 
                    className="w-full sm:w-64 h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-600 shadow-xl shadow-cyan-500/20"
                    onClick={() => updateStatus.mutate({ applicationId: applicationDetails.id, status: 'accepted' })}
                    isLoading={updateStatus.isPending}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" /> Accept Application
                  </PremiumButton>
                  <PremiumButton 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-64 h-12 border-2 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => updateStatus.mutate({ applicationId: applicationDetails.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-5 w-5 mr-2" /> Reject Application
                  </PremiumButton>
                </>
              ) : applicationDetails.status === 'accepted' ? (
                <PremiumButton 
                  className={cn(
                    "w-full sm:w-64 h-12 rounded-2xl bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/20",
                    applicationDetails.contract && (applicationDetails.contract.status === 'fully_signed' || applicationDetails.contract.status === 'active') && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => setShowGenerateDialog(true)}
                  disabled={applicationDetails.contract && (applicationDetails.contract.status === 'fully_signed' || applicationDetails.contract.status === 'active')}
                >
                  <FilePlus className="h-5 w-5 mr-2" /> Generate Contract
                </PremiumButton>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Contract Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Generate Rental Contract</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Generate a contract for this application. Select a template to include custom terms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <PremiumLabel>Language</PremiumLabel>
              <Select value={contractLanguage} onValueChange={setContractLanguage}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 z-[100]">
                  <SelectItem value="en">English (International)</SelectItem>
                  <SelectItem value="es">Spanish (Español)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <PremiumLabel>Contract Template</PremiumLabel>
              <Select 
                value={selectedTemplateId?.toString() || "default"} 
                onValueChange={(val) => setSelectedTemplateId(val === "default" ? null : parseInt(val))}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem value="default">Standard Rental Contract (Default)</SelectItem>
                  {templates?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <PremiumButton variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</PremiumButton>
            <PremiumButton 
              onClick={handleGenerateContract}
              isLoading={createContract.isPending}
              className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
            >
              Generate & Preview
            </PremiumButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PremiumDocumentViewer
        open={!!viewingDoc}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        url={viewingDoc?.url || null}
        fileName={viewingDoc?.fileName}
        type={viewingDoc?.type}
      />
    </PremiumPageContainer>
  );
}
