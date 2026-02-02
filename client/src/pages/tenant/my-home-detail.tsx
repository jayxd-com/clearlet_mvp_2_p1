import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Home, 
  MapPin, 
  Key, 
  Wrench,
  CheckSquare,
  Mail,
  Phone,
  Shield,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  FileText,
  MoreVertical,
  AlertTriangle,
  Clock,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/currency";
import { PremiumMyHomeProgressSteps } from "@/components/premium/PremiumMyHomeProgressSteps";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MoveInChecklistModal } from "@/components/MoveInChecklistModal";

export default function TenantMyHomeDetailPage() {
  const [, params] = useRoute("/tenant/my-home/:contractId");
  const contractId = parseInt(params?.contractId || "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const [showEndTenancy, setShowEndTenancy] = useState(false);
  const [showChangeCircumstances, setShowChangeCircumstances] = useState(false);
  const [reason, setReason] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().split('T')[0];

  const { data: contract, isLoading } = trpc.contracts.getById.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  const { data: checklist } = trpc.checklist.getByContractId.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  const completeChecklistMutation = trpc.checklist.complete.useMutation({
    onSuccess: () => {
      toast.success("Checklist marked as completed");
      utils.checklist.getByContractId.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const requestTermination = trpc.contractModifications.requestTermination.useMutation({
    onSuccess: () => {
      toast.success("Termination request sent to landlord");
      setShowEndTenancy(false);
      setReason("");
    },
    onError: (err) => toast.error(err.message)
  });

  const requestAmendment = trpc.contractModifications.requestAmendment.useMutation({
    onSuccess: () => {
      toast.success("Change request sent to landlord");
      setShowChangeCircumstances(false);
      setReason("");
    },
    onError: (err) => toast.error(err.message)
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading home details...</div>;
  if (!contract) return <div className="p-8 text-center text-red-500">Contract not found</div>;

  // Calculate Progress steps
  const steps = [
    { label: "App Accepted", completed: true },
    { label: "Contract Signed", completed: !!contract.tenantSignature },
    { label: "Deposit Paid", completed: contract.depositPaid },
    { label: "First Rent Paid", completed: contract.firstMonthRentPaid },
    { label: "Keys Collected", completed: contract.keysCollected },
    { label: "Checklist Done", completed: checklist?.status === "completed" },
  ];

  const firstIncompleteIndex = steps.findIndex(s => !s.completed);
  const currentStepIndex = firstIncompleteIndex === -1 ? steps.length : firstIncompleteIndex;
  const isAllComplete = currentStepIndex === steps.length;

  const property = contract.property;
  const landlord = contract.landlord;

  // Calculate days remaining for checklist
  const checklistDeadline = contract.checklistDeadline ? new Date(contract.checklistDeadline) : null;
  const daysLeft = checklistDeadline ? Math.ceil((checklistDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isOverdue = daysLeft < 0;

  // Parse images safely
  let propertyImage = null;
  try {
    if (property?.images) {
      const images = JSON.parse(property.images as any);
      if (Array.isArray(images) && images.length > 0) propertyImage = images[0];
    }
  } catch (e) {
    // ignore
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl text-white relative">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/tenant/my-home")}
            className="absolute top-4 left-4 text-white hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to All Homes
          </Button>
          
          <div className="flex items-center justify-between mt-12 md:mt-0">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Home className="h-10 w-10" />
                {property?.title || "My Home"}
              </h1>
              <p className="text-lg text-purple-100">Manage your active tenancy</p>
            </div>
            <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Shield className="h-12 w-12 text-white opacity-80" />
            </div>
          </div>
        </div>

        {/* End Tenancy Modal */}
        <Dialog open={showEndTenancy} onOpenChange={setShowEndTenancy}>
          <DialogContent className="max-w-md rounded-2xl border-2 bg-white dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase text-red-600">Terminate Tenancy</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                Are you sure you want to request a termination? This will be sent to your landlord for approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Desired Move-out Date</label>
                <input 
                  type="date" 
                  min={today}
                  className="w-full h-12 px-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:border-red-500" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Reason for leaving</label>
                <Textarea 
                  placeholder="Explain your situation (min. 10 characters)..." 
                  className="rounded-xl border-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white min-h-[100px] placeholder:text-slate-400"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                {reason && reason.length < 10 && (
                  <p className="text-[10px] text-red-500 font-bold">Please provide a more detailed reason (at least 10 characters).</p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowEndTenancy(false)} className="rounded-xl font-bold border-2">Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={() => requestTermination.mutate({ contractId, reason, desiredEndDate: endDate })}
                className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-red-500/20"
                disabled={!endDate || reason.length < 10 || requestTermination.isPending}
              >
                {requestTermination.isPending ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Circumstances Modal */}
        <Dialog open={showChangeCircumstances} onOpenChange={setShowChangeCircumstances}>
          <DialogContent className="max-w-md rounded-2xl border-2 bg-white dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase text-cyan-600">Change in Circumstances</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                Request a modification to your contract terms (e.g. rent due date change, term extension).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Requested Changes</label>
                <Textarea 
                  placeholder="Describe the changes you need (min. 10 characters)..." 
                  className="rounded-xl border-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white min-h-[120px] placeholder:text-slate-400"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                {reason && reason.length < 10 && (
                  <p className="text-[10px] text-red-500 font-bold">Please provide more detail (at least 10 characters).</p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowChangeCircumstances(false)} className="rounded-xl font-bold border-2">Cancel</Button>
              <Button 
                onClick={() => requestAmendment.mutate({ 
                  contractId, 
                  type: "other", 
                  description: reason, 
                  changes: { reason } 
                })}
                className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-cyan-500/20"
                disabled={reason.length < 10 || requestAmendment.isPending}
              >
                {requestAmendment.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Move-In Progress Bar */}
        {!isAllComplete && (
          <div className="mb-8">
            <PremiumMyHomeProgressSteps 
              steps={steps.map(s => s.label)} 
              currentIdx={currentStepIndex} 
            />
          </div>
        )}

        {/* Tenancy Management Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => setShowChangeCircumstances(true)} 
            className="h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-500 hover:text-cyan-600 rounded-xl shadow-sm justify-start px-6 gap-3 transition-all"
          >
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Change Circumstances</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Request Modifications</p>
            </div>
          </Button>

          <Button 
            onClick={() => setShowEndTenancy(true)} 
            className="h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-red-500 hover:text-red-600 rounded-xl shadow-sm justify-start px-6 gap-3 transition-all"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">End Tenancy</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Request Termination</p>
            </div>
          </Button>
        </div>

        {/* Alerts/Notifications */}
        {checklist && checklist.status !== "completed" && (
          <div className={`mb-8 border-2 rounded-2xl p-6 flex items-center justify-between shadow-md ${isOverdue ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-lg ${isOverdue ? "bg-red-500" : "bg-orange-500"}`}>
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isOverdue ? "text-red-900 dark:text-red-100" : "text-orange-900 dark:text-orange-100"}`}>
                  Complete Move-In Checklist
                  {checklistDeadline && (
                    <span className={`ml-2 text-sm px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"}`}>
                      {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days left`}
                    </span>
                  )}
                </h3>
                <p className={`text-sm ${isOverdue ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
                  Please document the property condition to protect your deposit.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation(`/tenant/checklist/${contractId}`)} 
              className={`${isOverdue ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"} text-white font-bold h-11 px-6 rounded-xl`}
            >
              Start Checklist <CheckSquare className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Property Card */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl bg-white dark:bg-slate-800">
              <div className="h-72 bg-slate-200 relative group">
                {propertyImage ? (
                  <img 
                    src={propertyImage} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt="Property"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold">
                    <Home className="h-16 w-16 opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 text-white border-none font-black uppercase text-[10px] px-3 py-1 shadow-lg">
                    Active Tenancy
                  </Badge>
                </div>
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/90 p-6 rounded-2xl backdrop-blur shadow-2xl border border-white/20 dark:border-slate-700/50">
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white mb-1">{property?.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <MapPin className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm">{property?.address}, {property?.city}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-cyan-400/30 transition-colors">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Monthly Rent</p>
                    <p className="text-2xl font-black text-cyan-500">{formatCents(contract.monthlyRent, contract.currency || "EUR")}</p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-400/30 transition-colors">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Lease Start</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{new Date(contract.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-purple-400/30 transition-colors">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Security Deposit</p>
                    <p className="text-2xl font-black text-purple-500">{formatCents(contract.securityDeposit, contract.currency || "EUR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="font-black uppercase text-xs tracking-widest text-slate-500 mb-4 px-2">Property Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Wrench, label: "Maintenance", path: "/tenant/maintenance", color: "from-red-500 to-orange-500" },
                  { icon: Key, label: "Key Access", path: "/tenant/keys", color: "from-blue-500 to-indigo-500" },
                  { icon: DollarSign, label: "Payments", path: "/tenant/payments", color: "from-green-500 to-emerald-500" },
                  { icon: FileText, label: "Documents", path: "/tenant/documents", color: "from-purple-500 to-pink-500" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setLocation(action.path)}
                    className="p-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-xl transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
                      <action.icon className="h-7 w-7" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight text-slate-700 dark:text-slate-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-8">
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl bg-white dark:bg-slate-800 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b-2 py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Landlord Support</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-black text-xl text-slate-500 border-2 border-white dark:border-slate-600 shadow-sm">
                    {landlord?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-lg text-slate-900 dark:text-white">{landlord?.name}</p>
                    <p className="text-[10px] font-black uppercase text-cyan-500 tracking-wider">Property Owner</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 justify-start gap-3 border-2 rounded-xl font-bold hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 hover:border-cyan-400 transition-all" 
                    onClick={() => setLocation(`/tenant/messages?userId=${landlord?.id}`)}
                  >
                    <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
                      <Mail className="h-4 w-4 text-cyan-600" />
                    </div>
                    Message Landlord
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 justify-start gap-3 border-2 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    {landlord?.phone || "No phone added"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-200 dark:border-cyan-800 shadow-xl rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="h-32 w-32 rotate-12" />
              </div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-black text-xl mb-3 uppercase tracking-tighter">ClearLet Protection</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed text-cyan-50">
                  Your tenancy is fully protected. All payments and contracts are verified and legally binding under Spanish LAU regulations.
                </p>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-100">Verified Member System</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
