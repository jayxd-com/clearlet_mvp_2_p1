import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building,
  FileText,
  DollarSign,
  ShieldAlert,
  Search,
  Download,
  Eye,
  Trash2,
  Edit,
  Activity,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PremiumStatCard } from "@/components/premium/PremiumStatCard";
import { PremiumDataTable, Column } from "@/components/premium/PremiumDataTable";
import { PremiumStatusBadge } from "@/components/premium/PremiumStatusBadge";
import { PremiumConfirmationDialog } from "@/components/premium/PremiumConfirmationDialog";
import { PremiumDocumentViewer } from "@/components/premium/PremiumDocumentViewer";

export default function UserManagementDashboard() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; fileName: string; type?: string } | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Queries
  const utils = trpc.useUtils();
  const { data: analytics, isLoading: analyticsLoading } = trpc.crm.getAnalytics.useQuery();
  const { data: overview } = trpc.crm.getOverview.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.crm.getUsers.useQuery({
    userType: userTypeFilter === "all" ? undefined : (userTypeFilter as "tenant" | "landlord"),
    verificationStatus: verificationFilter === "all" ? undefined : (verificationFilter as "unverified" | "pending" | "verified"),
    search: searchTerm,
    page: currentPage,
    limit: pageSize,
  });
  const { data: systemHealth } = trpc.crm.getSystemHealth.useQuery();
  const { data: userDetails, isLoading: userDetailsLoading } = trpc.crm.getUserDetails.useQuery(
    selectedUser?.id || 0,
    { enabled: !!selectedUser }
  );
  const { data: userTimeline } = trpc.crm.getUserTimeline.useQuery(
    selectedUser?.id || 0,
    { enabled: !!selectedUser }
  );

  // Mutations
  const updateVerification = trpc.crm.updateUserVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification updated");
      utils.crm.getUsers.invalidate();
      utils.crm.getUserDetails.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update verification status");
    },
  });

  const updateUserType = trpc.crm.updateUserType.useMutation({
    onSuccess: () => {
      toast.success("User type updated");
      utils.crm.getUsers.invalidate();
      utils.crm.getUserDetails.invalidate();
    },
  });

  const updatePropertyVerification = trpc.crm.updatePropertyVerification.useMutation({
    onSuccess: () => {
      toast.success("Property verification updated");
      utils.crm.getUserDetails.invalidate();
    },
  });

  const deleteUser = trpc.crm.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      setShowDeleteDialog(false);
      setShowUserDialog(false);
      utils.crm.getUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Table Columns
  const userColumns: Column<any>[] = [
    {
      header: "User Identity",
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white">{user.name || "Unknown"}</span>
          <span className="text-xs font-bold text-slate-400 tracking-tight">{user.email}</span>
          {user.dniNie && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit mt-1">ID: {user.dniNie}</span>}
        </div>
      ),
    },
    {
      header: "Role / Type",
      cell: (user) => (
        <div className="flex gap-2">
          <Badge variant="secondary" className="font-bold text-[10px] uppercase">{user.role}</Badge>
          <Badge variant="outline" className="font-bold text-[10px] uppercase">{user.userType}</Badge>
        </div>
      ),
    },
    {
      header: "Verification",
      cell: (user) => (
        <PremiumStatusBadge status={user.verificationStatus} />
      ),
    },
    {
      header: "Joined",
      cell: (user) => (
        <span className="text-xs font-bold text-slate-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (user) => (
        <div className="flex justify-end gap-2">
           <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setShowUserDialog(true);
            }}
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      ),
    },
  ];

  if (analyticsLoading) return <div className="p-8 text-center font-bold animate-pulse text-slate-400">LOADING CRM DATA...</div>;

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-slate-900 dark:text-white">USER & COMPLIANCE MANAGEMENT</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Platform Command Center</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className={`h-2.5 w-2.5 rounded-full ${systemHealth?.database === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">System: {systemHealth?.database}</span>
             </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <PremiumStatCard
            label="Total Users"
            value={overview?.current.totalUsers || 0}
            icon={Users}
            bg="bg-blue-50 dark:bg-blue-900/20"
            color="text-blue-600 dark:text-blue-400"
          />
          <PremiumStatCard
            label="Verified Users"
            value={overview?.current.verifiedUsers || 0}
            icon={CheckCircle}
            bg="bg-green-50 dark:bg-green-900/20"
            color="text-green-600 dark:text-green-400"
          />
          <PremiumStatCard
            label="Pending Users"
            value={systemHealth?.pendingVerifications || 0}
            icon={Clock}
            bg="bg-yellow-50 dark:bg-yellow-900/20"
            color="text-yellow-600 dark:text-yellow-400"
          />
          <PremiumStatCard
            label="Pending Docs"
            value={systemHealth?.pendingDocuments || 0}
            icon={ShieldAlert}
            bg="bg-purple-50 dark:bg-purple-900/20"
            color="text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
            <TabsTrigger value="users" className="rounded-lg font-bold px-6">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search users by name, email or ID..." 
                    className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                    <SelectTrigger className="w-[140px] h-10 font-bold bg-slate-50 dark:bg-slate-800"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="tenant">Tenants</SelectItem>
                      <SelectItem value="landlord">Landlords</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger className="w-[160px] h-10 font-bold bg-slate-50 dark:bg-slate-800"><SelectValue placeholder="Verification" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <Button variant="outline" className="h-10 px-3" onClick={() => toast.info("Exporting CSV...")}>
                    <Download className="h-4 w-4" />
                  </Button> */}
                </div>
             </div>

             <PremiumDataTable
                data={usersData?.users || []}
                columns={userColumns}
                isLoading={usersLoading}
                pagination={{
                  currentPage: currentPage,
                  totalPages: usersData?.pagination.totalPages || 1,
                  totalItems: usersData?.pagination.total || 0,
                  pageSize: pageSize,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: setPageSize,
                }}
                onRowClick={(user) => {
                  setSelectedUser(user);
                  setShowUserDialog(true);
                }}
             />
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details & Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl gap-0 border-0">
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedUser?.name}</h2>
                  <p className="font-bold text-slate-400">{selectedUser?.email}</p>
               </div>
               <div className="flex gap-2">
                  <Badge className="bg-white/10 text-white border-0 font-bold uppercase px-3 py-1">
                    {selectedUser?.role}
                  </Badge>
               </div>
            </div>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-950 p-8 space-y-8">
             {userDetailsLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
             ) : userDetails && (
                <>
                   {/* Quick Stats */}
                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Type</p>
                         <Select 
                           defaultValue={userDetails.user.userType}
                           onValueChange={(val) => updateUserType.mutate({ userId: userDetails.user.id, userType: val as any })}
                        >
                           <SelectTrigger className="h-8 border-0 bg-transparent p-0 font-black text-lg shadow-none focus:ring-0">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="tenant">Tenant</SelectItem>
                              <SelectItem value="landlord">Landlord</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Status</p>
                         <PremiumStatusBadge status={userDetails.user.verificationStatus} />
                      </div>
                      <div className="p-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Properties</p>
                         <p className="text-xl font-black">{userDetails.properties.length}</p>
                      </div>
                   </div>

                   {/* Activity Timeline */}
                   <div className="space-y-4">
                      <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">Activity Timeline</h3>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 p-4 max-h-48 overflow-y-auto">
                        {userTimeline && userTimeline.length > 0 ? (
                          <div className="space-y-4">
                            {userTimeline.map((event: any, i: number) => (
                              <div key={i} className="flex gap-3 items-start border-l-2 border-slate-200 pl-4 relative ml-2">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-4 border-blue-500" />
                                <div>
                                  <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{event.eventType?.replace(/_/g, ' ') || 'SYSTEM EVENT'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(event.eventTimestamp).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase">No activity recorded</p>
                        )}
                      </div>
                   </div>

                   {/* Managed Properties */}
                   <div className="space-y-4">
                      <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">Managed Properties</h3>
                      <div className="space-y-3">
                        {userDetails.properties.map((prop: any) => {
                          const propDoc = userDetails.propertyDocuments?.find((d: any) => d.propertyId === prop.id);
                          return (
                            <div key={prop.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 flex justify-between items-center">
                              <div>
                                <p className="font-black text-sm">{prop.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{prop.city}, {prop.country}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {prop.verifiedLandlord ? (
                                  <Badge className="bg-green-500 font-black uppercase text-[10px]">Verified</Badge>
                                ) : (
                                  <>
                                    {propDoc && (
                                      <Button 
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-blue-500 hover:bg-blue-50"
                                        title="View Ownership Proof"
                                        onClick={() => setPreviewDocument({
                                          url: propDoc.fileUrl,
                                          fileName: `Ownership Proof - ${prop.title}`,
                                          type: propDoc.mimeType
                                        })}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="font-black text-[10px] uppercase h-7 border-2"
                                      onClick={() => updatePropertyVerification.mutate({ propertyId: prop.id, verified: true })}
                                    >
                                      Verify
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {userDetails.properties.length === 0 && (
                          <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed">No properties listed</p>
                        )}
                      </div>
                   </div>

                   {/* Verification Documents */}
                   <div className="space-y-4">
                      <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">Verification Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userDetails.documents.map((doc: any) => (
                          <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm">{doc.documentType.toUpperCase()}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{doc.verificationStatus}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPreviewDocument({
                                url: doc.fileUrl,
                                fileName: `${doc.documentType} - ${doc.fileName}`,
                                type: doc.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {userDetails.documents.length === 0 && (
                          <p className="col-span-2 text-center py-4 text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed">No documents uploaded</p>
                        )}
                      </div>
                   </div>

                   {/* Verification Controls */}
                   <div className="space-y-3">
                      <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">Verification Actions</h3>
                      <div className="flex gap-3">
                         <Button 
                           className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-11"
                           onClick={() => updateVerification.mutate({ userId: selectedUser.id, status: "verified" })}
                           disabled={userDetails.user.verificationStatus === "verified"}
                        >
                           <CheckCircle className="h-4 w-4 mr-2" /> Verify Account
                        </Button>
                        <Button 
                           variant="outline"
                           className="flex-1 border-2 font-bold h-11"
                           onClick={() => updateVerification.mutate({ userId: selectedUser.id, status: "pending" })}
                           disabled={userDetails.user.verificationStatus === "pending"}
                        >
                           <Clock className="h-4 w-4 mr-2" /> Set Pending
                        </Button>
                        <Button 
                           variant="outline"
                           className="flex-1 border-2 font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 hover:border-red-200 h-11 transition-all"
                           onClick={() => updateVerification.mutate({ userId: selectedUser.id, status: "unverified" })}
                           disabled={userDetails.user.verificationStatus === "unverified"}
                        >
                           <XCircle className="h-4 w-4 mr-2" /> Revoke
                        </Button>
                      </div>
                   </div>

                   {/* Danger Zone */}
                   <div className="pt-8 border-t-2">
                      <Button 
                         variant="destructive" 
                         className="w-full font-bold"
                         onClick={() => {
                            setUserToDelete(userDetails.user.id);
                            setShowDeleteDialog(true);
                         }}
                      >
                         <Trash2 className="h-4 w-4 mr-2" />
                         Delete User Account
                      </Button>
                   </div>
                </>
             )}
          </div>
        </DialogContent>
      </Dialog>

      <PremiumConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete User Account"
        description="Are you sure you want to delete this user? This action cannot be undone. Their data will be anonymized."
        confirmLabel="Yes, Delete User"
        variant="destructive"
        onConfirm={() => {
           if (userToDelete) deleteUser.mutate({ userId: userToDelete });
        }}
        isLoading={deleteUser.isPending}
      />

      <PremiumDocumentViewer
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        url={previewDocument?.url || null}
        fileName={previewDocument?.fileName}
        type={previewDocument?.type}
      />
    </>
  );
}