import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Filter, CheckCircle, XCircle, Clock, Eye, ArrowLeft, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PremiumDocumentViewer } from "@/components/premium/PremiumDocumentViewer";

export default function AdminDocumentsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; fileName: string; type: string } | null>(null);
  
  const { data: documents, isLoading, refetch } = trpc.crm.getDocuments.useQuery();
  
  const updateStatusMutation = trpc.crm.updateDocumentStatus.useMutation({
    onSuccess: () => {
      toast.success("Document status updated");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  const deleteDocumentMutation = trpc.crm.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      refetch();
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete document");
    }
  });

  const handleUpdateStatus = (docId: number, status: "verified" | "rejected") => {
    updateStatusMutation.mutate({
      documentId: docId,
      status: status
    });
  };

  const handleDeleteClick = (docId: number) => {
    setDocumentToDelete(docId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate({ documentId: documentToDelete });
    }
  };

  const handleViewDocument = (doc: any) => {
    setPreviewDocument({
      url: doc.fileUrl,
      fileName: doc.fileName,
      type: doc.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
    });
  };

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.filter((doc: any) => {
      const matchesSearch = doc.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.id.toString() === searchTerm;
      const matchesStatus = statusFilter === "all" || doc.verificationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchTerm, statusFilter]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading documents...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">Document Review</h1>
            <p className="text-slate-500">Verify user identity and financial proofs</p>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "verified", "rejected"].map(s => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by user name, file name or document ID..." 
              className="pl-10 h-12" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-2 shadow-xl overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700">
                {filteredDocuments.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{doc.userName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{doc.fileName}</td>
                    <td className="px-6 py-4 uppercase text-xs font-bold text-slate-500">{doc.documentType}</td>
                    <td className="px-6 py-4">
                      <Badge variant={doc.verificationStatus === "verified" ? "default" : doc.verificationStatus === "rejected" ? "destructive" : "secondary"}>
                        {doc.verificationStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>View</Button>
                      
                      {doc.verificationStatus === "pending" && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleUpdateStatus(doc.id, "verified")}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleUpdateStatus(doc.id, "rejected")}
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDeleteClick(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                This action cannot be undone. This will permanently delete the document from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                {deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Document Preview Dialog */}
        <PremiumDocumentViewer
          open={!!previewDocument}
          onOpenChange={(open) => !open && setPreviewDocument(null)}
          url={previewDocument?.url || null}
          fileName={previewDocument?.fileName}
          type={previewDocument?.type}
        />
      </div>
    </div>
  );
}
