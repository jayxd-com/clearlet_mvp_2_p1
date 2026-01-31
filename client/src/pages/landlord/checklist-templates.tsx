import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ChecklistWizard } from "@/components/ChecklistWizard";
import { Plus, FileText, Trash2, Home, ClipboardList, AlertCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  PremiumPageContainer, 
  PremiumPageHeader, 
  PremiumCard, 
  PremiumButton, 
  PremiumStatusBadge,
  PremiumStatCard
} from "@/components/premium";
import { Badge } from "@/components/ui/badge";

export default function ChecklistTemplatesPage() {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const { data: templates, refetch, isLoading } = trpc.checklist.getTemplates.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.checklist.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete template");
    }
  });

  const stats = [
    { label: "Total Templates", value: templates?.length || 0, icon: ClipboardList, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Default Template", value: templates?.find((t: any) => t.isDefault) ? "Set" : "None", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading templates...</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumPageHeader
        title="Checklist Templates"
        subtitle="Manage reusable move-in condition reports for your properties"
        icon={ClipboardList}
        action={{
          label: "Create Template",
          onClick: () => { setSelectedTemplate(null); setShowWizard(true); },
          icon: Plus
        }}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((t: any) => (
          <PremiumCard 
            key={t.id} 
            title={t.name} 
            description={`${t.propertyType.charAt(0).toUpperCase() + t.propertyType.slice(1)} Property`}
            icon={ClipboardList}
            cta={
              t.isDefault && <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-none font-bold uppercase text-[9px]">Default</Badge>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <FileText className="h-3 w-3" />
                Created on {new Date(t.createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <PremiumButton 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-500 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                  onClick={() => {
                    setSelectedTemplate(t);
                    setShowWizard(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </PremiumButton>
                <PremiumButton 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                  onClick={() => { 
                    if(confirm("Are you sure you want to delete this template?")) {
                      deleteMutation.mutate({ templateId: t.id }); 
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </PremiumButton>
              </div>
            </div>
          </PremiumCard>
        ))}

        {templates?.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No templates found</h3>
            <p className="text-slate-500 mt-2">Create your first checklist template to streamline move-in inspections.</p>
            <PremiumButton onClick={() => setShowWizard(true)} className="mt-6">
              <Plus className="h-4 w-4 mr-2" /> Create First Template
            </PremiumButton>
          </div>
        )}
      </div>

      <Dialog open={showWizard} onOpenChange={(open) => { setShowWizard(open); if(!open) setSelectedTemplate(null); }}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{selectedTemplate ? "Edit Checklist Template" : "Create Checklist Template"}</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <ChecklistWizard 
              initialData={selectedTemplate}
              onComplete={() => { setShowWizard(false); setSelectedTemplate(null); refetch(); }} 
              onCancel={() => { setShowWizard(false); setSelectedTemplate(null); }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </PremiumPageContainer>
  );
}