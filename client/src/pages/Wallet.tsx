import { useLocation } from "wouter";
import { Wallet, TrendingUp, TrendingDown, Award, ShoppingBag, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Building2, FileSignature, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WalletPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  
  const { data: walletData, isLoading } = trpc.marketplace.getWalletBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: transactions, isLoading: transactionsLoading } = trpc.marketplace.getTransactionHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Please sign in to access your wallet</p>
          <Button onClick={() => setLocation("/signin")} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-10 w-10" />
                ClearCoin Wallet
              </h1>
              <p className="text-lg text-purple-100">Manage your rewards, earnings and credits</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Current Balance</p>
                <p className="text-3xl font-black">{walletData?.balance || 0} CC</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Balance & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Balance Overview Card */}
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Credit Balance</p>
                    {isLoading ? (
                      <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
                    ) : (
                      <div className="flex items-baseline gap-3">
                        <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{walletData?.balance || 0}</span>
                        <span className="text-2xl font-bold text-cyan-500 uppercase tracking-tighter">ClearCoins</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 shadow-inner">
                    <Wallet className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x-2">
                  <div className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Lifetime Earned</p>
                    <p className="text-2xl font-black text-green-500">+{walletData?.totalEarned || 0} CC</p>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Redeemed</p>
                    <p className="text-2xl font-black text-slate-400">-{walletData?.totalSpent || 0} CC</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <div className="space-y-4">
              <h3 className="font-black uppercase text-xs tracking-widest text-slate-500 px-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h3>
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl bg-white dark:bg-slate-800 overflow-hidden">
                <div className="divide-y-2">
                  {transactionsLoading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    transactions.map((tx: any) => (
                      <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl border-2 ${
                            (tx.transactionType === 'earn' || tx.transactionType === 'bonus') 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600'
                          }`}>
                            {(tx.transactionType === 'earn' || tx.transactionType === 'bonus') ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{tx.description}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-lg ${(tx.transactionType === 'earn' || tx.transactionType === 'bonus') ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                            {(tx.transactionType === 'earn' || tx.transactionType === 'bonus') ? '+' : '-'}{tx.amount} CC
                          </p>
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0 rounded-md border-2">Confirmed</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed">
                        <Clock className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-black text-slate-400 uppercase text-xs tracking-widest">No transactions yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column: How to Earn */}
          <div className="space-y-8">
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b-2 py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-500" />
                  Earn Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2">
                  {[
                    { action: "User Signup", coins: "10 CC", icon: Award, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { action: "Property Listing", coins: "10 CC", icon: Building2, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                    { action: "Contract Signed", coins: "20 CC", icon: FileSignature, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { action: "Profile Verified", coins: "50 CC", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10" },
                  ].map((item, idx) => {
                    const Icon = item.icon as any;
                    return (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{item.action}</span>
                        </div>
                        <span className="text-sm font-black text-cyan-500">+{item.coins}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                    Credits are awarded automatically upon completion of platform activities. Use credits in the future marketplace for premium boosts and features.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Clear Coin Info */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="h-32 w-32 rotate-12" />
              </div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-black text-xl mb-3 uppercase tracking-tighter text-white">Clear Coin Rewards</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed text-purple-50">
                  Clear Coin (CC) is our platform loyalty credit. Earn CC by being an active and verified member of the ClearLet community.
                </p>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-100">Reward Tier: Early Access</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
