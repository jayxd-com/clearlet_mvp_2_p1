import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  FileText, 
  Save, 
  ArrowLeft 
} from "lucide-react";
import {
  PremiumPageContainer,
  PremiumPageHeader,
  PremiumCard,
  PremiumButton,
  PremiumLabel,
  PremiumInput,
} from "@/components/premium";
import { MarkdownEditor } from "@/components/MarkdownEditor";

export default function CreateContractTemplatePage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/landlord/contract-templates/edit/:id");
  const templateId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!templateId;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    terms: `## 1. Introduction
This agreement is made between...

## 2. Rent
The tenant agrees to pay...

- Item 1
- Item 2`,
    specialConditions: "",
    isDefault: false,
    isPublic: false,
  });

  const { data: template, isLoading: isLoadingTemplate } = trpc.contractTemplates.getById.useQuery(
    { templateId: templateId! },
    { enabled: isEditing }
  );

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || "",
        terms: template.terms,
        specialConditions: template.specialConditions || "",
        isDefault: template.isDefault || false,
        isPublic: template.isPublic || false,
      });
    }
  }, [template]);

  const createMutation = trpc.contractTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      setLocation("/landlord/contract-templates");
    },
    onError: (err) => {
      toast.error("Failed to create template: " + err.message);
    }
  });

  const updateMutation = trpc.contractTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      setLocation("/landlord/contract-templates");
    },
    onError: (err) => {
      toast.error("Failed to update template: " + err.message);
    }
  });

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Please enter a template name");
      return;
    }
    if (!formData.terms) {
      toast.error("Please enter contract terms");
      return;
    }

    if (isEditing && templateId) {
      updateMutation.mutate({ templateId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEditing && isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading template...</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumButton 
        variant="ghost" 
        onClick={() => setLocation("/landlord/contract-templates")} 
        className="mb-6 pl-0 hover:bg-transparent text-slate-500 hover:text-cyan-500"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Templates
      </PremiumButton>

      <PremiumPageHeader
        title={isEditing ? "Edit Contract Template" : "Create Contract Template"}
        subtitle="Design a reusable legal agreement with our markdown editor"
        icon={FileText}
        action={{
          label: isEditing ? "Update Template" : "Save Template",
          onClick: handleSave,
          icon: Save,
          isLoading: createMutation.isPending || updateMutation.isPending
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PremiumCard title="Contract Terms" icon={FileText} description="Write your contract using the editor below. Supports Headings, Lists, and formatting.">
            <MarkdownEditor 
              value={formData.terms} 
              onChange={(val) => setFormData({...formData, terms: val})} 
              rows={25}
              placeholder="Start writing your contract terms..."
            />
          </PremiumCard>
        </div>

        <div className="space-y-8">
          <PremiumCard title="Template Details" description="Basic information for this template">
            <div className="space-y-4">
              <div className="space-y-2">
                <PremiumLabel required>Template Name</PremiumLabel>
                <PremiumInput 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Standard UK AST" 
                />
              </div>
              <div className="space-y-2">
                <PremiumLabel>Description</PremiumLabel>
                <PremiumInput 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="For residential properties in London..." 
                />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard title="Settings">
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.isDefault} 
                  onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="font-medium text-sm">Set as Default Template</span>
              </label>
            </div>
          </PremiumCard>

          <PremiumButton 
            className="w-full h-14 text-lg shadow-xl shadow-cyan-500/20" 
            onClick={handleSave} 
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? "Update Template" : "Create Template"}
          </PremiumButton>
        </div>
      </div>
    </PremiumPageContainer>
  );
}