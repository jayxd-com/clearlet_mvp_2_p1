import { useState } from "react";
import { Calendar, MapPin, Clock, Check, X, Key } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumInput, 
  PremiumLabel, 
  PremiumTextarea, 
  PremiumDatePicker,
  PremiumStatusBadge
} from "@/components/premium";

interface KeyCollectionSchedulerProps {
  contractId: number;
  userRole: "landlord" | "tenant";
  onScheduled?: () => void;
}

export default function KeyCollectionScheduler({
  contractId,
  userRole,
  onScheduled,
}: KeyCollectionSchedulerProps) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [formData, setFormData] = useState({
    collectionDate: "",
    collectionTime: "",
    location: "",
    notes: "",
  });

  const { data: existingCollection, refetch } = trpc.keyCollections.getByContract.useQuery(contractId);
  const createMutation = trpc.keyCollections.create.useMutation();
  const updateMutation = trpc.keyCollections.update.useMutation();
  const confirmMutation = trpc.keyCollections.confirm.useMutation();
  const completeMutation = trpc.keyCollections.complete.useMutation();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.collectionDate || !formData.collectionTime || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const dateTime = new Date(`${formData.collectionDate}T${formData.collectionTime}`);
      
      if (existingCollection) {
        await updateMutation.mutateAsync({
          id: existingCollection.id,
          collectionDate: dateTime,
          location: formData.location,
          ...(userRole === "landlord" 
            ? { landlordNotes: formData.notes }
            : { tenantNotes: formData.notes }
          ),
        });
        toast.success("Key collection updated successfully");
      } else {
        await createMutation.mutateAsync({
          contractId,
          collectionDate: dateTime,
          location: formData.location,
          ...(userRole === "landlord" 
            ? { landlordNotes: formData.notes }
            : { tenantNotes: formData.notes }
          ),
        });
        toast.success("Key collection scheduled successfully");
      }
      
      refetch();
      setIsScheduling(false);
      onScheduled?.();
    } catch (error) {
      console.error("Failed to schedule key collection:", error);
      toast.error("Failed to schedule key collection");
    }
  };

  const handleConfirm = async () => {
    if (!existingCollection) return;
    
    try {
      await confirmMutation.mutateAsync({
        id: existingCollection.id,
        role: userRole,
      });
      toast.success("Key collection confirmed");
      refetch();
      onScheduled?.();
    } catch (error) {
      console.error("Failed to confirm:", error);
      toast.error("Failed to confirm key collection");
    }
  };

  const handleComplete = async () => {
    if (!existingCollection) return;
    
    try {
      await completeMutation.mutateAsync(existingCollection.id);
      toast.success("Key collection marked as completed");
      refetch();
      onScheduled?.();
    } catch (error) {
      console.error("Failed to complete:", error);
      toast.error("Failed to mark as completed");
    }
  };

  // Initial State: No schedule yet
  if (!isScheduling && !existingCollection) {
    return (
      <PremiumCard 
        title="Key Collection" 
        icon={Key} 
        description="Schedule a time and place to hand over the keys"
        cta={
          <PremiumButton 
            onClick={() => setIsScheduling(true)} 
            size="sm"
            className="rounded-xl"
          >
            Schedule Handover
          </PremiumButton>
        }
      >
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-slate-500">
          <p className="text-sm">No handover scheduled yet.</p>
        </div>
      </PremiumCard>
    );
  }

  // View State: Scheduled
  if (existingCollection && !isScheduling) {
    const collectionDate = new Date(existingCollection.collectionDate);
    const isConfirmed = userRole === "landlord" 
      ? existingCollection.landlordConfirmed 
      : existingCollection.tenantConfirmed;
    const otherPartyConfirmed = userRole === "landlord"
      ? existingCollection.tenantConfirmed
      : existingCollection.landlordConfirmed;
    
    return (
      <PremiumCard 
        title="Key Collection Details" 
        icon={Key}
        cta={
          <div className="flex gap-2">
            <PremiumStatusBadge status={existingCollection.status || "scheduled"} />
            {existingCollection.status === "scheduled" && (
              <PremiumButton 
                onClick={() => setIsScheduling(true)} 
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs"
              >
                Edit
              </PremiumButton>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <Calendar className="h-5 w-5 text-cyan-500 mt-0.5" />
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {collectionDate.toLocaleDateString()} at {collectionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-cyan-500 mt-0.5" />
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</p>
                <p className="font-bold text-slate-900 dark:text-white">{existingCollection.location}</p>
              </div>
            </div>
          </div>

          {(existingCollection.landlordNotes || existingCollection.tenantNotes) && (
            <div className="space-y-2">
              {existingCollection.landlordNotes && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Landlord Notes</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{existingCollection.landlordNotes}"</p>
                </div>
              )}
              {existingCollection.tenantNotes && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenant Notes</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{existingCollection.tenantNotes}"</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isConfirmed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                {isConfirmed ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                <span className="text-xs font-bold uppercase">{isConfirmed ? "You Confirmed" : "Your Confirmation Pending"}</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${otherPartyConfirmed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                {otherPartyConfirmed ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                <span className="text-xs font-bold uppercase">{userRole === "landlord" ? "Tenant" : "Landlord"} {otherPartyConfirmed ? "Confirmed" : "Pending"}</span>
              </div>
            </div>

            {!isConfirmed && (
              <PremiumButton 
                onClick={handleConfirm}
                size="sm"
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
              >
                <Check className="h-4 w-4 mr-2" /> Confirm Attendance
              </PremiumButton>
            )}

            {existingCollection.status === "confirmed" && userRole === "landlord" && (
              <PremiumButton 
                onClick={handleComplete}
                size="sm"
                className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
              >
                <Key className="h-4 w-4 mr-2" /> Complete Handover
              </PremiumButton>
            )}
          </div>
        </div>
      </PremiumCard>
    );
  }

  // Edit/Create State
  return (
    <PremiumCard 
      title={existingCollection ? "Edit Key Collection" : "Schedule Key Collection"} 
      icon={Key}
      action={{
        label: "Cancel",
        onClick: () => setIsScheduling(false),
        icon: X
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <PremiumDatePicker
              label="Collection Date"
              value={formData.collectionDate}
              onChange={(date) => {
                if (date) {
                  const offset = date.getTimezoneOffset();
                  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                  setFormData({ ...formData, collectionDate: localDate.toISOString().split("T")[0] });
                } else {
                  setFormData({ ...formData, collectionDate: "" });
                }
              }}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <PremiumLabel>Collection Time</PremiumLabel>
            <PremiumInput
              type="time"
              value={formData.collectionTime}
              onChange={(e) => setFormData({ ...formData, collectionTime: e.target.value })}
              icon={Clock}
            />
          </div>
        </div>

        <div>
          <PremiumLabel>Location</PremiumLabel>
          <PremiumInput
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Property address or meeting point"
            icon={MapPin}
          />
        </div>

        <div>
          <PremiumLabel>Notes (Optional)</PremiumLabel>
          <PremiumTextarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional information or instructions for the other party..."
            rows={3}
          />
        </div>

        <div className="flex justify-end pt-2">
          <PremiumButton
            type="submit"
            className="w-full sm:w-auto min-w-[120px]"
            size="sm"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            Save Schedule
          </PremiumButton>
        </div>
      </form>
    </PremiumCard>
  );
}