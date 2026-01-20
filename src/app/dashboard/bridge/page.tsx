"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BridgeDetailModal } from "@/components/dashboard/BridgeDetailModal";
import { BridgePaymentCard } from "@/components/bridge/BridgePaymentCard";
import { ExternalLink, Search, Filter, Inbox } from "lucide-react";
import { motion } from "framer-motion";
import {
  useBridgeHistory,
  type BridgeTransaction,
} from "@/hooks/useBridgeHistory";

export default function BridgePage() {
  const [selectedTransaction, setSelectedTransaction] =
    useState<BridgeTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use real bridge history
  const { transactions, formatTransactionForDisplay, isLoaded } =
    useBridgeHistory();

  const handleOpenDetail = (tx: BridgeTransaction) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
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
          className="bg-white border border-border-subtle rounded-[32px] shadow-sm flex flex-col overflow-hidden"
        >
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-sidebar/30">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Bridge History
              </h2>
              <p className="text-muted text-[10px] font-medium mt-0.5">
                Your cross-chain activity
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-white border border-border-subtle rounded-lg text-muted hover:text-foreground shadow-sm cursor-pointer">
                <Search size={14} />
              </button>
              <button className="p-2 bg-white border border-border-subtle rounded-lg text-muted hover:text-foreground shadow-sm cursor-pointer">
                <Filter size={14} />
              </button>
            </div>
          </div>

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
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((item) => {
                    const display = formatTransactionForDisplay(item);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors group"
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
                                className={`w-4 h-4 rounded-full border border-white flex items-center justify-center shrink-0 ${
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
                                ? "text-green-600 bg-green-50 border-green-100"
                                : item.status === "Pending"
                                  ? "text-orange-600 bg-orange-50 border-orange-100"
                                  : "text-red-600 bg-red-50 border-red-100"
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
              {transactions.length} Item{transactions.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 bg-white border border-border-subtle rounded-lg text-[9px] font-black text-muted opacity-50 cursor-not-allowed">
                Prev
              </button>
              <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-border-subtle text-[9px] font-bold text-brand-orange shadow-sm">
                1
              </div>
              <button className="px-3 py-1.5 bg-white border border-border-subtle rounded-lg text-[9px] font-black text-muted opacity-50 cursor-not-allowed">
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
