import { useLocation } from "wouter";
import { useState } from "react";
import { Info, Send, Paperclip, CheckCircle, Clock, FileText, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function TenantInformationRequestsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  const { data: requests, isLoading, refetch } = trpc.informationRequests.getMyPending.useQuery(undefined, {
    enabled: !!user,
  });

  const respondMutation = trpc.informationRequests.respond.useMutation({
    onSuccess: () => {
      toast.success("Response sent successfully!");
      setShowResponseDialog(false);
      setResponseMessage("");
      setAttachments([]);
      setSelectedRequest(null);
      refetch();
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const handleRespond = (request: any) => {
    setSelectedRequest(request);
    setShowResponseDialog(true);
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: any = { document: "Document Request", clarification: "Clarification", reference: "Reference" };
    return labels[type] || type;
  };

  if (isLoading) return <div className="p-8 text-center">Loading requests...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Information Requests</h1>
        <p className="text-muted-foreground text-lg">Landlords have requested additional information for your applications</p>
      </div>

      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request: any) => (
            <div key={request.id} className="bg-white dark:bg-slate-800 border-2 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{request.application?.property?.title || "Application"}</h3>
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                      {getRequestTypeLabel(request.requestType)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">From: {request.landlord?.name}</p>
                </div>
                <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                  <Clock className="h-4 w-4" /> Pending
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mb-4 italic">"{request.requestMessage}"</div>
              <div className="flex gap-2">
                <Button onClick={() => handleRespond(request)} className="bg-cyan-500 hover:bg-cyan-600">Respond</Button>
                <Button variant="outline" onClick={() => setLocation('/tenant/applications')}>View Application</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold">No pending requests</h3>
        </div>
      )}

      {showResponseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Send Response</h2>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              className="w-full p-3 border-2 rounded-lg mb-4 min-h-[200px]"
              placeholder="Provide requested details..."
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancel</Button>
              <Button 
                onClick={() => respondMutation.mutate({ requestId: selectedRequest.id, responseMessage })}
                disabled={!responseMessage.trim() || respondMutation.isPending}
              >
                {respondMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
