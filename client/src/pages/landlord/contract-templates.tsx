import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Edit, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  PremiumPageContainer,
  PremiumPageHeader,
  PremiumCard,
  PremiumButton,
  PremiumLabel,
  PremiumInput,
  PremiumTextarea,
  PremiumStatCard
} from "@/components/premium";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ContractTemplatesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: templates, isLoading, refetch } = trpc.contractTemplates.getUserTemplates.useQuery(undefined, {
    enabled: !!user,
  });
  
  const deleteMutation = trpc.contractTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetch();
    },
  });

  const handleEdit = (t: any) => {
    setLocation(`/landlord/contract-templates/edit/${t.id}`);
  };

  const stats = [
    { label: "Total Templates", value: templates?.length || 0, icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Default Template", value: templates?.find((t: any) => t.isDefault) ? "Set" : "None", icon: ClipboardList, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
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
        title="Contract Templates"
        subtitle="Create reusable contract templates for your properties"
        icon={FileText}
        action={{
          label: "Create Template",
          onClick: () => setLocation("/landlord/contract-templates/create"),
          icon: Plus
        }}
      />

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
            description={t.description || "No description provided"}
            icon={FileText}
            cta={
              t.isDefault && <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-none font-bold uppercase text-[9px]">Default</Badge>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium line-clamp-3 min-h-[3rem]">
                {t.terms.substring(0, 100)}...
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <PremiumButton 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(t)}
                  className="text-slate-500 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
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
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No templates found</h3>
            <p className="text-slate-500 mt-2">Create your first contract template to streamline agreements.</p>
            <PremiumButton onClick={() => setLocation("/landlord/contract-templates/create")} className="mt-6">
              <Plus className="h-4 w-4 mr-2" /> Create First Template
            </PremiumButton>
          </div>
        )}
      </div>
    </PremiumPageContainer>
  );
}
