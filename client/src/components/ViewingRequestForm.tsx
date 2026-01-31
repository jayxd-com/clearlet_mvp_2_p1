import React, { useState, useMemo } from "react";
import { PremiumDatePicker } from "@/components/premium/PremiumDatePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

interface ViewingRequestFormProps {
  propertyId: number;
  propertyTitle: string;
  onSuccess?: () => void;
}

export function ViewingRequestForm({
  propertyId,
  propertyTitle,
  onSuccess,
}: ViewingRequestFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const { data: availability, isLoading: loadingAvail } = trpc.viewing.getPropertyAvailability.useQuery({ propertyId });

  const requestViewingMutation = trpc.viewing.requestViewing.useMutation({
    onSuccess: () => {
      toast.success("Viewing request submitted!");
      setOpen(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit request");
    }
  });

  // Available dates for the date picker helper
  const availableDates = useMemo(() => {
    if (!availability) return [];
    return availability.map((a: any) => {
      const d = new Date(a.availableDate);
      // Add 12 hours to handle timezone shifts (avoiding midnight edge cases)
      d.setHours(d.getHours() + 12);
      return d.toISOString().split('T')[0];
    });
  }, [availability]);

  // Current selected date availability details
  const currentAvailability = useMemo(() => {
    if (!selectedDate || !availability) return null;
    return availability.find((a: any) => {
      const d = new Date(a.availableDate);
      d.setHours(d.getHours() + 12);
      return d.toISOString().split('T')[0] === selectedDate;
    });
  }, [selectedDate, availability]);

  // Slots for the dropdown
  const timeSlots = useMemo(() => {
    if (!currentAvailability) return [];
    try {
      return JSON.parse(currentAvailability.timeSlots) as string[];
    } catch (e) {
      return [];
    }
  }, [currentAvailability]);

  const handleSubmit = () => {
    if (!selectedDate || !selectedTimeSlot) return toast.error("Please select date and time");
    requestViewingMutation.mutate({
      propertyId,
      requestedDate: selectedDate,
      requestedTimeSlot: selectedTimeSlot,
      message,
    });
  };

  if (!user || user.verificationStatus !== "verified") {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="pt-6 text-yellow-800 dark:text-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Verification Required</p>
              <p className="text-sm opacity-90">Only verified tenants can request viewings. Please upload your documents in your profile settings to get started.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold">Request Viewing</Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Request Viewing - {propertyTitle}</DialogTitle>
        </DialogHeader>
        
        {loadingAvail ? (
          <div className="py-8 text-center text-slate-500">Loading availability...</div>
        ) : (
          <div className="space-y-4 py-4">
            {availability && availability.length === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800 flex gap-2 items-start mb-4">
                <Info className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Landlord hasn't set specific availability yet. You can propose a time, and they will review it.
                </p>
              </div>
            )}
            
            {availability && availability.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-2 items-start mb-4">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Multiple tenants can request the same slot. The landlord will approve the best fit. Once a slot is approved, it will be removed from the calendar.
                </p>
              </div>
            )}

            <div>
              <PremiumDatePicker 
                label="Preferred Date"
                value={selectedDate} 
                onChange={(date) => {
                  if (date) {
                    // Adjust for timezone offset to ensure the date string represents the local date selected
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    setSelectedDate(localDate.toISOString().split("T")[0]);
                  } else {
                    setSelectedDate("");
                  }
                  setSelectedTimeSlot(""); // Reset slot on date change
                }} 
                min={new Date().toISOString().split("T")[0]} 
                helperText={!availableDates.includes(selectedDate) && selectedDate !== "" && availability && availability.length > 0 ? "Note: Landlord has not explicitly opened this date, but you can still request." : undefined}
                highlightedDates={availableDates}
              />
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300">Time Slot</Label>
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot} disabled={!selectedDate}>
                <SelectTrigger className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder={selectedDate ? "Select time" : "Choose a date first"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  {timeSlots.length > 0 ? (
                    timeSlots.map(slot => {
                      const isBooked = currentAvailability?.bookedSlots?.includes(slot);
                      return (
                        <SelectItem key={slot} value={slot} disabled={isBooked}>
                          {slot} {isBooked ? "(Already Booked)" : ""}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <>
                      <SelectItem value="09:00-10:00">09:00-10:00</SelectItem>
                      <SelectItem value="10:00-11:00">10:00-11:00</SelectItem>
                      <SelectItem value="11:00-12:00">11:00-12:00</SelectItem>
                      <SelectItem value="14:00-15:00">14:00-15:00</SelectItem>
                      <SelectItem value="15:00-16:00">15:00-16:00</SelectItem>
                      <SelectItem value="16:00-17:00">16:00-17:00</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300">Message to Landlord (Optional)</Label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Briefly introduce yourself..." 
                className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-h-[100px]"
              />
            </div>

            <Button 
              className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold mt-2" 
              onClick={handleSubmit} 
              disabled={requestViewingMutation.isPending || !selectedDate || !selectedTimeSlot}
            >
              {requestViewingMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
