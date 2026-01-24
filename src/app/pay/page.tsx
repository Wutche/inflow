"use client";

import { Suspense, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Send,
  ArrowLeft,
  Shield,
  Wallet,
  CheckCircle2,
  Loader2,
  Calendar,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { decodeInvoice, InvoiceData } from "@/lib/url-state";
import { useWallet } from "@/context/WalletContext";
import { useBridge } from "@/hooks/useBridge";
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory";
import { BridgeDirection } from "@/lib/bridge-utils";

/**
 * Wrapper component that provides Suspense boundary for useSearchParams.
 * Next.js App Router requires useSearchParams to be wrapped in Suspense.
 */
export default function PayPage() {
  return (
    <Suspense fallback={<PayPageSkeleton />}>
      <PayPageContent />
    </Suspense>
  );
}

/**
 * Loading skeleton displayed while the page is being hydrated.
 */
function PayPageSkeleton() {
  return (
    <main className="min-h-screen">
      <Navbar hideNavLinks />
      <div className="pt-32 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl border border-border-subtle p-8 animate-pulse dark:bg-card">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
            <div className="space-y-4">
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-16 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Main pay page content that reads and validates the URL state.
 */
function PayPageContent() {
  const searchParams = useSearchParams();
  const invoiceToken = searchParams.get("i");
  const invoiceData = decodeInvoice(invoiceToken);

  // If decoding failed, show error state
  if (!invoiceData) {
    return <InvalidInvoiceUI />;
  }

  return <ValidInvoiceUI data={invoiceData} />;
}

/**
 * UI displayed when the invoice link is invalid or corrupted.
 */
function InvalidInvoiceUI() {
  return (
    <main className="min-h-screen">
      <Navbar hideNavLinks />
      <div className="pt-32 pb-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-border-subtle p-8 dark:bg-card dark:shadow-dark-sleek"
          >
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Invalid Invoice Link
            </h1>
            <p className="text-muted mb-8">
              This payment link is invalid or has been corrupted. Please ask the
              sender for a new link.
            </p>

            {/* Back to Home */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-black/90 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate?: string): string {
  if (!isoDate) return "Unknown date";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * UI displayed when the invoice is valid.
 * Shows invoice details and payment button.
 */
function ValidInvoiceUI({ data }: { data: InvoiceData }) {
  const {
    ethTruncatedAddress,
    stacksTruncatedAddress,
    connectEthereum,
    connectStacks,
    ethConnected,
    stacksConnected,
  } = useWallet();

  const { bridge, status, txHash, error } = useBridge();
  const { updateInvoiceStatus } = useInvoiceHistory();

  // Determine which network the payer needs to use
  const payerNetwork = data.network || "stacks";
  const isPayerConnected =
    payerNetwork === "stacks" ? stacksConnected : ethConnected;
  const payerAddress =
    payerNetwork === "stacks" ? stacksTruncatedAddress : ethTruncatedAddress;

  // Track whether we've already marked this invoice as paid (using ref to avoid render cascade)
  const invoiceMarkedPaidRef = useRef(false);

  // Derive payment status from bridge status (avoids cascading setState in useEffect)
  const paymentStatus = useMemo(() => {
    if (status === "success" && txHash) return "success";
    if (status === "error" && error) return "error";
    if (
      status === "bridging" ||
      status === "approving" ||
      status === "checking"
    )
      return "processing";
    return "idle";
  }, [status, txHash, error]);

  // Derive payment error from bridge error (no need for separate state)
  const paymentError = status === "error" ? error : null;

  // Handle side effects: mark invoice as paid when txHash is available
  useEffect(() => {
    // Mark as paid as soon as we have a txHash (transaction submitted to blockchain)
    if (txHash && data.invoiceId && !invoiceMarkedPaidRef.current) {
      updateInvoiceStatus(data.invoiceId, "paid", txHash);
      invoiceMarkedPaidRef.current = true;
    }
  }, [txHash, data.invoiceId, updateInvoiceStatus]);

  /**
   * Handles wallet connection based on required network
   */
  const handleConnect = async () => {
    if (payerNetwork === "stacks") {
      await connectStacks();
    } else {
      await connectEthereum();
    }
  };

  /**
   * Handles the payment action using the bridge.
   */
  const handlePay = async () => {
    if (!isPayerConnected) {
      await handleConnect();
      return;
    }

    try {
      // Determine target network (default to cross-chain if not specified)
      const targetNetwork =
        data.targetNetwork ||
        (payerNetwork === "stacks" ? "ethereum" : "stacks");

      // Determine bridge direction
      let direction: BridgeDirection;
      if (payerNetwork === "stacks") {
        direction =
          targetNetwork === "stacks" ? "stacks-to-stacks" : "stacks-to-eth";
      } else {
        direction =
          targetNetwork === "ethereum" ? "eth-to-eth" : "eth-to-stacks";
      }

      await bridge(direction, data.amount, data.recipient);
    } catch (err) {
      // Error will be captured by bridge hook and reflected in paymentStatus/paymentError
      console.error("Payment failed:", err);
    }
  };

  // Success state
  if (paymentStatus === "success") {
    return (
      <main className="min-h-screen">
        <Navbar hideNavLinks />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-border-subtle p-8 text-center dark:bg-card dark:shadow-dark-sleek"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted mb-4">
                You&apos;ve sent {data.amount}{" "}
                {payerNetwork === "stacks" ? "USDCx" : "USDC"} to the merchant.
              </p>

              {/* Confirmation Note */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong>Bridge transfers takes 10 to 15 minutes
                  for confirmation and for the recipient to receive the
                  equivalent amount.
                </p>
              </div>

              {txHash && (
                <a
                  href={
                    payerNetwork === "stacks"
                      ? `https://explorer.stacks.co/txid/${txHash}?chain=testnet`
                      : `https://sepolia.etherscan.io/tx/${txHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-orange hover:underline mb-6"
                >
                  View Transaction →
                </a>
              )}
              <Link
                href="/"
                className="block w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-colors"
              >
                Done
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar hideNavLinks />
      <div className="pt-32 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border-subtle dark:shadow-dark-sleek overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-orange/5 border-b border-brand-orange/10 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">
                    Payment Request
                  </h1>
                  <p className="text-sm text-muted">Invoice from Inflow</p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="p-6 space-y-6">
              {/* Amount - Hero */}
              <div className="text-center py-6 border-b border-border-subtle">
                <p className="text-sm text-muted mb-1">Amount Due</p>
                <div className="text-5xl font-bold tracking-tight text-foreground">
                  {data.amount}
                  <span className="text-2xl text-muted ml-2">
                    {payerNetwork === "stacks" ? "USDCx" : "USDC"}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                {/* Created Date */}
                {data.createdAt && (
                  <div className="flex justify-between items-center py-3 border-b border-border-subtle/50">
                    <span className="text-sm text-muted flex items-center gap-2">
                      <Calendar size={14} />
                      Created
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(data.createdAt)}
                    </span>
                  </div>
                )}

                {/* Payment Network */}
                <div className="flex justify-between items-center py-3 border-b border-border-subtle/50">
                  <span className="text-sm text-muted flex items-center gap-2">
                    <ArrowLeftRight size={14} />
                    Pay on
                  </span>
                  <span className="text-sm font-bold flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${payerNetwork === "stacks" ? "bg-[#5546FF]" : "bg-[#627EEA]"} flex items-center justify-center`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          payerNetwork === "stacks"
                            ? "https://cryptologos.cc/logos/stacks-stx-logo.png"
                            : "https://cryptologos.cc/logos/ethereum-eth-logo.png"
                        }
                        className="w-2 h-2 brightness-0 invert"
                        alt="Network logo"
                      />
                    </div>
                    {payerNetwork === "stacks" ? "Stacks" : "Ethereum"}
                  </span>
                </div>

                {/* Recipient */}
                <div className="flex justify-between items-start py-3 border-b border-border-subtle/50">
                  <span className="text-sm text-muted">
                    Merchant receives on
                  </span>
                  <span className="text-sm font-bold flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${(data.targetNetwork || (payerNetwork === "stacks" ? "ethereum" : "stacks")) === "stacks" ? "bg-brand-orange" : "bg-brand-blue"} flex items-center justify-center`}
                    >
                      <div className="w-1 h-1 rounded-full bg-white" />
                    </div>
                    {(
                      data.targetNetwork ||
                      (payerNetwork === "stacks" ? "ethereum" : "stacks")
                    )
                      .charAt(0)
                      .toUpperCase() +
                      (
                        data.targetNetwork ||
                        (payerNetwork === "stacks" ? "ethereum" : "stacks")
                      ).slice(1)}
                  </span>
                </div>

                {/* Memo (if present) */}
                {data.memo && (
                  <div className="flex justify-between items-start py-3 border-b border-border-subtle/50">
                    <span className="text-sm text-muted">Memo</span>
                    <span className="text-sm text-right max-w-[200px]">
                      {data.memo}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {paymentStatus === "error" && paymentError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  Verified invoice • Bitcoin-finalized via Stacks
                </span>
              </div>

              {/* Pay Button */}
              <motion.button
                whileHover={{
                  scale: paymentStatus === "processing" ? 1 : 1.01,
                }}
                whileTap={{ scale: paymentStatus === "processing" ? 1 : 0.99 }}
                onClick={handlePay}
                disabled={paymentStatus === "processing"}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  paymentStatus === "processing"
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-brand-orange text-white hover:bg-brand-orange/90"
                }`}
              >
                {paymentStatus === "processing" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : isPayerConnected ? (
                  <>
                    <Send size={18} />
                    Pay {data.amount}{" "}
                    {payerNetwork === "stacks" ? "USDCx" : "USDC"}
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    Connect {payerNetwork === "stacks"
                      ? "Stacks"
                      : "Ethereum"}{" "}
                    Wallet
                  </>
                )}
              </motion.button>

              {/* Connected Wallet Info */}
              {isPayerConnected && payerAddress && (
                <p className="text-center text-xs text-muted">
                  Paying from wallet:{" "}
                  <span className="font-mono">{payerAddress}</span>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
