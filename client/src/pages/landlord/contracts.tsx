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
  Edit,
  Send,
  Trash2,
  AlertTriangle,
  Check,
  X,
  ClipboardList
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
} from "@/components/ui/dialog";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import KeyCollectionScheduler from "@/components/KeyCollectionScheduler";
import { PremiumPageHeader, PremiumPageContainer, PremiumStatCard, PremiumButton, PremiumCard, PremiumInput, PremiumLabel, PremiumStatusBadge, PremiumDocumentViewer } from "@/components/premium";
import { PremiumConfirmationDialog } from "@/components/premium/PremiumConfirmationDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatCents } from "@/lib/currency";

export default function LandlordContractsPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; fileName: string } | null>(null);
  const [contractToDelete, setContractToDelete] = useState<number | null>(null);
  const [contractToTerminate, setContractToTerminate] = useState<any>(null);
  const [contractToEdit, setContractToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    monthlyRent: 0,
    securityDeposit: 0,
    startDate: "",
    endDate: ""
  });
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationDate, setTerminationDate] = useState("");

  const utils = trpc.useUtils();

  const signMutation = trpc.contracts.sign.useMutation();
  const updateContractMutation = trpc.contracts.updateContract.useMutation({
    onSuccess: () => {
      toast.success("Contract updated successfully");
      setContractToEdit(null);
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });
  const sendContractMutation = trpc.contracts.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Contract sent to tenant successfully");
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });
  const generatePdfMutation = trpc.contracts.generatePdf.useMutation();
  const deleteContractMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contract deleted");
      setContractToDelete(null);
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });
  
  const requestTerminationMutation = trpc.contractModifications.requestTermination.useMutation({
    onSuccess: () => {
      toast.success("Termination request sent");
      setContractToTerminate(null);
      setTerminationReason("");
      setTerminationDate("");
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const { data: contractsData, isLoading, refetch } = trpc.contracts.getLandlordContracts.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Fetch Pending Requests
  const { data: pendingRequests, refetch: refetchRequests } = trpc.contractModifications.getPendingRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const respondTermination = trpc.contractModifications.respondTermination.useMutation({
    onSuccess: () => {
      toast.success("Response sent");
      refetchRequests();
      refetch();
    }
  });

  const respondAmendment = trpc.contractModifications.respondAmendment.useMutation({
    onSuccess: () => {
      toast.success("Response sent");
      refetchRequests();
    }
  });

  const handlePreview = async (contract: any) => {
    try {
      toast.loading("Generating preview...");
      const result: any = await generatePdfMutation.mutateAsync({ contractId: contract.id });
      toast.dismiss();
      setPreviewDoc({
        url: result.pdfUrl,
        fileName: `Contract - ${contract.property.title}.pdf`
      });
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate preview');
    }
  };

  const handleDownloadPdf = async (contractId: number) => {
    try {
      toast.loading("Downloading...");
      const result: any = await generatePdfMutation.mutateAsync({ contractId });
      toast.dismiss();
      window.open(result.pdfUrl, '_blank');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download PDF');
    }
  };

  const handleSignature = async (signature: string) => {
    if (!selectedContract) return;
    try {
      await signMutation.mutateAsync({ contractId: selectedContract.id, signature });
      toast.success("Contract signed successfully");
      setShowSignDialog(false);
      refetch();
    } catch (error) {
      toast.error("Failed to sign contract");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching contracts...</p>
        </div>
      </div>
    );
  }

  const contracts = contractsData || [];
  const hasRequests = pendingRequests && (pendingRequests.terminations.length > 0 || pendingRequests.amendments.length > 0);

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader
        title="Digital Contracts"
        subtitle="Manage and sign rental agreements securely"
        icon={FileText}
        action={{
          label: "Generate New",
          onClick: () => setLocation("/landlord/applications")
        }}
      />

      <div className="space-y-8">
        {/* Pending Requests Alert Section */}
        {hasRequests && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Action Required
            </h3>
            
            {pendingRequests?.terminations.map((req: any) => (
              <PremiumCard key={`term-${req.id}`} className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <Badge className="bg-red-500 text-white font-bold mb-2">Termination Request</Badge>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{req.property.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      <span className="font-bold">{req.requester.name}</span> wants to end the tenancy on <span className="font-bold">{new Date(req.desiredEndDate).toLocaleDateString()}</span>.
                    </p>
                    <div className="mt-3 p-3 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Reason</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{req.reason}"</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <PremiumButton 
                      onClick={() => respondTermination.mutate({ terminationId: req.id, approved: false })}
                      variant="outline" 
                      className="bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      isLoading={respondTermination.isPending}
                    >
                      <X className="h-4 w-4 mr-2" /> Reject
                    </PremiumButton>
                    <PremiumButton 
                      onClick={() => respondTermination.mutate({ terminationId: req.id, approved: true })}
                      className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                      isLoading={respondTermination.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" /> Approve Termination
                    </PremiumButton>
                  </div>
                </div>
              </PremiumCard>
            ))}

            {pendingRequests?.amendments.map((req: any) => (
              <PremiumCard key={`amend-${req.id}`} className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <Badge className="bg-blue-500 text-white font-bold mb-2">Change Request</Badge>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{req.property.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      <span className="font-bold">{req.requester.name}</span> has requested a change in circumstances.
                    </p>
                    <div className="mt-3 p-3 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Description</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{req.description}"</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <PremiumButton 
                      onClick={() => respondAmendment.mutate({ amendmentId: req.id, approved: false })}
                      variant="outline" 
                      className="bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      isLoading={respondAmendment.isPending}
                    >
                      <X className="h-4 w-4 mr-2" /> Reject
                    </PremiumButton>
                    <PremiumButton 
                      onClick={() => respondAmendment.mutate({ amendmentId: req.id, approved: true })}
                      className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      isLoading={respondAmendment.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" /> Approve Change
                    </PremiumButton>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <PremiumStatCard
            label="Total"
            value={contracts.length}
            icon={FileText}
            color="text-purple-500"
            bg="bg-purple-50 dark:bg-purple-900/20"
          />
          <PremiumStatCard
            label="Pending"
            value={contracts.filter((c: any) => ["sent_to_tenant", "tenant_signed"].includes(c.status)).length}
            icon={Clock}
            color="text-blue-500"
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
          <PremiumStatCard
            label="Fully Signed"
            value={contracts.filter((c: any) => ["fully_signed", "active"].includes(c.status)).length}
            icon={CheckCircle}
            color="text-green-500"
            bg="bg-green-50 dark:bg-green-900/20"
          />
          <PremiumStatCard
            label="Active Leases"
            value={contracts.filter((c: any) => c.status === "active").length}
            icon={Home}
            color="text-emerald-500"
            bg="bg-emerald-50 dark:bg-emerald-900/20"
          />
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {contracts.length === 0 ? (
            <div className="text-center py-32 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              <FileText className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-700 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No contracts found</h3>
              <p className="text-slate-500 font-medium">Accept an application to start the contract process.</p>
            </div>
          ) : contracts.map((contract: any) => (
            <PremiumCard key={contract.id} className="group hover:border-cyan-400/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{contract.property?.title}</h3>
                    <PremiumStatusBadge status={contract.status} />
                    {contract.depositPaid && (
                      <PremiumStatusBadge status="paid" label="Deposit Paid" />
                    )}
                    {contract.firstMonthRentPaid && (
                      <PremiumStatusBadge status="paid" label="Rent Paid" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-4">{contract.property?.address}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenant</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate">{contract.tenant?.name}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rent</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{formatCents(contract.monthlyRent || 0, contract.currency || "EUR")}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{format(new Date(contract.startDate), "dd/MM/yy")}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{format(new Date(contract.endDate), "dd/MM/yy")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 min-w-[140px] items-center md:items-end">
                  {contract.checklistStatus === "tenant_signed" && (
                    <PremiumButton 
                      size="sm"
                      className="w-full md:w-32 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                      onClick={() => setLocation(`/landlord/checklist/${contract.id}`)}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" /> Review
                    </PremiumButton>
                  )}

                  {contract.checklistStatus === "completed" && (
                    <PremiumButton 
                      variant="outline"
                      size="sm"
                      className="w-full md:w-32 rounded-xl border-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setLocation(`/landlord/checklist/${contract.id}`)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Checklist
                    </PremiumButton>
                  )}

                  <PremiumButton 
                    variant="outline" 
                    size="sm"
                    className="w-full md:w-32 rounded-xl border-2"
                    onClick={() => handlePreview(contract)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> View
                  </PremiumButton>

                  {contract.status === "draft" && (
                    <PremiumButton 
                      size="sm"
                      className="w-full md:w-32 rounded-xl bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
                      onClick={() => sendContractMutation.mutate({ contractId: contract.id, status: "sent_to_tenant" })}
                      isLoading={sendContractMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" /> Send
                    </PremiumButton>
                  )}

                  {contract.status === "tenant_signed" && (
                    <PremiumButton 
                      size="sm"
                      className="w-full md:w-32 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                      onClick={() => { setSelectedContract(contract); setShowSignDialog(true); }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Sign
                    </PremiumButton>
                  )}

                  {(contract.status === "fully_signed" || contract.status === "active") && (
                    <PremiumButton 
                      variant="ghost" 
                      size="sm"
                      className="w-full md:w-32 text-slate-500 hover:text-cyan-500"
                      onClick={() => handleDownloadPdf(contract.id)}
                    >
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </PremiumButton>
                  )}

                  {/* Edit Option for active contracts */}
                  {["active", "fully_signed"].includes(contract.status) && (
                    <PremiumButton 
                      variant="outline" 
                      size="sm"
                      className="w-full md:w-32 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        setContractToEdit(contract);
                        setEditForm({
                          monthlyRent: contract.monthlyRent / 100,
                          securityDeposit: contract.securityDeposit / 100,
                          startDate: new Date(contract.startDate).toISOString().split('T')[0],
                          endDate: new Date(contract.endDate).toISOString().split('T')[0]
                        });
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Modify
                    </PremiumButton>
                  )}

                  {/* Terminate Option for active contracts */}
                  {["active", "fully_signed"].includes(contract.status) && (
                    <PremiumButton 
                      variant="outline" 
                      size="sm"
                      className="w-full md:w-32 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      onClick={() => setContractToTerminate(contract)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" /> Terminate
                    </PremiumButton>
                  )}

                  {/* Delete Option for incomplete or ended contracts */}
                  {["draft", "sent_to_tenant", "tenant_signed", "terminated", "expired"].includes(contract.status) && (
                    <PremiumButton 
                      variant="ghost" 
                      size="sm"
                      className="w-full md:w-32 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setContractToDelete(contract.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </PremiumButton>
                  )}
                </div>
              </div>
              
            {/* Key Collection Integration for Active Contracts (After Deposit) */}
            {contract.status === "active" || (contract.status === "fully_signed" && contract.depositPaid) ? (
              <div className="mt-6 pt-6 border-t-2 border-slate-50 dark:border-slate-700/50">
                <KeyCollectionScheduler
                  contractId={contract.id}
                  userRole="landlord"
                  onScheduled={() => refetch()}
                />
              </div>
            ) : null}
            </PremiumCard>
          ))}
        </div>
      </div>

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 border-b-2 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Landlord Signature</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border-dashed border-slate-200 dark:border-slate-800">
              <SignatureCanvas onSave={handleSignature} onCancel={() => setShowSignDialog(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Termination Dialog */}
      <Dialog open={!!contractToTerminate} onOpenChange={(open) => !open && setContractToTerminate(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Terminate Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Request to end the contract for <span className="font-bold">{contractToTerminate?.property?.title}</span>.
              The tenant will be notified.
            </p>
            
            <div className="space-y-2">
              <PremiumLabel required>Termination Date</PremiumLabel>
              <PremiumInput 
                type="date" 
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <PremiumLabel required>Reason</PremiumLabel>
              <textarea 
                className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-transparent focus:border-cyan-500 outline-none transition-all min-h-[100px]"
                placeholder="Please explain why you want to terminate this contract..."
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <PremiumButton 
                variant="outline" 
                className="flex-1"
                onClick={() => setContractToTerminate(null)}
              >
                Cancel
              </PremiumButton>
              <PremiumButton 
                className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                onClick={() => {
                  if (!terminationDate || terminationReason.length < 10) {
                    toast.error("Please provide a date and a valid reason (min 10 chars)");
                    return;
                  }
                  requestTerminationMutation.mutate({
                    contractId: contractToTerminate.id,
                    desiredEndDate: new Date(terminationDate).toISOString(),
                    reason: terminationReason
                  });
                }}
                isLoading={requestTerminationMutation.isPending}
              >
                Submit Request
              </PremiumButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modification Dialog */}
      <Dialog open={!!contractToEdit} onOpenChange={(open) => !open && setContractToEdit(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Modify Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Update terms for <span className="font-bold">{contractToEdit?.property?.title}</span>.
              Changes will be reflected immediately.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <PremiumLabel>Monthly Rent (€)</PremiumLabel>
                <PremiumInput 
                  type="number" 
                  value={editForm.monthlyRent}
                  onChange={(e) => setEditForm({ ...editForm, monthlyRent: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>Deposit (€)</PremiumLabel>
                <PremiumInput 
                  type="number" 
                  value={editForm.securityDeposit}
                  onChange={(e) => setEditForm({ ...editForm, securityDeposit: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <PremiumLabel>Start Date</PremiumLabel>
                <PremiumInput 
                  type="date" 
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>End Date</PremiumLabel>
                <PremiumInput 
                  type="date" 
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <PremiumButton 
                variant="outline" 
                className="flex-1"
                onClick={() => setContractToEdit(null)}
              >
                Cancel
              </PremiumButton>
              <PremiumButton 
                className="flex-1 bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                onClick={() => {
                  updateContractMutation.mutate({
                    contractId: contractToEdit.id,
                    updates: {
                      monthlyRent: editForm.monthlyRent * 100,
                      securityDeposit: editForm.securityDeposit * 100,
                      startDate: new Date(editForm.startDate),
                      endDate: new Date(editForm.endDate)
                    }
                  });
                }}
                isLoading={updateContractMutation.isPending}
              >
                Save Changes
              </PremiumButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PremiumConfirmationDialog
        open={!!contractToDelete}
        onOpenChange={(open) => !open && setContractToDelete(null)}
        title="Delete Contract"
        description="Are you sure you want to delete this contract? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (contractToDelete) deleteContractMutation.mutate({ contractId: contractToDelete });
        }}
        isLoading={deleteContractMutation.isPending}
      />

      {/* PDF Previewer */}
      <PremiumDocumentViewer
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        url={previewDoc?.url || null}
        fileName={previewDoc?.fileName}
        type="application/pdf"
      />
    </PremiumPageContainer>
  );
}