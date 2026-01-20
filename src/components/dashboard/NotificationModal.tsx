"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  BellOff,
} from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const notifications = [
    {
      id: 1,
      title: "Invoice Paid",
      message: "Client paid INV-001 ($2,500.00 USDC)",
      time: "2m ago",
      type: "success",
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50 border-green-100",
    },
    {
      id: 2,
      title: "Bridge Confirmed",
      message: "Transfer of 1,500 USDC to Stacks is complete",
      time: "15m ago",
      type: "bridge",
      icon: ArrowLeftRight,
      color: "text-brand-orange bg-brand-orange/5 border-brand-orange/10",
    },
    {
      id: 3,
      title: "Payment Overdue",
      message: "INV-003 is now 5 days overdue",
      time: "1h ago",
      type: "error",
      icon: AlertCircle,
      color: "text-red-600 bg-red-50 border-red-100",
    },
  ];

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
            className="fixed top-6 right-6 bottom-6 w-full max-w-sm bg-white border border-border-subtle rounded-[40px] shadow-2xl z-201 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 bg-sidebar/30 relative">
              <div className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">
                Stay updated
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Activity Center
              </h3>
              <button
                onClick={onClose}
                className="absolute top-8 right-8 p-1.5 rounded-lg hover:bg-white text-muted transition-all cursor-pointer border border-transparent hover:border-border-subtle"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-5 rounded-[24px] bg-white border border-transparent hover:border-border-subtle hover:bg-sidebar transition-all group cursor-pointer"
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${notif.color}`}
                    >
                      <notif.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-bold text-foreground">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] font-bold text-muted uppercase tabular-nums">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted font-medium leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-sidebar flex items-center justify-center mb-4 border border-dashed border-border-subtle">
                    <BellOff size={24} className="text-muted opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-muted">
                    No new notifications
                  </p>
                  <p className="text-[10px] text-muted font-medium mt-1 uppercase tracking-tight">
                    Everything is up to date.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-50 bg-gray-50/50">
              <button className="w-full py-4 bg-white border border-border-subtle rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest hover:text-brand-orange hover:border-brand-orange/30 transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
