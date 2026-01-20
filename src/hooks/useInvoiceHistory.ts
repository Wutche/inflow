"use client";

import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";

// Storage key for localStorage
const STORAGE_KEY = "inflow_history";

/**
 * Zod schema for a single history item.
 * Validates the structure of persisted invoice records.
 */
export const HistoryItemSchema = z.object({
  id: z.string().uuid(),
  recipient: z.string().min(1),
  amount: z.string().min(1),
  token: z.string().min(1),
  date: z.string().datetime(), // ISO 8601 format
  link: z.string().url(),
  // New fields for payment tracking
  status: z.enum(["pending", "paid", "expired"]).default("pending"),
  paidTxHash: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  network: z.enum(["stacks", "ethereum"]).default("stacks"),
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type HistoryItem = z.infer<typeof HistoryItemSchema>;

/**
 * Input type for saving a new invoice.
 * If id is provided, it will be used; otherwise a new UUID is generated.
 */
export type SaveInvoiceInput = Omit<
  HistoryItem,
  "date" | "status" | "paidTxHash" | "paidAt"
> & {
  id?: string; // Optional: if provided, use this ID; otherwise generate new one
};

// Module-level cache to avoid re-parsing on every render
let cachedHistory: HistoryItem[] = [];
let cacheInitialized = false;

/**
 * Reads and validates history from localStorage.
 * Returns cached value if available.
 */
function readFromStorage(): HistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  if (cacheInitialized) {
    return cachedHistory;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      const result = HistoryItemSchema.array().safeParse(parsed);

      if (result.success) {
        cachedHistory = result.data;
      } else {
        // Corrupted data - clear storage
        console.warn("Invalid history data in localStorage, clearing...");
        localStorage.removeItem(STORAGE_KEY);
        cachedHistory = [];
      }
    } else {
      cachedHistory = [];
    }
  } catch {
    // JSON parse error - clear storage
    console.warn("Failed to parse history from localStorage, clearing...");
    localStorage.removeItem(STORAGE_KEY);
    cachedHistory = [];
  }

  cacheInitialized = true;
  return cachedHistory;
}

/**
 * Writes history to localStorage and updates cache.
 */
function writeToStorage(history: HistoryItem[]): void {
  cachedHistory = history;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    // Dispatch storage event for other tabs/windows
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch (error) {
    console.error("Failed to save history to localStorage:", error);
  }
}

/**
 * Clears history from localStorage and cache.
 */
function clearStorage(): void {
  cachedHistory = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch (error) {
    console.error("Failed to clear history from localStorage:", error);
  }
}

// Subscribers for useSyncExternalStore
const subscribers = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);

  // Also listen for storage events from other tabs
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cacheInitialized = false; // Force re-read
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): HistoryItem[] {
  return readFromStorage();
}

// Cached empty array for SSR - must be stable reference to avoid infinite loops
const EMPTY_HISTORY: HistoryItem[] = [];

function getServerSnapshot(): HistoryItem[] {
  return EMPTY_HISTORY;
}

function notifySubscribers(): void {
  subscribers.forEach((callback) => callback());
}

/**
 * Hook for managing invoice history in localStorage.
 * SSR-safe using useSyncExternalStore pattern.
 *
 * @returns Object containing history array and methods to save/clear history.
 */
export function useInvoiceHistory() {
  const history = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  /**
   * Saves a new invoice to history.
   * Uses provided ID if available, otherwise generates a UUID.
   */
  const saveInvoice = useCallback((data: SaveInvoiceInput): string => {
    // Use provided id or generate new one
    const id = data.id || crypto.randomUUID();
    const newItem: HistoryItem = {
      id,
      recipient: data.recipient,
      amount: data.amount,
      token: data.token,
      date: new Date().toISOString(),
      link: data.link,
      network: data.network,
      status: "pending",
    };

    // Add new item at the beginning (most recent first)
    const updated = [newItem, ...cachedHistory];
    writeToStorage(updated);
    notifySubscribers();
    return id; // Return the ID for tracking
  }, []);

  /**
   * Updates the payment status of an invoice.
   */
  const updateInvoiceStatus = useCallback(
    (
      invoiceId: string,
      status: "pending" | "paid" | "expired",
      txHash?: string,
    ): void => {
      const updated = cachedHistory.map((item) =>
        item.id === invoiceId
          ? {
              ...item,
              status,
              paidTxHash: txHash,
              paidAt: status === "paid" ? new Date().toISOString() : undefined,
            }
          : item,
      );
      writeToStorage(updated);
      notifySubscribers();
    },
    [],
  );

  /**
   * Gets an invoice by ID.
   */
  const getInvoiceById = useCallback(
    (invoiceId: string): HistoryItem | undefined => {
      return cachedHistory.find((item) => item.id === invoiceId);
    },
    [],
  );

  /**
   * Clears all history from state and localStorage.
   */
  const clearHistory = useCallback((): void => {
    clearStorage();
    notifySubscribers();
  }, []);

  return {
    history,
    isLoaded: true, // Always loaded with useSyncExternalStore
    saveInvoice,
    updateInvoiceStatus,
    getInvoiceById,
    clearHistory,
  };
}
