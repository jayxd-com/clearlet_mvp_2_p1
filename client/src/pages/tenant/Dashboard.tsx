import { useLocation } from "wouter";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Search, Star, TrendingUp, Award, FileText, AlertCircle, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTenantScore } from "@/hooks/useTenantScore";
import { Button } from "@/components/ui/button";

export default function TenantDashboardPage() {
  return <TenantDashboardContent />;
}

function TenantDashboardContent() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Fetch tenant score
  const { data: tenantScoreData } = useTenantScore();

  // Fetch user profile for verification status and score
  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: user?.userType === "tenant",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch saved properties
  const { data: savedPropertiesData } = trpc.properties.getSaved.useQuery(undefined, {
    enabled: user?.userType === "tenant",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch applications
  const { data: applicationsData } = trpc.applications.myApplications.useQuery(undefined, {
    enabled: user?.userType === "tenant",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch payment history from payments table
  const { data: paymentsData } = trpc.payments.getTenantPayments.useQuery(undefined, {
    enabled: user?.userType === "tenant",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch contracts to include deposit and first month rent payments
  const { data: contractsData } = trpc.contracts.getTenantContracts.useQuery(undefined, {
    enabled: user?.userType === "tenant",
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Calculate stats dynamically
  const savedCount = savedPropertiesData?.length || 0;
  // Note: applicationsData structure is [{ application: {...}, property: {...} }]
  const activeApplicationsCount = applicationsData?.filter((item: any) => {
    // Handle both structures: { application: {...}, property: {...} } or direct application object
    const app = item.application || item;
    const status = app?.status;
    return status === "pending" || status === "accepted";
  }).length || 0;
  const totalApplicationsCount = applicationsData?.length || 0;
  
  // Debug log to help troubleshoot
  if (applicationsData && applicationsData.length > 0) {
    console.log("[Dashboard] Applications data sample:", applicationsData[0]);
    console.log("[Dashboard] Active applications count:", activeApplicationsCount);
    console.log("[Dashboard] Total applications count:", totalApplicationsCount);
  }

  const stats = [
    { label: t('tenant.dashboard.stats.savedProperties'), value: savedCount.toString(), color: "cyan" },
    { label: t('tenant.dashboard.stats.activeApplications'), value: activeApplicationsCount.toString(), color: "blue" },
    { label: t('tenant.dashboard.stats.tenantScore'), value: tenantScoreData?.totalScore?.toString() || "0", color: "purple" },
  ];

  const pendingContracts = useMemo(() => {
    return (contractsData || []).filter((c: any) => c.status === "sent_to_tenant");
  }, [contractsData]);

  // ClearLet Score breakdown - use real data if available
  // The scores from the API are already weighted contributions (e.g., 0-25 for rental history)
  const clearletScore = tenantScoreData ? {
    total: tenantScoreData.totalScore,
    tier: tenantScoreData.tier,
    // Scores are already the weighted contribution (e.g., rentalHistory is 0-25 points)
    rentalHistory: Math.round(tenantScoreData.breakdown.rentalHistory.score),
    employment: Math.round(tenantScoreData.breakdown.employment.score),
    salary: Math.round(tenantScoreData.breakdown.salary.score),
    paymentHistory: Math.round(tenantScoreData.breakdown.paymentHistory.score),
    references: Math.round(tenantScoreData.breakdown.references.score),
  } : {
    total: 0,
    tier: "poor",
    rentalHistory: 0,
    employment: 0,
    salary: 0,
    paymentHistory: 0,
    references: 0,
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">{t('tenant.dashboard.signInRequired')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <OnboardingTour />
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div id="dashboard-overview" className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="h-10 w-10" />
                {t('tenant.dashboard.title')}
              </h1>
              <p className="text-lg text-purple-100">{t('tenant.dashboard.welcomeBack')}, {user.name || user.email || 'User'}!</p>
            </div>
            <Button
              id="search-properties"
              onClick={() => setLocation("/tenant/listings")}
              className="bg-white dark:bg-slate-100 hover:bg-slate-100 dark:hover:bg-slate-200 text-slate-900 font-medium shadow-lg"
            >
              <Search className="h-5 w-5 mr-2" />
              {t('tenant.dashboard.browseProperties')}
            </Button>
          </div>
        </div>

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
              onClick={() => setLocation("/tenant/settings")}
              className="bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20"
            >
              Complete Profile
            </Button>
          </div>
        )}

        <div className="space-y-8">
        {/* Action Callouts */}
        {pendingContracts.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6 flex items-center justify-between shadow-md animate-pulse">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-orange-900 dark:text-orange-100">
                  {pendingContracts.length} {pendingContracts.length === 1 ? 'Contract' : 'Contracts'} Pending Signature
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Landlord has sent your rental contract. Please review and sign to proceed.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation("/tenant/contracts")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              Sign Now
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ClearLet Tenant Score - Prominent Display */}
          <div className={`rounded-xl border-2 p-6 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all ${
            clearletScore.tier === "excellent" 
              ? "border-green-300 dark:border-green-600" 
              : clearletScore.tier === "good"
              ? "border-blue-300 dark:border-blue-600"
              : clearletScore.tier === "fair"
              ? "border-yellow-300 dark:border-yellow-600"
              : "border-purple-300 dark:border-purple-600"
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {t('tenant.dashboard.score.tenantScore')}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-4xl font-bold ${
                    clearletScore.tier === "excellent" 
                      ? "text-green-400" 
                      : clearletScore.tier === "good"
                      ? "text-blue-400"
                      : clearletScore.tier === "fair"
                      ? "text-yellow-400"
                      : "text-purple-400"
                  }`}>
                    {clearletScore.total}
                  </p>
                  <span className="text-muted-foreground text-lg">/100</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                clearletScore.tier === "excellent" 
                  ? "bg-green-400/20 text-green-400" 
                  : clearletScore.tier === "good"
                  ? "bg-blue-400/20 text-blue-400"
                  : clearletScore.tier === "fair"
                  ? "bg-yellow-400/20 text-yellow-400"
                  : "bg-purple-400/20 text-purple-400"
              }`}>
                <Star className="h-6 w-6" />
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block ${
              clearletScore.tier === "excellent" 
                ? "bg-green-500/20 text-green-400" 
                : clearletScore.tier === "good"
                ? "bg-blue-500/20 text-blue-400"
                : clearletScore.tier === "fair"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
            }`}>
              {clearletScore.tier === "excellent" ? t('tenant.dashboard.score.tier.excellent') : 
               clearletScore.tier === "good" ? t('tenant.dashboard.score.tier.good') : 
               clearletScore.tier === "fair" ? t('tenant.dashboard.score.tier.fair') : 
               t('tenant.dashboard.score.tier.buildingTrust')}
            </div>
            {tenantScoreData?.recommendation && (
              <p className="text-xs text-muted-foreground mt-3">
                {tenantScoreData.recommendation === "Building history. Focus on maintaining consistent payments and employment." 
                  ? t('tenant.dashboard.score.recommendation.fair')
                  : tenantScoreData.recommendation === "Highly trusted. Landlords prioritize applications from tenants with this score."
                  ? t('tenant.dashboard.score.recommendation.excellent')
                  : tenantScoreData.recommendation === "Reliable. Most landlords will consider your application positively."
                  ? t('tenant.dashboard.score.recommendation.good')
                  : tenantScoreData.recommendation === "New to the platform. Build your rental history and payment record to improve."
                  ? t('tenant.dashboard.score.recommendation.poor')
                  : tenantScoreData.recommendation}
              </p>
            )}
          </div>

          {/* Other Stats */}
          {stats.filter(stat => stat.label !== t('tenant.dashboard.stats.tenantScore')).map((stat) => {
            const colorClass = {
              cyan: "bg-cyan-400/10 text-cyan-400",
              blue: "bg-blue-400/10 text-blue-400",
              yellow: "bg-yellow-400/10 text-yellow-400",
              green: "bg-green-400/10 text-green-400",
            }[stat.color];

            return (
            <div key={stat.label} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${
                    stat.color === "cyan" ? "from-cyan-500 to-blue-600" : "from-blue-500 to-indigo-600"
                  } p-2.5 rounded-lg shadow-md ml-3`}>
                    {stat.label === t('tenant.dashboard.stats.savedProperties') ? (
                      <Heart className="h-6 w-6 text-white" />
                    ) : (
                      <TrendingUp className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md">
              <h3 className="font-bold mb-4">{t('tenant.dashboard.profile.title')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">{t('tenant.dashboard.profile.verificationStatus')}</p>
                  <p className={`font-semibold ${
                    user?.verificationStatus === "verified"
                      ? "text-green-400"
                      : user?.verificationStatus === "pending"
                      ? "text-yellow-400"
                      : "text-muted-foreground"
                  }`}>
                    {user?.verificationStatus === "verified" ? "✓ " : user?.verificationStatus === "pending" ? "⏱ " : ""}
                    {user?.verificationStatus === "verified" 
                      ? t('tenant.dashboard.profile.verified')
                      : user?.verificationStatus === "pending"
                      ? "Pending"
                      : "Unverified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t('tenant.dashboard.profile.verificationScore')}</p>
                  <div className="w-full bg-accent rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (profile?.verificationScore || 0) >= 80 
                          ? "bg-green-400"
                          : (profile?.verificationScore || 0) >= 50
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${profile?.verificationScore || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{profile?.verificationScore || 0}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t('tenant.dashboard.profile.tenantScore')}</p>
                  <div className="w-full bg-accent rounded-full h-2">
                    <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${clearletScore.total}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{clearletScore.total}/100 - {clearletScore.tier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t('tenant.dashboard.profile.memberSince')}</p>
                  <p className="font-semibold">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLocation("/tenant/settings")}
                className="w-full mt-4 px-4 py-2 rounded-lg bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 transition-colors text-sm font-medium"
              >
                {t('tenant.dashboard.profile.editProfile')}
              </button>
            </div>


          </div>

          {/* ClearLet Score Breakdown */}
          <div className="lg:col-span-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg mb-1">{t('tenant.dashboard.score.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('tenant.dashboard.score.breakdownDescription')}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                clearletScore.tier === "excellent" ? "bg-green-500/20 text-green-400 border border-green-400/30" :
                clearletScore.tier === "good" ? "bg-blue-500/20 text-blue-400 border border-blue-400/30" :
                clearletScore.tier === "fair" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30" :
                "bg-red-500/20 text-red-400 border border-red-400/30"
              }`}>
                {clearletScore.total}/100
              </div>
            </div>
            {tenantScoreData?.recommendation && (
              <div className={`mb-6 p-4 rounded-lg border ${
                clearletScore.tier === "excellent" 
                  ? "bg-green-400/10 border-green-400/30" 
                  : clearletScore.tier === "good"
                  ? "bg-blue-400/10 border-blue-400/30"
                  : clearletScore.tier === "fair"
                  ? "bg-yellow-400/10 border-yellow-400/30"
                  : "bg-red-400/10 border-red-400/30"
              }`}>
                <p className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {tenantScoreData.recommendation}
                </p>
              </div>
            )}
            <div className="space-y-3">
              {[
                { key: 'rentalHistory', label: t('tenant.dashboard.score.rentalHistory'), value: clearletScore.rentalHistory, maxValue: 25, color: 'bg-blue-400', weight: '25%' },
                { key: 'employment', label: t('tenant.dashboard.score.employment'), value: clearletScore.employment, maxValue: 20, color: 'bg-green-400', weight: '20%' },
                { key: 'salary', label: t('tenant.dashboard.score.salary'), value: clearletScore.salary, maxValue: 20, color: 'bg-yellow-400', weight: '20%' },
                { key: 'paymentHistory', label: t('tenant.dashboard.score.paymentHistory'), value: clearletScore.paymentHistory, maxValue: 20, color: 'bg-cyan-400', weight: '20%' },
                { key: 'references', label: t('tenant.dashboard.score.references'), value: clearletScore.references, maxValue: 15, color: 'bg-pink-400', weight: '15%' },
              ].map((item) => (
                <div key={item.key} className="p-4 rounded-lg bg-accent/50 border border-border/50 hover:border-cyan-400/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs text-muted-foreground">({item.weight})</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}/{item.maxValue}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`${item.color} h-2.5 rounded-full transition-all duration-300`} 
                      style={{ width: `${Math.min((item.value / item.maxValue) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
              <p className="text-xs text-cyan-300 font-medium">
                {t('tenant.dashboard.score.tip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

