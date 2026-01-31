import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, MessageSquare, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremiumPageHeader, PremiumPageContainer, PremiumButton } from "@/components/premium";
import { ViewingFeedbackDialog } from "@/components/ViewingFeedbackDialog";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function TenantViewingsPage() {
  const { data: viewings, isLoading } = trpc.viewing.getTenantViewings.useQuery();
  const [feedbackViewing, setFeedbackViewing] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState<any>(null);

  const { data: selectedFeedback } = trpc.viewing.getViewingFeedback.useQuery(
    { viewingId: viewingDetails?.id },
    { enabled: !!viewingDetails }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader 
        title="My Viewings"
        subtitle="Track and manage your property viewing requests"
        icon={Calendar}
      />

      <ViewingFeedbackDialog
        isOpen={!!feedbackViewing}
        onOpenChange={(open) => !open && setFeedbackViewing(null)}
        viewingId={feedbackViewing?.id}
        propertyTitle={feedbackViewing?.property?.title || "Property"}
        userType="tenant"
      />

      <div className="grid gap-6">
        {viewings?.map((v: any) => (
          <Card key={v.id} className="border-2 border-slate-100 dark:border-slate-700 hover:border-cyan-400/50 transition-all overflow-hidden bg-white dark:bg-slate-800/50 py-0 gap-0 shadow-sm group">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight mb-1 group-hover:text-cyan-500 transition-colors">
                        {v.property?.title || `Property #${v.propertyId}`}
                      </h3>
                      {v.property?.address && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                          <MapPin className="h-4 w-4 text-cyan-500" />
                          {v.property.address}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] md:text-[11px] font-black uppercase tracking-widest border-none px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl transition-colors whitespace-nowrap",
                      v.status === 'approved' ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20" :
                      v.status === 'pending' ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20" :
                      v.status === 'completed' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" :
                      "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                    )}>
                      {v.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested Time</p>
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                        <Calendar className="h-4 w-4 text-cyan-500" />
                        {format(new Date(v.requestedDate), "PPP")}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-slate-900 dark:text-white font-bold text-sm">
                        <Clock className="h-4 w-4 text-cyan-500" />
                        {v.requestedTimeSlot}
                      </div>
                    </div>

                    {v.meetingLocation && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meeting Location</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-cyan-500 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{v.meetingLocation}</p>
                            {v.meetingInstructions && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic font-medium">
                                "{v.meetingInstructions}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  {v.status === "completed" && (
                    <>
                      {!v.feedback?.tenantRating && (
                        <PremiumButton 
                          size="sm"
                          className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold text-sm h-10 rounded-xl border-none flex items-center justify-center gap-2"
                          onClick={() => setFeedbackViewing(v)}
                        >
                          <Star className="h-4 w-4 fill-yellow-500" /> Submit Feedback
                        </PremiumButton>
                      )}
                      {(v.feedback?.landlordRating || v.feedback?.tenantRating) && (
                        <PremiumButton 
                          size="sm"
                          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-sm h-10 rounded-xl border-none flex items-center justify-center gap-2"
                          onClick={() => setViewingDetails(v)}
                        >
                          <MessageSquare className="h-4 w-4" /> View Review
                        </PremiumButton>
                      )}
                    </>
                  )}
                  {v.status === "approved" && (
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest text-center px-4 py-2 bg-green-500/10 rounded-lg">Visit Scheduled</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {viewings?.length === 0 && (
          <div className="text-center py-32 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
            <Calendar className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-700 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No viewings yet</h3>
            <p className="text-slate-500 font-medium">Book your first property viewing to get started!</p>
          </div>
        )}
      </div>

      {/* View Feedback Details Dialog */}
      <Dialog open={!!viewingDetails} onOpenChange={() => setViewingDetails(null)}>
        <DialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Viewing Review</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">Feedback from the landlord</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-6">
            {!selectedFeedback ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-4" />
                <p className="font-bold text-slate-400 uppercase text-xs">Loading feedback...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Landlord Feedback */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Landlord Rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-4 w-4", s <= (selectedFeedback.landlordRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-200 dark:text-slate-700")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-900 dark:text-white font-medium italic">"{selectedFeedback.landlordComment || "No comment provided."}"</p>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Acceptance Impression</p>
                    <Badge className={cn("border-none font-black text-[9px] uppercase", selectedFeedback.wouldLandlordAccept ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      {selectedFeedback.wouldLandlordAccept ? "POSSITIVE" : "NEUTRAL / NEGATIVE"}
                    </Badge>
                  </div>
                </div>

                {/* Your own Feedback */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Feedback</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-4 w-4", s <= (selectedFeedback.tenantRating || 0) ? "fill-cyan-500 text-cyan-500" : "text-slate-200 dark:text-slate-700")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{selectedFeedback.tenantComment || "You haven't added feedback for this viewing yet."}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <PremiumButton className="w-full h-12 rounded-xl" onClick={() => setViewingDetails(null)}>Close</PremiumButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PremiumPageContainer>
  );
}