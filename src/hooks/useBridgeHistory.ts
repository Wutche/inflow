"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface BridgeTransaction {
  id: string;
  txHash: string;
  route: "ETHEREUM → STACKS" | "STACKS → ETHEREUM";
  from: "Ethereum" | "Stacks";
  to: "Ethereum" | "Stacks";
  amount: string; // Formatted amount (e.g., "2,500.00")
  amountRaw: number; // Raw amount for calculations
  status: "Pending" | "Confirmed" | "Failed";
  timestamp: string; // ISO date string
  recipientAddress: string;
}

interface BridgeHistoryState {
  transactions: BridgeTransaction[];
  totalVolume: number;
  totalSent: number;
  totalReceived: number;
  pendingCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "inflow_bridge_history";

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `BR-${Date.now().toString(36).toUpperCase()}`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// HOOK
// ============================================================================

// Lazy initializer for loading transactions from localStorage
function loadTransactionsFromStorage(): BridgeTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as BridgeTransaction[];
    }
  } catch (error) {
    console.error("Failed to load bridge history:", error);
  }
  return [];
}

export function useBridgeHistory() {
  // Use lazy initialization to load from localStorage without triggering cascading renders
  const [transactions, setTransactions] = useState<BridgeTransaction[]>(
    loadTransactionsFromStorage,
  );
  const [isLoaded] = useState(true);

  // Persist to localStorage whenever transactions change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      } catch (error) {
        console.error("Failed to save bridge history:", error);
      }
    }
  }, [transactions, isLoaded]);

  // Add a new transaction
  const addTransaction = useCallback(
    (params: {
      txHash: string;
      direction: "eth-to-stacks" | "stacks-to-eth";
      amount: string; // Raw amount as string
      recipientAddress: string;
    }) => {
      const amountNum = parseFloat(params.amount) || 0;
      const isEthToStacks = params.direction === "eth-to-stacks";

      const newTx: BridgeTransaction = {
        id: generateId(),
        txHash: params.txHash,
        route: isEthToStacks ? "ETHEREUM → STACKS" : "STACKS → ETHEREUM",
        from: isEthToStacks ? "Ethereum" : "Stacks",
        to: isEthToStacks ? "Stacks" : "Ethereum",
        amount: formatAmount(amountNum),
        amountRaw: amountNum,
        status: "Pending",
        timestamp: new Date().toISOString(),
        recipientAddress: params.recipientAddress,
      };

      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    },
    [],
  );

  // Update transaction status
  const updateTransactionStatus = useCallback(
    (txHash: string, status: "Pending" | "Confirmed" | "Failed") => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.txHash === txHash ? { ...tx, status } : tx)),
      );
    },
    [],
  );

  // Clear all transactions
  const clearHistory = useCallback(() => {
    setTransactions([]);
  }, []);

  // Computed stats
  const stats: BridgeHistoryState = {
    transactions,
    totalVolume: transactions.reduce((sum, tx) => sum + tx.amountRaw, 0),
    totalSent: transactions
      .filter((tx) => tx.from === "Stacks")
      .reduce((sum, tx) => sum + tx.amountRaw, 0),
    totalReceived: transactions
      .filter((tx) => tx.to === "Stacks")
      .reduce((sum, tx) => sum + tx.amountRaw, 0),
    pendingCount: transactions.filter((tx) => tx.status === "Pending").length,
  };

  // Recent transactions (for dashboard widget)
  const recentTransactions = transactions.slice(0, 3);

  // Format transaction for display
  const formatTransactionForDisplay = useCallback((tx: BridgeTransaction) => {
    const date = new Date(tx.timestamp);
    return {
      ...tx,
      displayDate: formatDate(date),
      displayAmount: `$${tx.amount}`,
      statusColor:
        tx.status === "Confirmed"
          ? "text-green-600"
          : tx.status === "Pending"
            ? "text-amber-500"
            : "text-red-500",
    };
  }, []);

  return {
    transactions,
    recentTransactions,
    stats,
    isLoaded,
    addTransaction,
    updateTransactionStatus,
    clearHistory,
    formatTransactionForDisplay,
  };
}
