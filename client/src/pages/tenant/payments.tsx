import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { CreditCard, Download, CheckCircle, Clock, XCircle, DollarSign, Receipt, Calendar, Building2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { loadStripeWithConfig } from "@/lib/stripe";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatCents } from "@/lib/currency";

function PaymentForm({ paymentId, clientSecret, amount, currency, stripePromise, onSuccess }: {
  paymentId: number;
  clientSecret: string;
  amount: number;
  currency: string;
  stripePromise: any;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const confirmPaymentMutation = trpc.payments.confirmPayment.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment in backend
        await confirmPaymentMutation.mutateAsync({
          paymentId,
          stripeChargeId: paymentIntent.id,
        });

        toast.success("Payment successful!");
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Amount to Pay</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(amount, currency)}</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900"></div>
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Pay {formatCurrency(amount, currency)}
          </span>
        )}
      </Button>
    </form>
  );
}

export default function TenantPaymentsPage() {
  const { user, isAuthenticated } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [filterType, setFilterType] = useState<"all" | "rent" | "deposit">("all");

  // Fetch Stripe config
  const stripeConfig = trpc.payments.getStripeConfig.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (stripeConfig.data?.publishableKey && !stripePromise) {
      setStripePromise(loadStripeWithConfig(stripeConfig.data.publishableKey));
    }
  }, [stripeConfig.data, stripePromise]);

  // Fetch tenant's active contracts
  const { data: contractsData, refetch: refetchContracts } = trpc.contracts.getTenantContracts.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Fetch payment history
  const { data: paymentsData, isLoading, refetch: refetchPayments } = trpc.payments.getTenantPayments.useQuery(undefined, {
    enabled: !!user,
  });

  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const downloadReceiptMutation = trpc.payments.downloadReceipt.useMutation();

  // Memoized calculations
  const payments = paymentsData || [];
  const contracts = contractsData || [];
  
  const allPayments = useMemo(() => {
    if (!paymentsData && !contractsData) return [];
    
    const list: any[] = [];
    
    // Track payments that exist in the payments table to avoid duplicates from contracts table
    const paidDeposits = new Set<number>();
    const paidFirstRents = new Set<number>();

    payments.forEach((payment: any) => {
      const isDeposit = payment.description === "Security Deposit";
      const isFirstRent = payment.description === "First Month Rent";

      if (payment.contractId) {
        if (isDeposit) paidDeposits.add(payment.contractId);
        if (isFirstRent) paidFirstRents.add(payment.contractId);
      }

      list.push({
        id: `payment-${payment.id}`,
        dbId: payment.id,
        type: isDeposit ? 'deposit' : 'rent',
        property: payment.property,
        landlord: payment.landlord,
        amount: payment.amount,
        currency: payment.currency || "EUR",
        status: payment.status,
        paidAt: payment.paidAt || payment.createdAt,
        description: payment.description || "Rent payment",
        receiptUrl: payment.receiptUrl,
        paymentMethod: payment.paymentMethod || "stripe",
      });
    });
    
    contracts.forEach((contract: any) => {
      if (contract.depositPaid && contract.depositPaidAt && !paidDeposits.has(contract.id)) {
        list.push({
          id: `contract-${contract.id}-deposit`,
          contractId: contract.id, // for receipt
          type: 'deposit',
          property: contract.property,
          landlord: contract.landlord,
          amount: contract.securityDeposit || 0,
          currency: contract.currency || "EUR",
          status: 'completed',
          paidAt: contract.depositPaidAt,
          description: `Security deposit for ${contract.property?.title || 'property'}`,
          paymentMethod: contract.depositPaymentMethod || "stripe",
        });
      }
      if (contract.firstMonthRentPaid && contract.firstMonthRentPaidAt && !paidFirstRents.has(contract.id)) {
        list.push({
          id: `contract-${contract.id}-rent`,
          contractId: contract.id, // for receipt
          type: 'rent',
          property: contract.property,
          landlord: contract.landlord,
          amount: contract.monthlyRent || 0,
          currency: contract.currency || "EUR",
          status: 'completed',
          paidAt: contract.firstMonthRentPaidAt,
          description: `First month rent for ${contract.property?.title || 'property'}`,
          paymentMethod: contract.firstMonthRentPaymentMethod || "stripe",
        });
      }
    });
    
    return list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [payments, contracts, paymentsData, contractsData]);

  const filteredPayments = useMemo(() => {
    if (filterType === "all") return allPayments;
    return allPayments.filter(p => p.type === filterType);
  }, [allPayments, filterType]);

  const totalPaymentsCount = filteredPayments.length;
  const completedPaymentsCount = filteredPayments.filter((p: any) => p.status === 'completed').length;
  const pendingPaymentsCount = filteredPayments.filter((p: any) => p.status === 'pending' || p.status === 'processing').length;
  
  const totalAmount = filteredPayments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // Helper functions
  const handlePayRent = async (contract: any) => {
    try {
      const result = await createPaymentIntentMutation.mutateAsync({
        contractId: contract.id,
        amount: contract.monthlyRent / 100, // Convert from cents to euros
        description: `Rent payment for ${contract.property?.title}`,
      });

      setPaymentIntent(result);
      setSelectedContract(contract);
      setShowPaymentDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize payment");
      console.error(error);
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      toast.loading("Generating receipt...");
      const result = await downloadReceiptMutation.mutateAsync({ paymentId });
      toast.dismiss();
      window.open(result.url, "_blank");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to generate receipt");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setPaymentIntent(null);
    setSelectedContract(null);
    refetchPayments();
    refetchContracts();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: "Pending",
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
        icon: Clock,
      },
      processing: {
        label: "Processing",
        className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
        icon: Clock,
      },
      completed: {
        label: "Completed",
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
        icon: CheckCircle,
      },
      failed: {
        label: "Failed",
        className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
        icon: XCircle,
      },
      refunded: {
        label: "Refunded",
        className: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Early returns MUST happen after all hooks and function definitions
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Please sign in to view your payments</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <CreditCard className="h-10 w-10" />
              Payments
            </h1>
            <p className="text-lg text-purple-100">
              View your payment history for deposits and rent
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { id: 'total', label: 'Total Payments', value: totalPaymentsCount, icon: Receipt, bgGradient: 'from-purple-500 to-indigo-600' },
            { id: 'completed', label: 'Completed', value: completedPaymentsCount, icon: CheckCircle, bgGradient: 'from-green-500 to-emerald-600' },
            { id: 'pending', label: 'Pending', value: pendingPaymentsCount, icon: Clock, bgGradient: 'from-yellow-500 to-orange-600' },
            { id: 'totalAmount', label: 'Total Paid', value: formatCents(totalAmount, allPayments[0]?.currency || "EUR"), icon: DollarSign, bgGradient: 'from-blue-500 to-indigo-600' }
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

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              Payment History
              {filteredPayments.length > 0 && (
                <span className="text-base font-normal text-slate-500 dark:text-slate-400">
                  ({filteredPayments.length})
                </span>
              )}
            </h2>
            
            <div className="w-48">
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="border-2 border-slate-200 dark:border-slate-700 rounded-xl h-10 font-medium">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="rent">Rent Only</SelectItem>
                  <SelectItem value="deposit">Deposit Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-lg">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No Payments Found</h3>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                  {filterType === "all" ? "Your payment history will appear here once you make your first payment." : `No ${filterType} payments found matching your filter.`}
                </p>
              </div>
            ) : (
              filteredPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {payment.property?.title || "Property"}
                        </h3>
                        {getStatusBadge(payment.status)}
                        {payment.type === 'deposit' && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                            Deposit
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {payment.description || (payment.type === 'deposit' ? 'Security deposit' : 'Rent payment')}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</p>
                          </div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {formatCents(payment.amount || 0, payment.currency)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Date</p>
                          </div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(payment.paidAt)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Landlord</p>
                          </div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {payment.landlord?.name || "N/A"}
                          </p>
                        </div>
                        {payment.paymentMethod && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Method</p>
                            </div>
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 capitalize">
                              {payment.paymentMethod}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {payment.status === "completed" && payment.dbId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.dbId)}
                        className="flex items-center gap-2 ml-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showPaymentDialog && paymentIntent && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
              <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Pay Rent
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Secure payment for {selectedContract?.property?.title || "property"}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentIntent.clientSecret,
                  appearance: {
                    theme: "stripe",
                  },
                }}
              >
                <PaymentForm
                  paymentId={paymentIntent.paymentId}
                  clientSecret={paymentIntent.clientSecret}
                  amount={paymentIntent.amount}
                  currency={selectedContract?.currency || "EUR"}
                  stripePromise={stripePromise}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}