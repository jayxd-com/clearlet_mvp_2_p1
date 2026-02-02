import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, ArrowLeft, Clock, FileText, X, CheckCircle, User, Shield, Download, Eye } from "lucide-react";
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
  condition: string;
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

export default function LandlordChecklistPage() {
  const [, params] = useRoute("/landlord/checklist/:contractId");
  const [, setLocation] = useLocation();
  const contractId = params?.contractId ? parseInt(params.contractId) : 0;
  
  const { data: checklist, isLoading, refetch } = trpc.checklist.getByContractId.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );

  const signChecklist = trpc.checklist.sign.useMutation();
  const addNotes = trpc.checklist.addNotes.useMutation();
  const generatePdfMutation = trpc.checklist.generatePdf.useMutation();
  
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [landlordNotes, setLandlordNotes] = useState("");
  
  useEffect(() => {
    if (checklist?.items) {
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
        console.error("Failed to parse checklist items:", e);
        setChecklistData({ rooms: [] });
      }
    }
    if (checklist?.landlordNotes) {
      setLandlordNotes(checklist.landlordNotes);
    }
  }, [checklist]);

  const handleSign = async (signature: string) => {
    if (!checklist) return;
    try {
      // Save notes first if changed
      if (landlordNotes !== checklist.landlordNotes) {
        await addNotes.mutateAsync({
          checklistId: checklist.id,
          notes: landlordNotes,
          role: "landlord"
        });
      }

      await signChecklist.mutateAsync({
        checklistId: checklist.id,
        signature,
        notes: landlordNotes
      });
      
      toast.success("Checklist signed and completed!");
      setShowSignature(false);
      refetch();
    } catch (error) {
      toast.error("Failed to sign checklist");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading checklist...</div>;
  if (!checklist) return <div className="p-8 text-center text-red-500">Checklist not found</div>;

  const isCompleted = checklist.status === "completed";
  const isPendingReview = checklist.status === "tenant_signed";
  const isDraft = checklist.status === "draft";

  const handleDownload = async () => {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation(`/landlord/contracts`)} className="gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="font-black uppercase tracking-tight text-lg hidden md:block">Move-In Checklist Review</div>
          <div className="flex gap-2">
             {isPendingReview && (
                <Button onClick={() => setShowSignature(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">
                  Approve & Sign <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
             )}
             {isCompleted && (
               <>
                 <Button variant="outline" onClick={handleDownload} className="font-bold border-2 rounded-xl">
                   <Download className="h-4 w-4 mr-2" /> PDF
                 </Button>
                 <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider">Completed</Badge>
               </>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Status Banner */}
        {isDraft && (
           <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
             <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
               <Clock className="h-8 w-8 text-slate-400" />
             </div>
             <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Waiting for Tenant</h2>
             <p className="text-slate-500 max-w-md mx-auto mt-2 font-medium">The tenant has not submitted their move-in checklist yet.</p>
           </div>
        )}

        {isPendingReview && (
          <div className="bg-blue-500 rounded-2xl p-8 text-center text-white shadow-xl shadow-blue-500/20">
            <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Review Tenant Submission</h2>
            <p className="text-blue-100 max-w-lg mx-auto font-medium">
              The tenant has completed their inspection. Please review their notes and photos below. If everything looks correct, sign to close the checklist.
            </p>
          </div>
        )}

                {/* Landlord General Notes */}

                        {(isPendingReview || isCompleted) && (

                          <Card className="border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">

                            <CardHeader className="pb-2">

                              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">

                                <Shield className="h-4 w-4" /> Landlord Remarks

                              </CardTitle>

                            </CardHeader>

                            <CardContent className="p-6 pt-2">

                      <Textarea 

                        placeholder="Add any final comments or acknowledgments here..."

                        value={landlordNotes}

                        onChange={(e) => setLandlordNotes(e.target.value)}

                        disabled={isCompleted}

                        className="min-h-[100px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"

                      />

                      {!isCompleted && (

                        <p className="text-[10px] font-bold text-slate-400 mt-2 text-right uppercase tracking-wider">Visible to tenant after signing</p>

                      )}

                    </CardContent>

                  </Card>

                )}

        

                {/* Checklist Content */}

                {(isPendingReview || isCompleted) && checklistData && (

                  <div className="space-y-10">

                    {checklistData.rooms.map((room, roomIdx) => (

                      <div key={roomIdx} className="space-y-4">

                        <div className="flex items-center gap-3 px-2">

                          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">

                            {roomIdx + 1}

                          </div>

                          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{room.room}</h2>

                        </div>

        

                        <div className="grid gap-4">

                          {room.items.map((item, itemIdx) => (

                            <Card key={itemIdx} className="overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm">

                              <CardContent className="p-6">

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">

                                  <div>

                                    <h4 className="font-black text-lg text-slate-900 dark:text-white">{item.name}</h4>

                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tenant Rating</p>

                                  </div>

                                  <div>

                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 inline-block ${

                                      (item.condition || "").toLowerCase() === "excellent" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :

                                      (item.condition || "").toLowerCase() === "good" ? "bg-blue-100 text-blue-700 border-blue-200" :

                                      (item.condition || "").toLowerCase() === "fair" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :

                                      (item.condition || "").toLowerCase() === "poor" ? "bg-orange-100 text-orange-700 border-orange-200" :

                                      (item.condition || "").toLowerCase() === "damaged" ? "bg-red-100 text-red-700 border-red-200" :

                                      "bg-slate-100 text-slate-500 border-slate-200"

                                    }`}>

                                      {item.condition || "Not Rated"}

                                    </span>

                                  </div>

                                </div>

        

                                {(item.notes || (item.photos && item.photos.length > 0)) && (

                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700 space-y-5">

                                    {item.notes && (

                                      <div>

                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tenant Notes</p>

                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{item.notes}"</p>

                                      </div>

                                    )}

                                    

                                    {item.photos && item.photos.length > 0 && (

                                      <div>

                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Evidence Photos</p>

                                        <div className="flex flex-wrap gap-3">

                                          {item.photos.map((photo, i) => (

                                            <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm hover:shadow-md group relative">

                                              <img src={photo} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">

                                                <Eye className="h-6 w-6 text-white drop-shadow-md" />

                                              </div>

                                            </a>

                                          ))}

                                        </div>

                                      </div>

                                    )}

                                  </div>

                                )}

                              </CardContent>

                            </Card>

                          ))}

                        </div>

                      </div>

                    ))}

                  </div>

                )}
      </div>

      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 border-b-2 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Landlord Signature</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border-dashed border-slate-200 dark:border-slate-800">
              <SignatureCanvas onSave={handleSign} onCancel={() => setShowSignature(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}