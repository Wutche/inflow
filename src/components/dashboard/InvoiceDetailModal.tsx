"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { HistoryItem } from "@/hooks/useInvoiceHistory";

interface InvoiceDetailModalProps {
  invoice: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncate wallet address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const displayStatus =
    invoice.status === "expired" ? "overdue" : invoice.status;
  const networkDisplay = invoice.network === "stacks" ? "Stacks" : "Ethereum";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-green-600 bg-green-500/10 border-green-500/20";
      case "pending":
        return "text-brand-orange bg-brand-orange/10 border-brand-orange/20";
      case "overdue":
      case "expired":
        return "text-red-600 bg-red-500/10 border-red-500/20";
      default:
        return "text-muted bg-white/5 border-white/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle2 size={14} />;
      case "pending":
        return <Clock size={14} />;
      case "overdue":
      case "expired":
        return <AlertCircle size={14} />;
      default:
        return null;
    }
  };

  const isStacks = invoice.network === "stacks";
  const networkColorClass = isStacks ? "text-brand-orange" : "text-brand-blue";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-overlay/60 backdrop-blur-md z-150 cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-151 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-card border border-border-subtle rounded-[40px] overflow-hidden pointer-events-auto relative shadow-2xl dark:shadow-dark-sleek"
            >
              {/* Close Button - Moved further right/top and refined */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-muted hover:text-foreground cursor-pointer z-50 group"
              >
                <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>

              <div className="pt-14 sm:pt-16 px-6 sm:px-10 pb-8 sm:pb-10 max-h-[85vh] overflow-y-auto">
                {/* Header Section - Pushing status badge down a bit to clear close button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
                  <div>
                    <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">
                      Invoice
                    </div>
                    <div className="text-xl sm:text-2xl font-black tracking-tighter font-mono">
                      #{invoice.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black tracking-widest ${getStatusColor(displayStatus)}`}
                    >
                      {getStatusIcon(displayStatus)}
                      {displayStatus.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="bg-sidebar/40 rounded-[32px] p-8 sm:p-12 mb-8 sm:mb-12 text-center border border-border-subtle relative group overflow-hidden">
                  <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-3 relative z-10">
                    Amount Due
                  </div>
                  <div className={`text-4xl sm:text-6xl font-black tracking-tighter ${networkColorClass} flex items-center justify-center gap-3 relative z-10`}>
                    {invoice.amount}
                    <span className="text-base sm:text-xl font-bold text-muted opacity-40">
                      {invoice.token}
                    </span>
                  </div>
                </div>

                {/* Detailed Info */}
                <div className="space-y-1">
                  <DetailRow
                    label="Recipient"
                    value={truncateAddress(invoice.recipient)}
                    isMono
                  />
                  <DetailRow
                    label="Created"
                    value={formatDate(invoice.date)}
                    icon={<Clock size={14} className="text-muted" />}
                  />
                  <DetailRow
                    label="Settled on Network"
                    value={networkDisplay}
                    isNetwork
                  />
                  {invoice.paidAt && (
                    <DetailRow
                      label="Paid At"
                      value={formatDate(invoice.paidAt)}
                      icon={
                        <CheckCircle2 size={14} className="text-green-500" />
                      }
                    />
                  )}
                  {invoice.paidTxHash && (
                    <DetailRow
                      label="Transaction"
                      value={`${invoice.paidTxHash.slice(0, 10)}...`}
                      isMono
                    />
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-10 sm:mt-14">
                  {invoice.status === "paid" ? (
                    <div className="space-y-4">
                      <div className="w-full py-4 sm:py-5 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-center justify-center gap-3 text-green-500 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                        <CheckCircle2 size={18} />
                        Invoice Settled Successfully
                      </div>
                      {invoice.paidTxHash && (
                        <a
                          href={
                            invoice.network === "stacks"
                              ? `https://explorer.stacks.co/txid/${invoice.paidTxHash}?chain=testnet`
                              : `https://sepolia.etherscan.io/tx/${invoice.paidTxHash}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 sm:py-5 bg-foreground text-background rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-xl shadow-black/10"
                        >
                          View Blockchain Receipt
                        </a>
                      )}
                    </div>
                  ) : (
                    <a
                      href={invoice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-4 sm:py-5 bg-foreground text-background rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-xl shadow-black/10`}
                    >
                      Open Payment Link
                    </a>
                  )}
                </div>
              </div>

              {/* Sophisticated Glows */}
              <div className={`absolute -top-20 -right-20 w-64 h-64 ${isStacks ? 'bg-brand-orange/5' : 'bg-brand-blue/5'} rounded-full blur-[100px] -z-10`} />
              <div className={`absolute -bottom-20 -left-20 w-64 h-64 ${isStacks ? 'bg-brand-blue/5' : 'bg-brand-orange/5'} rounded-full blur-[100px] -z-10`} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailRow({
  label,
  value,
  isMono,
  icon,
  isNetwork,
}: {
  label: string;
  value: string;
  isMono?: boolean;
  icon?: React.ReactNode;
  isNetwork?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-2.5 text-right">
        {icon}
        {isNetwork && (
          <div
            className={`w-1.5 h-1.5 rounded-full ${value.toLowerCase() === "stacks" ? "bg-brand-orange shadow-[0_0_8px_rgba(255,138,0,0.5)]" : "bg-brand-blue shadow-[0_0_8px_rgba(0,209,255,0.5)]"}`}
          />
        )}
        <div
          className={`text-[11px] font-black text-foreground ${isMono ? "font-mono" : ""} ${isNetwork ? "tracking-tight" : "uppercase tracking-tighter"}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
