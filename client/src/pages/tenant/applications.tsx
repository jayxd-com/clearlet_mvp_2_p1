import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar, MapPin, FileSignature, X, Eye, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Corrected import path
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar"; // Added import

export default function TenantApplicationsPage() {
  return <TenantApplicationsContent />;
}

function TenantApplicationsContent() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch real applications from backend
  const { data: applicationsData, isLoading, refetch } = trpc.applications.myApplications.useQuery();

  // Fetch contracts to check which applications have contracts
  const { data: contractsData } = trpc.contracts.getTenantContracts.useQuery();

  // Create a map of applicationId -> contract for quick lookup
  const applicationContractMap = useMemo(() => {
    const map = new Map<number, any>();
    (contractsData || []).forEach((contract: any) => {
      if (contract.applicationId) {
        map.set(contract.applicationId, contract);
      }
    });
    return map;
  }, [contractsData]);

  // Withdraw mutation
  const withdrawMutation = trpc.applications.withdraw.useMutation({
    onSuccess: () => {
      toast.success("Application withdrawn successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to withdraw application");
    },
  });

  // Removed mockApplications - relying solely on applicationsData
  const applications = applicationsData || [];

  const filteredApplications = applications.filter((app: any) => {
    if (filterStatus === "all") return true;
    return app.application?.status === filterStatus || app.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-400/20 text-green-400 border border-green-400/30";
      case "pending":
        return "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30";
      case "rejected":
        return "bg-red-400/20 text-red-400 border border-red-400/30";
      case "withdrawn":
        return "bg-slate-700/20 text-muted-foreground border border-border";
      default:
        return "bg-slate-700 text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5" />;
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      case "withdrawn":
        return "Withdrawn";
      default:
        return status;
    }
  };

  const handleWithdraw = (applicationId: number) => {
    if (confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      withdrawMutation.mutate({ applicationId });
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Please sign in to view your applications</p>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen bg-white dark:bg-slate-900">
        <div className="max-w-7xl w-full mx-auto p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <FileText className="h-10 w-10" />
                  My Applications
                </h1>
                <p className="text-lg text-purple-100">
                  Track and manage your property applications
                </p>
              </div>
              <Button
                onClick={() => setLocation("/tenant/listings")} // Changed to /tenant/listings
                className="bg-white dark:bg-slate-100 hover:bg-slate-100 dark:hover:bg-slate-200 text-slate-900 font-medium shadow-lg"
              >
                Apply to More Properties
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                id: 'total',
                label: 'Total Applications',
                value: applications.length,
                icon: FileText,
                bgGradient: 'from-purple-500 to-indigo-600'
              },
              {
                id: 'pending',
                label: 'Pending Review',
                value: applications.filter((a: any) => (a.application?.status || a.status) === "pending").length,
                icon: Clock,
                bgGradient: 'from-yellow-500 to-orange-600'
              },
              {
                id: 'accepted',
                label: 'Accepted',
                value: applications.filter((a: any) => (a.application?.status || a.status) === "accepted").length,
                icon: CheckCircle,
                bgGradient: 'from-green-500 to-emerald-600'
              },
              {
                id: 'rejected',
                label: 'Rejected',
                value: applications.filter((a: any) => (a.application?.status || a.status) === "rejected").length,
                icon: XCircle,
                bgGradient: 'from-red-500 to-rose-600'
              }
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

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {[
              { id: "all", label: "All", count: applications.length },
              { id: "pending", label: "Pending", count: applications.filter((a: any) => (a.application?.status || a.status) === "pending").length },
              { id: "accepted", label: "Accepted", count: applications.filter((a: any) => (a.application?.status || a.status) === "accepted").length },
              { id: "rejected", label: "Rejected", count: applications.filter((a: any) => (a.application?.status || a.status) === "rejected").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border-2 ${
                  filterStatus === tab.id
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app: any) => {
                const applicationId = app.application?.id || app.id;
                const contract = applicationContractMap.get(applicationId);
                const hasContract = !!contract;
                const isContractSigned = contract && (contract.status === "fully_signed" || contract.status === "active" || contract.tenantSignature);

                return (
                  <div
                    key={app.application.id} // Corrected to use app.application.id
                    className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {app.property?.title || app.property}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            (app.application?.status || app.status) === "accepted" 
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : (app.application?.status || app.status) === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : (app.application?.status || app.status) === "rejected"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}>
                            {getStatusIcon(app.application?.status || app.status)}
                            {getStatusLabel(app.application?.status || app.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {app.property?.address || app.location || 'Address not available'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-500">
                          {app.property?.city && app.property?.country && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.property.city}, {app.property.country}
                            </div>
                          )}
                          {app.application?.moveInDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Move-in: {new Date(app.application.moveInDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Monthly Rent</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          €{app.property?.rentPrice ? Math.floor(app.property.rentPrice / 100).toLocaleString() : app.rent || 'N/A'}/mo
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Landlord</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {app.landlord?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Applied Date</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {app.application?.createdAt
                            ? new Date(app.application.createdAt).toLocaleDateString()
                            : app.appliedDate || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Move-in Date</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {app.application?.moveInDate
                            ? new Date(app.application.moveInDate).toLocaleDateString()
                            : app.moveInDate || 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Message/Feedback */}
                    {(app.application?.message || app.message) && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {(app.application?.status || app.status) === "rejected" ? (
                            <>
                              <span className="font-semibold text-red-600 dark:text-red-400">Landlord's Feedback: </span>
                              {app.application?.message || app.message || "No feedback provided"}
                            </>
                          ) : (
                            app.application?.message || app.message
                          )}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/tenant/listings/${app.property?.id || app.id}`)} // Changed to /tenant/listings/:id
                        className="flex items-center gap-2 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                        View Property
                      </Button>

                      {(app.application?.status || app.status) === "pending" || (app.application?.status || app.status) === "accepted" ? (
                        <Button
                          variant="outline"
                          onClick={() => setLocation(`/messages?landlord=${app.landlord?.id}`)} // Changed to app.landlord?.id
                          className="flex items-center gap-2 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message Landlord
                        </Button>
                      ) : null}

                      {(app.application?.status || app.status) === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => handleWithdraw(app.application?.id || app.id)}
                          disabled={withdrawMutation.isPending}
                          className="flex items-center gap-2 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                          {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
                        </Button>
                      )}

                      {(app.application?.status || app.status) === "accepted" && (
                        <>
                          {hasContract && isContractSigned ? (
                            <Button
                              onClick={() => setLocation(`/tenant/contracts?contractId=${contract.id}`)}
                              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium"
                            >
                              <FileText className="h-4 w-4" />
                              View Contract
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setLocation(`/tenant/contracts?applicationId=${applicationId}`)}
                              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium"
                            >
                              <FileSignature className="h-4 w-4" />
                              View & Sign Contract
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-lg">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No applications found</h3>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium mb-6">
                  Start applying to properties to see them here
                </p>
                <Button
                  onClick={() => setLocation("/tenant/listings")}
                  className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium"
                >
                  Browse Properties
                </Button>
              </div>
            )}
          </div>
        </div>

    </div>
  );
}
