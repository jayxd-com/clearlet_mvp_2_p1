import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Save, Home, ClipboardList, Camera, X } from "lucide-react";
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumInput, 
  PremiumLabel, 
} from "@/components/premium";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  const getInitialRooms = (): ChecklistRoom[] => {
    if (initialData?.items) {
      try {
        const parsed = JSON.parse(initialData.items);
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.rooms && Array.isArray(parsed.rooms)) return parsed.rooms;
      } catch (e) {
        console.error("Failed to parse initial items", e);
      }
    }
    return DEFAULT_ROOMS.map(room => ({
      room: room.name,
      items: room.items.map(item => ({
        name: item,
        condition: "good" as const,
        notes: "",
        photos: [],
      })),
    }));
  };

  const [rooms, setRooms] = useState<ChecklistRoom[]>(getInitialRooms());
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<{ room: number, item: number } | null>(null);

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

  const uploadImageMutation = trpc.uploads.uploadImage.useMutation();

  const handlePhotoUpload = async (roomIdx: number, itemIdx: number, file: File) => {
    setIsUploading({ room: roomIdx, item: itemIdx });
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const { url } = await uploadImageMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
        
        const updated = [...rooms];
        if (!updated[roomIdx].items[itemIdx].photos) {
          updated[roomIdx].items[itemIdx].photos = [];
        }
        updated[roomIdx].items[itemIdx].photos.push(url);
        setRooms(updated);
        toast.success("Photo uploaded");
      } catch (e) {
        console.error("Upload failed", e);
        toast.error("Failed to upload photo");
      } finally {
        setIsUploading(null);
      }
    };
  };

  const removePhoto = (roomIdx: number, itemIdx: number, photoIdx: number) => {
    const updated = [...rooms];
    updated[roomIdx].items[itemIdx].photos.splice(photoIdx, 1);
    setRooms(updated);
  };

  const handleSave = () => {
    if (!templateName) return toast.error("Please enter a template name");
    
    // Save as raw array for consistency with tenant side expectation
    const itemsJson = JSON.stringify(rooms);

    if (initialData) {
      updateTemplate.mutate({
        templateId: initialData.id,
        name: templateName,
        propertyType,
        items: itemsJson,
      });
    } else {
      createTemplate.mutate({
        name: templateName,
        propertyType,
        items: itemsJson,
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
                  onClick={() => {
                    setCurrentRoomIndex(i);
                    setExpandedItemIndex(null);
                  }}
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
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex gap-2 items-center">
                      <PremiumInput 
                        value={item.name} 
                        onChange={(e) => {
                          const updated = [...rooms];
                          updated[currentRoomIndex].items[i].name = e.target.value;
                          setRooms(updated);
                        }} 
                        className="h-10 text-sm"
                      />
                      <PremiumButton 
                        variant="outline"
                        size="icon"
                        className={`aspect-square h-10 w-10 transition-colors ${expandedItemIndex === i ? "bg-cyan-100 border-cyan-500 text-cyan-600" : ""}`}
                        onClick={() => setExpandedItemIndex(expandedItemIndex === i ? null : i)}
                        title="Add reference photos"
                      >
                        <Camera className="h-4 w-4" />
                      </PremiumButton>
                      <PremiumButton 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:bg-red-50 aspect-square h-10 w-10" 
                        onClick={() => {
                          const updated = [...rooms];
                          updated[currentRoomIndex].items = updated[currentRoomIndex].items.filter((_, idx) => idx !== i);
                          setRooms(updated);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </PremiumButton>
                    </div>

                    {expandedItemIndex === i && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Reference Photos</p>
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                          {item.photos?.map((photo, photoIdx) => (
                            <div key={photoIdx} className="relative group aspect-square">
                              <img src={photo} className="w-full h-full object-cover rounded-lg border shadow-sm" />
                              <button 
                                onClick={() => removePhoto(currentRoomIndex, i, photoIdx)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </div>
                          ))}
                          
                          <label className={`aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all cursor-pointer group ${isUploading?.room === currentRoomIndex && isUploading?.item === i ? "opacity-50 animate-pulse" : ""}`}>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(currentRoomIndex, i, file);
                              }}
                              disabled={!!isUploading}
                            />
                            <Plus className="h-4 w-4 text-slate-300 group-hover:text-cyan-500" />
                          </label>
                        </div>
                      </div>
                    )}
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
