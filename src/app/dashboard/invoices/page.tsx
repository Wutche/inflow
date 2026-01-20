"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useInvoiceHistory, HistoryItem } from "@/hooks/useInvoiceHistory";

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
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                className="w-full pl-11 pr-4 py-3 bg-white border border-border-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-5 py-3 bg-white border border-border-subtle rounded-2xl text-sm font-bold text-foreground hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
              <Filter size={18} className="text-muted" />
              <span>All Status</span>
              <ChevronDown size={16} className="text-muted" />
            </button>
          </div>

          <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
            <button className="flex items-center gap-2 px-10 py-3.5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 cursor-pointer w-full justify-center whitespace-nowrap active:scale-[0.98]">
              <Plus size={18} />
              <span>New Invoice</span>
            </button>
          </Link>
        </div>

        {/* Invoices Table or Empty State */}
        {invoices.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border-subtle rounded-[32px] p-16 text-center shadow-sm"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">
              No invoices yet
            </h3>
            <p className="text-muted mb-8 max-w-sm mx-auto">
              Create your first invoice to start receiving payments in crypto.
            </p>
            <Link href="/dashboard/invoices/new">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 cursor-pointer">
                <Plus size={18} />
                <span>Create Invoice</span>
              </button>
            </Link>
          </motion.div>
        ) : (
          /* Invoices Table */
          <div className="bg-white border border-border-subtle rounded-[32px] overflow-hidden shadow-sm">
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
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((invoice, idx) => {
                    const displayStatus = getDisplayStatus(invoice.status);
                    const networkDisplay =
                      invoice.network === "stacks" ? "Stacks" : "Ethereum";

                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="py-5 px-6">
                          <span className="text-sm font-bold text-foreground">
                            {getDisplayId(invoice.id, idx)}
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
                              className={`w-1.5 h-1.5 rounded-full ${networkDisplay === "Stacks" ? "bg-[#5546FF]" : "bg-[#627EEA]"}`}
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
                              className="p-2 rounded-lg text-muted hover:bg-white hover:text-brand-orange hover:shadow-sm border border-transparent hover:border-border-subtle transition-all cursor-pointer"
                              title="Copy Link"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(invoice)}
                              className="p-2 rounded-lg text-muted hover:bg-white hover:text-brand-orange hover:shadow-sm border border-transparent hover:border-border-subtle transition-all cursor-pointer"
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
            <div className="md:hidden divide-y divide-gray-50">
              {invoices.map((invoice, idx) => {
                const displayStatus = getDisplayStatus(invoice.status);
                const networkDisplay =
                  invoice.network === "stacks" ? "Stacks" : "Ethereum";

                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleOpenDetail(invoice)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-bold text-foreground">
                          {getDisplayId(invoice.id, idx)}
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
                            className={`w-1.5 h-1.5 rounded-full ${networkDisplay === "Stacks" ? "bg-[#5546FF]" : "bg-[#627EEA]"}`}
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
                Showing 1-{invoices.length} of {invoices.length} Invoices
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white border border-border-subtle rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-gray-50 transition-all opacity-50 cursor-not-allowed">
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-border-subtle text-xs font-bold text-brand-orange shadow-sm cursor-pointer">
                    1
                  </button>
                </div>
                <button className="px-4 py-2 bg-white border border-border-subtle rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-gray-50 transition-all opacity-50 cursor-not-allowed">
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
