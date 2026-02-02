import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {   CheckSquare, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  FileText, 
  X, 
  CheckCircle,
  Camera,
  ClipboardList,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChecklistItem {
  name: string;
  condition: "Excellent" | "Good" | "Fair" | "Poor" | "Damaged" | "";
  notes: string;
  photos: string[];
}

interface ChecklistRoom {
  room: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  rooms: ChecklistRoom[];
}

export default function MoveInChecklistPage() {
  const [, params] = useRoute("/tenant/checklist/:contractId");
  const [, setLocation] = useLocation();
  const contractId = params?.contractId ? parseInt(params.contractId) : 0;
  
  const { data: checklist, isLoading, refetch } = trpc.checklist.getByContractId.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );

  const { data: contract } = trpc.contracts.getById.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );
  
  const updateItems = trpc.checklist.updateItems.useMutation();
  const submitChecklist = trpc.checklist.submit.useMutation();
  const uploadPhotoMutation = trpc.checklist.uploadPhoto.useMutation();
  const generatePdfMutation = trpc.checklist.generatePdf.useMutation();
  
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [isUploading, setIsUploading] = useState<{room: number, item: number} | null>(null);
  
  useEffect(() => {
    if (checklist?.items && !checklistData) {
      try {
        const parsed = JSON.parse(checklist.items);
        if (Array.isArray(parsed)) {
          setChecklistData({ rooms: parsed });
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rooms)) {
          setChecklistData(parsed);
        } else {
          setChecklistData({ rooms: [] });
        }
      } catch (e) {
        setChecklistData({ rooms: [] });
      }
    }
  }, [checklist]); // Only re-run if checklist changes (e.g. initial load)

  const handleDownload = async () => {
    if (!checklist) return;
    try {
      toast.loading("Generating PDF...");
      const { pdfUrl } = await generatePdfMutation.mutateAsync({ checklistId: checklist.id });
      toast.dismiss();
      window.open(pdfUrl, "_blank");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate PDF");
    }
  };
  
  const handleConditionChange = (roomIdx: number, itemIdx: number, cond: any) => {
    if (!checklistData || isReadOnly) return;
    setChecklistData(prev => {
      if (!prev) return null;
      const newRooms = [...prev.rooms];
      const newItems = [...newRooms[roomIdx].items];
      newItems[itemIdx] = { ...newItems[itemIdx], condition: cond };
      newRooms[roomIdx] = { ...newRooms[roomIdx], items: newItems };
      return { ...prev, rooms: newRooms };
    });
  };

  const handleNotesChange = (roomIdx: number, itemIdx: number, notes: string) => {
    if (!checklistData || isReadOnly) return;
    setChecklistData(prev => {
      if (!prev) return null;
      const newRooms = [...prev.rooms];
      const newItems = [...newRooms[roomIdx].items];
      newItems[itemIdx] = { ...newItems[itemIdx], notes: notes };
      newRooms[roomIdx] = { ...newRooms[roomIdx], items: newItems };
      return { ...prev, rooms: newRooms };
    });
  };

  const handlePhotoUpload = async (roomIdx: number, itemIdx: number, file: File) => {
    if (!checklistData || isReadOnly || !checklist) return;
    
    setIsUploading({ room: roomIdx, item: itemIdx });
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const { url } = await uploadPhotoMutation.mutateAsync({
           checklistId: checklist.id,
           fileName: file.name,
           photoData: base64
        });
        
        setChecklistData(prev => {
          if (!prev) return null;
          const newRooms = [...prev.rooms];
          const newItems = [...newRooms[roomIdx].items];
          const currentPhotos = newItems[itemIdx].photos || [];
          newItems[itemIdx] = { ...newItems[itemIdx], photos: [...currentPhotos, url] };
          newRooms[roomIdx] = { ...newRooms[roomIdx], items: newItems };
          return { ...prev, rooms: newRooms };
        });
        
        toast.success("Photo uploaded");
      } catch (e) {
        toast.error("Upload failed");
      } finally {
        setIsUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = async (silent = false) => {
    if (!checklist || !checklistData) return;
    try {
      await updateItems.mutateAsync({
        checklistId: checklist.id,
        items: JSON.stringify(checklistData),
      });
      if (!silent) toast.success("Progress saved");
    } catch (error) {
      toast.error("Failed to save progress");
    }
  };

  const handleSubmit = async (signature: string) => {
    if (!checklist || !checklistData) return;
    try {
      await handleSave(true);
      await submitChecklist.mutateAsync({
        checklistId: checklist.id,
        items: JSON.stringify(checklistData),
        signature,
      });
      toast.success("Checklist submitted successfully");
      setShowSignature(false);
      refetch();
    } catch (error) {
      toast.error("Failed to submit checklist");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading checklist...</div>;
  if (!checklist) return <div className="p-8 text-center text-red-500">Checklist not found for this contract</div>;

  const isReadOnly = checklist.status === "tenant_signed" || checklist.status === "completed";
  const checklistDeadline = contract?.checklistDeadline ? new Date(contract.checklistDeadline) : null;
  const daysLeft = checklistDeadline ? Math.ceil((checklistDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isOverdue = daysLeft < 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation(`/tenant/my-home/${contractId}`)} className="gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="font-black uppercase tracking-tight text-lg hidden md:block">Move-In Checklist</div>
          <div className="flex gap-2">
            {(checklist?.status === "completed" || checklist?.status === "tenant_signed") && (
               <Button variant="outline" onClick={handleDownload} className="font-bold border-2 rounded-xl">
                 <Download className="h-4 w-4 mr-2" /> PDF
               </Button>
            )}
            {!isReadOnly && (
              <>
                <Button variant="outline" onClick={() => handleSave(false)} className="font-bold border-2 rounded-xl">Save Draft</Button>
                <Button onClick={() => setShowSignature(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20">
                  Submit Checklist
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Status Banners */}
        {checklist.status === "tenant_signed" && (
          <div className="bg-blue-500 rounded-2xl p-8 text-center text-white shadow-xl shadow-blue-500/20">
            <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Waiting for Landlord Review</h2>
            <p className="text-blue-100 max-w-lg mx-auto font-medium">
              You have submitted your checklist. The landlord will review your report and sign off to complete the process.
            </p>
          </div>
        )}

        {checklist.status === "completed" && (
          <div className="bg-emerald-500 rounded-2xl p-8 text-center text-white shadow-xl shadow-emerald-500/20">
            <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Checklist Completed</h2>
            <p className="text-emerald-500 font-medium bg-white px-4 py-2 rounded-xl inline-block mt-2">
              Legally Signed & Verified
            </p>
          </div>
        )}

        {/* Deadline Alert */}
        {!isReadOnly && checklistDeadline && (
          <div className={`border-2 rounded-2xl p-6 shadow-sm flex items-center gap-6 ${isOverdue ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30"}`}>
            <div className={`p-4 rounded-2xl ${isOverdue ? "bg-red-500 shadow-red-500/20" : "bg-orange-500 shadow-orange-500/20"} shadow-lg`}>
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-lg">
                {isOverdue ? "Submission Overdue" : "Submission Window"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Please complete this checklist within 7 days of move-in.
                <span className={`font-black ml-2 px-3 py-1 rounded-lg ${isOverdue ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                  {isOverdue ? `${Math.abs(daysLeft)} days late` : `${daysLeft} days remaining`}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {checklistData?.rooms && checklistData.rooms.length > 0 ? (
            checklistData.rooms.map((room, roomIdx) => (
              <div key={roomIdx} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
                    {roomIdx + 1}
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{room.room}</h2>
                </div>
                
                <div className="grid gap-4">
                  {room.items.map((item, itemIdx) => (
                    <Card key={itemIdx} className="overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-cyan-200 dark:hover:border-cyan-700 transition-all shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                          <div>
                            <h4 className="font-black text-lg text-slate-900 dark:text-white">{item.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Item Condition</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {["Excellent", "Good", "Fair", "Poor", "Damaged"].map((condition) => (
                              <button
                                key={condition}
                                onClick={() => handleConditionChange(roomIdx, itemIdx, condition)}
                                disabled={isReadOnly}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                                  (item.condition || "").toLowerCase() === condition.toLowerCase()
                                    ? "bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20 transform scale-105"
                                    : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600"
                                } ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {condition}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes & Observations</label>
                            <Textarea 
                              placeholder={isReadOnly ? "No notes added." : "Describe any issues, scratches, or details..."}
                              value={item.notes}
                              onChange={(e) => handleNotesChange(roomIdx, itemIdx, e.target.value)}
                              disabled={isReadOnly}
                              className="min-h-[100px] rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:border-cyan-500 transition-all resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Photo Evidence</label>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                              {item.photos && item.photos.map((photo, i) => (
                                <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 hover:border-cyan-500 transition-all group relative">
                                  <img src={photo} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-white" />
                                  </div>
                                </a>
                              ))}
                              
                              {!isReadOnly && (
                                <label className={`aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all cursor-pointer group ${isUploading?.room === roomIdx && isUploading?.item === itemIdx ? "opacity-50 animate-pulse" : ""}`}>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handlePhotoUpload(roomIdx, itemIdx, file);
                                    }}
                                    disabled={!!isUploading}
                                  />
                                  <Camera className="h-6 w-6 text-slate-300 dark:text-slate-500 group-hover:text-cyan-500 mb-1" />
                                  <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-cyan-600 tracking-tighter">Add Photo</span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <ClipboardList className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">No checklist items found. Please contact your landlord.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 border-b-2 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Tenant Signature</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border-dashed border-slate-200 dark:border-slate-800">
              <SignatureCanvas onSave={handleSubmit} onCancel={() => setShowSignature(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}