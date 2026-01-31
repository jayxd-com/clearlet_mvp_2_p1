import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Clock, CheckCircle, FileText, Download, Calendar, Loader2 } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Badge } from "@/components/ui/badge";
import { PremiumPageHeader, PremiumPageContainer, PremiumStatCard, PremiumButton, PremiumCard, PremiumLabel } from "@/components/premium";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCurrency, formatCents, getCurrencySymbol } from "@/lib/currency";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

export default function LandlordEarningsPage() {
  const { user, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<"6months" | "12months" | "24months">("12months");
  const [paymentType, setPaymentType] = useState<"all" | "rent" | "deposit">("all");

  const months = timeRange === "6months" ? 6 : timeRange === "12months" ? 12 : 24;

  const { data: stats, isLoading: statsLoading } = trpc.payments.getLandlordStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = trpc.payments.getMonthlyEarnings.useQuery({ 
    months 
  }, { enabled: isAuthenticated });

  const { data: paymentsData, isLoading: paymentsLoading } = trpc.payments.getLandlordPayments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const payments = useMemo(() => {
    if (!paymentsData) return [];
    if (paymentType === "all") return paymentsData;
    // Map UI filter to backend types or descriptions if necessary
    // Since we added 'type' enum to schema, we can filter by it.
    // If backend doesn't populate 'type' yet for old data, we might need fallback logic based on description.
    return paymentsData.filter((p: any) => {
      if (p.type) return p.type === paymentType;
      // Fallback for older data without 'type' column populated
      if (paymentType === 'rent') return p.description?.toLowerCase().includes('rent');
      if (paymentType === 'deposit') return p.description?.toLowerCase().includes('deposit');
      return true;
    });
  }, [paymentsData, paymentType]);

  const isLoading = statsLoading || paymentsLoading || monthlyLoading;

  const generateStatement = (year?: number) => {
    if (!payments || payments.length === 0) {
      toast.error("No payment data available to generate statement");
      return;
    }

    const toastId = toast.loading(year ? `Generating ${year} statement...` : "Generating statement...");

    try {
      const doc = new jsPDF();
      
      const filteredPayments = year 
        ? payments.filter((p: any) => new Date(p.createdAt).getFullYear() === year)
        : payments;

      if (filteredPayments.length === 0) {
        toast.dismiss(toastId);
        toast.info(`No payments found for ${year || 'the selected period'}`);
        return;
      }

      const baseCurrency = filteredPayments[0]?.currency || "EUR";

      doc.setFontSize(20);
      doc.setTextColor(0, 150, 136);
      doc.text(year ? `ClearLet Statement ${year}` : "ClearLet Statement", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Landlord: ${user?.name || "Unknown"}`, 14, 35);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Financial Summary", 14, 45);
      
      const totalRevenue = filteredPayments.reduce((sum: number, p: any) => sum + (p.status === 'completed' ? p.amount : 0), 0);
      const pendingRevenue = filteredPayments.reduce((sum: number, p: any) => sum + (['pending', 'processing'].includes(p.status) ? p.amount : 0), 0);
      const completedCount = filteredPayments.filter((p: any) => p.status === 'completed').length;

      const summaryData = [
        ["Total Revenue", formatCents(totalRevenue, baseCurrency)],
        ["Pending Payments", formatCents(pendingRevenue, baseCurrency)],
        ["Completed Payments", `${completedCount}`],
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });

      doc.text("Detailed Payment History", 14, (doc as any).lastAutoTable.finalY + 15);

      const tableData = filteredPayments.map((p: any) => [
        new Date(p.createdAt).toLocaleDateString(),
        p.property.title,
        p.tenant.name,
        formatCents(p.amount, p.currency || "EUR"),
        p.status
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Property', 'Tenant', 'Amount', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [6, 182, 212] },
        styles: { fontSize: 9 },
      });

      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
        doc.text("ClearLet Inc. - Confidential", 14, doc.internal.pageSize.height - 10);
      }

      doc.save(`clearlet_statement_${year || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss(toastId);
      toast.success("Statement downloaded successfully");
    } catch (error) {
      toast.dismiss(toastId);
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate statement");
    }
  };

  const generateReceipt = (payment: any) => {
    const toastId = toast.loading("Generating receipt...");
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(0, 150, 136);
      doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Receipt ID: #${payment.id}`, 105, 30, { align: "center" });
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 105, 35, { align: "center" });

      doc.setFillColor(240, 250, 255);
      doc.rect(70, 45, 70, 20, "F");
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(formatCents(payment.amount, payment.currency || "EUR"), 105, 58, { align: "center" });

      doc.setFontSize(12);
      doc.text("Payment Details", 14, 80);
      
      const detailsData = [
        ["Property", payment.property.title],
        ["Tenant", payment.tenant.name],
        ["Status", payment.status.toUpperCase()],
        ["Reference", payment.stripePaymentIntentId || "N/A"]
      ];

      autoTable(doc, {
        startY: 85,
        body: detailsData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
      });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("ClearLet Inc. - Automated Receipt", 105, 280, { align: "center" });

      doc.save(`receipt_${payment.id}.pdf`);
      toast.dismiss(toastId);
      toast.success("Receipt downloaded");
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Receipt generation failed:", error);
      toast.error("Failed to generate receipt");
    }
  };

  const chartData = useMemo(() => {
    if (!monthlyData) return { labels: [], datasets: [] };
    return {
      labels: monthlyData.labels,
      datasets: [
        {
          label: `Earnings (${getCurrencySymbol(payments?.[0]?.currency || "EUR")})`,
          data: monthlyData.data,
          borderColor: "rgb(6, 182, 212)",
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [monthlyData, payments]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        padding: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        callbacks: {
          label: (context: any) => formatCurrency(context.parsed.y, payments?.[0]?.currency || "EUR")
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(226, 232, 240, 0.1)" },
        ticks: { 
          callback: (value: any) => formatCurrency(value, payments?.[0]?.currency || "EUR"),
        }
      },
      x: { grid: { display: false } }
    },
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader
        title="Earnings & Payments"
        subtitle="Track your rental income and financial performance"
        icon={DollarSign}
        action={{
          label: "Download Statement",
          onClick: () => generateStatement(),
          icon: Download
        }}
      />

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard
            label="Total Revenue"
            value={formatCents(stats?.totalEarnings || 0, payments?.[0]?.currency || "EUR")}
            icon={TrendingUp}
            color="text-green-500"
            bg="bg-green-50 dark:bg-green-900/20"
          />
          <PremiumStatCard
            label="Pending Payments"
            value={formatCents(stats?.pendingPayments || 0, payments?.[0]?.currency || "EUR")}
            icon={Clock}
            color="text-yellow-500"
            bg="bg-yellow-50 dark:bg-yellow-900/20"
          />
          <PremiumStatCard
            label="Completed Payments"
            value={(stats?.totalPayments || 0) - (stats?.pendingPaymentsCount || 0)}
            icon={CheckCircle}
            color="text-cyan-500"
            bg="bg-cyan-50 dark:bg-cyan-900/20"
          />
          <PremiumStatCard
            label="Average Monthly"
            value={formatCents(((stats?.totalEarnings || 0) / (stats?.totalPayments || 1)), payments?.[0]?.currency || "EUR")}
            icon={Calendar}
            color="text-blue-500"
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-white dark:bg-slate-800 p-1 border-2 border-slate-200 dark:border-slate-700 rounded-xl w-full md:w-auto grid grid-cols-3 md:inline-flex h-auto shadow-sm">
              <TabsTrigger value="overview" className="px-8 py-3 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Overview</TabsTrigger>
              <TabsTrigger value="payments" className="px-8 py-3 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Payments</TabsTrigger>
              <TabsTrigger value="reports" className="px-8 py-3 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Reports</TabsTrigger>
            </TabsList>

            <div className="flex gap-4 w-full md:w-auto">
              <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                <SelectTrigger className="w-full md:w-[150px] h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="font-bold">All Payments</SelectItem>
                  <SelectItem value="rent" className="font-bold">Rent Only</SelectItem>
                  <SelectItem value="deposit" className="font-bold">Deposit Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-full md:w-[180px] h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="6months" className="font-bold">Last 6 Months</SelectItem>
                  <SelectItem value="12months" className="font-bold">Last 12 Months</SelectItem>
                  <SelectItem value="24months" className="font-bold">Last 24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <PremiumCard title="Income Trends" icon={TrendingUp} description="Monthly rental income over selected period">
              <div className="h-[400px] w-full pt-4">
                <Line data={chartData} options={chartOptions} />
              </div>
            </PremiumCard>
          </TabsContent>

          <TabsContent value="payments">
            <PremiumCard title="Payment History" icon={FileText} description="Detailed list of all received and pending payments" contentClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-4"><PremiumLabel className="mb-0">Date</PremiumLabel></th>
                      <th className="px-8 py-4"><PremiumLabel className="mb-0">Property</PremiumLabel></th>
                      <th className="px-8 py-4"><PremiumLabel className="mb-0">Tenant</PremiumLabel></th>
                      <th className="px-8 py-4"><PremiumLabel className="mb-0">Amount</PremiumLabel></th>
                      <th className="px-8 py-4"><PremiumLabel className="mb-0">Status</PremiumLabel></th>
                      <th className="px-8 py-4 text-right"><PremiumLabel className="mb-0">Actions</PremiumLabel></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-800/50">
                    {payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-900 dark:text-white text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 text-sm">{p.property.title}</td>
                        <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 text-sm">{p.tenant.name}</td>
                        <td className="px-8 py-5 font-black text-cyan-600 dark:text-cyan-400 text-sm">{formatCents(p.amount, p.currency || "EUR")}</td>
                        <td className="px-8 py-5">
                          <Badge className={cn(
                            "border-none font-black uppercase text-[9px] px-3 py-1 rounded-lg",
                            p.status === 'completed' ? "bg-green-500/10 text-green-600" :
                            p.status === 'pending' ? "bg-yellow-500/10 text-yellow-600" :
                            "bg-red-500/10 text-red-600"
                          )}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <PremiumButton variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => generateReceipt(p)}>
                            <Download className="h-4 w-4" />
                          </PremiumButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PremiumCard>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PremiumCard title="Tax Reports" icon={FileText} description="Download annual tax compliance reports">
                <div className="space-y-4">
                  {[2026, 2025, 2024].map(year => (
                    <div key={year} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{year} Annual Statement</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {year === 2026 ? "In Progress" : year === 2025 ? "Ready for download" : "Archived"}
                        </p>
                      </div>
                      <PremiumButton variant="outline" size="sm" className="h-10 px-4 rounded-xl text-xs" onClick={() => generateStatement(year)}>
                        Download
                      </PremiumButton>
                    </div>
                  ))}
                </div>
              </PremiumCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PremiumPageContainer>
  );
}