"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, isVisible, onClose: _onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 bg-white border border-gray-200 rounded-2xl px-6 py-3.5 flex items-center gap-3 shadow-xl shadow-black/10 dark:bg-card dark:border-border-subtle dark:shadow-dark-sleek"
        >
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
