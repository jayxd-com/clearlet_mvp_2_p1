import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, CheckCircle, Clock, Key, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function LandlordKeysPage() {
  const { user } = useAuth();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  
  const { data: collections, isLoading, refetch } = trpc.keyCollections.getLandlordCollections.useQuery(undefined, {
    enabled: !!user,
  });

  const confirmMutation = trpc.keyCollections.confirm.useMutation({
    onSuccess: () => {
      toast.success("Attendance confirmed");
      refetch();
    },
  });

  const completeMutation = trpc.keyCollections.complete.useMutation({
    onSuccess: () => {
      toast.success("Keys marked as collected!");
      refetch();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      scheduled: { label: "Scheduled", color: "bg-blue-500" },
      confirmed: { label: "Confirmed", color: "bg-green-500" },
      completed: { label: "Completed", color: "bg-emerald-500" },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return <span className={`px-2 py-1 rounded-full text-[10px] text-white ${config.color}`}>{config.label}</span>;
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading collections...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 shadow-xl text-white">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Key className="h-10 w-10" />
            Key Collection
          </h1>
          <p className="mt-2 opacity-90 text-lg">Manage key handover for your properties</p>
        </div>

        <div className="space-y-4">
          {collections?.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-2xl">No key collections scheduled</div>
          ) : (
            collections?.map((c: any) => (
              <div key={c.id} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{c.property?.title}</h3>
                      {getStatusBadge(c.status)}
                    </div>
                    <p className="text-sm text-slate-500 mb-1">Tenant: {c.tenant?.name}</p>
                    <p className="text-sm text-slate-500">{c.location}</p>
                  </div>
                  <div className="flex gap-2">
                    {!c.landlordConfirmed && c.status !== "completed" && (
                      <Button variant="outline" size="sm" onClick={() => confirmMutation.mutate({ id: c.id, role: "landlord" })}>
                        Confirm Attendance
                      </Button>
                    )}
                    {c.status === "confirmed" && (
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => completeMutation.mutate(c.id)}>
                        Mark Collected
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <Calendar className="text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500">Scheduled for</p>
                      <p className="font-semibold">{new Date(c.collectionDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <CheckCircle className={c.tenantConfirmed ? "text-green-500" : "text-slate-300"} />
                    <p className="text-sm font-medium">Tenant {c.tenantConfirmed ? "Confirmed" : "Pending"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
