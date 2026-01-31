import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  User,
  UserX,
  MessageSquare,
  ShieldCheck,
  Check,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { ViewingFeedbackDialog } from "@/components/ViewingFeedbackDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function ViewingManagementDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  
  // URL Filtering Logic
  const searchParams = new URLSearchParams(window.location.search);
  const urlPropertyId = searchParams.get("propertyId");
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(urlPropertyId || "all");
  const [selectedViewing, setSelectedViewing] = useState<any>(null);
  const [feedbackViewing, setFeedbackViewing] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState<any>(null); // For viewing submitted feedback
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingInstructions, setMeetingInstructions] = useState("");

  const { data: viewings, refetch, isLoading } = trpc.viewing.getLandlordViewings.useQuery();
  const { data: stats } = trpc.viewing.getLandlordStats.useQuery();
  const { data: properties } = trpc.properties.myListings.useQuery();

  // Filter viewings by property
  const filteredViewings = useMemo(() => {
    if (!viewings) return [];
    if (selectedPropertyId === "all") return viewings;
    return viewings.filter((v: any) => v.property.id === parseInt(selectedPropertyId));
  }, [viewings, selectedPropertyId]);

  const { data: selectedFeedback } = trpc.viewing.getViewingFeedback.useQuery(
    { viewingId: viewingDetails?.id },
    { enabled: !!viewingDetails }
  );

  const approveMutation = trpc.viewing.approveViewing.useMutation({
    onSuccess: () => {
      toast.success("Viewing approved!");
      setSelectedViewing(null);
      setMeetingLocation("");
      setMeetingInstructions("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve viewing");
    }
  });

  const rejectMutation = trpc.viewing.rejectViewing.useMutation({
    onSuccess: () => {
      toast.success("Viewing rejected");
      setSelectedViewing(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject viewing");
    }
  });

  const completeMutation = trpc.viewing.completeViewing.useMutation({
    onSuccess: () => {
      toast.success("Viewing marked as completed");
      refetch();
    }
  });

  const noShowMutation = trpc.viewing.markNoShow.useMutation({
    onSuccess: () => {
      toast.success("Tenant marked as no-show");
      refetch();
    }
  });

        const getStatusBadge = (status: string) => {
          switch (status) {
            case "pending":
              return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-none font-black uppercase text-[9px] md:text-[11px] tracking-widest px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl hover:bg-yellow-500/20 transition-colors whitespace-nowrap">Pending</Badge>;
            case "approved":
              return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-none font-black uppercase text-[9px] md:text-[11px] tracking-widest px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl hover:bg-green-500/20 transition-colors whitespace-nowrap">Approved</Badge>;
            case "completed":
              return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-black uppercase text-[9px] md:text-[11px] tracking-widest px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl hover:bg-blue-500/20 transition-colors whitespace-nowrap">Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-none font-black uppercase text-[9px] md:text-[11px] tracking-widest px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl hover:bg-red-500/20 transition-colors whitespace-nowrap">Rejected</Badge>;
      case "no_show":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none font-black uppercase text-[9px] md:text-[11px] tracking-widest px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl hover:bg-orange-500/20 transition-colors whitespace-nowrap">No Show</Badge>;
      default:
              return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-none font-black uppercase text-[9px] md:text-[11px] tracking-widest px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl hover:bg-slate-500/20 transition-colors whitespace-nowrap">{status}</Badge>;
          }
        };      const ViewingCard = ({ v }: { v: any }) => (
        <Card className="border-2 border-slate-100 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-400 transition-all overflow-hidden bg-white dark:bg-slate-800/50 py-0 gap-0 shadow-sm group">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1 space-y-5">              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight mb-1 group-hover:text-cyan-500 transition-colors">{v.property.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-cyan-500" />
                    {v.property.address}
                  </div>
                </div>
                {getStatusBadge(v.status)}
              </div>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested Time</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cyan-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{format(new Date(v.requestedDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock className="h-4 w-4 text-cyan-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{v.requestedTimeSlot}</span>
                  </div>
                </div>
  
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tenant Details</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{v.tenant.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <ShieldCheck className={cn("h-4 w-4", v.tenant.verificationStatus === 'verified' ? "text-green-500" : "text-slate-400")} />
                    <span className="text-[10px] font-black uppercase text-slate-500">{v.tenant.verificationStatus}</span>
                  </div>
                </div>
  
                                            {(v.status === 'approved' || v.status === 'completed') && (
                                              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meeting Location</p>
                                                <div className="flex items-start gap-2">
                                                  <MapPin className="h-4 w-4 text-cyan-500 mt-0.5" />
                                                  <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{v.meetingLocation || "TBD"}</p>
                                                    {v.meetingInstructions && (
                                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic font-medium">
                                                        "{v.meetingInstructions}"
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                              
                                            {v.tenantMessage && (
                                              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tenant Message</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">"{v.tenantMessage}"</p>
                                              </div>
                                            )}              </div>
            </div>
  
                                          <div className="flex md:flex-col gap-2 min-w-[160px]">
  
                                            {v.status === "pending" && (
  
                                              <>
  
                                                <Button 
  
                                                  className="flex-1 lg:w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-sm h-10 rounded-xl transition-all active:scale-95 border-none flex items-center justify-center gap-2"
  
                                                  onClick={() => setSelectedViewing(v)}
  
                                                >
  
                                                  <Check className="h-4 w-4" /> Approve
  
                                                </Button>
  
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button 
                                                      variant="ghost" 
                                                      className="flex-1 lg:w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm h-10 rounded-xl transition-all border-none flex items-center justify-center gap-2"
                                                    >
                                                      <XCircle className="h-4 w-4" /> Reject
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                                        <XCircle className="h-6 w-6 text-red-500" />
                                                        Reject Request?
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                                                        Are you sure you want to reject this viewing request from {v.tenant.name}? They will be notified of the cancellation.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-6">
                                                      <AlertDialogCancel className="border-2 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                                                      <AlertDialogAction
                                                        className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl px-8"
                                                        onClick={() => rejectMutation.mutate({ viewingId: v.id })}
                                                      >
                                                        Reject
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
  
                                              </>
  
                                            )}
  
                                                        {v.status === "approved" && (
  
                                                          <div className="flex flex-col gap-2 w-full">
  
                                                            <Button 
  
                                                              className="bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-bold text-sm h-10 rounded-xl transition-all active:scale-95 border-none flex items-center justify-center gap-2"
  
                                                              onClick={() => completeMutation.mutate({ viewingId: v.id })}
  
                                                              disabled={completeMutation.isPending}
  
                                                            >
  
                                                              <CheckCircle className="h-4 w-4" /> Mark Complete
  
                                                            </Button>
  
                                                            
  
                                                                            <AlertDialog>
  
                                                            
  
                                                                              <AlertDialogTrigger asChild>
  
                                                            
  
                                                                                <Button 
  
                                                            
  
                                                                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm h-10 rounded-xl transition-all active:scale-95 border-none flex items-center justify-center gap-2"
  
                                                            
  
                                                                                >
  
                                                            
  
                                                                                  <UserX className="h-4 w-4" /> Tenant No-Show
  
                                                            
  
                                                                                </Button>
  
                                                            
  
                                                                              </AlertDialogTrigger>
  
                                                              <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
  
                                                                <AlertDialogHeader>
  
                                                                  <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
  
                                                                    <UserX className="h-6 w-6 text-red-500" />
  
                                                                    Mark as No-Show?
  
                                                                  </AlertDialogTitle>
  
                                                                  <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
  
                                                                    Are you sure you want to mark {v.tenant.name} as a no-show? This will cancel the viewing and record it in the history.
  
                                                                  </AlertDialogDescription>
  
                                                                </AlertDialogHeader>
  
                                                                <AlertDialogFooter className="mt-6">
  
                                                                  <AlertDialogCancel className="border-2 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
  
                                                                  <AlertDialogAction
  
                                                                    className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl px-8"
  
                                                                    onClick={() => noShowMutation.mutate({ viewingId: v.id })}
  
                                                                  >
  
                                                                    Confirm
  
                                                                  </AlertDialogAction>
  
                                                                </AlertDialogFooter>
  
                                                              </AlertDialogContent>
  
                                                            </AlertDialog>
  
                                                          </div>
  
                                                        )}
  
                                            {v.status === "completed" && (
  
                                              <div className="flex flex-col gap-2 w-full">
  
                                                {!v.feedback?.landlordRating && (
  
                                                  <Button 
  
                                                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold text-sm h-10 rounded-xl transition-all active:scale-95 border-none flex items-center justify-center gap-2"
  
                                                    onClick={() => setFeedbackViewing(v)}
  
                                                  >
  
                                                    <Star className="h-4 w-4 fill-yellow-500" /> Submit Feedback
  
                                                  </Button>
  
                                                )}
  
                                                {(v.feedback?.tenantRating || v.feedback?.landlordRating) && (
  
                                                  <Button 
  
                                                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-sm h-10 rounded-xl w-full transition-all active:scale-95 border-none flex items-center justify-center gap-2"
  
                                                    onClick={() => setViewingDetails(v)}
  
                                                  >
  
                                                    <MessageSquare className="h-4 w-4" /> View Review
  
                                                  </Button>
  
                                                )}
  
                                              </div>
  
                                            )}
  
                                          </div>
          </div>
        </CardContent>
      </Card>
    );
  
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Viewing Management"
        subtitle="Manage and schedule property visits with tenants"
        icon={Calendar}
      />

      <ViewingFeedbackDialog
        isOpen={!!feedbackViewing}
        onOpenChange={(open) => !open && setFeedbackViewing(null)}
        viewingId={feedbackViewing?.id}
        propertyTitle={feedbackViewing?.property.title}
        userType="landlord"
      />

      {/* View Feedback Details Dialog */}
      <Dialog open={!!viewingDetails} onOpenChange={() => setViewingDetails(null)}>
        <DialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Viewing Review</DialogTitle>
            <CardDescription className="text-slate-500 font-medium">Feedback for {viewingDetails?.property.title}</CardDescription>
          </DialogHeader>

          <div className="space-y-8 py-6">
            {!selectedFeedback ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-4" />
                <p className="font-bold text-slate-400 uppercase text-xs">Loading feedback...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tenant Feedback */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant Feedback</p>
                    {selectedFeedback.tenantRating ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-4 w-4", s <= selectedFeedback.tenantRating ? "fill-yellow-400 text-yellow-400" : "text-slate-200 dark:text-slate-700")} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 uppercase">Awaiting feedback</span>
                    )}
                  </div>
                  {selectedFeedback.tenantRating ? (
                    <>
                      <p className="text-slate-900 dark:text-white font-medium italic">"{selectedFeedback.tenantComment || "No comment provided."}"</p>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Interested in applying?</p>
                        <Badge className={cn("border-none font-black text-[9px] uppercase", selectedFeedback.wouldTenantApply ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                          {selectedFeedback.wouldTenantApply ? "YES" : "NO / UNDECIDED"}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-tight italic">Tenant hasn't provided any feedback yet.</p>
                  )}
                </div>

                {/* Landlord Feedback (Your own) */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Notes</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-4 w-4", s <= (selectedFeedback.landlordRating || 0) ? "fill-cyan-500 text-cyan-500" : "text-slate-200 dark:text-slate-700")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{selectedFeedback.landlordComment || "You haven't added notes for this viewing yet."}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-xl" onClick={() => setViewingDetails(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Requests", value: stats?.totalViewings || 0, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Pending", value: stats?.pendingViewings || 0, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "Approved", value: stats?.approvedViewings || 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Response Rate", value: `${stats?.responseRate || 100}%`, icon: BarChart3, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
        ].map((stat, i) => (
          <Card key={i} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm gap-0 py-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-white dark:bg-slate-800 p-1 border-2 border-slate-200 dark:border-slate-700 rounded-xl w-full md:w-auto grid grid-cols-3 md:inline-flex h-auto shadow-sm">
            <TabsTrigger value="pending" className="px-8 py-3 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="px-8 py-3 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Approved</TabsTrigger>
            <TabsTrigger value="completed" className="px-8 py-3 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">History</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 pl-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-72">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="border-none shadow-none h-10 font-bold text-xs uppercase tracking-widest">
                <SelectValue placeholder="Filter Property" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold text-xs uppercase">All Properties</SelectItem>
                {properties?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()} className="font-bold text-xs uppercase">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Loading viewings...</p>
          </div>
        ) : (
          <>
            <TabsContent value="pending" className="space-y-4">
              {filteredViewings.filter((v: any) => v.status === "pending").length === 0 ? (
                <EmptyState icon={Clock} message={selectedPropertyId === "all" ? "No pending requests" : "No pending requests for this property"} />
              ) : (
                filteredViewings.filter((v: any) => v.status === "pending").map((v: any) => <ViewingCard key={v.id} v={v} />)
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {filteredViewings.filter((v: any) => v.status === "approved").length === 0 ? (
                <EmptyState icon={CheckCircle} message={selectedPropertyId === "all" ? "No approved viewings" : "No approved viewings for this property"} />
              ) : (
                filteredViewings.filter((v: any) => v.status === "approved").map((v: any) => <ViewingCard key={v.id} v={v} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredViewings.filter((v: any) => v.status === "completed" || v.status === "rejected" || v.status === "no_show").length === 0 ? (
                <EmptyState icon={History} message={selectedPropertyId === "all" ? "No viewing history" : "No history for this property"} />
              ) : (
                filteredViewings.filter((v: any) => v.status === "completed" || v.status === "rejected" || v.status === "no_show").map((v: any) => <ViewingCard key={v.id} v={v} />)
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={!!selectedViewing} onOpenChange={() => setSelectedViewing(null)}>
        <DialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Approve Viewing</DialogTitle>
            <CardDescription className="text-slate-500 font-medium">Set the meeting details for {selectedViewing?.tenant.name}</CardDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meeting Location</Label>
              <Input
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="e.g. Main entrance, reception..."
                className="h-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions (Optional)</Label>
              <Textarea
                value={meetingInstructions}
                onChange={(e) => setMeetingInstructions(e.target.value)}
                placeholder="e.g. Ring doorbell #4, wait at the gate..."
                className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-medium min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="font-bold rounded-xl h-12 px-6" onClick={() => setSelectedViewing(null)}>Cancel</Button>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest rounded-xl h-12 px-8 shadow-lg shadow-green-500/20"
              onClick={() => approveMutation.mutate({
                viewingId: selectedViewing.id,
                meetingLocation,
                meetingInstructions
              })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: any) {
  return (
    <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      <Icon className="h-12 w-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
      <p className="font-black text-slate-400 uppercase text-xs tracking-widest">{message}</p>
    </div>
  );
}

function History(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
  );
}
