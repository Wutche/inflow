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
        return "text-green-600 bg-green-50 border-green-100";
      case "pending":
        return "text-orange-600 bg-orange-50 border-orange-100";
      case "overdue":
      case "expired":
        return "text-red-600 bg-red-50 border-red-100";
      default:
        return "text-muted bg-gray-50 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle2 size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "overdue":
      case "expired":
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

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
            className="fixed inset-0 bg-overlay/40 backdrop-blur-sm z-150 cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-151 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-card border border-border-subtle rounded-[32px] overflow-hidden pointer-events-auto relative dark:shadow-dark-sleek"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 transition-colors text-muted hover:text-foreground cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="pt-8 sm:pt-10 px-5 sm:px-8 pb-6 sm:pb-8 max-h-[85vh] overflow-y-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                      Invoice
                    </div>
                    <div className="text-lg sm:text-xl font-bold tracking-tight font-mono">
                      {invoice.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full border text-[10px] font-bold ${getStatusColor(displayStatus)}`}
                  >
                    {getStatusIcon(displayStatus)}
                    {displayStatus.toUpperCase()}
                  </div>
                </div>

                {/* Amount Section */}
                <div className="bg-sidebar rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-6 sm:mb-10 text-center border border-border-subtle">
                  <div className="text-muted text-xs font-semibold mb-2">
                    Amount Due
                  </div>
                  <div className="text-3xl sm:text-5xl font-black tracking-tight text-brand-blue flex items-center justify-center gap-2">
                    {invoice.amount}
                    <span className="text-base sm:text-lg font-bold text-muted opacity-50">
                      {invoice.token}
                    </span>
                  </div>
                </div>

                {/* Detailed Info */}
                <div className="space-y-6">
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
                        <CheckCircle2 size={14} className="text-green-600" />
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

                {/* Footer Action / Status Banner */}
                <div className="mt-6 sm:mt-10 space-y-2 sm:space-y-3">
                  {invoice.status === "paid" ? (
                    <>
                      <div className="w-full py-3 sm:py-4 bg-green-50 border border-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-green-700 font-bold text-xs sm:text-sm">
                        <CheckCircle2
                          size={16}
                          className="sm:w-[18px] sm:h-[18px]"
                        />
                        This invoice has been paid
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
                          className="w-full py-3 sm:py-4 bg-black text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-black/90 transition-all cursor-pointer dark:shadow-xl dark:shadow-black/10"
                        >
                          View Transaction →
                        </a>
                      )}
                    </>
                  ) : (
                    <a
                      href={invoice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 sm:py-4 bg-black text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-black/90 transition-all dark:shadow-xl dark:shadow-black/10 cursor-pointer"
                    >
                      Open Payment Link
                    </a>
                  )}
                </div>
              </div>

              {/* Sophisticated Glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-orange/3 rounded-full blur-[100px] -z-10" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-blue/3 rounded-full blur-[100px] -z-10" />
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
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className="flex items-center gap-2 text-right">
        {icon}
        {isNetwork && (
          <div
            className={`w-2 h-2 rounded-full ${value.toLowerCase() === "stacks" ? "bg-[#5546FF]" : "bg-[#627EEA]"}`}
          />
        )}
        <div
          className={`text-sm font-bold ${isMono ? "font-mono" : ""} ${isNetwork ? "tracking-tight" : ""}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
