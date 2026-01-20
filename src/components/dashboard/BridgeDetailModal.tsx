"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { BridgeTransaction } from "@/hooks/useBridgeHistory";

interface BridgeDetailModalProps {
  transaction: BridgeTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function getExplorerUrl(tx: BridgeTransaction): string {
  // Source chain explorer based on where the tx was initiated
  if (tx.from === "Ethereum") {
    return `https://sepolia.etherscan.io/tx/${tx.txHash}`;
  }
  return `https://explorer.stacks.co/txid/${tx.txHash}?chain=testnet`;
}

export function BridgeDetailModal({
  transaction,
  isOpen,
  onClose,
}: BridgeDetailModalProps) {
  if (!transaction) return null;

  const explorerUrl = getExplorerUrl(transaction);
  const displayHash = truncateHash(transaction.txHash);

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-150 cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-151 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-md bg-card border border-border-subtle rounded-[32px] overflow-hidden pointer-events-auto relative dark:shadow-dark-sleek"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 transition-colors text-muted hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                  <div className="text-[9px] font-black text-muted uppercase tracking-[0.15em] mb-1">
                    Bridge Proof
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {transaction.id}
                  </h3>
                </div>

                {/* Amount Visual */}
                <div className="bg-sidebar/50 rounded-2xl p-6 mb-8 border border-border-subtle relative overflow-hidden text-center">
                  <div className="text-muted text-[10px] font-bold uppercase tracking-wider mb-2">
                    Transferred Amount
                  </div>
                  <div className="text-3xl font-black text-foreground mb-4 tabular-nums">
                    ${transaction.amount}{" "}
                    <span className="text-xs font-bold text-muted opacity-50">
                      USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${
                        transaction.status === "Confirmed"
                          ? "text-green-600 bg-green-50 border-green-100"
                          : transaction.status === "Pending"
                            ? "text-orange-600 bg-orange-50 border-orange-100"
                            : "text-red-600 bg-red-50 border-red-100"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>

                {/* Settlement Timeline / Flow */}
                <div className="space-y-6 mb-8 px-2">
                  <FlowStep
                    label="Source Chain"
                    value={transaction.from}
                    hash={displayHash}
                    explorerUrl={explorerUrl}
                    isConfirmed={true}
                  />
                  <div className="ml-4 h-6 border-l-2 border-dashed border-gray-100 relative">
                    <div className="absolute top-1/2 -left-[9px] -translate-y-1/2 w-4 h-4 rounded-full bg-card border border-border-subtle flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                    </div>
                  </div>
                  <FlowStep
                    label="Destination Chain"
                    value={transaction.to}
                    hash={displayHash}
                    explorerUrl={explorerUrl}
                    isConfirmed={transaction.status === "Confirmed"}
                  />
                </div>

                {/* Protocol Verification */}
                <div className="bg-brand-orange/4 border border-brand-orange/10 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-brand-orange" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-orange uppercase tracking-tight mb-0.5">
                        Bitcoin-Backed Finality
                      </div>
                      <p className="text-[10px] text-muted leading-relaxed font-bold">
                        Secured by Stacks PoX & finalized on Bitcoin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof Marker */}
                <div className="mt-8 pt-6 border-t border-gray-50 opacity-40 flex items-center justify-between text-[8px] font-black text-muted uppercase tracking-widest">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-4 h-0.5 bg-gray-200 rounded-full"
                      />
                    ))}
                  </div>
                  <span>Verified Proof</span>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/3 rounded-full blur-[80px] -z-10" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

interface FlowStepProps {
  label: string;
  value: string;
  hash: string;
  explorerUrl: string;
  isConfirmed: boolean;
}

function FlowStep({
  label,
  value,
  hash,
  explorerUrl,
  isConfirmed,
}: FlowStepProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isConfirmed ? "bg-green-50 border border-green-100" : "bg-sidebar border border-border-subtle"}`}
        >
          {isConfirmed ? (
            <CheckCircle2 size={16} className="text-green-600" />
          ) : (
            <Clock size={16} className="text-muted" />
          )}
        </div>
        <div>
          <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
            {label}
          </div>
          <div className="text-xs font-bold">{value}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[9px] font-bold text-muted mb-0.5 tracking-tighter">
          TX HASH
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono font-bold text-brand-orange hover:underline cursor-pointer"
        >
          {hash}
          <ExternalLink size={8} />
        </a>
      </div>
    </div>
  );
}
