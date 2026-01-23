"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Copy, Check, FileText, Trash2 } from "lucide-react";
import { useInvoiceHistory, HistoryItem } from "@/hooks/useInvoiceHistory";
import { Toast } from "@/components/ui/Toast";

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
function InvoiceItem({
  item,
  onCopy,
}: {
  item: HistoryItem;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(item.link);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = item.link;
        // Ensure textarea doesn't cause a scroll jump
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [item.link, onCopy]
  );

  const isStacks = item.network === "stacks";
  const networkColorClass = isStacks ? "text-brand-orange" : "text-brand-blue";
  const networkBgClass = isStacks ? "bg-brand-orange/5" : "bg-brand-blue/5";
  const networkBorderClass = isStacks ? "border-brand-orange/10" : "border-brand-blue/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 py-2 px-3 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group overflow-hidden active:scale-[0.99] cursor-pointer"
      onClick={copyLink}
    >
      {/* 1. Icon - Network Accented Container */}
      <div className={`w-7 h-7 rounded-lg ${networkBgClass} flex items-center justify-center shrink-0 border ${networkBorderClass}`}>
        <FileText
          size={12}
          className={
            item.status === "paid"
              ? "text-green-500/80"
              : item.status === "expired"
                ? "text-red-500/80"
                : `${networkColorClass}/80`
          }
        />
      </div>

      {/* 2. Amount Focus - Network Colored */}
      <div className="flex flex-col shrink-0">
        <span className={`text-xs font-bold tracking-tight ${networkColorClass} leading-none mb-0.5`}>
          {item.amount}
        </span>
        <span className={`text-[9px] ${networkColorClass} font-black uppercase tracking-wider leading-none opacity-80`}>
          {item.token}
        </span>
      </div>

      {/* 3. Identifier (Truncated) */}
      <span className={`text-[10px] text-muted-foreground font-mono truncate px-3 border-l ${networkBorderClass} ml-1 opacity-70`}>
        {truncateAddress(item.recipient)}
      </span>

      {/* 4. Status/Action Strip */}
      <div className="flex items-center justify-end min-w-[50px] relative h-full">
        {/* Default View: Time (Dot Removed) */}
        <div className="flex items-center gap-2 group-hover:opacity-0 transition-all duration-300">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter tabular-nums">
            {formatRelativeTime(item.date)
              .replace(" ago", "")
              .replace("Just now", "now")}
          </span>
        </div>

        {/* Hover View: Action Trigger */}
        <div className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyLink}
            type="button"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              copied
                ? "text-green-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span className="sr-only">Copy</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Widget displaying the 5 most recent generated invoices.
 * Reads from localStorage via useInvoiceHistory hook.
 */
export function RecentInvoices() {
  const { history, isLoaded, clearHistory } = useInvoiceHistory();
  const [showToast, setShowToast] = useState(false);

  const handleCopy = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Show only the 5 most recent
  const recentInvoices = history.slice(0, 5);

  // Don't render anything until localStorage is loaded (SSR safety)
  if (!isLoaded) {
    return (
      <div className="bg-card rounded-3xl border border-border-subtle dark:shadow-dark-sleek p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-sidebar rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-sidebar/50 rounded-xl" />
            <div className="h-12 bg-sidebar/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-3xl border border-border-subtle dark:shadow-dark-sleek p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted" />
            <h3 className="text-sm font-bold">Recent Invoices</h3>
          </div>

          {recentInvoices.length > 0 && (
            <button
              onClick={clearHistory}
              type="button"
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
              <InvoiceItem key={item.id} item={item} onCopy={handleCopy} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-sidebar flex items-center justify-center border border-border-subtle">
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

      <Toast
        message="Invoice link copied to clipboard"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}
