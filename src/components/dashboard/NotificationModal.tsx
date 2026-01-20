"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  BellOff,
  FileText,
  Clock,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications, NotificationType } from "@/hooks/useNotifications";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

// Get icon and color based on notification type
function getNotificationStyle(type: NotificationType) {
  switch (type) {
    case "invoice_paid":
      return {
        icon: CheckCircle2,
        color:
          "text-green-600 bg-green-50/10 border-green-500/20 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/30",
      };
    case "invoice_created":
      return {
        icon: FileText,
        color:
          "text-blue-600 bg-blue-50/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/30",
      };
    case "bridge_confirmed":
      return {
        icon: ArrowLeftRight,
        color:
          "text-brand-orange bg-brand-orange/5 border-brand-orange/10 dark:text-brand-orange dark:bg-brand-orange/10 dark:border-brand-orange/20",
      };
    case "bridge_pending":
      return {
        icon: Clock,
        color:
          "text-amber-600 bg-amber-50/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30",
      };
    case "bridge_failed":
      return {
        icon: AlertCircle,
        color:
          "text-red-600 bg-red-50/10 border-red-500/20 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/30",
      };
    default:
      return {
        icon: CheckCircle2,
        color:
          "text-muted bg-sidebar border-border-subtle dark:bg-sidebar-hover",
      };
  }
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Handle clicking on a notification
  const handleNotificationClick = (notifId: string, type: NotificationType) => {
    markAsRead(notifId);

    // Navigate based on type
    if (type.startsWith("invoice")) {
      router.push("/dashboard/invoices");
    } else if (type.startsWith("bridge")) {
      router.push("/dashboard/bridge");
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-200 cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-6 right-6 bottom-6 w-full max-w-sm bg-card border border-border-subtle rounded-[40px] z-201 overflow-hidden flex flex-col transition-all duration-300 dark:shadow-dark-sleek"
          >
            {/* Header */}
            <div className="p-8 border-b border-border-subtle bg-sidebar/30 relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-[10px] font-black text-brand-orange uppercase tracking-widest">
                  Stay updated
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Activity Center
              </h3>
              <button
                onClick={onClose}
                className="absolute top-8 right-8 p-1.5 rounded-lg hover:bg-card text-muted transition-all cursor-pointer border border-transparent hover:border-border-subtle dark:hover:bg-sidebar-hover"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const style = getNotificationStyle(notif.type);
                  const Icon = style.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() =>
                        handleNotificationClick(notif.id, notif.type)
                      }
                      className={`p-5 rounded-[24px] bg-card border transition-all group cursor-pointer ${
                        notif.read
                          ? "border-transparent hover:border-border-subtle opacity-70"
                          : "border-brand-orange/20 hover:border-brand-orange/40"
                      } hover:bg-sidebar-hover`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${style.color}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                              {notif.title}
                              {!notif.read && (
                                <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
                              )}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted uppercase tabular-nums">
                                {formatRelativeTime(notif.timestamp)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                className="p-1 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted font-medium leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-sidebar flex items-center justify-center mb-4 border border-dashed border-border-subtle">
                    <BellOff size={24} className="text-muted opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-muted">
                    No notifications yet
                  </p>
                  <p className="text-[10px] text-muted font-medium mt-1 uppercase tracking-tight">
                    Create invoices or bridge assets to see activity here.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-6 border-t border-border-subtle bg-sidebar/50 space-y-2">
                <button
                  onClick={markAllAsRead}
                  className="w-full py-4 bg-card border border-border-subtle rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest hover:text-brand-orange hover:border-brand-orange/30 transition-all cursor-pointer dark:shadow-sm active:scale-[0.98] dark:hover:bg-sidebar-hover"
                >
                  Mark all as read
                </button>
                <button
                  onClick={clearAll}
                  className="w-full py-3 text-[11px] font-bold text-muted uppercase tracking-widest hover:text-red-500 transition-all cursor-pointer"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
