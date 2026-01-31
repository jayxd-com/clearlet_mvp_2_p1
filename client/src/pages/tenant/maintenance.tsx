import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Wrench, Plus, User, MessageSquare, Briefcase, FileText, CheckCircle, AlertCircle, Clock, XCircle, Search, Calendar, Phone } from "lucide-react";
import {
  PremiumPageContainer,
  PremiumPageHeader,
  PremiumCard,
  PremiumButton,
  PremiumStatusBadge,
  PremiumInput,
  PremiumLabel,
  PremiumTextarea,
  PremiumStatCard
} from "@/components/premium";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { PROPERTY_IMAGE_CONFIG } from "@/lib/imageUpload";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/currency";

export default function TenantMaintenancePage() {
  const { user, isAuthenticated } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "plumbing" as "plumbing" | "electrical" | "heating" | "appliance" | "structural" | "pest" | "other",
    photos: [] as string[],
  });

  const utils = trpc.useUtils();

  const { data: contracts } = trpc.contracts.getTenantContracts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: requests, isLoading: requestsLoading } = trpc.maintenance.getTenantRequests.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: comments } = trpc.maintenance.getComments.useQuery(
    { requestId: selectedRequest?.id },
    { enabled: !!selectedRequest }
  );

  const createRequest = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      toast.success("Maintenance request submitted");
      setIsCreateDialogOpen(false);
      setFormData({ 
        propertyId: "", 
        title: "", 
        description: "", 
        priority: "medium", 
        category: "plumbing",
        photos: [] 
      });
      utils.maintenance.getTenantRequests.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit request");
    }
  });

  const uploadImageMutation = trpc.uploads.uploadImage.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.title || !formData.description) return;

    const contract = contracts?.find((c: any) => c.propertyId === parseInt(formData.propertyId));
    if (!contract) return;

    createRequest.mutate({
      ...formData,
      propertyId: parseInt(formData.propertyId),
      landlordId: contract.landlordId,
    });
  };

  const stats = [
    { label: "Total Requests", value: requests?.length || 0, icon: Wrench, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Pending", value: requests?.filter((r: any) => r.status === "pending").length || 0, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "In Progress", value: requests?.filter((r: any) => r.status === "in_progress").length || 0, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Completed", value: requests?.filter((r: any) => r.status === "completed").length || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  const handleImageUpload = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          uploadImageMutation.mutate(
            {
              fileName: file.name,
              fileData: reader.result,
              mimeType: file.type,
            },
            {
              onSuccess: (data) => {
                setFormData((prev) => ({
                  ...prev,
                  photos: [...prev.photos, data.url],
                }));
                toast.success("Image uploaded successfully");
                resolve();
              },
              onError: (error) => {
                toast.error(`Failed to upload image: ${error.message}`);
                reject(error);
              },
            }
          );
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  };

  if (requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading maintenance requests...</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumPageHeader
        title="Maintenance"
        subtitle="Report issues and track repairs for your home"
        icon={Wrench}
        action={{
          label: "New Request",
          onClick: () => setIsCreateDialogOpen(true),
          icon: Plus
        }}
      />

      {/* Stats Grid */}
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

      {/* Requests List */}
      <div className="space-y-6">
        {requests && requests.length > 0 ? (
          requests.map((request: any) => (
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
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {request.description}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Opened on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <PremiumButton variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                  View Details
                </PremiumButton>
              </div>
            </PremiumCard>
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Wrench className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No maintenance requests</h3>
            <p className="text-slate-500 mt-2">Submit a request if you need something fixed.</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">New Maintenance Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <PremiumLabel>Property</PremiumLabel>
              <Select onValueChange={(v) => setFormData({...formData, propertyId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  {contracts?.map((c: any) => (
                    <SelectItem key={c.propertyId} value={c.propertyId.toString()}>{c.property?.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <PremiumLabel>Issue Title</PremiumLabel>
              <PremiumInput 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Leaking faucet in kitchen"
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <PremiumLabel>Category</PremiumLabel>
                <Select onValueChange={(v: any) => setFormData({...formData, category: v})} defaultValue={formData.category}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="heating">Heating</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="pest">Pest Control</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <PremiumLabel>Priority</PremiumLabel>
                <Select onValueChange={(v: any) => setFormData({...formData, priority: v})} defaultValue={formData.priority}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <PremiumLabel>Description</PremiumLabel>
              <PremiumTextarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                rows={4} 
                placeholder="Please describe the issue in detail..."
                required 
              />
            </div>

            <div className="space-y-2">
              <PremiumLabel>Photos</PremiumLabel>
              <ImageUpload
                config={PROPERTY_IMAGE_CONFIG}
                onUpload={handleImageUpload}
                maxFiles={5}
                label="Upload Photos of the Issue"
              />
            </div>

            <PremiumButton 
              type="submit" 
              className="w-full h-14 text-lg" 
              isLoading={createRequest.isPending || uploadImageMutation.isPending}
            >
              Submit Request
            </PremiumButton>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto">
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
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 rounded-2xl">
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" /> Assigned Contractor
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
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
                      <div className={selectedRequest.estimatedCost ? "" : "col-span-2"}>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                        <p className="font-bold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedRequest.scheduledDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <MessageSquare className="h-5 w-5 text-cyan-500" /> Updates & Comments
                </h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {comments?.length === 0 ? (
                    <p className="text-slate-500 italic text-sm">No updates yet.</p>
                  ) : (
                    comments?.map((c: any) => (
                      <div key={c.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {c.user.name || "User"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{c.comment}</p>
                      </div>
                    ))
                  )}
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