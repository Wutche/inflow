"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Copy, Check, FileText, Trash2 } from "lucide-react";
import { useInvoiceHistory, HistoryItem } from "@/hooks/useInvoiceHistory";

/**
 * Truncates an address to show first 4 and last 4 characters.
 * Example: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" -> "ST1P...ZGZGM"
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Formats a date to relative time string.
 * Examples: "2 mins ago", "1 hour ago", "3 days ago"
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Individual invoice history item component.
 */
function InvoiceItem({ item }: { item: HistoryItem }) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = item.link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [item.link]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-sidebar transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
          <FileText size={14} className="text-brand-orange" />
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-600">
              {item.amount} {item.token}
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-mono truncate">
              {truncateAddress(item.recipient)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-muted" />
              <span className="text-xs text-muted">
                {formatRelativeTime(item.date)}
              </span>
            </div>
            {/* Status Badge */}
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                item.status === "paid"
                  ? "bg-green-50 text-green-600"
                  : item.status === "expired"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-600"
              }`}
            >
              {item.status || "pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Copy Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={copyLink}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          copied
            ? "bg-green-100 text-green-700"
            : "bg-white border border-border-subtle hover:bg-gray-50 opacity-0 group-hover:opacity-100"
        }`}
      >
        {copied ? (
          <>
            <Check size={12} />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

/**
 * Widget displaying the 5 most recent generated invoices.
 * Reads from localStorage via useInvoiceHistory hook.
 */
export function RecentInvoices() {
  const { history, isLoaded, clearHistory } = useInvoiceHistory();

  // Show only the 5 most recent
  const recentInvoices = history.slice(0, 5);

  // Don't render anything until localStorage is loaded (SSR safety)
  if (!isLoaded) {
    return (
      <div className="bg-white rounded-3xl border border-border-subtle shadow-sleek p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-50 rounded-xl" />
            <div className="h-12 bg-gray-50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-border-subtle shadow-sleek p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted" />
          <h3 className="text-sm font-bold">Recent Invoices</h3>
        </div>

        {recentInvoices.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-xs text-muted hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Invoice List */}
      {recentInvoices.length > 0 ? (
        <div className="space-y-1">
          {recentInvoices.map((item) => (
            <InvoiceItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
            <FileText size={20} className="text-muted" />
          </div>
          <p className="text-sm text-muted font-medium">
            No recent invoices found.
          </p>
          <p className="text-xs text-muted mt-1">
            Generated payment links will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
