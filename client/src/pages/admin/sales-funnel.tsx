import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Download,
  Loader2,
  Trash2,
  Eye,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PremiumStatCard } from "@/components/premium/PremiumStatCard";
import { PremiumConfirmationDialog } from "@/components/premium/PremiumConfirmationDialog";
import { PremiumDataTable, Column } from "@/components/premium/PremiumDataTable";

export default function SalesFunnelPage() {
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const utils = trpc.useUtils();
  const { data: leadsData, isLoading: leadsLoading } = trpc.crm.getLeads.useQuery({
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    page,
    limit: pageSize,
  });
  const { data: funnel, isLoading: funnelLoading } = trpc.crm.getConversionFunnel.useQuery();
  
  const { data: conversation, isLoading: conversationLoading } = trpc.crm.getLeadConversation.useQuery(
    { leadId: selectedLead || 0 },
    { enabled: !!selectedLead }
  );

  const updateStatusMutation = trpc.crm.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated");
      utils.crm.getLeads.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLeadMutation = trpc.crm.deleteLead.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      utils.crm.getLeads.invalidate();
      setLeadToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  const columns: Column<any>[] = [
    {
      header: "Name",
      cell: (lead) => (
        <span className="font-bold text-slate-900 dark:text-white">{lead.name || "Anonymous"}</span>
      )
    },
    {
      header: "Email",
      accessorKey: "email",
      className: "text-xs font-bold text-slate-500"
    },
    {
      header: "Interest",
      accessorKey: "interest",
      className: "text-xs font-bold"
    },
    {
      header: "Status",
      cell: (lead) => (
        <Select 
          defaultValue={lead.status} 
          onValueChange={(val) => updateStatusMutation.mutate({ leadId: lead.id, status: val as any })}
        >
          <SelectTrigger className="h-7 w-[110px] text-[10px] font-black uppercase border-slate-200 bg-white dark:bg-slate-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      header: "Source",
      accessorKey: "source",
      className: "text-xs font-bold text-slate-400 uppercase"
    },
    {
      header: "Date",
      cell: (lead) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(lead.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (lead) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); setSelectedLead(lead.id); }}
            title="View Chat"
          >
            <Eye className="h-4 w-4 text-slate-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={(e) => { e.stopPropagation(); setLeadToDelete(lead.id); }}
            title="Delete Lead"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-slate-900 dark:text-white">SALES FUNNEL</h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Leads & Conversion Analytics</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Application Funnel
            </h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="relative">
              {funnel ? (
                <div className="flex justify-between text-center relative z-10">
                  <div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl font-black">
                      {funnel.applications}
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500">Applications</p>
                  </div>
                  <div className="pt-6">
                    <ArrowRight className="h-6 w-6 text-slate-300" />
                  </div>
                  <div>
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl font-black">
                      {funnel.approved}
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500">Approved</p>
                    <p className="text-[10px] font-bold text-green-500">{funnel.conversionRate.approvalRate.toFixed(1)}%</p>
                  </div>
                  <div className="pt-6">
                    <ArrowRight className="h-6 w-6 text-slate-300" />
                  </div>
                  <div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl font-black">
                      {funnel.signed}
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500">Signed</p>
                    <p className="text-[10px] font-bold text-green-500">{funnel.conversionRate.signingRate.toFixed(1)}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 font-bold uppercase">Loading funnel data...</div>
              )}
            </div>
          </div>
        </Card>

        {/* Chatbot Stats */}
        <div className="grid grid-cols-2 gap-6">
           <PremiumStatCard
              label="Total Leads"
              value={leadsData?.stats.total || 0}
              icon={MessageSquare}
              bg="bg-blue-50 dark:bg-blue-900/20"
              color="text-blue-600 dark:text-blue-400"
           />
           <PremiumStatCard
              label="Active Conversations"
              value={leadsData?.stats.activeConversations || 0} 
              icon={TrendingUp}
              bg="bg-green-50 dark:bg-green-900/20"
              color="text-green-600 dark:text-green-400"
           />
        </div>
      </div>

      {/* Chatbot Leads Table */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Captured Leads</h2>
          <Button variant="outline" size="sm" className="font-bold uppercase text-[10px]" onClick={() => toast.info("Exporting CSV...")}>
            <Download className="h-3 w-3 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search leads..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
        </div>

        <PremiumDataTable 
          data={leadsData?.leads || []}
          columns={columns}
          isLoading={leadsLoading}
          emptyMessage="No leads captured yet"
          pagination={{
            currentPage: page,
            totalPages: leadsData?.pagination.totalPages || 1,
            totalItems: leadsData?.pagination.total || 0,
            pageSize: pageSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
        />
      </div>

      {/* Chat History Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <DialogTitle className="text-lg font-black uppercase text-slate-900 dark:text-white">
              Chat History
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            {conversationLoading ? (
              <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
            ) : conversation && conversation.length > 0 ? (
              conversation.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium ${
                      msg.sender === "user" 
                        ? "bg-blue-600 text-white rounded-br-none shadow-md" 
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.message}
                    <p className={`text-[9px] mt-1 font-bold uppercase ${msg.sender === "user" ? "text-blue-200" : "text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 font-bold uppercase text-xs tracking-widest">
                No conversation history found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <PremiumConfirmationDialog
        open={!!leadToDelete}
        onOpenChange={(open) => !open && setLeadToDelete(null)}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => leadToDelete && deleteLeadMutation.mutate({ leadId: leadToDelete })}
        isLoading={deleteLeadMutation.isPending}
      />
    </div>
  );
}