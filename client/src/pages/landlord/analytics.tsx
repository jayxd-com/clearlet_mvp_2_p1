import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, DollarSign, Users, Eye, Home, Clock, Wrench, TrendingDown } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency, formatCents } from "@/lib/currency";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LandlordAnalyticsPage() {
  const { user, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState("month");

  // Fetch real data
  const { data: properties } = trpc.properties.getUserProperties.useQuery(undefined, { enabled: isAuthenticated });
  const { data: contracts } = trpc.contracts.getLandlordContracts.useQuery(undefined, { enabled: isAuthenticated });
  const { data: maintenanceRequests } = trpc.maintenance.getLandlordRequests.useQuery(undefined, { enabled: isAuthenticated });
  const { data: payments } = trpc.payments.getLandlordPayments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: monthlyEarnings } = trpc.payments.getMonthlyEarnings.useQuery({ months: 6 }, { enabled: isAuthenticated });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!properties || !contracts) {
      return {
        totalProperties: 0,
        occupiedProperties: 0,
        occupancyRate: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageRent: 0,
        activeContracts: 0,
        pendingMaintenance: 0,
        averageTimeToRent: 0,
      };
    }

    const totalProperties = properties.length;
    const activeContracts = contracts.filter((c: any) => c.status === "active" || c.status === "fully_signed").length;
    const occupiedProperties = activeContracts;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    // Calculate revenue
    const monthlyRevenue = contracts
      .filter((c: any) => c.status === "active")
      .reduce((sum: number, c: any) => sum + (c.monthlyRent || 0), 0);
    
    const totalRevenue = payments
      ? payments
          .filter((p: any) => p.status === "completed")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      : 0;

    const averageRent = activeContracts > 0 ? monthlyRevenue / activeContracts : 0;

    const pendingMaintenance = maintenanceRequests
      ? maintenanceRequests.filter((r: any) => r.status === "pending" || r.status === "in_progress").length
      : 0;

    // Average time to rent (days from property creation to first signed contract)
    let totalDays = 0;
    let rentedCount = 0;
    
    properties.forEach((property: any) => {
      const propertyContracts = contracts.filter((c: any) => c.propertyId === property.id);
      if (propertyContracts.length > 0) {
        const firstContract = propertyContracts.sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        
        const daysDiff = Math.floor(
          (new Date(firstContract.createdAt).getTime() - new Date(property.createdAt).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff >= 0) {
          totalDays += daysDiff;
          rentedCount++;
        }
      }
    });

    const averageTimeToRent = rentedCount > 0 ? Math.round(totalDays / rentedCount) : 0;

    const baseCurrency = properties?.[0]?.currency || "EUR";

    return {
      totalProperties,
      occupiedProperties,
      occupancyRate,
      totalRevenue: totalRevenue / 100,
      monthlyRevenue: monthlyRevenue / 100,
      averageRent: averageRent / 100,
      activeContracts,
      pendingMaintenance,
      averageTimeToRent,
      baseCurrency,
    };
  }, [properties, contracts, maintenanceRequests, payments]);

  const chartData = {
    labels: monthlyEarnings?.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: `Revenue (${metrics.baseCurrency})`,
        data: monthlyEarnings?.data || [0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(34, 211, 238, 0.5)",
        borderRadius: 8,
      },
    ],
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color,
    trend, 
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: any; 
    color?: string;
    trend?: "up" | "down"; 
    trendValue?: string;
  }) => (
    <Card className="border-2 shadow-md hover:shadow-lg transition-all bg-white dark:bg-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color || 'bg-slate-100 dark:bg-slate-700'} text-white shadow-md`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black">{value}</div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{subtitle}</p>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 shadow-xl text-white flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <BarChart3 className="h-10 w-10" />
              Portfolio Analytics
            </h1>
            <p className="mt-2 opacity-90 text-lg">Detailed performance metrics for your properties</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue, metrics.baseCurrency)}
            subtitle="All-time earnings"
            icon={DollarSign}
            color="bg-emerald-500"
          />
          <MetricCard
            title="Occupancy Rate"
            value={`${metrics.occupancyRate.toFixed(1)}%`}
            subtitle={`${metrics.occupiedProperties} properties occupied`}
            icon={Users}
            color="bg-blue-500"
            trend={metrics.occupancyRate >= 80 ? "up" : "down"}
            trendValue={metrics.occupancyRate >= 80 ? "Healthy" : "Below target"}
          />
          <MetricCard
            title="Monthly Revenue"
            value={formatCurrency(metrics.monthlyRevenue, metrics.baseCurrency)}
            subtitle={`${formatCurrency(metrics.averageRent, metrics.baseCurrency)} avg. rent`}
            icon={TrendingUp}
            color="bg-purple-500"
          />
          <MetricCard
            title="Time to Rent"
            value={`${metrics.averageTimeToRent} days`}
            subtitle="Avg. listing to contract"
            icon={Clock}
            color="bg-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 border-2 shadow-xl p-6 bg-white dark:bg-slate-800">
            <h3 className="font-bold text-lg mb-6">Revenue Growth (6 Months)</h3>
            <div className="h-80">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </Card>

          <div className="space-y-6">
            <MetricCard
              title="Active Contracts"
              value={metrics.activeContracts}
              subtitle="Currently valid leases"
              icon={Calendar}
              color="bg-indigo-500"
            />
            <MetricCard
              title="Pending Maintenance"
              value={metrics.pendingMaintenance}
              subtitle="Requires your attention"
              icon={Wrench}
              color="bg-orange-500"
              trend={metrics.pendingMaintenance > 0 ? "down" : "up"}
              trendValue={metrics.pendingMaintenance > 0 ? "Action needed" : "All clear"}
            />
          </div>
        </div>

        {/* Property Performance Table */}
        <Card className="border-2 shadow-xl bg-white dark:bg-slate-800 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-2">
            <CardTitle className="text-xl font-bold">Property Performance</CardTitle>
            <CardDescription className="font-medium">Overview of individual rental performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {properties && properties.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 bg-slate-50 dark:bg-slate-900/50">
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-slate-500">Property</th>
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-slate-500">Status</th>
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-slate-500">Monthly Rent</th>
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-slate-500">Contract</th>
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-slate-500">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 border-slate-100 dark:border-slate-700">
                    {properties.map((property: any) => {
                      const propertyContracts = contracts?.filter((c: any) => c.propertyId === property.id) || [];
                      const activeContract = propertyContracts.find((c: any) => c.status === "active" || c.status === "fully_signed");
                      const isOccupied = !!activeContract;
                      
                      // Calculate occupancy days
                      const totalDaysSinceCreation = Math.floor(
                        (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                      ) || 1;
                      
                      const occupiedDays = propertyContracts.reduce((sum: number, c: any) => {
                        if (c.startDate) {
                          const start = new Date(c.startDate).getTime();
                          const end = (c.status === "active" || c.status === "fully_signed") 
                            ? Date.now() 
                            : (c.endDate ? new Date(c.endDate).getTime() : Date.now());
                          const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                          return sum + Math.max(0, days);
                        }
                        return sum;
                      }, 0);
                      
                      const propertyOccupancyRate = Math.min(100, (occupiedDays / totalDaysSinceCreation) * 100);

                      return (
                        <tr key={property.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{property.title}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">{property.city}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                              isOccupied 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                              {isOccupied ? "Occupied" : "Vacant"}
                            </span>
                          </td>
                          <td className="p-4 font-black text-slate-700 dark:text-slate-300">
                            {formatCents(property.rentPrice || 0, property.currency || "EUR")}
                          </td>
                          <td className="p-4">
                            {activeContract ? (
                              <div className="text-sm">
                                <div className="font-bold text-indigo-500">Active Lease</div>
                                <div className="text-xs font-bold text-slate-400">
                                  Until {new Date(activeContract.endDate).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 uppercase">No active lease</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className={`h-full transition-all rounded-full ${
                                    propertyOccupancyRate > 80 ? 'bg-cyan-500' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${propertyOccupancyRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-black min-w-[3rem] text-right text-slate-700 dark:text-slate-300">
                                {propertyOccupancyRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">No properties yet. Add your first property to see analytics.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
