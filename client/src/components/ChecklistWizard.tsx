import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Save, Home, ClipboardList } from "lucide-react";
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumInput, 
  PremiumLabel, 
  PremiumTextarea 
} from "@/components/premium";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChecklistItem {
  name: string;
  condition: "excellent" | "good" | "fair" | "poor";
  notes: string;
  photos: string[];
}

interface ChecklistRoom {
  room: string;
  items: ChecklistItem[];
}

interface ChecklistWizardProps {
  initialData?: any;
  onComplete?: () => void;
  onCancel?: () => void;
}

const DEFAULT_ROOMS = [
  { name: "Living Room", items: ["Walls", "Ceiling", "Floor", "Windows", "Doors", "Light Fixtures"] },
  { name: "Kitchen", items: ["Walls", "Ceiling", "Floor", "Cabinets", "Countertops", "Appliances", "Sink", "Faucet"] },
];

export function ChecklistWizard({ initialData, onComplete, onCancel }: ChecklistWizardProps) {
  const [step, setStep] = useState(1);
  const [templateName, setTemplateName] = useState(initialData?.name || "");
  const [propertyType, setPropertyType] = useState<"apartment" | "house" | "studio" | "commercial" | "other">(initialData?.propertyType || "apartment");
  const [rooms, setRooms] = useState<ChecklistRoom[]>(
    initialData?.items ? JSON.parse(initialData.items) :
    DEFAULT_ROOMS.map(room => ({
      room: room.name,
      items: room.items.map(item => ({
        name: item,
        condition: "good" as const,
        notes: "",
        photos: [],
      })),
    }))
  );
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);

  const createTemplate = trpc.checklist.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template created!");
      onComplete?.();
    }
  });

  const updateTemplate = trpc.checklist.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated!");
      onComplete?.();
    }
  });

  const handleSave = () => {
    if (!templateName) return toast.error("Please enter a template name");
    
    if (initialData) {
      updateTemplate.mutate({
        templateId: initialData.id,
        name: templateName,
        propertyType,
        items: JSON.stringify(rooms),
      });
    } else {
      createTemplate.mutate({
        name: templateName,
        propertyType,
        items: JSON.stringify(rooms),
        isDefault: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <PremiumCard title="Template Basics" icon={ClipboardList} description="Set up the basic details for your checklist template">
          <div className="space-y-6">
            <div className="space-y-2">
              <PremiumLabel>Template Name</PremiumLabel>
              <PremiumInput 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                placeholder="e.g., Standard Apartment Checklist" 
              />
            </div>
            <div className="space-y-2">
              <PremiumLabel>Property Type</PremiumLabel>
              <Select value={propertyType} onValueChange={(v: any) => setPropertyType(v)}>
                <SelectTrigger className="h-14 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <PremiumButton onClick={() => setStep(2)}>
                Next: Configure Rooms
              </PremiumButton>
            </div>
          </div>
        </PremiumCard>
      ) : (
        <PremiumCard title="Configure Rooms & Items" icon={Home} description="Add or remove rooms and customize the checklist structure">
          <div className="space-y-8">
            {/* Room Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {rooms.map((r, i) => (
                <PremiumButton 
                  key={i} 
                  variant={currentRoomIndex === i ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setCurrentRoomIndex(i)}
                  className="rounded-xl whitespace-nowrap"
                >
                  {r.room}
                </PremiumButton>
              ))}
              <PremiumButton variant="outline" size="icon" onClick={() => setRooms([...rooms, { room: "New Room", items: [] }])} className="rounded-xl aspect-square">
                <Plus className="h-4 w-4" />
              </PremiumButton>
            </div>

            {/* Current Room Items */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-6">
                <PremiumInput 
                  value={rooms[currentRoomIndex].room} 
                  onChange={(e) => {
                    const updated = [...rooms];
                    updated[currentRoomIndex].room = e.target.value;
                    setRooms(updated);
                  }}
                  className="font-bold text-lg h-12"
                />
                <PremiumButton 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:bg-red-50" 
                  onClick={() => {
                    if (rooms.length > 1) {
                      const updated = rooms.filter((_, idx) => idx !== currentRoomIndex);
                      setRooms(updated);
                      setCurrentRoomIndex(Math.max(0, currentRoomIndex - 1));
                    } else {
                      toast.error("At least one room is required");
                    }
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </PremiumButton>
              </div>

              <div className="space-y-3">
                {rooms[currentRoomIndex].items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <PremiumInput 
                      value={item.name} 
                      onChange={(e) => {
                        const updated = [...rooms];
                        updated[currentRoomIndex].items[i].name = e.target.value;
                        setRooms(updated);
                      }} 
                      className="h-12"
                    />
                    <PremiumButton 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:bg-red-50 aspect-square h-12 w-12" 
                      onClick={() => {
                        const updated = [...rooms];
                        updated[currentRoomIndex].items = updated[currentRoomIndex].items.filter((_, idx) => idx !== i);
                        setRooms(updated);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </PremiumButton>
                  </div>
                ))}
                <PremiumButton 
                  variant="outline" 
                  className="w-full border-dashed border-2 h-12" 
                  onClick={() => {
                    const updated = [...rooms];
                    updated[currentRoomIndex].items.push({ name: "New Item", condition: "good", notes: "", photos: [] });
                    setRooms(updated);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </PremiumButton>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <PremiumButton variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </PremiumButton>
              <PremiumButton onClick={handleSave} isLoading={createTemplate.isPending || updateTemplate.isPending} className="flex-1">
                <Save className="h-4 w-4 mr-2" /> {initialData ? "Update Template" : "Save Template"}
              </PremiumButton>
            </div>
          </div>
        </PremiumCard>
      )}
    </div>
  );
}
