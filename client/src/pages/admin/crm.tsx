import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Tag, 
  MoreHorizontal, 
  Trash2, 
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  StickyNote,
  History,
  Send,
  Save
} from "lucide-react";
import { 
  PremiumPageContainer, 
  PremiumPageHeader, 
  PremiumCard, 
  PremiumButton, 
  PremiumStatusBadge,
  PremiumStatCard,
  PremiumInput
} from "@/components/premium";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export default function AdminCRMPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedRequest] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);

  const { data: leadsData, isLoading, refetch } = trpc.crm.getLeads.useQuery({
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const { data: leadDetails, isLoading: isDetailsLoading } = trpc.crm.getLeadDetails.useQuery(
    { leadId: selectedLead?.id },
    { 
      enabled: !!selectedLead,
      refetchOnWindowFocus: false 
    }
  );

  const { data: conversation } = trpc.crm.getLeadConversation.useQuery(
    { leadId: selectedLead?.id },
    { enabled: !!selectedLead }
  );

  const updateStatusMutation = trpc.crm.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated");
      refetch();
    }
  });

  const deleteLeadMutation = trpc.crm.deleteLead.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted");
      refetch();
    }
  });

  const updateNotesMutation = trpc.crm.updateLeadNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes saved");
    },
    onError: (err) => toast.error(err.message)
  });

  const scheduleFollowUpMutation = trpc.crm.scheduleFollowUp.useMutation({
    onSuccess: () => {
      toast.success("Follow-up scheduled");
    },
    onError: (err) => toast.error(err.message)
  });

  const stats = [
    { label: "Total Leads", value: leadsData?.stats.total || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Active Chats", value: leadsData?.stats.activeConversations || 0, icon: MessageCircle, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
    { label: "New Leads", value: leadsData?.leads.filter((l: any) => l.status === 'new').length || 0, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 'contacted': return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case 'qualified': return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case 'converted': return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case 'rejected': return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  // Initialize form state when lead details load
  useMemo(() => {
    if (leadDetails) {
      setNotes(leadDetails.notes || "");
      setFollowUpDate(leadDetails.nextFollowUpDate ? new Date(leadDetails.nextFollowUpDate) : undefined);
    }
  }, [leadDetails]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading leads...</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumPageHeader
        title="CRM & Leads"
        subtitle="Manage captured leads from chatbot and other sources"
        icon={Users}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <PremiumStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <PremiumInput
            placeholder="Search leads by name, email or interest..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "new", "contacted", "qualified", "converted", "rejected"].map(s => (
            <Button 
              key={s} 
              variant={statusFilter === s ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize rounded-xl px-4 h-14 font-bold border-2"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <PremiumCard title="Captured Leads" icon={Tag} description="Potential customers from platform inquiries" contentClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Info</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Interest</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-800/50">
              {leadsData?.leads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(lead.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{lead.name || "Anonymous"}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                      {lead.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit capitalize text-[10px] font-black tracking-widest border-2">{lead.userType}</Badge>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{lead.interest}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <Badge className={cn("border-none font-black uppercase text-[9px] px-3 py-1 rounded-lg", getStatusColor(lead.status))}>
                      {lead.status}
                    </Badge>
                    {lead.nextFollowUpDate && (
                      <div className="mt-1 flex items-center text-[10px] text-orange-500 font-bold">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-2 rounded-xl">
                        <DropdownMenuLabel>Manage Lead</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedRequest(lead)}>
                          <ExternalLink className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Set Status</DropdownMenuLabel>
                        {["contacted", "qualified", "converted", "rejected"].map(s => (
                          <DropdownMenuItem key={s} onClick={() => updateStatusMutation.mutate({ leadId: lead.id, status: s as any })} className="capitalize">
                            {s}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => { if(confirm("Delete lead?")) deleteLeadMutation.mutate({ leadId: lead.id }); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {leadsData?.leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500 italic">No leads found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumCard>

      {/* Lead Management Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Lead Management</DialogTitle>
                  <DialogDescription className="font-medium mt-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    {selectedLead.name || "Unknown"} <span className="text-slate-300 dark:text-slate-600">•</span> {selectedLead.email}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={cn("border-none font-black uppercase text-[10px] px-4 py-1.5 rounded-xl", getStatusColor(selectedLead.status))}>
                    {selectedLead.status}
                  </Badge>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">
              <Tabs defaultValue="conversation" className="h-full flex flex-col">
                <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <TabsList className="bg-transparent p-0 gap-6 h-auto">
                    <TabsTrigger value="conversation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-0 pb-3 font-bold text-slate-500 dark:text-slate-400 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">
                      <MessageCircle className="h-4 w-4 mr-2" /> Conversation
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-0 pb-3 font-bold text-slate-500 dark:text-slate-400 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400">
                      <StickyNote className="h-4 w-4 mr-2" /> Notes
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-0 pb-3 font-bold text-slate-500 dark:text-slate-400 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">
                      <History className="h-4 w-4 mr-2" /> History
                    </TabsTrigger>
                    <TabsTrigger value="followup" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent px-0 pb-3 font-bold text-slate-500 dark:text-slate-400 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400">
                      <CalendarIcon className="h-4 w-4 mr-2" /> Follow-up
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <TabsContent value="conversation" className="mt-0 h-full">
                    <div className="space-y-6">
                      {conversation?.map((msg: any, i: number) => (
                        <div key={i} className={cn("flex flex-col", msg.sender === "user" ? "items-end" : "items-start")}>
                          <div className={cn(
                            "max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-sm",
                            msg.sender === "user" 
                              ? "bg-cyan-500 text-white rounded-br-none" 
                              : "bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-bl-none text-slate-700 dark:text-slate-200"
                          )}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-tight">
                            {msg.sender === "user" ? "Visitor" : "ClearBot"} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))}
                      {conversation?.length === 0 && (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic">No message history found for this lead.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0 h-full flex flex-col">
                    <div className="flex-1 space-y-4">
                      <div className="bg-white dark:bg-slate-900 border-2 border-purple-100 dark:border-purple-900/20 rounded-xl p-4 transition-colors">
                        <label className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 mb-2 block">Internal Notes</label>
                        <Textarea 
                          placeholder="Add internal notes about this lead..." 
                          className="min-h-[200px] border-0 focus-visible:ring-0 bg-transparent resize-none p-0 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => updateNotesMutation.mutate({ leadId: selectedLead.id, notes })} 
                          disabled={updateNotesMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                        >
                          <Save className="h-4 w-4 mr-2" /> Save Notes
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-0 h-full">
                    <div className="space-y-6 max-w-2xl mx-auto">
                      {leadDetails?.history?.map((log: any, i: number) => (
                        <div key={log.id} className="relative pl-8 pb-6 border-l-2 border-slate-200 dark:border-slate-800 last:border-0">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-700" />
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                              {new Date(log.createdAt).toLocaleString()} • {log.adminName}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                            {log.details && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mt-1 shadow-sm">
                                {log.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!leadDetails?.history || leadDetails.history.length === 0) && (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic">No history recorded yet.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="followup" className="mt-0 h-full">
                    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-black uppercase text-slate-800 dark:text-white">Schedule Follow-up</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Set a reminder to contact this lead</p>
                      </div>
                      
                      <div className="flex justify-center mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Calendar
                          mode="single"
                          selected={followUpDate}
                          onSelect={setFollowUpDate}
                          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 font-bold border-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          onClick={() => setFollowUpDate(undefined)}
                        >
                          Clear
                        </Button>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                          disabled={!followUpDate || scheduleFollowUpMutation.isPending}
                          onClick={() => followUpDate && scheduleFollowUpMutation.mutate({ 
                            leadId: selectedLead.id, 
                            date: followUpDate.toISOString() 
                          })}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" /> Schedule
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="p-6 border-t-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 flex-shrink-0">
              <PremiumButton variant="outline" onClick={() => setSelectedRequest(null)} className="rounded-xl border-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Close</PremiumButton>
              <PremiumButton onClick={() => window.open(`mailto:${selectedLead.email}`)} className="rounded-xl px-6">
                <Mail className="h-4 w-4 mr-2" /> Reply via Email
              </PremiumButton>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PremiumPageContainer>
  );
}