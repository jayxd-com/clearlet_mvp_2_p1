import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PremiumPageContainer, PremiumPageHeader, PremiumCard, PremiumButton } from "@/components/premium";
import { ShieldCheck, Plus, Edit, Trash2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PremiumConfirmationDialog } from "@/components/premium/PremiumConfirmationDialog";
import {Button} from "@/components/ui/button";

const AVAILABLE_PERMISSIONS = [
  { id: "verify_documents", label: "Verify Documents" },
  { id: "flag_content", label: "Flag Content" },
  { id: "view_reports", label: "View Reports" },
  { id: "manage_users", label: "Manage Users" },
  { id: "manage_roles", label: "Manage Roles" },
  { id: "view_user_info", label: "View User Info" },
  { id: "handle_disputes", label: "Handle Disputes" },
  { id: "send_messages", label: "Send Messages" },
];

export default function RolesPermissionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const utils = trpc.useUtils();
  const { data: roles, isLoading } = trpc.adminRbac.getRoles.useQuery();

  const createMutation = trpc.adminRbac.createRole.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      setIsDialogOpen(false);
      resetForm();
      utils.adminRbac.getRoles.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.adminRbac.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      setIsDialogOpen(false);
      resetForm();
      utils.adminRbac.getRoles.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.adminRbac.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      setRoleToDelete(null);
      utils.adminRbac.getRoles.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] });
    setEditingRole(null);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: JSON.parse(role.permissions || "[]"),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) return toast.error("Role name is required");

    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  return (
      <PremiumPageContainer>
        <PremiumPageHeader
          title="Roles & Permissions"
          subtitle="Manage custom admin roles and access levels"
          icon={ShieldCheck}
          action={{
            label: "Create Role",
            icon: Plus,
            onClick: () => { resetForm(); setIsDialogOpen(true); }
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-slate-400">Loading roles...</div>
          ) : roles?.map((role: any) => (
            <PremiumCard
              key={role.id}
              title={role.name}
              description={role.description || "No description"}
              className="relative"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(role.permissions || "[]").map((perm: string) => (
                    <span key={perm} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase text-slate-500">
                      {perm.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>

                {!role.isSystem && (
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRoleToDelete(role.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </PremiumCard>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Moderator"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of responsibilities"
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PremiumConfirmationDialog
          open={!!roleToDelete}
          onOpenChange={(open) => !open && setRoleToDelete(null)}
          title="Delete Role"
          description="Are you sure you want to delete this role? This action cannot be undone."
          onConfirm={() => roleToDelete && deleteMutation.mutate({ id: roleToDelete })}
          isLoading={deleteMutation.isPending}
          variant="destructive"
        />
      </PremiumPageContainer>
  );
}
