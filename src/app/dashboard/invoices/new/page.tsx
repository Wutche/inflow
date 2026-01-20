"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  ShieldCheck,
  Zap,
  Calendar,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Share2,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPaymentUrl } from "@/lib/url-state";
import { RecentInvoices } from "@/components/RecentInvoices";
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, price: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [network, setNetwork] = useState("Stacks");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form fields for invoice encoding
  const [clientWallet, setClientWallet] = useState("");
  const [invoiceMemo, setInvoiceMemo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(""); // ISO date string from date picker

  // History hook for persisting generated invoices
  const { saveInvoice } = useInvoiceHistory();

  // Generate stable invoice ID on mount using lazy state initialization
  const [defaultInvoiceId] = useState(
    () => `INV-${Date.now().toString().slice(-3).padStart(3, "0")}`,
  );

  const addItem = () => {
    setItems([
      ...items,
      { id: Math.random().toString(), description: "", quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Generate description from line items
    const itemDescriptions = items
      .filter((item) => item.description)
      .map((item) => item.description)
      .join(", ");

    // Create unique invoice ID
    const invoiceId = crypto.randomUUID();

    // Convert network to url-state format: "Stacks" -> "stacks", "Ethereum" -> "ethereum"
    const networkParam = network.toLowerCase() as "stacks" | "ethereum";

    // Create createdAt from the date picker or use current date
    const createdAt = invoiceDate
      ? new Date(invoiceDate).toISOString()
      : new Date().toISOString();

    // Create the encoded payment URL using the State-in-URL pattern
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // Use correct token based on network: USDCx for Stacks, USDC for Ethereum
    const tokenSymbol = network === "Stacks" ? "USDCx" : "USDC";
    const paymentUrl = createPaymentUrl(
      {
        invoiceId,
        recipient: clientWallet,
        amount: calculateSubtotal().toFixed(2),
        memo: invoiceMemo || itemDescriptions.slice(0, 50) || undefined,
        token: tokenSymbol,
        network: networkParam,
        createdAt,
      },
      origin,
    );

    // Simulate brief processing delay for UX
    setTimeout(async () => {
      // Generate QR code for the payment URL
      try {
        const qr = await QRCode.toDataURL(paymentUrl, {
          width: 200,
          margin: 2,
        });
        setQrCodeUrl(qr);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        setQrCodeUrl(null);
      }

      setIsSubmitting(false);
      setGeneratedLink(paymentUrl);

      // Save to local history with the same invoiceId used in the payment URL
      saveInvoice({
        id: invoiceId, // Use the same ID as in the payment URL
        recipient: clientWallet,
        amount: calculateSubtotal().toFixed(2),
        token: tokenSymbol,
        link: paymentUrl,
        network: networkParam,
      });
    }, 800);
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout
      title="Create New Invoice"
      subtitle="Issue a professional cross-chain invoice in seconds"
    >
      <div className="mt-8 mb-12 relative">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-brand-orange transition-colors group mb-6"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to Invoices</span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          {/* Main Form */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border-subtle rounded-[40px] shadow-sm overflow-hidden"
            >
              {/* Header Info */}
              <div className="p-10 border-b border-gray-50 bg-sidebar/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                      Client Information
                    </label>
                    <input
                      type="text"
                      placeholder="Client Name or Organization"
                      className="w-full px-6 py-4 bg-white border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Client Wallet Address (Stacks or ETH)"
                      value={clientWallet}
                      onChange={(e) => setClientWallet(e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-border-subtle rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                      Invoice Details
                    </label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all uppercase tracking-tight"
                        required
                      />
                    </div>
                    <div className="relative">
                      <FileText
                        size={16}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        type="text"
                        placeholder="Invoice ID (e.g. INV-001)"
                        defaultValue={defaultInvoiceId}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="relative">
                    <MessageSquare
                      size={16}
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="text"
                      placeholder="Memo / Notes (optional)"
                      value={invoiceMemo}
                      onChange={(e) => setInvoiceMemo(e.target.value)}
                      maxLength={50}
                      className="w-full pl-14 pr-6 py-4 bg-white border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                    Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 text-[10px] font-black text-brand-orange uppercase tracking-widest px-4 py-2 rounded-xl bg-brand-orange/5 border border-brand-orange/10 hover:bg-brand-orange/10 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-4 items-start group"
                      >
                        <div className="flex-4 relative">
                          <input
                            type="text"
                            placeholder="Item description..."
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            className="w-full px-6 py-4 bg-sidebar/50 border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all group-hover:bg-white"
                            required
                          />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full px-4 py-4 bg-sidebar/50 border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all text-center group-hover:bg-white"
                            required
                          />
                        </div>
                        <div className="flex-[1.5] min-w-[120px] relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">
                            $
                          </div>
                          <input
                            type="number"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full pl-8 pr-4 py-4 bg-sidebar/50 border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all group-hover:bg-white"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="mt-4 p-2 text-muted hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Summary */}
              <div className="px-10 py-10 border-t border-gray-50 bg-sidebar/10">
                <div className="flex flex-col items-end space-y-4">
                  <div className="flex items-center gap-20">
                    <span className="text-xs font-bold text-muted uppercase tracking-widest">
                      Subtotal
                    </span>
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      ${calculateSubtotal().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-20 pt-4 border-t border-dashed border-border-subtle w-full justify-end">
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest">
                      Total Amount Due
                    </span>
                    <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                      ${calculateSubtotal().toLocaleString()}
                      <span className="text-base text-muted font-bold ml-2">
                        {network === "Stacks" ? "USDCx" : "USDC"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Config */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-border-subtle rounded-[32px] p-8 shadow-sm"
            >
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">
                Payment Network
              </h3>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setNetwork("Stacks")}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    network === "Stacks"
                      ? "bg-brand-orange/5 border-brand-orange shadow-sm text-brand-orange"
                      : "bg-white border-border-subtle text-muted hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        network === "Stacks"
                          ? "bg-brand-orange text-white"
                          : "bg-sidebar text-muted"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                        className={`w-4 h-4 ${
                          network === "Stacks" ? "brightness-0 invert" : ""
                        }`}
                        alt="Stacks logo"
                      />
                    </div>
                    <span className="text-sm font-bold">Stacks Network</span>
                  </div>
                  {network === "Stacks" && (
                    <div className="w-2 h-2 rounded-full bg-brand-orange" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setNetwork("Ethereum")}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    network === "Ethereum"
                      ? "bg-brand-blue/5 border-brand-blue shadow-sm text-brand-blue"
                      : "bg-white border-border-subtle text-muted hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        network === "Ethereum"
                          ? "bg-brand-blue text-white"
                          : "bg-sidebar text-muted"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                        className={`w-4 h-4 ${
                          network === "Ethereum" ? "brightness-0 invert" : ""
                        }`}
                        alt="Ethereum logo"
                      />
                    </div>
                    <span className="text-sm font-bold">Ethereum Mainnet</span>
                  </div>
                  {network === "Ethereum" && (
                    <div className="w-2 h-2 rounded-full bg-brand-blue" />
                  )}
                </button>
              </div>

              <div className="mt-8 p-5 bg-sidebar/50 rounded-2xl border border-dashed border-border-subtle space-y-4">
                <div className="flex gap-3">
                  <Zap
                    size={14}
                    className="text-brand-orange shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                    Invoices are secured by Bitcoin finality via xReserve smart
                    contracts.
                  </p>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck
                    size={14}
                    className="text-brand-orange shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                    Platform fee: 0% for standard tiers.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-black text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Generating...</span>
                ) : (
                  <>
                    <span>Generate Invoice</span>
                    <Sparkles
                      size={18}
                      className="group-hover:scale-110 group-hover:rotate-12 transition-transform text-brand-orange"
                    />
                  </>
                )}
              </button>

              <button
                type="button"
                className="w-full py-5 bg-white border border-border-subtle text-muted rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointe"
              >
                Save as Draft
              </button>
            </motion.div>

            {/* Recent Invoices Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <RecentInvoices />
            </motion.div>
          </div>
        </form>

        {/* Success / Generated Link Overlay */}
        <AnimatePresence>
          {generatedLink && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-200 cursor-pointer"
                onClick={() => setGeneratedLink(null)}
              />
              <div className="fixed inset-0 flex items-center justify-center z-201 pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-lg bg-white border border-border-subtle rounded-[24px] sm:rounded-[40px] shadow-2xl pointer-events-auto overflow-y-auto scrollbar-hide max-h-[90vh] text-center p-6 sm:p-10 md:p-12 relative"
                >
                  {/* Decorative Glows */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl -z-10" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl -z-10" />

                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[28px] bg-brand-orange/10 flex items-center justify-center text-brand-orange mx-auto mb-4 sm:mb-8 shadow-inner">
                    <Check size={28} strokeWidth={3} className="sm:hidden" />
                    <Check
                      size={40}
                      strokeWidth={3}
                      className="hidden sm:block"
                    />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                    Invoice Generated!
                  </h3>
                  <p className="text-muted text-xs sm:text-sm font-medium mb-6 sm:mb-10 max-w-[300px] mx-auto leading-relaxed">
                    Your professional invoice is live. Share the link below with
                    your client for instant settlement.
                  </p>

                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-4 left-4 sm:left-6 flex items-center text-muted group-hover:text-brand-orange transition-colors">
                        <Globe size={16} />
                      </div>
                      <input
                        readOnly
                        value={generatedLink}
                        className="w-full pl-10 sm:pl-14 pr-28 sm:pr-32 py-4 sm:py-5 bg-sidebar border border-border-subtle rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold focus:outline-none transition-all cursor-default"
                      />
                      <button
                        onClick={handleCopy}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-3 sm:px-5 py-2 sm:py-2.5 bg-brand-orange text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand-orange/20 cursor-pointer active:scale-95 flex items-center gap-1.5 sm:gap-2"
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{isCopied ? "Copied" : "Copy Link"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button className="flex items-center justify-center gap-3 py-4 bg-white border border-border-subtle rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest hover:text-foreground hover:bg-gray-50 transition-all cursor-pointer">
                        <Share2 size={16} />
                        Share Link
                      </button>
                      <button
                        onClick={() => setGeneratedLink(null)}
                        className="flex items-center justify-center gap-3 py-4 bg-white border border-border-subtle rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest hover:text-foreground hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        <ExternalLink size={16} />
                        Preview
                      </button>
                    </div>

                    {/* QR Code Display */}
                    {qrCodeUrl && (
                      <div className="mt-4 sm:mt-6 flex flex-col items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeUrl}
                          alt="Invoice QR Code"
                          className="w-28 h-28 sm:w-40 sm:h-40 rounded-lg sm:rounded-xl border border-border-subtle"
                        />
                        <p className="text-[10px] sm:text-xs text-muted mt-2 font-medium">
                          Scan to pay
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-gray-50">
                    <button
                      onClick={() => router.push("/dashboard/invoices")}
                      className="text-[10px] font-black text-muted hover:text-brand-orange uppercase tracking-[0.2em] transition-all cursor-pointer"
                    >
                      Return to dashboard
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
