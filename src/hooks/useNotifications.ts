"use client";

import { useSyncExternalStore, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = "invoice_created" | "invoice_paid" | "invoice_sent" | "bridge_pending" | "bridge_confirmed" | "bridge_failed";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  link?: string; // Optional link to navigate to
  metadata?: {
    invoiceId?: string;
    txHash?: string;
    amount?: string;
  };
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = "inflow_notifications";

// Module-level cache
let cachedNotifications: Notification[] = [];
let cacheInitialized = false;

function readFromStorage(): Notification[] {
  if (typeof window === "undefined") {
    return [];
  }

  if (cacheInitialized) {
    return cachedNotifications;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedNotifications = JSON.parse(stored) as Notification[];
    } else {
      cachedNotifications = [];
    }
  } catch {
    console.warn("Failed to parse notifications from localStorage, clearing...");
    localStorage.removeItem(STORAGE_KEY);
    cachedNotifications = [];
  }

  cacheInitialized = true;
  return cachedNotifications;
}

function writeToStorage(notifications: Notification[]): void {
  cachedNotifications = notifications;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch (error) {
    console.error("Failed to save notifications to localStorage:", error);
  }
}

// ============================================================================
// SUBSCRIBERS
// ============================================================================

const subscribers = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cacheInitialized = false;
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): Notification[] {
  return readFromStorage();
}

const EMPTY_NOTIFICATIONS: Notification[] = [];

function getServerSnapshot(): Notification[] {
  return EMPTY_NOTIFICATIONS;
}

function notifySubscribers(): void {
  subscribers.forEach((callback) => callback());
}

// ============================================================================
// HOOK
// ============================================================================

export function useNotifications() {
  const notifications = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  /**
   * Add a new notification
   */
  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      metadata?: Notification["metadata"]
    ): string => {
      const id = crypto.randomUUID();
      const newNotification: Notification = {
        id,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        metadata,
      };

      // Add to front of array (most recent first)
      const updated = [newNotification, ...cachedNotifications];
      
      // Keep only last 50 notifications
      const trimmed = updated.slice(0, 50);
      
      writeToStorage(trimmed);
      notifySubscribers();
      return id;
    },
    []
  );

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback((notificationId: string): void => {
    const updated = cachedNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    writeToStorage(updated);
    notifySubscribers();
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback((): void => {
    const updated = cachedNotifications.map((n) => ({ ...n, read: true }));
    writeToStorage(updated);
    notifySubscribers();
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback((): void => {
    writeToStorage([]);
    notifySubscribers();
  }, []);

  /**
   * Delete a specific notification
   */
  const deleteNotification = useCallback((notificationId: string): void => {
    const updated = cachedNotifications.filter((n) => n.id !== notificationId);
    writeToStorage(updated);
    notifySubscribers();
  }, []);

  // Computed values
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    unreadCount,
    hasUnread,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR CREATING NOTIFICATIONS
// ============================================================================

/**
 * Create notification for invoice created
 */
export function createInvoiceCreatedNotification(
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  invoiceId: string,
  amount: string
): void {
  addNotification(
    "invoice_created",
    "Invoice Created",
    `New invoice for $${amount} has been created`,
    { invoiceId, amount }
  );
}

/**
 * Create notification for invoice paid
 */
export function createInvoicePaidNotification(
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  invoiceId: string,
  amount: string
): void {
  addNotification(
    "invoice_paid",
    "Invoice Paid",
    `Payment of $${amount} received`,
    { invoiceId, amount }
  );
}

/**
 * Create notification for bridge pending
 */
export function createBridgePendingNotification(
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  txHash: string,
  amount: string,
  direction: string
): void {
  addNotification(
    "bridge_pending",
    "Bridge Initiated",
    `Bridging $${amount} ${direction}`,
    { txHash, amount }
  );
}

/**
 * Create notification for bridge confirmed
 */
export function createBridgeConfirmedNotification(
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  txHash: string,
  amount: string
): void {
  addNotification(
    "bridge_confirmed",
    "Bridge Confirmed",
    `Transfer of $${amount} completed successfully`,
    { txHash, amount }
  );
}
