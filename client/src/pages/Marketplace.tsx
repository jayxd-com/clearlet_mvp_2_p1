import { useLocation } from "wouter";
import { ShoppingBag, Star, Zap, Shield, TrendingUp, FileText, Camera, ArrowLeft, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  category: "listing" | "profile" | "analytics" | "support";
  duration?: string;
}

const marketplaceItems: MarketplaceItem[] = [
  {
    id: "featured_listing",
    title: "Featured Listing Boost",
    description: "Boost your property to the top of search results for 7 days",
    price: 100,
    icon: <Star className="h-6 w-6" />,
    category: "listing",
    duration: "7 days",
  },
  {
    id: "priority_support",
    title: "Priority Support",
    description: "Get priority access to customer support for 30 days",
    price: 50,
    icon: <Zap className="h-6 w-6" />,
    category: "support",
    duration: "30 days",
  },
  {
    id: "verification_badge",
    title: "Verification Badge",
    description: "Add a verified badge to your profile to build trust",
    price: 75,
    icon: <Shield className="h-6 w-6" />,
    category: "profile",
  },
  {
    id: "premium_analytics",
    title: "Premium Analytics",
    description: "Access advanced analytics and insights for 30 days",
    price: 150,
    icon: <TrendingUp className="h-6 w-6" />,
    category: "analytics",
    duration: "30 days",
  },
  {
    id: "application_waiver",
    title: "Application Fee Waiver",
    description: "Waive the application fee for one property application",
    price: 25,
    icon: <FileText className="h-6 w-6" />,
    category: "listing",
  },
  {
    id: "professional_photos",
    title: "Professional Photography",
    description: "Get professional photos taken for your property listing",
    price: 200,
    icon: <Camera className="h-6 w-6" />,
    category: "listing",
  },
];

export default function MarketplacePage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = trpc.marketplace.getWalletBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const purchaseMutation = trpc.marketplace.purchaseItem.useMutation({
    onSuccess: () => {
      toast.success("Purchase successful!");
      refetchWallet();
    },
    onError: (error) => {
      toast.error("Purchase failed", {
        description: error.message,
      });
    },
  });

  const handlePurchase = (item: MarketplaceItem) => {
    if (!walletData || walletData.balance < item.price) {
      toast.error("Insufficient ClearCoins", {
        description: `You need ${item.price} CC but only have ${walletData?.balance || 0} CC.`,
      });
      return;
    }

    purchaseMutation.mutate({
      itemId: item.id,
      itemName: item.title,
      price: item.price,
    });
  };

  const filteredItems =
    selectedCategory === "all"
      ? marketplaceItems
      : marketplaceItems.filter((item) => item.category === selectedCategory);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access the marketplace</p>
          <Button onClick={() => setLocation("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-muted-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-cyan-400" />
                ClearCoin Marketplace
              </h1>
              <p className="text-muted-foreground mt-1">Spend your ClearCoins on premium features</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Balance</p>
              {walletLoading ? (
                <div className="h-8 w-24 bg-accent animate-pulse rounded mt-1" />
              ) : (
                <p className="text-2xl font-bold text-cyan-400 flex items-center gap-2 justify-end">
                  <Wallet className="h-5 w-5" />
                  {walletData?.balance || 0} CC
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === "all"
                  ? "bg-cyan-400 text-slate-950 font-medium"
                  : "bg-accent text-muted-foreground hover:bg-slate-700"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedCategory("listing")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === "listing"
                  ? "bg-cyan-400 text-slate-950 font-medium"
                  : "bg-accent text-muted-foreground hover:bg-slate-700"
              }`}
            >
              Listing Boosts
            </button>
            <button
              onClick={() => setSelectedCategory("profile")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === "profile"
                  ? "bg-cyan-400 text-slate-950 font-medium"
                  : "bg-accent text-muted-foreground hover:bg-slate-700"
              }`}
            >
              Profile Features
            </button>
            <button
              onClick={() => setSelectedCategory("analytics")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === "analytics"
                  ? "bg-cyan-400 text-slate-950 font-medium"
                  : "bg-accent text-muted-foreground hover:bg-slate-700"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setSelectedCategory("support")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === "support"
                  ? "bg-cyan-400 text-slate-950 font-medium"
                  : "bg-accent text-muted-foreground hover:bg-slate-700"
              }`}
            >
              Support
            </button>
          </div>

          {/* Marketplace Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card/50 p-6 hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                    {item.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cyan-400">{item.price} CC</p>
                    {item.duration && <p className="text-xs text-muted-foreground mt-1">{item.duration}</p>}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <Button
                  onClick={() => handlePurchase(item)}
                  disabled={purchaseMutation.isPending || (walletData?.balance || 0) < item.price}
                  className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchaseMutation.isPending ? "Processing..." : "Purchase"}
                </Button>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
