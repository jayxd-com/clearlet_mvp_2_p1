import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, Edit, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { 
  PremiumLabel, 
  PremiumButton 
} from "@/components/premium";
import { Badge } from "@/components/ui/badge";

const TIME_SLOTS = [
  "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
  "16:00-17:00", "17:00-18:00", "18:00-19:00",
];

interface ViewingAvailabilityCalendarProps {
  propertyId: number;
  propertyTitle: string;
}

export function ViewingAvailabilityCalendar({
  propertyId,
  propertyTitle,
}: ViewingAvailabilityCalendarProps) {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date>();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isDialogOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: availability, refetch } = trpc.viewing.getPropertyAvailability.useQuery({ propertyId });

  const createMutation = trpc.viewing.createAvailability.useMutation({
    onSuccess: () => {
      toast.success("Availability added!");
      resetForm();
      refetch();
    }
  });

  const updateMutation = trpc.viewing.updateAvailability.useMutation({
    onSuccess: () => {
      toast.success("Availability updated!");
      resetForm();
      refetch();
    }
  });

  const deleteMutation = trpc.viewing.deleteAvailability.useMutation({
    onSuccess: () => {
      toast.success("Availability deleted!");
      refetch();
    }
  });

  const resetForm = () => {
    setDate(undefined);
    setSelectedSlots([]);
    setEditingId(null);
    setIsOpen(false);
  };

  const handleSave = () => {
    if (!date || selectedSlots.length === 0) return toast.error("Select date and slots");
    
    if (editingId) {
      updateMutation.mutate({
        availabilityId: editingId,
        timeSlots: selectedSlots,
      });
    } else {
      createMutation.mutate({
        propertyId,
        availableDate: date.toISOString(),
        timeSlots: selectedSlots,
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setDate(new Date(item.availableDate));
    setSelectedSlots(JSON.parse(item.timeSlots));
    setIsOpen(true);
  };

  // Expose the open function to window for the header button to call
  React.useEffect(() => {
    (window as any).openAddAvailability = () => setIsOpen(true);
    return () => { delete (window as any).openAddAvailability; };
  }, []);

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsOpen(open); }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {editingId ? "Edit Viewing Slots" : "Add Viewing Slots"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6 px-2">
            <div className="space-y-3">
              <PremiumLabel>Select Viewing Date</PremiumLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    disabled={!!editingId}
                    className={cn(
                      "w-full h-14 justify-start text-left font-bold text-lg rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 transition-all hover:border-cyan-400/50",
                      !date && "text-muted-foreground",
                      editingId && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-6 w-6 text-cyan-500" />
                    {date ? format(date, "PPP") : <span>Select a date...</span>}
                  </Button>
                </PopoverTrigger>
                {!editingId && (
                  <PopoverContent className="w-auto p-0 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 2}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="p-4"
                    />
                  </PopoverContent>
                )}
              </Popover>
              {editingId && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Note: Date cannot be changed when editing.</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <PremiumLabel className="mb-0">Available Time Slots</PremiumLabel>
                <button 
                  type="button"
                  onClick={() => setSelectedSlots(selectedSlots.length === TIME_SLOTS.length ? [] : [...TIME_SLOTS])}
                  className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-600 transition-colors"
                >
                  {selectedSlots.length === TIME_SLOTS.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TIME_SLOTS.map(slot => {
                  const isSelected = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])}
                      className={`h-12 rounded-xl border-2 font-black text-[11px] uppercase tracking-tight transition-all duration-200 ${
                        isSelected 
                          ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20" 
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-400/50 hover:text-cyan-500"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <PremiumButton
              className="w-full"
              onClick={handleSave}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <span className="flex items-center gap-2">
                {editingId ? "Update Availability" : "Save Availability"}
                <Plus className={cn("h-4 w-4 transition-transform group-hover:rotate-90", editingId && "hidden")} />
              </span>
            </PremiumButton>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3">
        {availability?.map((a: any) => (
          <div key={a.id} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex justify-between items-center group hover:border-cyan-400/30 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                <CalendarIcon className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white leading-none mb-1">
                  {new Date(a.availableDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {JSON.parse(a.timeSlots).length} slots opened
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(a)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-cyan-500 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                      <Trash2 className="h-6 w-6 text-red-500" />
                      Delete Availability?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                      Are you sure you want to remove the viewing slots for {format(new Date(a.availableDate), "PPP")}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="border-2 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl px-8"
                      onClick={() => deleteMutation.mutate({ availabilityId: a.id })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {availability && availability.length > 0 && (
        <PremiumButton 
          variant="outline"
          onClick={() => setLocation(`/landlord/viewings?propertyId=${propertyId}`)}
          className="w-full h-12 rounded-2xl shadow-sm mt-2"
        >
          <Users className="h-4 w-4 mr-2 text-cyan-500" /> Manage Requests
        </PremiumButton>
      )}
    </div>
  );
}
