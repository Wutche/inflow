"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Zap,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Code2,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";

type FlowStep =
  | "idle"
  | "requesting"
  | "payment_required"
  | "paying"
  | "success"
  | "error";

interface InvoiceResult {
  id: string;
  paymentUrl: string;
  txId?: string;
}

export default function X402DemoPage() {
  const { stacksConnected, connectStacks } = useWallet();

  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [recipient, setRecipient] = useState(
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  );
  const [amount, setAmount] = useState("100.00");
  const [memo, setMemo] = useState("x402 Demo Invoice");

  const handleCreateInvoice = async () => {
    if (!stacksConnected) {
      await connectStacks();
      return;
    }

    setFlowStep("requesting");
    setError(null);
    setResult(null);

    try {
      // Step 1: Make request without payment (will get 402)
      const response = await fetch("/api/v1/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, amount, token: "USDC", memo }),
      });

      if (response.status === 402) {
        setFlowStep("payment_required");
        const paymentDetails = await response.json();

        // In a real implementation, we would:
        // 1. Sign a transaction using @stacks/transactions
        // 2. Send it in the X-PAYMENT header
        // For demo purposes, we'll show the 402 flow

        // Simulate payment flow visualization
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setFlowStep("paying");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Generate a real invoice URL for the demo (so the link actually works)
        const demoInvoiceId = crypto.randomUUID();
        const { createPaymentUrl } = await import("@/lib/url-state");
        const demoPaymentUrl = createPaymentUrl({
          invoiceId: demoInvoiceId,
          recipient,
          amount,
          token: "USDC",
          memo,
          network: "stacks",
          createdAt: new Date().toISOString(),
        });

        setResult({
          id: demoInvoiceId,
          paymentUrl: demoPaymentUrl,
          txId: undefined,
        });
        setFlowStep("success");

        // Store payment details for display
        console.log("402 Payment Details:", paymentDetails);
      } else if (response.ok) {
        const data = await response.json();
        setResult({
          id: data.invoice.id,
          paymentUrl: data.invoice.paymentUrl,
          txId: data.payment?.txId,
        });
        setFlowStep("success");
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setFlowStep("error");
    }
  };

  const handleCopyUrl = async () => {
    if (result?.paymentUrl) {
      await navigator.clipboard.writeText(
        window.location.origin + result.paymentUrl,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStepInfo = () => {
    switch (flowStep) {
      case "requesting":
        return {
          icon: Send,
          text: "Making API request...",
          color: "text-blue-500",
        };
      case "payment_required":
        return {
          icon: Zap,
          text: "402 Payment Required!",
          color: "text-brand-orange",
        };
      case "paying":
        return {
          icon: Loader2,
          text: "Processing STX payment...",
          color: "text-yellow-500",
        };
      case "success":
        return {
          icon: CheckCircle2,
          text: "Invoice created!",
          color: "text-green-500",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Error occurred",
          color: "text-red-500",
        };
      default:
        return null;
    }
  };

  const stepInfo = getStepInfo();

  return (
    <DashboardLayout
      title="x402 API Demo"
      subtitle="Pay-per-Invoice Micropayments"
    >
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-sm font-bold mb-4">
            <Zap className="w-4 h-4" />
            x402 Payment Protocol Demo
          </div>
          <h1 className="text-3xl font-bold mb-3">Pay-per-Invoice API</h1>
          <p className="text-muted text-lg">
            Create invoices programmatically by paying 0.001 STX per API call
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border-subtle rounded-3xl p-8"
        >
          {/* Wallet Status */}
          {!stacksConnected && (
            <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-yellow-500" />
                <span className="text-sm">
                  Connect your Stacks wallet to test x402 payments
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-sidebar border border-border-subtle focus:border-brand-orange focus:outline-none transition-colors"
                placeholder="ST1..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-sidebar border border-border-subtle focus:border-brand-orange focus:outline-none transition-colors"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Memo</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-sidebar border border-border-subtle focus:border-brand-orange focus:outline-none transition-colors"
                  placeholder="Payment for..."
                />
              </div>
            </div>
          </div>

          {/* API Cost Indicator */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-sidebar mb-6">
            <span className="text-sm text-muted">API Call Cost</span>
            <span className="font-mono font-bold text-brand-orange">
              0.001 STX
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreateInvoice}
            disabled={flowStep === "requesting" || flowStep === "paying"}
            className="w-full py-4 rounded-2xl bg-brand-orange text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {flowStep === "requesting" || flowStep === "paying" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Code2 className="w-5 h-5" />
                {stacksConnected
                  ? "Create Invoice via API"
                  : "Connect Wallet First"}
              </>
            )}
          </button>

          {/* Flow Status */}
          <AnimatePresence>
            {stepInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl bg-sidebar ${stepInfo.color}`}
                >
                  <stepInfo.icon
                    className={`w-5 h-5 ${
                      flowStep === "paying" || flowStep === "requesting"
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  <span className="font-medium">{stepInfo.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result && flowStep === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 p-6 rounded-2xl bg-green-500/10 border border-green-500/20"
              >
                <h3 className="font-bold text-lg mb-4 text-green-500">
                  ✅ Invoice Created Successfully!
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Invoice ID</span>
                    <code className="font-mono text-xs">
                      {result.id.slice(0, 16)}...
                    </code>
                  </div>
                  {result.txId && (
                    <div className="flex justify-between">
                      <span className="text-muted">Payment TX</span>
                      <a
                        href={`https://explorer.stacks.co/txid/${result.txId}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange hover:underline flex items-center gap-1"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="mt-4 w-full py-3 rounded-xl border border-border-subtle hover:bg-sidebar transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy Payment URL"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-2xl bg-sidebar border border-border-subtle"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-orange" />
            How x402 Works
          </h3>
          <ol className="space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>Client sends API request without payment</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>Server responds with HTTP 402 and payment details</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>
                Client signs STX transaction and retries with X-PAYMENT header
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold flex items-center justify-center">
                4
              </span>
              <span>Server settles payment via facilitator, returns data</span>
            </li>
          </ol>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
