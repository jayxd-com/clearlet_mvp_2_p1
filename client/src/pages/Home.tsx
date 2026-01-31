import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  Map as MapIcon, 
  Grid3x3, 
  Shield, 
  TrendingUp, 
  FileText,
  CheckCircle,
  BarChart3,
  Lock
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { loadMapScript } from "@/lib/google-maps";

export default function HomePage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    city: "",
    maxBudget: "",
    moveInDate: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
  });
  
  const cityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMapScript().then(() => {
      if (!cityInputRef.current || !window.google) return;

      const autocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current, {
        types: ['(cities)'],
        fields: ['name', 'formatted_address', 'geometry'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.name) {
          setSearchFilters(prev => ({ ...prev, city: place.name || "" }));
        }
      });
    }).catch(err => console.error("Failed to load Google Maps for autocomplete", err));
  }, []);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const dashboardPath = user.role === "admin" 
        ? "/admin/dashboard"
        : user.userType === "tenant"
        ? "/tenant/dashboard"
        : user.userType === "landlord"
        ? "/landlord/dashboard"
        : "/dashboard";
      setLocation(dashboardPath);
    }
  }, [loading, isAuthenticated, user, setLocation]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render home page if user is authenticated (will redirect)
  if (isAuthenticated && user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchFilters.city) params.set('city', searchFilters.city);
    if (searchFilters.maxBudget) params.set('maxPrice', searchFilters.maxBudget);
    if (searchFilters.bedrooms) params.set('bedrooms', searchFilters.bedrooms);
    if (searchFilters.bathrooms) params.set('bathrooms', searchFilters.bathrooms);
    if (searchFilters.propertyType) params.set('type', searchFilters.propertyType);
    setLocation(`/listings?${params.toString()}`);
  };

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/property-hero-shot.jpg" 
            alt="Luxury Property" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('verifiedTenants')}</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('transparentFlow')}</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('digitalContracts')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Landlord/Tenant Tabs */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button
              onClick={() => setLocation('/for-tenants')}
              className="flex-1 max-w-md px-8 py-8 rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all text-left group"
            >
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">{t('forTenants')}</h3>
              <p className="text-muted-foreground">{t('tenantsTagline')}</p>
            </button>
            <button
              onClick={() => setLocation('/for-landlords')}
              className="flex-1 max-w-md px-8 py-8 rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all text-left group"
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-3">{t('forLandlords')}</h3>
              <p className="text-muted-foreground">{t('landlordsTagline')}</p>
            </button>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-3">{t('startSearch')}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('searchDescription')}
          </p>
          <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-2xl">
            <div className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,auto]">
              <input
                ref={cityInputRef}
                name="city"
                value={searchFilters.city}
                onChange={handleInputChange}
                placeholder={t('cityOrArea')}
                className="rounded-xl border border-border bg-accent px-5 py-3 text-foreground placeholder:text-foreground0 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
              />
              <input
                name="maxBudget"
                value={searchFilters.maxBudget}
                onChange={handleInputChange}
                placeholder={t('maxBudget')}
                className="rounded-xl border border-border bg-accent px-5 py-3 text-foreground placeholder:text-foreground0 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
              />
              <input
                name="moveInDate"
                value={searchFilters.moveInDate}
                onChange={handleInputChange}
                type="date"
                placeholder={t('moveInDate')}
                className="rounded-xl border border-border bg-accent px-5 py-3 text-foreground placeholder:text-foreground0 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
              />
              <button 
                onClick={handleSearch}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 font-semibold text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all"
              >
                {t('search')}
              </button>
            </div>

            {/* Advanced Search Fields */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors font-medium"
              >
                <span>{t('advancedSearch')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Advanced Search Fields */}
            {showAdvanced && (
              <div className="mt-6 grid gap-4 md:grid-cols-3 pt-6 border-t border-border">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bedrooms</label>
                  <select
                    name="bedrooms"
                    value={searchFilters.bedrooms}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border bg-accent px-5 py-3 text-foreground focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bathrooms</label>
                  <select
                    name="bathrooms"
                    value={searchFilters.bathrooms}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border bg-accent px-5 py-3 text-foreground focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Property Type</label>
                  <select
                    name="propertyType"
                    value={searchFilters.propertyType}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border bg-accent px-5 py-3 text-foreground focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  >
                    <option value="">Any</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="room">Room</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ClearLet Tenant Score Feature */}
      <section className="border-b border-border bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">{t('uniqueFeature')}</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                {t('clearLetTenantScore')}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {t('tenantScoreDescription')}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t('dataDrivenRankings')}</h3>
                    <p className="text-sm text-muted-foreground">{t('dataDrivenRankingsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t('buildYourReputation')}</h3>
                    <p className="text-sm text-muted-foreground">{t('buildYourReputationDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t('privacyProtected')}</h3>
                    <p className="text-sm text-muted-foreground">{t('privacyProtectedDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/digital-verification.jpeg" 
                alt="Tenant Score Dashboard" 
                className="rounded-2xl shadow-2xl border border-border"
              />
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-6 shadow-2xl max-w-xs">
                <div className="text-white">
                  <p className="text-sm font-medium mb-1">{t('yourClearLetScore')}</p>
                  <p className="text-4xl font-bold">850</p>
                  <p className="text-sm opacity-90 mt-1">{t('excellentTopTenPercent')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Trust & Verification */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-foreground mb-3">{t('builtOnTrust')}</h2>
          <p className="text-lg text-muted-foreground mb-12">
            {t('trustDescription')}
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: t('verifiedIdentity'),
                body: t('verifiedIdentityDesc'),
                color: "cyan"
              },
              {
                icon: TrendingUp,
                title: t('incomeAffordability'),
                body: t('incomeAffordabilityDesc'),
                color: "purple"
              },
              {
                icon: FileText,
                title: t('digitalLAUContracts'),
                body: t('digitalLAUContractsDesc'),
                color: "blue"
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card/50 p-8 hover:border-border transition-colors"
              >
                <div className={`w-14 h-14 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-6`}>
                  <item.icon className={`h-7 w-7 text-${item.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-foreground mb-12">{t('howItWorks')}</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                title: t('step1Title'),
                body: t('step1Desc'),
              },
              {
                step: "02",
                title: t('step2Title'),
                body: t('step2Desc'),
              },
              {
                step: "03",
                title: t('step3Title'),
                body: t('step3Desc'),
              },
              {
                step: "04",
                title: t('step4Title'),
                body: t('step4Desc'),
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-cyan-500/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tenant vs Landlord Benefits */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">{t('builtForBothSides')}</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            {t('builtForBothSidesDesc')}
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Tenants */}
            <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-2xl">
                  🔑
                </div>
                <h3 className="text-2xl font-bold text-cyan-400">{t('forTenantsTitle')}</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('buildYourReputationTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('buildYourReputationBenefit')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('standOutInApplications')}</p>
                    <p className="text-sm text-muted-foreground">{t('standOutInApplicationsDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('transparentProcess')}</p>
                    <p className="text-sm text-muted-foreground">{t('transparentProcessDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('verifiedListingsOnly')}</p>
                    <p className="text-sm text-muted-foreground">{t('verifiedListingsOnlyDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('fasterMoveIn')}</p>
                    <p className="text-sm text-muted-foreground">{t('fasterMoveInDesc')}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* For Landlords */}
            <div className="rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
                  🏠
                </div>
                <h3 className="text-2xl font-bold text-purple-400">{t('forLandlordsTitle')}</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('preScreenedTenants')}</p>
                    <p className="text-sm text-muted-foreground">{t('preScreenedTenantsDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('reduceDecisionTime')}</p>
                    <p className="text-sm text-muted-foreground">{t('reduceDecisionTimeDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('lowerRisk')}</p>
                    <p className="text-sm text-muted-foreground">{t('lowerRiskDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('digitalEverything')}</p>
                    <p className="text-sm text-muted-foreground">{t('digitalEverythingDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{t('legalCompliance')}</p>
                    <p className="text-sm text-muted-foreground">{t('legalComplianceDesc')}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">{t('whatEarlyUsersSay')}</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            {t('earlyUsersFeedback')}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Tenant Testimonial 1 */}
            <div className="rounded-2xl border border-border bg-background/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('testimonial1Name')}</p>
                  <p className="text-sm text-muted-foreground">{t('testimonial1Role')}</p>
                </div>
              </div>
              <p className="text-muted-foreground italic mb-4">
                "{t('testimonial1Quote')}"
              </p>
              <div className="flex gap-1 text-cyan-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            {/* Landlord Testimonial 1 */}
            <div className="rounded-2xl border border-border bg-background/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  C
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('testimonial2Name')}</p>
                  <p className="text-sm text-muted-foreground">{t('testimonial2Role')}</p>
                </div>
              </div>
              <p className="text-muted-foreground italic mb-4">
                "{t('testimonial2Quote')}"
              </p>
              <div className="flex gap-1 text-purple-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            {/* Tenant Testimonial 2 */}
            <div className="rounded-2xl border border-border bg-background/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('testimonial3Name')}</p>
                  <p className="text-sm text-muted-foreground">{t('testimonial3Role')}</p>
                </div>
              </div>
              <p className="text-muted-foreground italic mb-4">
                "{t('testimonial3Quote')}"
              </p>
              <div className="flex gap-1 text-cyan-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t('readyToMakeRentingSane')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('joinClearLetToday')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setLocation('/for-tenants')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all"
            >
              {t('imATenant')}
            </button>
            <button
              onClick={() => setLocation('/for-landlords')}
              className="px-8 py-4 rounded-xl bg-accent text-foreground font-semibold hover:bg-slate-700 border border-border transition-all"
            >
              {t('imALandlord')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
