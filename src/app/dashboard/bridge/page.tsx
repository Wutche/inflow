"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BridgeDetailModal } from "@/components/dashboard/BridgeDetailModal";
import { BridgePaymentCard } from "@/components/bridge/BridgePaymentCard";
import {
  ExternalLink,
  Search,
  Filter,
  Inbox,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useBridgeHistory,
  type BridgeTransaction,
} from "@/hooks/useBridgeHistory";

// Status filter options
type StatusFilter = "all" | "Pending" | "Confirmed" | "Failed";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Failed", label: "Failed" },
];

export default function BridgePage() {
  const [selectedTransaction, setSelectedTransaction] =
    useState<BridgeTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use real bridge history
  const { transactions, formatTransactionForDisplay, isLoaded } =
    useBridgeHistory();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
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

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Filter transactions based on search query and status filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter !== "all" && tx.status !== statusFilter) {
        return false;
      }

      // Search filter (case-insensitive)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          tx.txHash.toLowerCase(),
          tx.recipientAddress.toLowerCase(),
          tx.amount.toLowerCase(),
          tx.route.toLowerCase(),
          tx.from.toLowerCase(),
          tx.to.toLowerCase(),
          tx.status.toLowerCase(),
        ];

        return searchableFields.some((field) => field.includes(query));
      }

      return true;
    });
  }, [transactions, searchQuery, statusFilter]);

  const handleOpenDetail = (tx: BridgeTransaction) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  // Get the current filter label
  const currentFilterLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ||
    "All Status";

  // Check if filters are active
  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setIsSearchOpen(false);
  };

  return (
    <DashboardLayout
      title="Bridge"
      subtitle="Transfer USDC between Ethereum and Stacks via xReserve"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 items-start">
        {/* Left Col: Bridge Payment Card */}
        <BridgePaymentCard />

        {/* Right Col: History Table */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border-subtle rounded-[32px] flex flex-col overflow-hidden"
        >
          <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-sidebar/30">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Bridge History
              </h2>
              <p className="text-muted text-[10px] font-medium mt-0.5">
                Your cross-chain activity
              </p>
            </div>
            <div className="flex gap-2">
              {/* Search Button & Modal */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    setIsFilterOpen(false);
                  }}
                  className={`p-2 bg-card border rounded-lg shadow-sm cursor-pointer transition-colors ${
                    isSearchOpen || searchQuery
                      ? "border-brand-orange/30 text-brand-orange"
                      : "border-border-subtle text-muted hover:text-foreground hover:bg-sidebar-hover"
                  }`}
                >
                  <Search size={14} />
                </button>

                {/* Search Modal */}
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-card border border-border-subtle rounded-2xl overflow-hidden z-50 dark:shadow-lg"
                    >
                      <div className="p-3 border-b border-border-subtle">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                            size={14}
                          />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-sidebar border border-border-subtle rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-card text-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-2 max-h-60 overflow-y-auto">
                        {searchQuery.trim() === "" ? (
                          <div className="px-3 py-4 text-center">
                            <p className="text-xs text-muted">
                              Search by tx hash, address, amount, or route
                            </p>
                          </div>
                        ) : filteredTransactions.length === 0 ? (
                          <div className="px-3 py-4 text-center">
                            <p className="text-xs text-muted">
                              No matching transactions
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="px-3 py-1 text-[10px] font-bold text-muted uppercase tracking-widest">
                              {filteredTransactions.length} result
                              {filteredTransactions.length !== 1 ? "s" : ""}
                            </p>
                            {filteredTransactions.slice(0, 5).map((tx) => {
                              const display = formatTransactionForDisplay(tx);
                              return (
                                <button
                                  key={tx.id}
                                  onClick={() => {
                                    handleOpenDetail(tx);
                                    setIsSearchOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sidebar-hover transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center -space-x-1">
                                      <div
                                        className={`w-4 h-4 rounded-full border border-card flex items-center justify-center ${
                                          tx.from === "Stacks"
                                            ? "bg-[#5546FF]"
                                            : "bg-[#627EEA]"
                                        }`}
                                      >
                                        <img
                                          src={
                                            tx.from === "Stacks"
                                              ? "https://cryptologos.cc/logos/stacks-stx-logo.png"
                                              : "https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                          }
                                          className="w-2 h-2 brightness-0 invert"
                                          alt=""
                                        />
                                      </div>
                                      <div
                                        className={`w-4 h-4 rounded-full border border-card flex items-center justify-center ${
                                          tx.to === "Stacks"
                                            ? "bg-[#5546FF]"
                                            : "bg-[#627EEA]"
                                        }`}
                                      >
                                        <img
                                          src={
                                            tx.to === "Stacks"
                                              ? "https://cryptologos.cc/logos/stacks-stx-logo.png"
                                              : "https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                          }
                                          className="w-2 h-2 brightness-0 invert"
                                          alt=""
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-foreground">
                                        {display.displayAmount}
                                      </p>
                                      <p className="text-[10px] text-muted">
                                        {tx.route}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      tx.status === "Confirmed"
                                        ? "text-green-600 bg-green-500/10"
                                        : tx.status === "Pending"
                                          ? "text-orange-600 bg-orange-500/10"
                                          : "text-red-600 bg-red-500/10"
                                    }`}
                                  >
                                    {tx.status}
                                  </span>
                                </button>
                              );
                            })}
                            {filteredTransactions.length > 5 && (
                              <p className="px-3 py-2 text-[10px] text-muted text-center">
                                +{filteredTransactions.length - 5} more results
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {searchQuery && (
                        <div className="p-2 border-t border-border-subtle bg-sidebar/50">
                          <button
                            onClick={() => setIsSearchOpen(false)}
                            className="w-full py-2 text-xs font-bold text-brand-orange hover:underline cursor-pointer"
                          >
                            View in table ↓
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Filter Button & Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    setIsSearchOpen(false);
                  }}
                  className={`p-2 bg-card border rounded-lg shadow-sm cursor-pointer transition-colors ${
                    isFilterOpen || statusFilter !== "all"
                      ? "border-brand-orange/30 text-brand-orange"
                      : "border-border-subtle text-muted hover:text-foreground hover:bg-sidebar-hover"
                  }`}
                >
                  <Filter size={14} />
                </button>

                {/* Filter Dropdown */}
                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-44 bg-card border border-border-subtle rounded-2xl overflow-hidden z-50 dark:shadow-lg"
                    >
                      <div className="p-2">
                        <p className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                          Filter by Status
                        </p>
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                              statusFilter === option.value
                                ? "bg-brand-orange/10 text-brand-orange"
                                : "text-foreground hover:bg-sidebar-hover"
                            }`}
                          >
                            <span>{option.label}</span>
                            {statusFilter === option.value && (
                              <Check size={14} className="text-brand-orange" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters && (
            <div className="px-6 py-2 bg-brand-orange/5 border-b border-brand-orange/20 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted">
                {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </span>
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-brand-orange hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[500px]">
            {!isLoaded ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sidebar border border-border-subtle flex items-center justify-center mb-4">
                  <Inbox size={20} className="text-muted" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  No transactions yet
                </h3>
                <p className="text-xs text-muted max-w-[200px]">
                  Your bridge transactions will appear here
                </p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sidebar border border-border-subtle flex items-center justify-center mb-4">
                  <Search size={20} className="text-muted" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  No matching transactions
                </h3>
                <p className="text-xs text-muted max-w-[200px] mb-4">
                  Try adjusting your search or filter
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-brand-orange hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-sidebar/50 border-b border-border-subtle">
                    <th className="py-4 px-6 text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
                      Route
                    </th>
                    <th className="py-4 px-6 text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
                      Amount
                    </th>
                    <th className="py-4 px-6 text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
                      Status
                    </th>
                    <th className="py-4 px-6 text-right text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredTransactions.map((item) => {
                    const display = formatTransactionForDisplay(item);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-sidebar/50 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-1.5">
                              <div
                                className={`w-4 h-4 rounded-full border border-white flex items-center justify-center shrink-0 ${
                                  item.from === "Stacks"
                                    ? "bg-[#5546FF]"
                                    : "bg-[#627EEA]"
                                }`}
                              >
                                <img
                                  src={
                                    item.from === "Stacks"
                                      ? "https://cryptologos.cc/logos/stacks-stx-logo.png"
                                      : "https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                  }
                                  className="w-2 h-2 brightness-0 invert"
                                  alt=""
                                />
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border border-card flex items-center justify-center shrink-0 ${
                                  item.to === "Stacks"
                                    ? "bg-[#5546FF]"
                                    : "bg-[#627EEA]"
                                }`}
                              >
                                <img
                                  src={
                                    item.to === "Stacks"
                                      ? "https://cryptologos.cc/logos/stacks-stx-logo.png"
                                      : "https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                  }
                                  className="w-2 h-2 brightness-0 invert"
                                  alt=""
                                />
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted tracking-tight truncate max-w-[80px]">
                              {item.route}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-foreground">
                            {display.displayAmount}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${
                              item.status === "Confirmed"
                                ? "text-green-600 bg-green-500/10 border-green-500/20"
                                : item.status === "Pending"
                                  ? "text-orange-600 bg-orange-500/10 border-orange-500/20"
                                  : "text-red-600 bg-red-500/10 border-red-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 rounded-lg text-muted hover:bg-sidebar hover:text-brand-orange border border-transparent hover:border-border-subtle transition-all cursor-pointer"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Compact Pagination */}
          <div className="px-6 py-3 bg-sidebar/30 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
              {filteredTransactions.length} Item
              {filteredTransactions.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 bg-card border border-border-subtle rounded-lg text-[9px] font-black text-muted opacity-50 cursor-not-allowed">
                Prev
              </button>
              <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-card border border-border-subtle text-[9px] font-bold text-brand-orange">
                1
              </div>
              <button className="px-3 py-1.5 bg-card border border-border-subtle rounded-lg text-[9px] font-black text-muted opacity-50 cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <BridgeDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </DashboardLayout>
  );
}
