"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Command,
  Clock,
  ArrowRight,
  Zap,
  FileText,
  ArrowLeftRight,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceHistory, HistoryItem } from "@/hooks/useInvoiceHistory";
import { useBridgeHistory, BridgeTransaction } from "@/hooks/useBridgeHistory";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Unified search result type
interface SearchResult {
  id: string;
  type: "invoice" | "bridge";
  label: string;
  detail: string;
  link?: string;
  data: HistoryItem | BridgeTransaction;
}

// Quick actions configuration
const quickActions = [
  {
    label: "Create New Invoice",
    icon: FileText,
    shortcut: "N",
    href: "/dashboard/invoices/new",
  },
  {
    label: "Bridge Assets",
    icon: ArrowLeftRight,
    shortcut: "B",
    href: "/dashboard/bridge",
  },
  {
    label: "View Invoices",
    icon: DollarSign,
    shortcut: "I",
    href: "/dashboard/invoices",
  },
];

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Helper to format amount
function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper to get status display
function getStatusDisplay(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
    case "confirmed":
      return "Paid";
    case "pending":
      return "Pending";
    case "expired":
    case "failed":
      return "Expired";
    default:
      return status;
  }
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && <SearchContent onClose={onClose} />}
    </AnimatePresence>
  );
}

function SearchContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { history: invoices } = useInvoiceHistory();
  const { transactions: bridges } = useBridgeHistory();

  // Combine and transform data into unified search results
  const allItems = useMemo((): SearchResult[] => {
    const invoiceResults: SearchResult[] = invoices.map((inv, idx) => ({
      id: inv.id,
      type: "invoice" as const,
      label: `Invoice INV-${String(idx + 1).padStart(3, "0")}`,
      detail: `${getStatusDisplay(inv.status)} • ${formatAmount(inv.amount)}`,
      link: inv.link,
      data: inv,
    }));

    const bridgeResults: SearchResult[] = bridges.map((tx) => ({
      id: tx.id,
      type: "bridge" as const,
      label: `Bridge ${tx.route}`,
      detail: `${tx.status} • ${formatRelativeTime(tx.timestamp)}`,
      data: tx,
    }));

    // Sort by most recent (combine both, sort by date descending)
    return [...invoiceResults, ...bridgeResults].sort((a, b) => {
      const dateA =
        a.type === "invoice"
          ? new Date((a.data as HistoryItem).date)
          : new Date((a.data as BridgeTransaction).timestamp);
      const dateB =
        b.type === "invoice"
          ? new Date((b.data as HistoryItem).date)
          : new Date((b.data as BridgeTransaction).timestamp);
      return dateB.getTime() - dateA.getTime();
    });
  }, [invoices, bridges]);

  // Filter results based on query
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      // Show recent activity (top 5)
      return allItems.slice(0, 5);
    }

    const lowerQuery = query.toLowerCase().trim();

    return allItems.filter((item) => {
      // Search in label
      if (item.label.toLowerCase().includes(lowerQuery)) return true;

      // Search in detail
      if (item.detail.toLowerCase().includes(lowerQuery)) return true;

      // Search in specific fields
      if (item.type === "invoice") {
        const inv = item.data as HistoryItem;
        if (inv.recipient.toLowerCase().includes(lowerQuery)) return true;
        if (inv.amount.includes(lowerQuery)) return true;
        if (inv.token.toLowerCase().includes(lowerQuery)) return true;
        if (inv.network.toLowerCase().includes(lowerQuery)) return true;
      } else {
        const tx = item.data as BridgeTransaction;
        if (tx.txHash.toLowerCase().includes(lowerQuery)) return true;
        if (tx.recipientAddress.toLowerCase().includes(lowerQuery)) return true;
        if (tx.amount.includes(lowerQuery)) return true;
        if (tx.route.toLowerCase().includes(lowerQuery)) return true;
      }

      return false;
    });
  }, [query, allItems]);

  // Filter quick actions based on query
  const filteredQuickActions = useMemo(() => {
    if (!query.trim()) return quickActions;

    const lowerQuery = query.toLowerCase().trim();
    return quickActions.filter((action) =>
      action.label.toLowerCase().includes(lowerQuery),
    );
  }, [query]);

  // Total navigable items
  const totalItems = searchResults.length + filteredQuickActions.length;

  // Handle selection of an item
  const handleSelect = useCallback(
    (index: number) => {
      if (index < searchResults.length) {
        // Selected a search result
        const result = searchResults[index];
        if (result.type === "invoice") {
          // Navigate to invoices page
          router.push("/dashboard/invoices");
        } else {
          // Navigate to bridge page
          router.push("/dashboard/bridge");
        }
      } else {
        // Selected a quick action
        const actionIndex = index - searchResults.length;
        const action = filteredQuickActions[actionIndex];
        if (action) {
          router.push(action.href);
        }
      }
      onClose();
    },
    [searchResults, filteredQuickActions, router, onClose],
  );

  // Handle click on result item
  const handleResultClick = (index: number) => {
    handleSelect(index);
  };

  // Handle click on quick action
  const handleQuickActionClick = (href: string) => {
    router.push(href);
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(selectedIndex);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, totalItems, handleSelect, onClose]);

  // Handle keyboard shortcuts for quick actions
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const action = quickActions.find(
          (a) => a.shortcut.toLowerCase() === e.key.toLowerCase(),
        );
        if (action) {
          e.preventDefault();
          router.push(action.href);
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [router, onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-200 cursor-pointer"
      />
      <div className="fixed inset-0 flex items-start justify-center z-201 pointer-events-none pt-[15vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl bg-card border border-border-subtle rounded-[32px] overflow-hidden pointer-events-auto dark:shadow-dark-sleek"
        >
          <div className="relative">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-muted"
              size={20}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search invoices, transactions, or type a command..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full pl-16 pr-12 py-6 text-lg font-bold bg-card text-foreground focus:outline-none placeholder:text-muted/50 transition-colors"
            />
            <button
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-sidebar-hover text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 bg-sidebar/50 border-t border-border-subtle max-h-[60vh] overflow-y-auto">
            {/* Search Results / Recent Activity */}
            {(searchResults.length > 0 || allItems.length === 0) && (
              <div className="mb-6">
                <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
                  <Clock size={12} />
                  {query.trim()
                    ? `Search Results (${searchResults.length})`
                    : "Recent Activity"}
                </h3>
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(idx)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group cursor-pointer border ${
                          selectedIndex === idx
                            ? "bg-card border-brand-orange/30"
                            : "border-transparent hover:bg-card hover:border-border-subtle dark:hover:bg-sidebar-hover"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-lg bg-sidebar border border-border-subtle flex items-center justify-center transition-colors ${
                              selectedIndex === idx
                                ? "text-brand-orange"
                                : "text-muted group-hover:text-brand-orange"
                            }`}
                          >
                            {item.type === "invoice" ? (
                              <FileText size={16} />
                            ) : (
                              <ArrowLeftRight size={16} />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-muted font-medium uppercase tracking-tight">
                              {item.detail}
                            </div>
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className={`text-muted transition-all ${
                            selectedIndex === idx
                              ? "opacity-100 translate-x-0"
                              : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-sidebar border border-border-subtle flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-muted" />
                    </div>
                    <p className="text-sm text-muted font-medium">
                      {query.trim() ? "No results found" : "No recent activity"}
                    </p>
                    <p className="text-xs text-muted/70 mt-1">
                      {query.trim()
                        ? "Try a different search term"
                        : "Create an invoice or bridge assets to get started"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {filteredQuickActions.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
                  <Zap size={12} />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredQuickActions.map((action, idx) => {
                    const absoluteIndex = searchResults.length + idx;
                    return (
                      <button
                        key={action.label}
                        onClick={() => handleQuickActionClick(action.href)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card border transition-all group cursor-pointer dark:hover:bg-sidebar-hover ${
                          selectedIndex === absoluteIndex
                            ? "border-brand-orange/30"
                            : "border-border-subtle hover:border-brand-orange/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-orange/5 flex items-center justify-center text-brand-orange">
                            <action.icon size={16} />
                          </div>
                          <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground">
                            {action.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-sidebar rounded-lg text-[10px] font-black text-muted group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors border border-border-subtle">
                          <Command size={10} />
                          <span>{action.shortcut}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle bg-sidebar flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-sidebar-hover border border-border-subtle rounded-md">
                  ↵
                </kbd>{" "}
                to select
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-sidebar-hover border border-border-subtle rounded-md">
                  ↑↓
                </kbd>{" "}
                to navigate
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-orange">
              <Zap size={12} />
              <span>Powered by Inflow AI</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
