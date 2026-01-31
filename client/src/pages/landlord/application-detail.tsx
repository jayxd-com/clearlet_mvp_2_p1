import { 
  CheckCircle, XCircle, Clock, TrendingUp, Info, Send, 
  User, Mail, Phone, Calendar, ArrowLeft, Shield, FileText, MessageSquare, Globe 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PremiumLabel, PremiumButton } from "@/components/premium";

export default function LandlordApplicationDetailPage() {
  const [, params] = useRoute("/landlord/applications/:id");
  const [, setLocation] = useLocation();
  const applicationId = params?.id ? parseInt(params.id) : 0;

  const [showContractDialog, setShowContractDialog] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("none");
  const [contractLanguage, setContractLanguage] = useState<string>("en");

  const { data: app, isLoading, refetch } = trpc.applications.getDetails.useQuery(
    { applicationId },
    { enabled: applicationId > 0 }
  );

  const { data: checklists } = trpc.checklist.getTemplates.useQuery();

  const updateStatusMutation = trpc.applications.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Application status updated");
      refetch();
    }
  });

  const handleGenerateContract = () => {
    if (!app) return;
    const checklistParam = selectedChecklistId !== "none" ? `&checklistId=${selectedChecklistId}` : "";
    setLocation(`/landlord/contracts?autoGenerate=true&applicationId=${app.id}${checklistParam}&language=${contractLanguage}`);
  };

  if (isLoading) return <div className="p-8 text-center">Loading application...</div>;
  if (!app) return <div className="p-8 text-center text-red-500">Application not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/landlord/applications")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Applications
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-2 shadow-xl">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">Tenant Application</CardTitle>
                  <Badge className={
                    app.status === "accepted" ? "bg-green-500" :
                    app.status === "rejected" ? "bg-red-500" :
                    "bg-yellow-500"
                  }>
                    {app.status?.toUpperCase() || "PENDING"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Personal Message</h3>
                  <p className="text-lg text-slate-700 dark:text-slate-200 italic leading-relaxed">
                    "{app.message || "No message provided."}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Move-in Date</p>
                    <p className="font-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-500" />
                      {app.moveInDate ? new Date(app.moveInDate).toLocaleDateString() : "Flexible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Lease Length</p>
                    <p className="font-bold">{app.leaseLength} Months</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Details */}
            <Card className="border-2 shadow-xl">
              <CardHeader className="border-b"><CardTitle>Verification & Proofs</CardTitle></CardHeader>
              <CardContent className="p-8">
                <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-100 dark:border-cyan-800 rounded-2xl mb-6">
                  <div className="flex items-center gap-4">
                    <Shield className="h-8 w-8 text-cyan-500" />
                    <div>
                      <p className="font-bold text-cyan-900 dark:text-cyan-100">Verification Score</p>
                      <p className="text-xs text-cyan-700 dark:text-cyan-300">Identity and document validity</p>
                    </div>
                  </div>
                  <p className="text-4xl font-black text-cyan-500">{app.verificationStatus === "verified" ? "100%" : "Pending"}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase">Shared Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Identity (DNI/NIE)", shared: app.shareIdDocument },
                      { label: "Income Verification", shared: app.shareIncomeDocument },
                      { label: "Employment Proof", shared: app.shareEmploymentDocument },
                      { label: "References", shared: app.shareReferences },
                    ].map((doc, i) => (
                      <div key={i} className={`p-4 border-2 rounded-xl flex items-center justify-between ${doc.shared ? "border-green-200 bg-green-50/30" : "opacity-50 grayscale"}`}>
                        <span className="text-sm font-bold">{doc.label}</span>
                        {doc.shared ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-slate-300" />}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="border-2 shadow-xl sticky top-24">
              <CardHeader className="border-b"><CardTitle>Applicant Profile</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                    {app.tenantName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-xl">{app.tenantName}</p>
                    <Badge variant="outline" className="mt-1">Tenant</Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{app.tenantEmail}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{app.tenantPhone || "No phone"}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t">
                  {app.status === "pending" && (
                    <>
                      <Button className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 shadow-lg" onClick={() => updateStatusMutation.mutate({ applicationId: app.id, status: "accepted" })}>
                        Approve Application
                      </Button>
                      <Button variant="outline" className="w-full border-2 font-bold h-12" onClick={() => updateStatusMutation.mutate({ applicationId: app.id, status: "rejected" })}>
                        Reject Application
                      </Button>
                    </>
                  )}
                  {app.status === "accepted" && (
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold h-12 shadow-lg" onClick={() => setShowContractDialog(true)}>
                      Generate Contract
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full text-slate-500" onClick={() => setLocation(`/landlord/messages?userId=${app.userId}`)}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Message Tenant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Setup</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <PremiumLabel>Language</PremiumLabel>
              <Select value={contractLanguage} onValueChange={setContractLanguage}>
                <SelectTrigger className="h-14 border-2 rounded-xl">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 z-[100]">
                  <SelectItem value="en">English (International)</SelectItem>
                  <SelectItem value="es">Spanish (Español)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <PremiumLabel>Move-In Checklist (Optional)</PremiumLabel>
              <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                <SelectTrigger className="h-14 border-2 rounded-xl">
                  <SelectValue placeholder="Select a checklist template" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 z-[100]">
                  <SelectItem value="none">No Checklist</SelectItem>
                  {checklists?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Attaching a checklist template will allow you and the tenant to document the property condition at move-in.
              </p>
            </div>
            <PremiumButton className="w-full h-12 text-lg" onClick={handleGenerateContract}>
              Continue to Contract Editor
            </PremiumButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
