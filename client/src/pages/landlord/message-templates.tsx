import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Copy, Edit, Trash2, Plus, Check, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MessageTemplatesPage() {
  const { user } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", category: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: userTemplates, isLoading, refetch } = trpc.messageTemplates.getUserTemplates.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: defaultTemplates } = trpc.messageTemplates.getDefaultTemplates.useQuery(undefined, {
    enabled: !!user,
  });

  const allTemplates = useMemo(() => [...(userTemplates || []), ...(defaultTemplates || [])], [userTemplates, defaultTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTemplates, searchQuery]);

  const createMutation = trpc.messageTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created");
      setShowEditDialog(false);
      refetch();
    }
  });

  const updateMutation = trpc.messageTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated");
      setShowEditDialog(false);
      refetch();
    }
  });

  const deleteMutation = trpc.messageTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetch();
    }
  });

  const handleSave = () => {
    if (selectedTemplate) {
      updateMutation.mutate({ templateId: selectedTemplate.id, ...formData });
    } else {
      createMutation.mutate({ ...formData, isDefault: false });
    }
  };

  const handleEdit = (t: any) => {
    setSelectedTemplate(t);
    setFormData({ title: t.title, category: t.category, content: t.content });
    setShowEditDialog(true);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading templates...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl text-white flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3"><MessageSquare className="h-10 w-10" /> Message Templates</h1>
            <p className="mt-2 opacity-90 text-lg">Manage pre-written messages for quick communication</p>
          </div>
          <Button onClick={() => { setSelectedTemplate(null); setFormData({title:"", category:"", content:""}); setShowEditDialog(true); }} className="bg-white text-slate-900 font-bold px-6">
            <Plus className="h-5 w-5 mr-2" /> Create Template
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 border-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((t: any) => (
            <Card key={t.id} className="border-2 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl">{t.title}</h3>
                    <Badge variant="secondary" className="mt-1">{t.category}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(t.content); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                    {!t.isDefault && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if(confirm("Delete?")) deleteMutation.mutate({ templateId: t.id }); }}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-300 border italic line-clamp-4">
                  {t.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{selectedTemplate ? "Edit Template" : "Create Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label>Category</Label><Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} /></div>
            <div><Label>Content</Label><Textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={10} /></div>
            <Button className="w-full" onClick={handleSave}>Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
