import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Check, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { SignatureCanvas } from "@/components/SignatureCanvas";

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

export default function MoveInChecklistPage() {
  const [, params] = useRoute("/tenant/checklist/:contractId");
  const contractId = params?.contractId ? parseInt(params.contractId) : 0;
  
  const { data: checklist, isLoading, refetch } = trpc.checklist.getByContractId.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );
  
  const updateItems = trpc.checklist.updateItems.useMutation();
  const signChecklist = trpc.checklist.sign.useMutation();
  
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  
  useEffect(() => {
    if (checklist?.items) {
      try {
        setChecklistData(JSON.parse(checklist.items));
      } catch (e) {
        console.error("Failed to parse checklist items:", e);
      }
    }
  }, [checklist]);
  
  const handleConditionChange = (roomIdx: number, itemIdx: number, cond: string) => {
    if (!checklistData) return;
    const updated = { ...checklistData };
    updated.rooms[roomIdx].items[itemIdx].condition = cond;
    setChecklistData(updated);
  };
  
  const handleSave = async () => {
    if (!checklist || !checklistData) return;
    try {
      await updateItems.mutateAsync({
        checklistId: checklist.id,
        items: JSON.stringify(checklistData),
      });
      toast.success("Checklist saved");
      refetch();
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  const handleSign = async (signature: string) => {
    if (!checklist) return;
    try {
      await signChecklist.mutateAsync({
        checklistId: checklist.id,
        signature,
      });
      toast.success("Checklist signed and submitted");
      setShowSignature(false);
      refetch();
    } catch (error) {
      toast.error("Failed to sign");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading checklist...</div>;
  if (!checklist) return <div className="p-8 text-center text-red-500">Checklist not found for this contract</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3"><FileText className="h-8 w-8" /> Move-In Checklist</h1>
          <p className="text-muted-foreground mt-2">Document the condition of the property at move-in</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>Save Progress</Button>
          <Button onClick={() => setShowSignature(true)} className="bg-green-600 hover:bg-green-700">Submit & Sign</Button>
        </div>
      </div>

      <div className="space-y-8">
        {checklistData?.rooms.map((room, roomIdx) => (
          <Card key={roomIdx}>
            <CardHeader><CardTitle>{room.room}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {room.items.map((item, itemIdx) => (
                <div key={itemIdx} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">{item.name}</h4>
                    <div className="flex gap-2">
                      {["Excellent", "Good", "Fair", "Poor"].map((c) => (
                        <button
                          key={c}
                          onClick={() => handleConditionChange(roomIdx, itemIdx, c)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${item.condition === c ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea 
                    placeholder="Add notes about condition..."
                    value={item.notes}
                    onChange={(e: any) => {
                      const updated = { ...checklistData };
                      updated.rooms[roomIdx].items[itemIdx].notes = e.target.value;
                      setChecklistData(updated);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {showSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Sign Checklist</h2>
              <Button variant="ghost" onClick={() => setShowSignature(false)}><X /></Button>
            </div>
            <SignatureCanvas onSave={handleSign} onCancel={() => setShowSignature(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
