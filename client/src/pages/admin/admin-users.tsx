import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PremiumPageContainer, PremiumPageHeader, PremiumStatCard, PremiumButton } from "@/components/premium";
import { PremiumDataTable, Column } from "@/components/premium/PremiumDataTable";
import { Users, UserPlus, Shield, XCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PremiumConfirmationDialog } from "@/components/premium/PremiumConfirmationDialog";

export default function AdminUsersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removeAdminId, setRemoveAdminId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // For assigning roles
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  // For inviting
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", roleId: "" });

  const utils = trpc.useUtils();
  const { data: adminsData, isLoading } = trpc.adminRbac.getAdminUsers.useQuery({
    page,
    limit: pageSize
  });
  const { data: roles } = trpc.adminRbac.getRoles.useQuery();

  const assignRoleMutation = trpc.adminRbac.assignRoleToUser.useMutation({
    onSuccess: () => {
      toast.success("Role assigned successfully");
      setSelectedAdminId(null);
      setSelectedRoleId("");
      utils.adminRbac.getAdminUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeAdminMutation = trpc.adminRbac.removeAdminAccess.useMutation({
    onSuccess: () => {
      toast.success("Admin access removed");
      setRemoveAdminId(null);
      utils.adminRbac.getAdminUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const inviteMutation = trpc.adminRbac.inviteAdminUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.isNewUser ? "Admin created successfully" : "User promoted to Admin");
      setIsInviteOpen(false);
      setInviteForm({ email: "", name: "", roleId: "" });
      utils.adminRbac.getAdminUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInviteSubmit = () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast.error("Email and Name are required");
      return;
    }
    inviteMutation.mutate({
      email: inviteForm.email,
      name: inviteForm.name,
      roleId: inviteForm.roleId || undefined
    });
  };

  const columns: Column<any>[] = [
    {
      header: "User",
      cell: (admin) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {admin.name}
            {admin.isSuperAdmin && <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-700 h-4 px-1">SUPER</Badge>}
          </div>
          <div className="text-xs text-slate-500">{admin.email}</div>
        </div>
      )
    },
    {
      header: "Custom Role",
      cell: (admin) => (
        admin.assignedRole ? (
          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 border-0">
            {admin.assignedRole.name}
          </Badge>
        ) : (
          <span className="text-xs text-slate-400 italic">No specific role</span>
        )
      )
    },
    {
      header: "Joined",
      cell: (admin) => <span className="text-xs text-slate-500">{new Date(admin.createdAt).toLocaleDateString()}</span>
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (admin) => (
        <div className="flex justify-end gap-2">
          {!admin.isSuperAdmin && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => {
                  setSelectedAdminId(admin.id);
                  setSelectedRoleId(admin.assignedRole?.id?.toString() || "");
                }}
              >
                Assign Role
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setRemoveAdminId(admin.id)}
              >
                Remove
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
      <PremiumPageContainer>
        <PremiumPageHeader
          title="Admin Users"
          subtitle="Manage platform administrators and their roles"
          icon={Users}
          action={{
            label: "Add Admin",
            icon: UserPlus,
            onClick: () => setIsInviteOpen(true)
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
          <PremiumStatCard
            label="Total Admins"
            value={adminsData?.pagination.total || 0}
            icon={Shield}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
            color="text-indigo-600"
          />
        </div>

        <PremiumDataTable
          data={adminsData?.users || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No administrators found"
          pagination={{
            currentPage: page,
            totalPages: adminsData?.pagination.totalPages || 1,
            totalItems: adminsData?.pagination.total || 0,
            pageSize: pageSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
        />

        {/* Invite Dialog */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Administrator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  placeholder="John Doe"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  placeholder="john@example.com"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                />
                <p className="text-xs text-slate-500">If user exists, they will be promoted. Otherwise a new account is created.</p>
              </div>
              <div className="space-y-2">
                <Label>Assign Role (Optional)</Label>
                <Select value={inviteForm.roleId} onValueChange={(val) => setInviteForm({...inviteForm, roleId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role: any) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInviteSubmit} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Adding..." : "Add Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Role Dialog */}
        <Dialog open={!!selectedAdminId} onOpenChange={(open) => !open && setSelectedAdminId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">Select Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role: any) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAdminId(null)}>Cancel</Button>
              <Button 
                onClick={() => selectedAdminId && assignRoleMutation.mutate({ userId: selectedAdminId, roleId: parseInt(selectedRoleId) })}
                disabled={assignRoleMutation.isPending || !selectedRoleId}
              >
                Save Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PremiumConfirmationDialog
          open={!!removeAdminId}
          onOpenChange={(open) => !open && setRemoveAdminId(null)}
          title="Remove Admin Access"
          description="Are you sure you want to remove admin privileges from this user? They will be demoted to a standard user."
          onConfirm={() => removeAdminId && removeAdminMutation.mutate({ userId: removeAdminId })}
          isLoading={removeAdminMutation.isPending}
          variant="destructive"
          confirmLabel="Remove Access"
        />
      </PremiumPageContainer>
  );
}