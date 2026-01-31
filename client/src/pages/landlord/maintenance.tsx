import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Wrench,
  Calendar,
  MessageSquare,
  User,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  DollarSign,
  Phone,
  FileText
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PremiumPageContainer,
  PremiumPageHeader,
  PremiumCard,
  PremiumButton,
  PremiumStatusBadge,
  PremiumStatCard,
  PremiumLabel,
  PremiumInput,
  PremiumTextarea
} from "@/components/premium";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCents, getCurrencySymbol } from "@/lib/currency";

export default function LandlordMaintenancePage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [commentText, setCommentText] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [contractorForm, setContractorForm] = useState({
    contractorName: "",
    contractorPhone: "",
    estimatedCost: "",
    scheduledDate: "",
  });

  const utils = trpc.useUtils();

  const { data: requests, isLoading: requestsLoading } = trpc.maintenance.getLandlordRequests.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: comments } = trpc.maintenance.getComments.useQuery(
    { requestId: selectedRequest?.id },
    { enabled: !!selectedRequest }
  );

  const updateStatus = trpc.maintenance.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.maintenance.getLandlordRequests.invalidate();
    }
  });

  const assignContractor = trpc.maintenance.assignContractor.useMutation({
    onSuccess: () => {
      toast.success("Contractor assigned");
      utils.maintenance.getLandlordRequests.invalidate();
    }
  });

  const addComment = trpc.maintenance.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.maintenance.getComments.invalidate();
    }
  });

  const stats = [
    { label: "Total Requests", value: requests?.length || 0, icon: Wrench, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Pending", value: requests?.filter((r: any) => r.status === "pending").length || 0, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "In Progress", value: requests?.filter((r: any) => r.status === "in_progress").length || 0, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Completed", value: requests?.filter((r: any) => r.status === "completed").length || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  if (requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading requests...</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumPageHeader
        title="Maintenance Dashboard"
        subtitle="Manage and track maintenance requests from your tenants"
        icon={Wrench}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <PremiumStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-8">
        <TabsList className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 h-12 p-1 rounded-2xl w-full sm:w-auto">
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Pending</TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-white">In Progress</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-6">
        {requests?.filter((r: any) => statusFilter === "all" || r.status === statusFilter).map((request: any) => (
          <PremiumCard
            key={request.id}
            title={request.title}
            description={request.property?.title}
            icon={Wrench}
            cta={
              <div className="flex gap-2">
                <PremiumStatusBadge status={request.status} />
                <Badge variant="outline" className="capitalize">{request.priority}</Badge>
              </div>
            }
          >
            <div className="flex justify-between items-start cursor-pointer" onClick={() => setSelectedRequest(request)}>
              <div className="space-y-4 w-full">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {request.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(request.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {request.tenant?.name}</span>
                </div>
              </div>
              <PremiumButton variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                Manage
              </PremiumButton>
            </div>
          </PremiumCard>
        ))}
        {requests?.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Wrench className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No maintenance requests</h3>
            <p className="text-slate-500 mt-2">Requests from tenants will appear here.</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b-2 border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl font-black">{selectedRequest.title}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Request ID: #{selectedRequest.id} • {new Date(selectedRequest.createdAt).toLocaleDateString()}
                  </DialogDescription>
                </div>
                <PremiumStatusBadge status={selectedRequest.status} />
              </div>
            </DialogHeader>

            <div className="space-y-8 py-4">
              {/* Issue Description */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <FileText className="h-5 w-5 text-cyan-500" /> Description
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedRequest.description}
                </p>
                {selectedRequest.photos && (
                  <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                     {(() => {
                        try {
                          const photos = typeof selectedRequest.photos === 'string' 
                            ? JSON.parse(selectedRequest.photos) 
                            : selectedRequest.photos;
                          
                          if (Array.isArray(photos)) {
                            return photos.map((photo: string, i: number) => (
                              <img 
                                key={i} 
                                src={photo} 
                                alt={`Issue ${i}`} 
                                className="h-24 w-24 object-cover rounded-lg border-2 border-slate-200 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                onClick={() => setZoomedImage(photo)}
                              />
                            ));
                          }
                          return null;
                        } catch (e) {
                          return null;
                        }
                      })()}
                  </div>
                )}
              </div>

              {selectedRequest.contractorName && (
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-800/50 rounded-2xl">
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" /> Current Contractor
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Name</p>
                      <p className="font-bold text-sm text-blue-900 dark:text-blue-100">{selectedRequest.contractorName}</p>
                    </div>
                    {selectedRequest.contractorPhone && (
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Phone</p>
                        <p className="font-bold text-sm text-blue-900 dark:text-blue-100">{selectedRequest.contractorPhone}</p>
                      </div>
                    )}
                    {selectedRequest.estimatedCost && (
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Estimated Cost</p>
                        <p className="font-bold text-sm text-blue-900 dark:text-blue-100">{formatCents(selectedRequest.estimatedCost, selectedRequest.property?.currency || "EUR")}</p>
                      </div>
                    )}
                    {selectedRequest.scheduledDate && (
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                        <p className="font-bold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedRequest.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-1 gap-8">
                {/* Update Status */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "in_progress", "completed", "cancelled"].map(s => (
                      <PremiumButton
                        key={s}
                        size="sm"
                        variant={selectedRequest.status === s ? "default" : "outline"}
                        className={selectedRequest.status === s ? "bg-cyan-500 hover:bg-cyan-600 border-none font-bold" : "border-2"}
                        onClick={() => {
                          updateStatus.mutate({ requestId: selectedRequest.id, status: s as any });
                          // Optimistically update the UI status
                          setSelectedRequest({...selectedRequest, status: s});
                        }}
                      >
                        {s.replace("_", " ")}
                      </PremiumButton>
                    ))}
                  </div>
                </div>

                {/* Assign Contractor */}
                <div className="space-y-4 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border-2 border-blue-100 dark:border-blue-800/50">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" /> Assign Contractor
                  </h4>
                  <div className="space-y-3">
                    <PremiumInput 
                      placeholder="Contractor Name" 
                      value={contractorForm.contractorName} 
                      onChange={(e) => setContractorForm({...contractorForm, contractorName: e.target.value})} 
                    />
                    <PremiumInput 
                      placeholder="Contractor Phone" 
                      value={contractorForm.contractorPhone} 
                      onChange={(e) => setContractorForm({...contractorForm, contractorPhone: e.target.value})} 
                    />
                    <PremiumInput 
                      type="number" 
                      placeholder={`Estimated Cost (${getCurrencySymbol(selectedRequest.property?.currency || "EUR")})`} 
                      value={contractorForm.estimatedCost} 
                      onChange={(e) => setContractorForm({...contractorForm, estimatedCost: e.target.value})} 
                    />
                    <PremiumInput 
                      type="date" 
                      value={contractorForm.scheduledDate} 
                      onChange={(e) => setContractorForm({...contractorForm, scheduledDate: e.target.value})} 
                    />
                    <PremiumButton
                      className="w-full bg-blue-500 hover:bg-blue-600 font-bold"
                      onClick={() => assignContractor.mutate({ 
                        requestId: selectedRequest.id, 
                        contractorName: contractorForm.contractorName,
                        contractorPhone: contractorForm.contractorPhone || undefined,
                        estimatedCost: contractorForm.estimatedCost ? parseFloat(contractorForm.estimatedCost) : undefined,
                        scheduledDate: contractorForm.scheduledDate || undefined
                      })}
                    >
                      Assign Contractor
                    </PremiumButton>
                  </div>
                </div>
              </div>

              {/* Updates & Comments */}
              <div className="pt-6 border-t-2 border-slate-100 dark:border-slate-800">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <MessageSquare className="h-5 w-5 text-cyan-500" /> Updates & Comments
                </h4>
                <div className="flex gap-2 mb-6">
                  <PremiumInput 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="Add a comment or update..." 
                    className="flex-1"
                  />
                  <PremiumButton onClick={() => addComment.mutate({ requestId: selectedRequest.id, comment: commentText })}>
                    Add
                  </PremiumButton>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {comments?.map((c: any) => (
                    <div key={c.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.user?.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-5xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
            <img 
              src={zoomedImage} 
              alt="Zoomed issue" 
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
              onClick={() => setZoomedImage(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </PremiumPageContainer>
  );
}