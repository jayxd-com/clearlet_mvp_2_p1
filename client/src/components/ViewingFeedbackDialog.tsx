import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Check, X, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ViewingFeedbackDialogProps {
  viewingId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userType: "tenant" | "landlord";
  propertyTitle: string;
}

export function ViewingFeedbackDialog({
  viewingId,
  isOpen,
  onOpenChange,
  userType,
  propertyTitle,
}: ViewingFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldProceed, setWouldProceed] = useState<boolean | null>(null);
  
  const submitMutation = trpc.viewing.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted! Thank you.");
      onOpenChange(false);
      setRating(0);
      setComment("");
      setWouldProceed(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
    }
  });

  const handleSubmit = () => {
    if (rating === 0) return toast.error("Please provide a rating");
    submitMutation.mutate({
      viewingId,
      rating,
      comment,
      wouldApplyOrAccept: wouldProceed ?? undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Viewing Feedback
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            How was your viewing for <span className="font-bold text-cyan-500">{propertyTitle}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Star Rating */}
          <div className="space-y-3 text-center">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Rating</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      "h-10 w-10 transition-colors",
                      star <= rating 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-slate-200 dark:text-slate-700"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Proceed Question */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 block text-center">
              {userType === "tenant" ? "Would you like to apply for this property?" : "Would you accept this tenant?"}
            </Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1 h-14 rounded-xl border-2 font-bold transition-all",
                  wouldProceed === true 
                    ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20" 
                    : "border-slate-100 dark:border-slate-800 text-slate-500"
                )}
                onClick={() => setWouldProceed(true)}
              >
                <ThumbsUp className="mr-2 h-5 w-5" /> Yes
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1 h-14 rounded-xl border-2 font-bold transition-all",
                  wouldProceed === false 
                    ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                    : "border-slate-100 dark:border-slate-800 text-slate-500"
                )}
                onClick={() => setWouldProceed(false)}
              >
                <ThumbsDown className="mr-2 h-5 w-5" /> No
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Comments</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-medium min-h-[120px] focus:border-cyan-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-cyan-500 dark:hover:bg-cyan-400 transition-all"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
