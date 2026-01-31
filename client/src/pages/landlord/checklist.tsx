import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileText, X, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Badge } from "@/components/ui/badge";

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
  
  const [showSignature, setShowSignature] = useState(false);
  
  const handleSign = async (signature: string) => {
    if (!checklist) return;
    
    try {
      await signChecklist.mutateAsync({
        checklistId: checklist.id,
        signature,
        role: "landlord",
      });
      
      toast.success("Checklist signed successfully - Move-in complete!");
      setShowSignature(false);
      refetch();
    } catch (error) {
      toast.error("Failed to sign checklist");
    }
  };
  
  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading checklist...</div>;
  if (!checklist) return <div className="p-8 text-center text-red-500">Checklist not found</div>;
  
  const parsedData: ChecklistData = checklist.items ? JSON.parse(checklist.items) : { rooms: [] };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 shadow-xl text-white flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3"><CheckSquare className="h-10 w-10" /> Move-In Checklist Review</h1>
            <p className="mt-2 opacity-90 text-lg">Review and sign the property condition report</p>
          </div>
          {checklist.tenantSignature && !checklist.landlordSignature && (
            <Button onClick={() => setShowSignature(true)} className="bg-white text-blue-600 hover:bg-slate-100 font-bold px-8 shadow-lg h-12">
              Sign & Complete
            </Button>
          )}
        </div>

        <div className="grid gap-6">
          {/* Status Badge */}
          <div className="flex justify-end">
            <Badge className={`px-4 py-2 text-sm font-bold uppercase tracking-widest ${
              checklist.status === "completed" ? "bg-green-500" : "bg-yellow-500 text-black"
            }`}>
              {checklist.status === "completed" ? "Move-in Complete" : "Pending Landlord Signature"}
            </Badge>
          </div>

          {parsedData.rooms.map((room, roomIdx) => (
            <Card key={roomIdx} className="border-2 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b">
                <CardTitle className="text-xl font-bold">{room.room}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2">
                  {room.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-6 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{item.name}</h4>
                        <p className="text-sm text-slate-500 mb-3">{item.notes || "No notes provided"}</p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <Badge variant="outline" className={`border-2 font-black uppercase text-[10px] px-3 ${
                          item.condition === "Excellent" ? "border-green-500 text-green-500" :
                          item.condition === "Good" ? "border-blue-500 text-blue-500" :
                          "border-orange-500 text-orange-500"
                        }`}>
                          {item.condition}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Shield className="h-6 w-6 text-cyan-500" />
                Landlord Final Signature
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSignature(false)} className="rounded-full"><X /></Button>
            </div>
            <SignatureCanvas onSave={handleSign} onCancel={() => setShowSignature(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
