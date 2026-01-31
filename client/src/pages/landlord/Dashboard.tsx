import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Loader2, Plus, Eye, Users, DollarSign, Calendar, MapPin, Bed, Bath, Home, Clock, CheckCircle, XCircle, Edit, Trash2, FileText, MessageSquare, Building2, Sparkles, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { 
  PremiumPageHeader, 
  PremiumPageContainer, 
  PremiumStatCard, 
  PremiumButton, 
  PremiumLabel, 
  PremiumPropertyCard,
  PremiumCard
} from "@/components/premium";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LandlordDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Fetch real data
  const { data: properties, isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = trpc.properties.myListings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Delete property mutation
  const deleteProperty = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Property deleted successfully");
      refetchProperties();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete property: ${error.message || "Unknown error"}`);
    },
  });
  
  const { data: statsData, isLoading: statsLoading } = trpc.landlord.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: applicationsData, isLoading: applicationsLoading } = trpc.landlord.getRecentApplications.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch messages unread count
  const { data: unreadMessagesCount = 0 } = trpc.messages.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch user profile for verification status
  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const missingFields = useMemo(() => {
    if (!profile) return [];
    const required = ['address', 'city', 'dniNie', 'name', 'phone'];
    return required.filter(field => {
      const val = profile[field as keyof typeof profile];
      return !val || String(val).trim() === '';
    });
  }, [profile]);

  const isProfileIncomplete = missingFields.length > 0;

  // Calculate verification progress
  const verificationProgress = 100;

  if (propertiesLoading || statsLoading || applicationsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader
        title={`Welcome back, ${user?.name || 'Owner'}`}
        subtitle="Here's what's happening with your properties today."
        icon={Building2}
        action={{
          label: "List Property",
          onClick: () => setLocation("/landlord/create-listing"),
          icon: Plus
        }}
      />

      {isProfileIncomplete && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 mb-8 flex items-center justify-between shadow-md animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-2 rounded-lg shadow-sm">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">Profile Incomplete</h3>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Complete your profile to get verified. Missing: {missingFields.map(f => f === "dniNie" ? "DNI/NIE" : f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setLocation("/landlord/settings")}
            className="bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20"
          >
            Complete Profile
          </Button>
        </div>
      )}

      <div className="space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard
            label="Total Properties"
            value={statsData?.totalProperties || 0}
            icon={Home}
            color="text-blue-500"
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
          <PremiumStatCard
            label="Active Listings"
            value={statsData?.activeListings || 0}
            icon={Eye}
            color="text-cyan-500"
            bg="bg-cyan-50 dark:bg-cyan-900/20"
          />
          <PremiumStatCard
            label="Pending Review"
            value={statsData?.pendingApplications || 0}
            icon={Clock}
            color="text-yellow-500"
            bg="bg-yellow-50 dark:bg-yellow-900/20"
          />
          <PremiumStatCard
            label="Unread Messages"
            value={unreadMessagesCount}
            icon={MessageSquare}
            color="text-purple-500"
            bg="bg-purple-50 dark:bg-purple-900/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Properties Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Properties</h2>
                <PremiumButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/landlord/properties")}
                  className="text-cyan-500 font-black h-9 px-4 rounded-xl"
                >
                  View All
                </PremiumButton>
              </div>
              
              {properties && properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.slice(0, 4).map((property: any) => (
                    <PremiumPropertyCard 
                      key={property.id} 
                      property={property} 
                      onDelete={(id) => deleteProperty.mutate(id)}
                      isDeleting={deleteProperty.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center">
                  <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold mb-6">You haven't listed any properties yet.</p>
                  <PremiumButton onClick={() => setLocation("/landlord/list-property")} className="h-12 px-8 rounded-xl text-sm">
                    Create Your First Listing
                  </PremiumButton>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Content (1/3) */}
          <div className="space-y-10">
            {/* Verification Status */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <PremiumLabel className="mb-0">Verification Status</PremiumLabel>
                <span className="text-xs font-black text-cyan-500">{verificationProgress}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Identity</span>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-none font-black uppercase text-[9px] px-2 py-1 rounded-lg">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Ownership</span>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600 border-none font-black uppercase text-[9px] px-2 py-1 rounded-lg">Verified</Badge>
                </div>
              </div>
              <PremiumButton variant="outline" className="w-full mt-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest border-2">
                Manage Documents
              </PremiumButton>
            </div>

            {/* Recent Applications */}
            <PremiumCard 
              title="Recent Leads" 
              icon={Users} 
              headerClassName="py-4 px-6"
              contentClassName="p-0"
              cta={
                <button
                  onClick={() => setLocation("/landlord/applications")}
                  className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-600 transition-colors"
                >
                  View All
                </button>
              }
            >
              <div className="divide-y-2 divide-slate-50 dark:divide-slate-700/50">
                {applicationsData && applicationsData.length > 0 ? (
                  applicationsData.slice(0, 5).map((app: any) => (
                    <div key={app.application.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-cyan-500 transition-colors">{app.tenant.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{app.property.title}</p>
                        </div>
                        <Badge className={cn(
                          "border-none font-black uppercase text-[9px] px-2 py-1 rounded-lg",
                          app.application.status === 'accepted' ? "bg-green-500/10 text-green-600" :
                          app.application.status === 'pending' ? "bg-yellow-500/10 text-yellow-600" :
                          "bg-red-500/10 text-red-600"
                        )}>
                          {app.application.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-cyan-500" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">Score: {app.tenant.tenantScore || 0}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{new Date(app.application.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <Users className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No applications yet</p>
                  </div>
                )}
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>
    </PremiumPageContainer>
  );
}
