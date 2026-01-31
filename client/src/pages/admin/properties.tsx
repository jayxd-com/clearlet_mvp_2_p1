import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Building, 
  Search, 
  MapPin, 
  Home, 
  Euro, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PremiumDataTable, Column } from "@/components/premium/PremiumDataTable";
import { PremiumStatusBadge } from "@/components/premium/PremiumStatusBadge";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { PremiumStatCard } from "@/components/premium/PremiumStatCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminPropertiesPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Queries and Mutations
  const { data, isLoading, refetch } = trpc.adminProperties.getAll.useQuery({
    page,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter,
  });

  const { data: overview } = trpc.crm.getOverview.useQuery();

  const { data: documents, isLoading: isLoadingDocs } = trpc.adminProperties.getDocuments.useQuery(
    { propertyId: selectedProperty?.id || 0 },
    { enabled: !!selectedProperty }
  );

  const approveMutation = trpc.adminProperties.approve.useMutation({
    onSuccess: () => {
      toast.success("Property approved successfully");
      refetch();
      setSelectedProperty((prev: any) => ({ ...prev, verifiedLandlord: true, status: 'active' }));
    },
    onError: (err) => toast.error(`Failed to approve: ${err.message}`)
  });

  const rejectMutation = trpc.adminProperties.reject.useMutation({
    onSuccess: () => {
      toast.success("Property rejected");
      refetch();
      setSelectedProperty((prev: any) => ({ ...prev, verifiedLandlord: false, status: 'inactive' }));
    },
    onError: (err) => toast.error(`Failed to reject: ${err.message}`)
  });

  const updateStatusMutation = trpc.adminProperties.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refetch();
    },
    onError: (err) => toast.error(`Failed to update status: ${err.message}`)
  });

  const columns: Column<any>[] = [
    {
      header: "Property",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
             <Home className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{p.title}</p>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.address}</p>
          </div>
        </div>
      )
    },
    {
      header: "Landlord",
      cell: (p) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{p.landlord?.name || "Unknown"}</p>
          <p className="text-xs text-slate-500">{p.landlord?.email}</p>
        </div>
      )
    },
    {
      header: "Price",
      cell: (p) => (
        <span className="font-bold text-slate-900 dark:text-white">
          €{(p.rentPrice / 100).toLocaleString()}
        </span>
      )
    },
    {
      header: "Status",
      cell: (p) => (
        <div className="flex flex-col gap-1">
          <PremiumStatusBadge status={p.status} className="w-fit" />
          {p.verifiedLandlord && (
            <PremiumStatusBadge status="verified" label="Verified Listing" className="w-fit" />
          )}
        </div>
      )
    },
    {
      header: "Actions",
      cell: (p) => (
        <PremiumButton 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProperty(p);
          }}
        >
          View Details
        </PremiumButton>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            Property Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Review, approve, and manage property listings.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumStatCard
            label="Total Properties"
            value={overview?.current.totalProperties || 0}
            icon={Building}
            bg="bg-orange-50 dark:bg-orange-900/20"
            color="text-orange-600 dark:text-orange-400"
          />
          <PremiumStatCard
            label="Active Contracts"
            value={overview?.current.activeContracts || 0}
            icon={Home}
            bg="bg-blue-50 dark:bg-blue-900/20"
            color="text-blue-600 dark:text-blue-400"
          />
          <PremiumStatCard
            label="Total Revenue"
            value={`€${((overview?.current.totalRevenue || 0) / 100).toLocaleString()}`}
            icon={DollarSign}
            bg="bg-green-50 dark:bg-green-900/20"
            color="text-green-600 dark:text-green-400"
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search properties by title or address..." 
              className="pl-10 h-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-10 font-bold">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_verification">Pending Verification</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <PremiumDataTable 
          data={data?.items || []}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            currentPage: page,
            totalPages: data?.pagination.totalPages || 1,
            totalItems: data?.pagination.total || 0,
            pageSize: pageSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
        />

        {/* Property Detail Dialog */}
        <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
          <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 overflow-hidden rounded-2xl">
            <DialogHeader className="p-6 border-b-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Building className="h-6 w-6 text-cyan-500" />
                Property Details
              </DialogTitle>
              <DialogDescription>
                Review property information and manage verification status.
              </DialogDescription>
            </DialogHeader>

            {selectedProperty && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
                   <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedProperty.title}</h3>
                     <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                       <MapPin className="h-3 w-3" />
                       {selectedProperty.address}, {selectedProperty.city}
                     </div>
                     <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                       <Euro className="h-3 w-3" />
                       <span className="font-bold">{(selectedProperty.rentPrice / 100).toLocaleString()}</span> / month
                     </div>
                   </div>
                   <div className="text-left md:text-right">
                     <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Status</p>
                     <PremiumStatusBadge status={selectedProperty.status} />
                     {selectedProperty.verifiedLandlord ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-2 md:justify-end">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </div>
                     ) : (
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-2 md:justify-end">
                          <AlertTriangle className="h-3 w-3" /> Unverified
                        </div>
                     )}
                   </div>
                </div>

                {/* Documents */}
                <div>
                   <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                     <FileText className="h-4 w-4" /> Attached Documents
                   </h4>
                   {isLoadingDocs ? (
                     <p className="text-sm text-slate-400">Loading documents...</p>
                   ) : documents && documents.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {documents.map((doc: any) => (
                         <a 
                           key={doc.id} 
                           href={doc.fileUrl} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500 transition-colors group"
                         >
                           <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <FileText className="h-4 w-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                           </div>
                           <div className="overflow-hidden">
                             <p className="text-sm font-medium truncate text-slate-900 dark:text-white">{doc.fileName}</p>
                             <p className="text-[10px] text-slate-500 uppercase tracking-widest">{doc.category}</p>
                           </div>
                           <ExternalLink className="h-3 w-3 ml-auto text-slate-400 group-hover:text-cyan-500" />
                         </a>
                       ))}
                     </div>
                   ) : (
                     <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                       <p className="text-sm text-slate-500">No documents found for this property.</p>
                     </div>
                   )}
                </div>

                {/* Status Control */}
                {selectedProperty.verifiedLandlord && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <h4 className="text-sm font-black uppercase tracking-widest text-blue-500 mb-2">Manage Status</h4>
                    <div className="space-y-2">
                      <Select 
                        value={selectedProperty.status} 
                        onValueChange={(val) => {
                          // Optimistic update
                          setSelectedProperty({...selectedProperty, status: val});
                          updateStatusMutation.mutate({ id: selectedProperty.id, status: val as any });
                        }}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-blue-400">
                        Change the public visibility status of this property.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="p-6 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 gap-2 sm:gap-0">
              {selectedProperty && (
                <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
                  <a 
                    href={`/properties/${selectedProperty.id}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-cyan-500 hover:text-cyan-600 flex items-center gap-1"
                  >
                    View Public Page <ExternalLink className="h-3 w-3" />
                  </a>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {!selectedProperty.verifiedLandlord ? (
                      <>
                        <PremiumButton
                           variant="outline"
                           className="flex-1 sm:flex-none border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                           onClick={() => rejectMutation.mutate({ id: selectedProperty.id })}
                           disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </PremiumButton>
                        <PremiumButton
                           className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white"
                           onClick={() => approveMutation.mutate({ id: selectedProperty.id })}
                           disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </PremiumButton>
                      </>
                    ) : (
                      <PremiumButton
                         variant="outline"
                         className="w-full sm:w-auto border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                         onClick={() => rejectMutation.mutate({ id: selectedProperty.id })}
                         disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Revoke Approval
                      </PremiumButton>
                    )}
                  </div>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
