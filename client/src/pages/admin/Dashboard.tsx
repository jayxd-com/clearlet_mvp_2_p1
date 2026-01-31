import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Users, 
  BarChart3, 
  ClipboardList, 
  ShieldCheck, 
  Database,
  ArrowRight,
  Search,
  Building,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PremiumStatCard } from "@/components/premium/PremiumStatCard";
import { PremiumDataTable, Column } from "@/components/premium/PremiumDataTable";
import { PremiumStatusBadge } from "@/components/premium/PremiumStatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: analytics } = trpc.crm.getAnalytics.useQuery();
  const { data: health } = trpc.crm.getSystemHealth.useQuery();
  
  // Fetch users for the table
  const { data: usersData, isLoading: usersLoading } = trpc.crm.getUsers.useQuery({
    page,
    limit: pageSize,
    search: searchTerm,
    verificationStatus: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const adminModules = [
    { title: "User Management", description: "Manage users and verification", icon: Users, path: "/admin/users", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Properties", description: "Review and manage property listings", icon: Building, path: "/admin/properties", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { title: "Analytics", description: "Platform growth and metrics", icon: BarChart3, path: "/admin/analytics", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
    { title: "Documents", description: "Review user ID and income proofs", icon: ShieldCheck, path: "/admin/documents", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { title: "Audit Logs", description: "Track all administrative actions", icon: ClipboardList, path: "/admin/audit-logs", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  const columns: Column<any>[] = [
    {
      header: "User",
      cell: (u) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
          <p className="text-xs text-slate-500">{u.email}</p>
        </div>
      )
    },
    {
      header: "Role",
      cell: (u) => <Badge variant="outline" className="uppercase text-[10px]">{u.userType}</Badge>
    },
    {
      header: "Status",
      cell: (u) => <PremiumStatusBadge status={u.verificationStatus} />
    },
    {
      header: "Joined",
      cell: (u) => <span className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</span>
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Admin Command</h1>
            <p className="text-lg text-slate-500 font-medium">ClearLet Platform Operational Oversight</p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 shadow-sm">
            <Database className={`h-5 w-5 ${health?.database === 'connected' ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">System Health</p>
              <p className="text-xs font-bold">{health?.database === 'connected' ? 'DB ONLINE' : 'DB OFFLINE'}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <PremiumStatCard 
            label="Total Users" 
            value={analytics?.overview.totalUsers || 0} 
            icon={Users} 
            bg="bg-blue-50 dark:bg-blue-900/20" 
            color="text-blue-500" 
          />
          <PremiumStatCard 
            label="Total Volume" 
            value={`€${((analytics?.overview.totalRevenue || 0) / 100).toLocaleString()}`} 
            icon={DollarSign} 
            bg="bg-green-50 dark:bg-green-900/20" 
            color="text-green-500" 
          />
          <PremiumStatCard 
            label="ClearLet Revenue" 
            value={`€${((analytics?.overview.totalPlatformRevenue || 0) / 100).toLocaleString()}`} 
            icon={TrendingUp} 
            bg="bg-cyan-50 dark:bg-cyan-900/20" 
            color="text-cyan-500" 
          />
          <PremiumStatCard 
            label="Pending Tasks" 
            value={health?.pendingVerifications || 0} 
            icon={ClipboardList} 
            bg="bg-purple-50 dark:bg-purple-900/20" 
            color="text-purple-500" 
          />
        </div>

        {/* Module Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((m) => (
            <button
              key={m.title}
              onClick={() => setLocation(m.path)}
              className="group text-left p-8 bg-white dark:bg-slate-900 border-2 rounded-3xl hover:border-cyan-400 hover:shadow-2xl transition-all relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${m.bg} opacity-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
              <div className="relative z-10">
                <div className={`p-4 rounded-2xl ${m.bg} ${m.color} w-fit mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                  <m.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black mb-2">{m.title}</h3>
                <p className="text-slate-500 font-medium mb-6">{m.description}</p>
                <div className="flex items-center gap-2 text-cyan-500 font-bold text-sm">
                  Access Module <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Recent Activity Table */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recent Users</h2>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PremiumDataTable 
            data={usersData?.users || []}
            columns={columns}
            isLoading={usersLoading}
            pagination={{
              currentPage: page,
              totalPages: usersData?.pagination.totalPages || 1,
              totalItems: usersData?.pagination.total || 0,
              pageSize: pageSize,
              onPageChange: setPage,
              onPageSizeChange: setPageSize
            }}
          />
        </div>
      </div>
    </div>
  );
}
