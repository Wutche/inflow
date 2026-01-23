"use client";

import { useState, useCallback } from "react";
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
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPaymentUrl } from "@/lib/url-state";
import { RecentInvoices } from "@/components/RecentInvoices";
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory";
import { sendInvoiceEmail, isValidEmail } from "@/lib/email";
import { useNotifications } from "@/hooks/useNotifications";
import { useWallet } from "@/context/WalletContext";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { ethAddress, stacksAddress, ethTruncatedAddress, stacksTruncatedAddress } = useWallet();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, price: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [network, setNetwork] = useState("Stacks");
  const [receivingNetwork, setReceivingNetwork] = useState("Ethereum");
  const [isCustomReceivingNetwork, setIsCustomReceivingNetwork] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

   // Form fields for invoice encoding
  const [clientWallet, setClientWallet] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceMemo, setInvoiceMemo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(""); // ISO date string from date picker

  // Auto-fill wallet address based on network
  const connectedReceivingAddress = receivingNetwork === "Ethereum" ? ethAddress : stacksAddress;

  const handleUseConnectedWallet = () => {
    if (connectedReceivingAddress) {
      setClientWallet(connectedReceivingAddress);
    }
  };

  // History hook for persisting generated invoices
  const { saveInvoice } = useInvoiceHistory();
  
  // Notifications hook
  const { addNotification } = useNotifications();

  // Email state
  const [clientEmail, setClientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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
    const targetNetworkParam = receivingNetwork.toLowerCase() as "stacks" | "ethereum";

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
        targetNetwork: targetNetworkParam,
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

      // Create notification for the new invoice
      addNotification(
        "invoice_created",
        "Invoice Created",
        `New invoice for $${calculateSubtotal().toFixed(2)} ${tokenSymbol} generated`
      );
    }, 800);
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  /**
   * Sends the invoice via email to the client.
   */
  const sendEmail = useCallback(async () => {
    if (!generatedLink || !clientEmail) return;

    // Validate email
    if (!isValidEmail(clientEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSent(false);

    const tokenSymbol = network === "Stacks" ? "USDCx" : "USDC";
    const networkParam = network.toLowerCase() as "stacks" | "ethereum";

    const result = await sendInvoiceEmail({
      to_email: clientEmail,
      amount: calculateSubtotal().toFixed(2),
      token: tokenSymbol,
      recipient: clientWallet,
      network: networkParam,
      pay_link: generatedLink,
      memo: invoiceMemo || undefined,
    });

    setIsSendingEmail(false);

    if (result.success) {
      setEmailSent(true);
      addNotification(
        "invoice_sent",
        "Invoice Sent",
        `Invoice emailed to ${clientEmail}`
      );
      // Reset after 3 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 3000);
    } else {
      setEmailError(result.message);
    }
  }, [generatedLink, clientEmail, network, clientWallet, invoiceMemo, addNotification, calculateSubtotal]);

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
              className="bg-card border border-border-subtle rounded-[40px] overflow-hidden dark:shadow-dark-sleek"
            >
              {/* Header Info */}
              <div className="p-10 border-b border-border-subtle bg-sidebar/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                      Billing Information
                    </label>
                    <input
                      type="text"
                      placeholder="Client or Project Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-6 py-4 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                      required
                    />
                    <div className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                         <label className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                           Your Receiving Wallet ({receivingNetwork})
                         </label>
                         {connectedReceivingAddress && (
                           <button 
                             type="button" 
                             onClick={handleUseConnectedWallet}
                             className={`text-[9px] font-black ${network === "Stacks" ? "text-brand-blue" : "text-brand-orange"} uppercase tracking-tight hover:underline cursor-pointer whitespace-nowrap`}
                           >
                             Use Connected
                           </button>
                         )}
                       </div>
                      <input
                        type="text"
                        placeholder={`Address to receive funds on ${receivingNetwork}`}
                        value={clientWallet}
                        onChange={(e) => setClientWallet(e.target.value)}
                        className="w-full px-6 py-4 bg-sidebar border border-border-subtle rounded-2xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                        required
                      />
                    </div>
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
                        className="w-full pl-14 pr-6 py-4 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all uppercase tracking-tight"
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
                        className="w-full pl-14 pr-6 py-4 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
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
                      className="w-full pl-14 pr-6 py-4 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
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
                            className="w-full px-6 py-4 bg-sidebar/50 border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all group-hover:bg-card dark:group-hover:bg-sidebar"
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
                            className="w-full px-4 py-4 bg-sidebar/50 border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all text-center group-hover:bg-card dark:group-hover:bg-sidebar"
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
                            className="w-full pl-8 pr-4 py-4 bg-sidebar/50 border border-border-subtle rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all group-hover:bg-card dark:group-hover:bg-sidebar"
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
              <div className="px-10 py-10 border-t border-border-subtle bg-sidebar/10">
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
              className="bg-card border border-border-subtle rounded-[32px] p-8 dark:shadow-dark-sleek"
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">
                    Payer Uses (Source)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNetwork("Stacks");
                        if (!isCustomReceivingNetwork) setReceivingNetwork("Ethereum");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        network === "Stacks"
                          ? "bg-brand-orange/5 border-brand-orange text-brand-orange"
                          : "bg-sidebar border-border-subtle text-muted hover:border-sidebar-hover dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xs font-bold">Stacks</span>
                      {network === "Stacks" && <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNetwork("Ethereum");
                        if (!isCustomReceivingNetwork) setReceivingNetwork("Stacks");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        network === "Ethereum"
                          ? "bg-brand-blue/5 border-brand-blue text-brand-blue"
                          : "bg-sidebar border-border-subtle text-muted hover:border-sidebar-hover dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xs font-bold">Ethereum</span>
                      {network === "Ethereum" && <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">
                    You Receive (Settlement)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReceivingNetwork("Stacks");
                        setIsCustomReceivingNetwork(true);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        receivingNetwork === "Stacks"
                          ? "bg-brand-orange/5 border-brand-orange text-brand-orange"
                          : "bg-sidebar border-border-subtle text-muted hover:border-sidebar-hover dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xs font-bold">USDCx</span>
                      {receivingNetwork === "Stacks" && <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceivingNetwork("Ethereum");
                        setIsCustomReceivingNetwork(true);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        receivingNetwork === "Ethereum"
                          ? "bg-brand-blue/5 border-brand-blue text-brand-blue"
                          : "bg-sidebar border-border-subtle text-muted hover:border-sidebar-hover dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xs font-bold">USDC</span>
                      {receivingNetwork === "Ethereum" && <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                  Transaction Path
                </h4>
                <div className="bg-sidebar/50 rounded-2xl p-5 border border-border-subtle space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest">Payer Sends</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${network === "Stacks" ? "bg-brand-orange" : "bg-brand-blue"}`} />
                        <p className="text-xs font-black">{network}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      {network === receivingNetwork ? (
                        <div className="text-[8px] font-bold text-muted rotate-90 whitespace-nowrap">LOCAL</div>
                      ) : (
                        <Zap size={10} className="text-brand-orange animate-pulse" />
                      )}
                      <div className="w-px h-6 bg-linear-to-b from-border-subtle via-brand-orange/40 to-border-subtle my-1" />
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest">You Receive</p>
                      <div className="flex items-center gap-2 justify-end">
                        <p className="text-xs font-black">{receivingNetwork}</p>
                        <div className={`w-2 h-2 rounded-full ${receivingNetwork === "Stacks" ? "bg-brand-orange" : "bg-brand-blue"}`} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex gap-3">
                      {network === receivingNetwork ? (
                         <div className="w-3 h-3 rounded-full bg-muted/20 flex items-center justify-center shrink-0 mt-0.5">
                           <div className="w-1 h-1 rounded-full bg-muted" />
                         </div>
                      ) : (
                        <ShieldCheck size={12} className="text-brand-orange shrink-0 mt-0.5" />
                      )}
                      <p className="text-[9px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                        {network === receivingNetwork 
                          ? "Direct settlement on the same network. No bridge protocol required."
                          : "xReserve protocol handles the cross-chain liquidity & settlement automatically."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-5 bg-sidebar/50 rounded-2xl border border-dashed border-border-subtle flex items-start gap-3">
                <Zap
                  size={14}
                  className="text-brand-orange shrink-0 mt-0.5"
                />
                <p className="text-[10px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                  Invoices are secured by Bitcoin finality via xReserve smart
                  contracts.
                </p>
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
                className="w-full py-5 bg-black text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-white/90 dark:shadow-2xl dark:shadow-black/20"
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
                className="w-full py-5 bg-card border border-border-subtle text-muted rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-sidebar-hover transition-all cursor-pointer"
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
                className="fixed inset-0 bg-overlay/40 backdrop-blur-sm z-200 cursor-pointer"
                onClick={() => setGeneratedLink(null)}
              />
              <div className="fixed inset-0 flex items-center justify-center z-201 pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-lg bg-card border border-border-subtle rounded-[24px] sm:rounded-[40px] pointer-events-auto overflow-y-auto scrollbar-hide max-h-[90vh] text-center p-6 sm:p-10 md:p-12 relative dark:shadow-2xl"
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
                      <button className="flex items-center justify-center gap-3 py-4 bg-card border border-border-subtle rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest hover:text-foreground hover:bg-sidebar-hover transition-all cursor-pointer">
                        <Share2 size={16} />
                        Share Link
                      </button>
                      <button
                        onClick={() => setGeneratedLink(null)}
                        className="flex items-center justify-center gap-3 py-4 bg-card border border-border-subtle rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest hover:text-foreground hover:bg-sidebar-hover transition-all cursor-pointer"
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
                          className="w-28 h-28 sm:w-40 sm:h-40 rounded-lg sm:rounded-xl border border-border-subtle bg-white p-2"
                        />
                        <p className="text-[10px] sm:text-xs text-muted mt-2 font-medium">
                          Scan to pay
                        </p>
                      </div>
                    )}

                    {/* Email Invoice Section */}
                    <div className="mt-6 pt-6 border-t border-border-subtle">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Mail size={14} className="text-muted" />
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                          Send via Email
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => {
                            setClientEmail(e.target.value);
                            setEmailError(null);
                          }}
                          placeholder="client@email.com"
                          disabled={isSendingEmail || emailSent}
                          className={`flex-1 px-4 py-3 rounded-xl border text-sm text-center ${
                            emailError 
                              ? "border-red-500" 
                              : emailSent 
                                ? "border-green-500 bg-green-50"
                                : "border-border-subtle"
                          } bg-sidebar focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all disabled:opacity-50`}
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: isSendingEmail || emailSent ? 1 : 1.02 }}
                          whileTap={{ scale: isSendingEmail || emailSent ? 1 : 0.98 }}
                          onClick={sendEmail}
                          disabled={!clientEmail || isSendingEmail || emailSent}
                          className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            emailSent
                              ? "bg-green-500 text-white"
                              : "bg-brand-orange text-white hover:bg-brand-orange/90"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isSendingEmail ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : emailSent ? (
                            <Check size={16} />
                          ) : (
                            <Send size={16} />
                          )}
                          <span className="text-xs font-black uppercase tracking-widest">
                            {isSendingEmail ? "Sending" : emailSent ? "Sent!" : "Send"}
                          </span>
                        </motion.button>
                      </div>
                      
                      {emailError && (
                        <p className="mt-2 text-xs text-red-500 text-center">{emailError}</p>
                      )}
                      
                      {emailSent && (
                        <p className="mt-2 text-xs text-green-600 text-center">
                          ✓ Invoice sent to {clientEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-subtle">
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
