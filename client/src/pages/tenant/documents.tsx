import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { FileText, Upload, CheckCircle, AlertCircle, Trash2, Download, Plus, Calendar, Clock, FileCheck, Receipt, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TenantDocumentsPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  // Fetch all document types
  const { data: documentsData, isLoading, refetch } = trpc.uploads.getMyDocuments.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: contractsData } = trpc.contracts.getTenantContracts.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: vaultDocumentsData } = trpc.documentVault.getMyDocuments.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  const utils = trpc.useUtils();

  // Delete document mutation
  const deleteDocumentMutation = trpc.uploads.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      refetch();
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

  // Organize documents by category
  const organizedDocuments = useMemo(() => {
    const verificationDocs = (documentsData || []).map((doc: any) => ({
      ...doc,
      category: "verification",
      categoryLabel: "Verification Documents",
      icon: Shield,
    }));

    const contractDocs = (contractsData || [])
      .filter((contract: any) => contract.contractPdfUrl)
      .map((contract: any) => ({
        id: `contract-${contract.id}`,
        fileName: `Contract - ${contract.property?.title || `Property ${contract.propertyId}`}`,
        fileUrl: contract.contractPdfUrl,
        documentType: "contract",
        category: "contracts",
        categoryLabel: "Contract Documents",
        icon: FileCheck,
        verificationStatus: contract.status === "fully_signed" ? "verified" : "pending",
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        contractId: contract.id,
        propertyTitle: contract.property?.title,
      }));

    const vaultDocs = (vaultDocumentsData || []).map((doc: any) => ({
      ...doc,
      category: doc.category === "lease" ? "agreements" : "other",
      categoryLabel: doc.category === "lease" ? "Agreement Documents" : "Other Documents",
      icon: doc.category === "lease" ? FileText : Receipt,
      documentType: doc.category,
      verificationStatus: "verified",
    }));

    return {
      verification: verificationDocs,
      contracts: contractDocs,
      agreements: vaultDocs.filter((d: any) => d.category === "agreements"),
      other: vaultDocs.filter((d: any) => d.category === "other"),
    };
  }, [documentsData, contractsData, vaultDocumentsData]);

  const allDocuments = useMemo(() => {
    return [
      ...organizedDocuments.verification,
      ...organizedDocuments.contracts,
      ...organizedDocuments.agreements,
      ...organizedDocuments.other,
    ];
  }, [organizedDocuments]);

  const documents = selectedCategory 
    ? organizedDocuments[selectedCategory as keyof typeof organizedDocuments] || []
    : allDocuments;

  const verificationScore = profile?.verificationScore || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5" />;
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "id":
        return "ID Document";
      case "income":
        return "Income Verification";
      case "employment":
        return "Employment Letter";
      case "reference":
        return "Reference Letter";
      default:
        return type;
    }
  };

  const handleDownload = async (documentId: number | string, fileName: string, fileUrl?: string) => {
    try {
      let downloadUrl = fileUrl;
      
      if (typeof documentId === 'string' && documentId.startsWith('contract-')) {
        downloadUrl = fileUrl;
      } else if (typeof documentId === 'number') {
        // Always fetch a signed URL for verification documents to handle private buckets
        toast.loading("Generating secure download link...");
        const result = await utils.uploads.downloadDocument.fetch(documentId);
        toast.dismiss();
        downloadUrl = result;
      }
      
      if (downloadUrl) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
      } else {
        toast.error("Document URL not available");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to download document");
    }
  };

  const handleDeleteClick = (documentId: number) => {
    setDocumentToDelete(documentId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Please sign in to view your documents</p>
      </div>
    );
  }

  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter((d: any) => d.verificationStatus === "verified").length;
  const pendingDocuments = documents.filter((d: any) => d.verificationStatus === "pending").length;
  const rejectedDocuments = documents.filter((d: any) => d.verificationStatus === "rejected").length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="h-10 w-10" />
                My Documents
              </h1>
              <p className="text-lg text-purple-100">
                Manage your verification documents and track your verification status
              </p>
            </div>
            <Button
              onClick={() => setLocation("/tenant/settings")}
              className="bg-white dark:bg-slate-100 hover:bg-slate-100 dark:hover:bg-slate-200 text-slate-900 font-medium shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { id: 'total', label: 'Total Documents', value: totalDocuments, icon: FileText, bgGradient: 'from-purple-500 to-indigo-600' },
            { id: 'verified', label: 'Verified', value: verifiedDocuments, icon: CheckCircle, bgGradient: 'from-green-500 to-emerald-600' },
            { id: 'pending', label: 'Pending', value: pendingDocuments, icon: Clock, bgGradient: 'from-yellow-500 to-orange-600' },
            { id: 'rejected', label: 'Rejected', value: rejectedDocuments, icon: AlertCircle, bgGradient: 'from-red-500 to-rose-600' }
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.id} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.bgGradient} p-2.5 rounded-lg shadow-md ml-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verification Score</h2>
            <span className="text-3xl font-bold text-cyan-400">{verificationScore}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-400 h-3 rounded-full transition-all"
              style={{ width: `${verificationScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload and verify your documents to increase your verification score. Higher scores help you stand out to landlords.
          </p>
        </div>

        <div className="border-b-2 border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex gap-8">
            {[
              { id: "documents", label: "My Documents", count: allDocuments.length },
              { id: "activity", label: "Activity Log" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
                }`}
              >
                {tab.label} {tab.count ? `(${tab.count})` : ""}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "documents" && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All Documents ({allDocuments.length})
            </button>
            {[
              { id: "verification", label: "Verification", icon: Shield },
              { id: "contracts", label: "Contracts", icon: FileCheck },
              { id: "agreements", label: "Agreements", icon: FileText },
              { id: "other", label: "Other", icon: Receipt },
            ].map((category) => {
              const Icon = category.icon;
              const count = organizedDocuments[category.id as keyof typeof organizedDocuments].length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-md">
                <p className="text-slate-600 dark:text-slate-400">Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                        {doc.icon ? <doc.icon className="h-6 w-6 text-cyan-400" /> : <FileText className="h-6 w-6 text-cyan-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                            {doc.categoryLabel ? `${doc.categoryLabel}: ` : ""}
                            {doc.contractId ? doc.fileName : getDocumentTypeLabel(doc.documentType || doc.category || "other")}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.verificationStatus)}`}>
                            {getStatusIcon(doc.verificationStatus)}
                            <span className="capitalize">{doc.verificationStatus}</span>
                          </span>
                        </div>
                        {doc.propertyTitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Property: {doc.propertyTitle}</p>}
                        {!doc.contractId && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{doc.fileName}</p>}
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Uploaded {formatDate(doc.createdAt)}
                          </div>
                          {doc.expiresAt && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires {formatDate(doc.expiresAt)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{doc.verificationStatus}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Uploaded</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(doc.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.fileName, doc.fileUrl)}
                        className="flex-1 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {!doc.contractId && doc.verificationStatus !== "verified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(doc.id)}
                          disabled={deleteDocumentMutation.isPending}
                          className="border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-lg">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No Documents Yet</h3>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium mb-6">
                  Upload your verification documents to get started
                </p>
                <Button
                  onClick={() => setLocation("/tenant/settings")}
                  className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Your First Document
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            {allDocuments.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-lg">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No Activity Yet</h3>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                  Your document activity will appear here once you upload documents
                </p>
              </div>
            ) : (
              allDocuments.flatMap((doc: any) => {
                const activities = [];
                if (doc.createdAt) {
                  activities.push({
                    action: "Document Uploaded",
                    description: `You uploaded ${getDocumentTypeLabel(doc.documentType || doc.category).toLowerCase()}`,
                    date: formatDate(doc.createdAt),
                    type: "uploaded",
                    timestamp: new Date(doc.createdAt).getTime(),
                  });
                }
                if (doc.verificationStatus === "verified") {
                  activities.push({
                    action: "Document Verified",
                    description: `Your ${getDocumentTypeLabel(doc.documentType || doc.category).toLowerCase()} has been verified`,
                    date: formatDate(doc.updatedAt || doc.createdAt),
                    type: "verified",
                    timestamp: new Date(doc.updatedAt || doc.createdAt).getTime(),
                  });
                } else if (doc.verificationStatus === "rejected") {
                  activities.push({
                    action: "Document Rejected",
                    description: `Your ${getDocumentTypeLabel(doc.documentType || doc.category).toLowerCase()} was rejected. Please resubmit a clearer copy.`,
                    date: formatDate(doc.updatedAt || doc.createdAt),
                    type: "rejected",
                    timestamp: new Date(doc.updatedAt || doc.createdAt).getTime(),
                  });
                }
                return activities;
              }).sort((a, b) => b.timestamp - a.timestamp).map((activity, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-start gap-4 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      activity.type === "verified"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-400"
                        : activity.type === "rejected"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-400"
                    }`}
                  >
                    {activity.type === "verified" && <CheckCircle className="h-5 w-5" />}
                    {activity.type === "rejected" && <AlertCircle className="h-5 w-5" />}
                    {activity.type !== "verified" && activity.type !== "rejected" && (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{activity.action}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activity.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{activity.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-md">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">Document Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Required
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Valid ID document (passport, driver's license, or national ID)</li>
                <li>• Proof of income (pay stubs, bank statements, or tax returns)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Optional
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Employment letter or contract</li>
                <li>• Reference letter from previous landlord</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Delete Document
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDocumentToDelete(null);
              }}
              className="flex-1 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteDocumentMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
