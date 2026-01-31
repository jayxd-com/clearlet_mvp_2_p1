import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { FileText, Eye, Download, CheckCircle, Clock, Edit, CreditCard, DollarSign, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import KeyCollectionScheduler from "@/components/KeyCollectionScheduler";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { loadStripeWithConfig } from "@/lib/stripe";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { 
  PremiumPageContainer, 
  PremiumPageHeader, 
  PremiumCard, 
  PremiumButton, 
  PremiumDocumentViewer,
  PremiumStatCard,
  PremiumStatusBadge,
  PremiumLabel,
  PremiumInput
} from "@/components/premium";
import { format } from "date-fns";
import { formatCurrency, formatCents } from "@/lib/currency";

function StripePaymentForm({
  clientSecret,
  amount,
  currency,
  stripePromise,
  onSuccess,
  onCancel
}: {
  clientSecret: string;
  amount: number;
  currency: string;
  stripePromise: any;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
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
        onSuccess(paymentIntent.id);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-2">
        <PremiumButton type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">
          Cancel
        </PremiumButton>
        <PremiumButton
          type="submit"
          size="sm"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
        >
          {isProcessing ? "Processing..." : `Pay ${formatCurrency(amount, currency)}`}
        </PremiumButton>
      </div>
    </form>
  );
}

export default function TenantContractsPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showDepositPaymentDialog, setShowDepositPaymentDialog] = useState(false);
  const [showRentPaymentDialog, setShowRentPaymentDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; fileName: string } | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  
  const [contractToTerminate, setContractToTerminate] = useState<any>(null);
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [depositClientSecret, setDepositClientSecret] = useState<string | null>(null);
  const [rentClientSecret, setRentClientSecret] = useState<string | null>(null);

  // Fetch Stripe config
  const stripeConfig = trpc.payments.getStripeConfig.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  React.useEffect(() => {
    if (stripeConfig.data?.publishableKey && !stripePromise) {
      setStripePromise(loadStripeWithConfig(stripeConfig.data.publishableKey));
    }
  }, [stripeConfig.data, stripePromise]);

  const { data: contractsData, isLoading, refetch } = trpc.contracts.getTenantContracts.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const signMutation = trpc.contracts.sign.useMutation();
  const generatePdfMutation = trpc.contracts.generatePdf.useMutation();
  const createDepositPaymentIntentMutation = trpc.contracts.createDepositPaymentIntent.useMutation();
  const createRentPaymentIntentMutation = trpc.contracts.createRentPaymentIntent.useMutation();
  const confirmDepositPaymentMutation = trpc.contracts.confirmDepositPayment.useMutation({
    onSuccess: () => {
      toast.success("Deposit payment confirmed!");
      setShowDepositPaymentDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm deposit payment");
    }
  });
  const confirmRentPaymentMutation = trpc.contracts.confirmRentPayment.useMutation({
    onSuccess: () => {
      toast.success("Rent payment confirmed!");
      setShowRentPaymentDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm rent payment");
    }
  });
  
  const requestTerminationMutation = trpc.contractModifications.requestTermination.useMutation({
    onSuccess: () => {
      toast.success("Termination request sent");
      setContractToTerminate(null);
      setTerminationReason("");
      setTerminationDate("");
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSignature = async (signature: string) => {
    if (!selectedContract) return;
    try {
      await signMutation.mutateAsync({ contractId: selectedContract.id, signature });
      toast.success("Contract signed successfully");
      setShowSignDialog(false);
      refetch();
    } catch (error) {
      toast.error("Failed to sign contract");
    }
  };

  const handlePreview = async (contract: any) => {
    try {
      toast.loading("Generating preview...");
      const result: any = await generatePdfMutation.mutateAsync({ contractId: contract.id });
      toast.dismiss();
      setPreviewDoc({
        url: result.pdfUrl,
        fileName: `Contract - ${contract.property.title}.pdf`
      });
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate preview');
    }
  };

  const handleDownloadPdf = async (contractId: number) => {
    try {
      toast.loading("Downloading...");
      const result: any = await generatePdfMutation.mutateAsync({ contractId });
      toast.dismiss();
      window.open(result.pdfUrl, "_blank");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 font-bold animate-pulse">Loading contracts...</p>
      </div>
    );
  }

  const contracts = contractsData || [];

  return (
    <PremiumPageContainer maxWidth="7xl">
      <PremiumPageHeader 
        title="My Contracts" 
        subtitle="Review, sign, and manage your rental agreements"
        icon={FileText}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total', value: contracts.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: FileText },
          { label: 'Pending', value: contracts.filter((c: any) => ["sent_to_tenant"].includes(c.status)).length, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: Clock },
          { label: 'Signed', value: contracts.filter((c: any) => ["tenant_signed", "fully_signed", "active"].includes(c.status)).length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle },
          { label: 'Active', value: contracts.filter((c: any) => c.status === "active").length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: Home }
        ].map(stat => (
          <PremiumStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      <div className="space-y-4">
        {contracts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No contracts found</h3>
            <p className="text-slate-500 mt-2">Contracts will appear here once sent by a landlord.</p>
          </div>
        ) : (
          contracts.map((contract: any) => (
            <PremiumCard key={contract.id} className="group hover:border-cyan-400/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{contract.property?.title}</h3>
                    <PremiumStatusBadge status={contract.status} />
                    {contract.depositPaid && (
                      <PremiumStatusBadge status="paid" label="Deposit Paid" />
                    )}
                    {contract.firstMonthRentPaid && (
                      <PremiumStatusBadge status="paid" label="Rent Paid" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-4">{contract.property?.address}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rent</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{formatCents(contract.monthlyRent || 0, contract.currency || "EUR")}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deposit</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{formatCents(contract.securityDeposit || 0, contract.currency || "EUR")}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{format(new Date(contract.startDate), "dd/MM/yy")}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{format(new Date(contract.endDate), "dd/MM/yy")}</p>
                    </div>
                  </div>
                </div>

                  <div className="flex flex-row md:flex-col gap-2 min-w-[140px] items-center md:items-end">
                    <PremiumButton 
                      variant="outline" 
                      size="sm"
                      className="w-full md:w-32 rounded-xl border-2"
                      onClick={() => handlePreview(contract)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </PremiumButton>

                    {contract.status === "sent_to_tenant" && (
                      <PremiumButton 
                        size="sm"
                        className="w-full md:w-32 rounded-xl bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 text-white"
                        onClick={() => { setSelectedContract(contract); setShowSignDialog(true); }}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Sign
                      </PremiumButton>
                    )}

                    {(contract.status === "fully_signed" || contract.status === "active") && (
                      <>
                        {!contract.depositPaid && (
                          <PremiumButton 
                            size="sm"
                            className="w-full md:w-32 rounded-xl bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
                            onClick={() => { 
                              setSelectedContract(contract); 
                              setDepositClientSecret(null);
                              setShowDepositPaymentDialog(true); 
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-2" /> Deposit
                          </PremiumButton>
                        )}
                        {contract.depositPaid && !contract.firstMonthRentPaid && (
                          <PremiumButton 
                            size="sm"
                            className="w-full md:w-32 rounded-xl bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
                            onClick={() => { 
                              setSelectedContract(contract); 
                              setRentClientSecret(null);
                              setShowRentPaymentDialog(true); 
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" /> Pay Rent
                          </PremiumButton>
                        )}
                        <PremiumButton 
                          variant="ghost" 
                          size="sm"
                          className="w-full md:w-32 text-slate-500 hover:text-cyan-500"
                          onClick={() => handleDownloadPdf(contract.id)}
                        >
                          <Download className="h-4 w-4 mr-2" /> PDF
                        </PremiumButton>

                        {/* Terminate Button */}
                        {["active", "fully_signed"].includes(contract.status) && (
                         <PremiumButton 
                          variant="ghost" 
                          size="sm"
                          className="w-full md:w-32 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setContractToTerminate(contract)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" /> Terminate
                        </PremiumButton>
                        )}
                      </>
                    )}
                  </div>
              </div>
              
              {/* Key Collection for Active/Fully Signed (After Deposit) */}
              {contract.status === "active" || (contract.status === "fully_signed" && contract.depositPaid) ? (
                <div className="mt-6 pt-6 border-t-2 border-slate-50 dark:border-slate-700/50">
                  <KeyCollectionScheduler
                    contractId={contract.id}
                    userRole="tenant"
                    onScheduled={() => refetch()}
                  />
                </div>
              ) : null}
            </PremiumCard>
          ))
        )}
      </div>

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 border-b-2 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Tenant Signature</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border-dashed border-slate-200 dark:border-slate-800">
              <SignatureCanvas onSave={handleSignature} onCancel={() => setShowSignDialog(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Termination Dialog */}
      <Dialog open={!!contractToTerminate} onOpenChange={(open) => !open && setContractToTerminate(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Terminate Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Request to end the contract for <span className="font-bold">{contractToTerminate?.property?.title}</span>.
              The landlord will be notified.
            </p>
            
            <div className="space-y-2">
              <PremiumLabel required>Termination Date</PremiumLabel>
              <PremiumInput 
                type="date" 
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <PremiumLabel required>Reason</PremiumLabel>
              <textarea 
                className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-transparent focus:border-cyan-500 outline-none transition-all min-h-[100px]"
                placeholder="Please explain why you want to terminate this contract..."
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <PremiumButton 
                variant="outline" 
                className="flex-1"
                onClick={() => setContractToTerminate(null)}
              >
                Cancel
              </PremiumButton>
              <PremiumButton 
                className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                onClick={() => {
                  if (!terminationDate || terminationReason.length < 10) {
                    toast.error("Please provide a date and a valid reason (min 10 chars)");
                    return;
                  }
                  requestTerminationMutation.mutate({
                    contractId: contractToTerminate.id,
                    desiredEndDate: new Date(terminationDate).toISOString(),
                    reason: terminationReason
                  });
                }}
                isLoading={requestTerminationMutation.isPending}
              >
                Submit Request
              </PremiumButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialogs (Deposit/Rent) */}
      {showDepositPaymentDialog && selectedContract && (
        <Dialog open={showDepositPaymentDialog} onOpenChange={setShowDepositPaymentDialog}>
          <DialogContent className="max-w-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Pay Security Deposit</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {depositClientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret: depositClientSecret }}>
                  <StripePaymentForm
                    clientSecret={depositClientSecret}
                    stripePromise={stripePromise}
                    amount={selectedContract.securityDeposit / 100}
                    currency={selectedContract.currency || "EUR"}
                    onSuccess={(id) => confirmDepositPaymentMutation.mutate({ contractId: selectedContract.id, paymentIntentId: id })}
                    onCancel={() => setShowDepositPaymentDialog(false)}
                  />
                </Elements>
              ) : (
                <PremiumButton 
                  onClick={async () => {
                    try {
                      const res = await createDepositPaymentIntentMutation.mutateAsync({ contractId: selectedContract.id });
                      setDepositClientSecret(res.clientSecret);
                    } catch (error: any) {
                      toast.error(error.message || "Failed to initialize payment");
                    }
                  }}
                  isLoading={createDepositPaymentIntentMutation.isPending}
                  className="w-full"
                >
                  Continue to Payment ({formatCents(selectedContract.securityDeposit, selectedContract.currency || "EUR")})
                </PremiumButton>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showRentPaymentDialog && selectedContract && (
        <Dialog open={showRentPaymentDialog} onOpenChange={setShowRentPaymentDialog}>
          <DialogContent className="max-w-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Pay First Month's Rent</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {rentClientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret: rentClientSecret }}>
                  <StripePaymentForm
                    clientSecret={rentClientSecret}
                    stripePromise={stripePromise}
                    amount={selectedContract.monthlyRent / 100}
                    currency={selectedContract.currency || "EUR"}
                    onSuccess={(id) => confirmRentPaymentMutation.mutate({ contractId: selectedContract.id, paymentIntentId: id })}
                    onCancel={() => setShowRentPaymentDialog(false)}
                  />
                </Elements>
              ) : (
                <PremiumButton 
                  onClick={async () => {
                    try {
                      const res = await createRentPaymentIntentMutation.mutateAsync({ contractId: selectedContract.id });
                      setRentClientSecret(res.clientSecret);
                    } catch (error: any) {
                      toast.error(error.message || "Failed to initialize payment");
                    }
                  }}
                  isLoading={createRentPaymentIntentMutation.isPending}
                  className="w-full"
                >
                  Continue to Payment ({formatCents(selectedContract.monthlyRent, selectedContract.currency || "EUR")})
                </PremiumButton>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PDF Previewer */}
      <PremiumDocumentViewer
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        url={previewDoc?.url || null}
        fileName={previewDoc?.fileName}
        type="application/pdf"
      />
    </PremiumPageContainer>
  );
}