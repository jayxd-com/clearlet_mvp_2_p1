import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, CheckCircle, Clock, Key, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

export default function TenantKeysPage() {
  const { user } = useAuth();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [contractForScheduling, setContractForScheduling] = useState<any>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    collectionDate: "",
    collectionTime: "",
    location: "",
    notes: "",
  });

  const { data: collections, isLoading, refetch } = trpc.keyCollections.getTenantCollections.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: contracts } = trpc.contracts.getTenantContracts.useQuery(undefined, {
    enabled: !!user,
  });

  const contractsNeedingScheduling = React.useMemo(() => {
    if (!contracts) return [];
    const contractIdsWithCollections = new Set((collections || []).map((c: any) => c.contractId));
    return contracts.filter((contract: any) => {
      const hasPayments = contract.depositPaid && contract.firstMonthRentPaid;
      const hasCollection = contractIdsWithCollections.has(contract.id);
      return hasPayments && !hasCollection && (contract.status === "fully_signed" || contract.status === "active");
    });
  }, [contracts, collections]);

  const createMutation = trpc.keyCollections.create.useMutation({
    onSuccess: () => {
      toast.success("Key collection scheduled successfully");
      refetch();
      setShowScheduleDialog(false);
    },
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

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl text-white">
          <h1 className="text-4xl font-bold flex items-center gap-3"><Key className="h-10 w-10" /> Key Collection</h1>
          <p className="mt-2 opacity-90">View and manage your scheduled key collections</p>
        </div>

        {contractsNeedingScheduling.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Awaiting Scheduling</h2>
            {contractsNeedingScheduling.map((c: any) => (
              <div key={c.id} className="p-4 border-2 rounded-xl flex justify-between items-center bg-white dark:bg-slate-800">
                <div>
                  <h3 className="font-semibold">{c.property?.title}</h3>
                  <p className="text-sm text-slate-500">{c.property?.address}</p>
                </div>
                <Button onClick={() => { setContractForScheduling(c); setShowScheduleDialog(true); }}>Schedule</Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {collections?.map((c: any) => (
            <div key={c.id} className="p-6 border-2 rounded-2xl bg-white dark:bg-slate-800 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{c.property?.title}</h3>
                    {getStatusBadge(c.status)}
                  </div>
                  <p className="text-sm text-slate-500">{c.property?.address}</p>
                </div>
                {!c.tenantConfirmed && c.status !== "completed" && (
                  <Button variant="outline" size="sm" onClick={() => confirmMutation.mutate({ id: c.id, role: "tenant" })}>Confirm Attendance</Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <Calendar className="text-cyan-500" />
                  <div>
                    <p className="text-xs text-slate-500">Date & Time</p>
                    <p className="font-semibold">{new Date(c.collectionDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <MapPin className="text-cyan-500" />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="font-semibold">{c.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Collection</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date</Label>
              <Input type="date" onChange={(e) => setScheduleFormData({...scheduleFormData, collectionDate: e.target.value})} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" onChange={(e) => setScheduleFormData({...scheduleFormData, collectionTime: e.target.value})} />
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="Meeting point" onChange={(e) => setScheduleFormData({...scheduleFormData, location: e.target.value})} />
            </div>
            <Button className="w-full" onClick={() => {
              const dt = new Date(`${scheduleFormData.collectionDate}T${scheduleFormData.collectionTime}`);
              createMutation.mutate({ contractId: contractForScheduling.id, collectionDate: dt, location: scheduleFormData.location });
            }}>Save Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
