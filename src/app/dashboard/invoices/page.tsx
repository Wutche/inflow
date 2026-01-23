"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InvoiceDetailModal } from "@/components/dashboard/InvoiceDetailModal";
import { Toast } from "@/components/ui/Toast";
import {
  Search,
  Filter,
  Plus,
  Copy,
  ExternalLink,
  ChevronDown,
  FileText,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useInvoiceHistory, HistoryItem } from "@/hooks/useInvoiceHistory";

// Status filter options
type StatusFilter = "all" | "pending" | "paid" | "expired";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "expired", label: "Overdue" },
];

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

/**
 * Generate a short display ID from UUID
 */
function getDisplayId(uuid: string, index: number): string {
  return `INV-${String(index + 1).padStart(3, "0")}`;
}

/**
 * Map status to display format
 */
function getDisplayStatus(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "expired":
      return "Overdue";
    default:
      return "Pending";
  }
}

export default function InvoicesPage() {
  const { history: invoices } = useInvoiceHistory();
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<HistoryItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter invoices based on search query and status filter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Status filter
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }

      // Search filter (case-insensitive)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          invoice.recipient.toLowerCase(),
          invoice.amount.toLowerCase(),
          invoice.token.toLowerCase(),
          invoice.network.toLowerCase(),
          invoice.status.toLowerCase(),
          invoice.id.toLowerCase(),
        ];

        // Check if any field contains the search query
        return searchableFields.some((field) => field.includes(query));
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Get the current filter label
  const currentFilterLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ||
    "All Status";

  const handleCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setIsToastVisible(true);
      setTimeout(() => setIsToastVisible(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleOpenDetail = (invoice: HistoryItem) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-green-600 bg-green-500/10 border-green-500/20 dark:text-green-400";
      case "pending":
        return "text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-400";
      case "overdue":
      case "expired":
        return "text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400";
      default:
        return "text-muted bg-sidebar border-border-subtle";
    }
  };

  // Check if we have active filters
  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  return (
    <DashboardLayout
      title="Invoices"
      subtitle="Manage your invoices and track payments"
    >
      <div className="space-y-8">
        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-96">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-border-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all dark:bg-card dark:border-border-subtle dark:text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-sidebar-hover text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-5 py-3 bg-card border rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter !== "all"
                    ? "border-brand-orange/30 text-brand-orange"
                    : "border-border-subtle text-foreground hover:bg-sidebar-hover"
                }`}
              >
                <Filter
                  size={18}
                  className={
                    statusFilter !== "all" ? "text-brand-orange" : "text-muted"
                  }
                />
                <span>{currentFilterLabel}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isFilterOpen ? "rotate-180" : ""} ${statusFilter !== "all" ? "text-brand-orange" : "text-muted"}`}
                />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border-subtle rounded-2xl overflow-hidden z-50 dark:shadow-lg"
                  >
                    <div className="p-2">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(option.value);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                            statusFilter === option.value
                              ? "bg-brand-orange/10 text-brand-orange"
                              : "text-foreground hover:bg-sidebar-hover"
                          }`}
                        >
                          <span>{option.label}</span>
                          {statusFilter === option.value && (
                            <Check size={16} className="text-brand-orange" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
            <button className="flex items-center gap-2 px-10 py-3.5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-black/90 transition-all cursor-pointer w-full justify-center whitespace-nowrap active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-white/90 dark:shadow-none">
              <Plus size={18} />
              <span>New Invoice</span>
            </button>
          </Link>
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && filteredInvoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-2 bg-brand-orange/5 border border-brand-orange/20 rounded-xl"
          >
            <span className="text-sm font-medium text-muted">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </span>
            <button
              onClick={clearFilters}
              className="text-sm font-bold text-brand-orange hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* Invoices Table or Empty State */}
        {invoices.length === 0 ? (
          /* Empty State - No invoices at all */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border-subtle rounded-[32px] p-16 text-center dark:shadow-dark-sleek"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-sidebar flex items-center justify-center border border-border-subtle">
              <FileText className="w-10 h-10 text-muted/30" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">
              No invoices yet
            </h3>
            <p className="text-muted mb-8 max-w-sm mx-auto">
              Create your first invoice to start receiving payments in crypto.
            </p>
            <Link href="/dashboard/invoices/new">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-white/90 dark:shadow-none">
                <Plus size={18} />
                <span>Create Invoice</span>
              </button>
            </Link>
          </motion.div>
        ) : filteredInvoices.length === 0 ? (
          /* Empty State - No matching invoices */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border-subtle rounded-[32px] p-16 text-center dark:shadow-dark-sleek"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-sidebar flex items-center justify-center border border-border-subtle">
              <Search className="w-10 h-10 text-muted/30" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">
              No matching invoices
            </h3>
            <p className="text-muted mb-8 max-w-sm mx-auto">
              Try adjusting your search or filter to find what you&apos;re
              looking for.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-white/90 dark:shadow-none"
            >
              <X size={18} />
              <span>Clear Filters</span>
            </button>
          </motion.div>
        ) : (
          /* Invoices Table */
          <div className="bg-card border border-border-subtle rounded-[32px] overflow-hidden dark:shadow-dark-sleek">
            {/* Desktop Table - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-sidebar border-b border-border-subtle">
                    <th className="text-left py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Invoice ID
                    </th>
                    <th className="text-left py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Recipient
                    </th>
                    <th className="text-left py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="text-left py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Status
                    </th>
                    <th className="text-left py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Network
                    </th>
                    <th className="text-left py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Created
                    </th>
                    <th className="text-right py-5 px-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredInvoices.map((invoice, idx) => {
                    // Find the original index for display ID
                    const originalIndex = invoices.findIndex(
                      (inv) => inv.id === invoice.id
                    );
                    const displayStatus = getDisplayStatus(invoice.status);
                    const networkDisplay =
                      invoice.network === "stacks" ? "Stacks" : "Ethereum";

                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-sidebar-hover transition-colors group"
                      >
                        <td className="py-5 px-6">
                          <span className="text-sm font-bold text-foreground">
                            {getDisplayId(invoice.id, originalIndex)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm font-medium text-muted font-mono">
                            {truncateAddress(invoice.recipient)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm font-bold text-foreground">
                            {invoice.amount} {invoice.token}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-black tracking-tight ${getStatusStyle(displayStatus)}`}
                          >
                            {displayStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${networkDisplay === "Stacks" ? "bg-brand-orange shadow-[0_0_8px_rgba(255,138,0,0.4)]" : "bg-brand-blue shadow-[0_0_8px_rgba(0,209,255,0.4)]"}`}
                            />
                            <span className="text-sm font-bold text-muted">
                              {networkDisplay}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm font-medium text-muted">
                            {formatDate(invoice.date)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopy(invoice.link)}
                              className="p-2 rounded-lg text-muted hover:bg-card hover:text-brand-orange hover:shadow-sm border border-transparent hover:border-border-subtle transition-all cursor-pointer dark:hover:bg-sidebar-hover"
                              title="Copy Link"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(invoice)}
                              className="p-2 rounded-lg text-muted hover:bg-card hover:text-brand-orange hover:shadow-sm border border-transparent hover:border-border-subtle transition-all cursor-pointer dark:hover:bg-sidebar-hover"
                              title="View Details"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout - shown on mobile only */}
            <div className="md:hidden divide-y divide-border-subtle">
              {filteredInvoices.map((invoice, idx) => {
                const originalIndex = invoices.findIndex(
                  (inv) => inv.id === invoice.id
                );
                const displayStatus = getDisplayStatus(invoice.status);
                const networkDisplay =
                  invoice.network === "stacks" ? "Stacks" : "Ethereum";

                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 hover:bg-sidebar-hover transition-colors"
                    onClick={() => handleOpenDetail(invoice)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-bold text-foreground">
                          {getDisplayId(invoice.id, originalIndex)}
                        </span>
                        <div className="text-xs font-medium text-muted font-mono mt-0.5">
                          {truncateAddress(invoice.recipient)}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black tracking-tight ${getStatusStyle(displayStatus)}`}
                      >
                        {displayStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-foreground">
                          {invoice.amount}
                        </span>
                        <span className="text-sm font-medium text-muted ml-1">
                          {invoice.token}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${networkDisplay === "Stacks" ? "bg-brand-orange shadow-[0_0_8px_rgba(255,138,0,0.4)]" : "bg-brand-blue shadow-[0_0_8px_rgba(0,209,255,0.4)]"}`}
                          />
                          <span className="text-xs font-medium text-muted">
                            {networkDisplay}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-muted">
                          {formatDate(invoice.date)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-sidebar border-t border-border-subtle flex items-center justify-between">
              <div className="text-xs font-bold text-muted uppercase tracking-widest">
                Showing 1-{filteredInvoices.length} of {filteredInvoices.length}{" "}
                Invoices
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-card border border-border-subtle rounded-xl text-xs font-bold text-muted transition-all opacity-50 cursor-not-allowed">
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border-subtle text-xs font-bold text-brand-orange cursor-pointer hover:bg-sidebar-hover transition-colors">
                    1
                  </button>
                </div>
                <button className="px-4 py-2 bg-card border border-border-subtle rounded-xl text-xs font-bold text-muted transition-all opacity-50 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <Toast
        message="Invoice link copied!"
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </DashboardLayout>
  );
}
