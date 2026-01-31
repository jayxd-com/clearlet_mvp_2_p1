import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface MoveInChecklistModalProps {
  contractId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export function MoveInChecklistModal({ contractId, open, onOpenChange, onCompleted }: MoveInChecklistModalProps) {
  const { data: checklist, isLoading, refetch } = trpc.checklist.getByContractId.useQuery(
    { contractId },
    { enabled: contractId > 0 && open }
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
      toast.success("Checklist completed!");
      setShowSignature(false);
      onOpenChange(false);
      if (onCompleted) onCompleted();
    } catch (error) {
      toast.error("Failed to sign");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Move-In Checklist
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">Loading checklist...</div>
        ) : !checklist ? (
          <div className="p-8 text-center text-red-500">Checklist not found for this contract</div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end gap-2 sticky top-0 bg-white dark:bg-slate-900 py-2 z-10">
              <Button variant="outline" onClick={handleSave}>Save Progress</Button>
              <Button onClick={() => setShowSignature(true)} className="bg-green-600 hover:bg-green-700">Checklist Done</Button>
            </div>

            {checklistData?.rooms.map((room, roomIdx) => (
              <Card key={roomIdx} className="border-2 shadow-sm">
                <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b"><CardTitle className="text-lg">{room.room}</CardTitle></CardHeader>
                <CardContent className="space-y-4 p-4">
                  {room.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-3 border rounded-lg bg-white dark:bg-slate-900">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <div className="flex flex-wrap gap-1">
                          {["Excellent", "Good", "Fair", "Poor"].map((c) => (
                            <button
                              key={c}
                              onClick={() => handleConditionChange(roomIdx, itemIdx, c)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${item.condition === c ? "bg-cyan-500 text-white border-cyan-500" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-cyan-300"}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Add notes..."
                        className="text-sm min-h-[60px]"
                        value={item.notes}
                        onChange={(e) => {
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
        )}

        {showSignature && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Sign to Complete</h2>
                <Button variant="ghost" onClick={() => setShowSignature(false)}><X /></Button>
              </div>
              <SignatureCanvas onSave={handleSign} onCancel={() => setShowSignature(false)} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
