import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Home,
  FileText,
  DollarSign,
  ArrowUp,
  ArrowDown,
  BarChart3
} from "lucide-react";
import { formatCents } from "@/lib/currency";

export default function AdminAnalyticsPage() {
  const { data: overview, isLoading } = trpc.crm.getOverview.useQuery();
  const { data: userGrowth } = trpc.crm.getUserGrowth.useQuery({ days: 30 });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
          <BarChart3 className="h-10 w-10 text-cyan-500" />
          Platform Analytics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            { label: "Total Users", value: overview?.current.totalUsers, icon: Users, color: "text-blue-500" },
            { label: "Properties", value: overview?.current.totalProperties, icon: Home, color: "text-orange-500" },
            { label: "Applications", value: overview?.current.totalApplications, icon: FileText, color: "text-purple-500" },
            { label: "Total Volume", value: formatCents(overview?.current.totalRevenue || 0, "EUR"), icon: DollarSign, color: "text-green-500" },
            { label: "ClearLet Revenue", value: formatCents(overview?.current.totalPlatformRevenue || 0, "EUR"), icon: DollarSign, color: "text-cyan-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-2 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black">{stat.value}</p>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 shadow-xl p-8">
          <h3 className="font-bold text-xl mb-6">User Growth (Last 30 Days)</h3>
          <div className="h-64 flex items-end gap-2">
            {userGrowth?.map((day: any, i: number) => {
              const height = (day.count / 5) * 100; // Simplified scale
              return (
                <div 
                  key={i} 
                  className="flex-1 bg-cyan-500 rounded-t-lg hover:bg-cyan-400 transition-all relative group"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                    {day.count} users
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
