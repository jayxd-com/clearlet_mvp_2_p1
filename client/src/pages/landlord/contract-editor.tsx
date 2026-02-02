import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, Send, FileText, CheckSquare, Eye, ArrowLeft, Calendar, Euro, User, Mail, Phone, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PremiumPageContainer,
  PremiumPageHeader,
  PremiumCard,
  PremiumButton,
  PremiumLabel,
  PremiumInput,
  PremiumTextarea
} from "@/components/premium";

export default function ContractEditorPage() {
  const [, params] = useRoute("/landlord/contract/:id/edit");
  const [, setLocation] = useLocation();
  const contractId = params?.id ? parseInt(params.id) : null;
  
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");
  
  const { data: contract, isLoading } = trpc.contracts.getById.useQuery(
    { contractId: contractId! },
    { enabled: !!contractId }
  );
  
  const { data: checklists } = trpc.checklist.getTemplates.useQuery();
  
  const updateMutation = trpc.contracts.updateContract.useMutation();
  const attachChecklistMutation = trpc.contracts.attachChecklist.useMutation();
  const sendMutation = trpc.contracts.sendToTenant.useMutation();
  
  const [formData, setFormData] = useState<any>({
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    monthlyRent: 0,
    securityDeposit: 0,
    startDate: "",
    endDate: "",
    terms: "",
    specialConditions: "",
  });
  
  useEffect(() => {
    if (contract) {
      setFormData({
        tenantName: contract.tenantName || contract.tenant?.name || "",
        tenantEmail: contract.tenantEmail || contract.tenant?.email || "",
        tenantPhone: contract.tenantPhone || contract.tenant?.phone || "",
        monthlyRent: contract.monthlyRent ? contract.monthlyRent / 100 : 0,
        securityDeposit: contract.securityDeposit ? contract.securityDeposit / 100 : 0,
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : "",
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
        terms: contract.terms || "",
        specialConditions: contract.specialConditions || "",
      });
      if (contract.checklistId) setSelectedChecklistId(contract.checklistId.toString());
    }
  }, [contract]);
  
  const handleSave = async () => {
    if (!contractId) return;
    try {
      await updateMutation.mutateAsync({
        contractId,
        updates: {
          ...formData,
          monthlyRent: Math.round(formData.monthlyRent * 100),
          securityDeposit: Math.round(formData.securityDeposit * 100),
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        },
      });
      toast.success("Contract saved");
    } catch (error) {
      toast.error("Failed to save");
    }
  };
  
  const handleSend = async () => {
    if (!contractId) return;
    try {
      await sendMutation.mutateAsync({ contractId });
      toast.success("Contract sent to tenant!");
      setLocation("/landlord/contracts");
    } catch (error) {
      toast.error("Failed to send");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading editor...</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumButton variant="ghost" onClick={() => setLocation("/landlord/contracts")} className="mb-6 pl-0 hover:bg-transparent text-slate-500 hover:text-cyan-500">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contracts
      </PremiumButton>

      <PremiumPageHeader
        title="Contract Editor"
        subtitle="Fine-tune the agreement terms and details before sending"
        icon={Edit}
        action={{
          label: "Send to Tenant",
          onClick: handleSend,
          icon: Send
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PremiumCard title="Agreement Terms" icon={FileText} description="Define the legal terms and conditions">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <PremiumLabel>Main Terms</PremiumLabel>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Markdown Supported</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Use <b># Header</b> for titles, <b>**bold**</b> for emphasis, and <b>- Item</b> for lists.
                </div>
                <PremiumTextarea 
                  value={formData.terms} 
                  onChange={(e) => setFormData({...formData, terms: e.target.value})} 
                  rows={20} 
                  className="font-mono text-sm leading-relaxed" 
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>Special Conditions</PremiumLabel>
                <PremiumTextarea 
                  value={formData.specialConditions} 
                  onChange={(e) => setFormData({...formData, specialConditions: e.target.value})} 
                  rows={5} 
                />
              </div>
            </div>
          </PremiumCard>
        </div>

        <div className="space-y-8">
          <PremiumCard title="Lease Details" icon={Calendar} description="Financials and dates">
            <div className="space-y-4">
              <div className="space-y-2">
                <PremiumLabel>Monthly Rent (€)</PremiumLabel>
                <PremiumInput 
                  type="number" 
                  value={formData.monthlyRent} 
                  onChange={(e) => setFormData({...formData, monthlyRent: parseFloat(e.target.value)})} 
                  icon={Euro}
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>Security Deposit (€)</PremiumLabel>
                <PremiumInput 
                  type="number" 
                  value={formData.securityDeposit} 
                  onChange={(e) => setFormData({...formData, securityDeposit: parseFloat(e.target.value)})} 
                  icon={Euro}
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>Start Date</PremiumLabel>
                <PremiumInput 
                  type="date" 
                  value={formData.startDate} 
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>End Date</PremiumLabel>
                <PremiumInput 
                  type="date" 
                  value={formData.endDate} 
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard title="Move-In Checklist" icon={CheckSquare} description="Attach a condition report">
            {contract?.checklistId ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-100 dark:border-green-900/50 rounded-xl">
                <span className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Checklist Attached
                </span>
                <PremiumButton variant="ghost" size="sm" onClick={() => setShowChecklistDialog(true)}>Change</PremiumButton>
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <p className="text-sm text-slate-500 mb-4">No checklist attached yet.</p>
                <PremiumButton variant="outline" className="w-full border-2 border-dashed" onClick={() => setShowChecklistDialog(true)}>
                  <CheckSquare className="h-4 w-4 mr-2" /> Attach Checklist
                </PremiumButton>
              </div>
            )}
          </PremiumCard>

          <PremiumButton 
            variant="outline" 
            className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={handleSave} 
            isLoading={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </PremiumButton>
        </div>
      </div>

      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Select Move-In Checklist</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <PremiumLabel>Checklist Template</PremiumLabel>
              <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                <SelectTrigger className="h-14 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  {checklists?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PremiumButton onClick={() => {
              if (contractId && selectedChecklistId) {
                attachChecklistMutation.mutate({ contractId: contractId!, templateId: parseInt(selectedChecklistId) });
                setShowChecklistDialog(false);
              }
            }}>
              Confirm Attachment
            </PremiumButton>
          </div>
        </DialogContent>
      </Dialog>
    </PremiumPageContainer>
  );
}
