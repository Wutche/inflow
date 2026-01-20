"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Command, Clock, ArrowRight, Zap, FileText, ArrowLeftRight } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // This would toggle if we had a toggle
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  const recentSearches = [
    { label: "Invoice INV-001", type: "invoice", detail: "Paid • $2,500.00" },
    { label: "Bridge to Stacks", type: "bridge", detail: "Confirmed • 5m ago" },
  ];

  const quickActions = [
    { label: "Create New Invoice", icon: FileText, shortcut: "N" },
    { label: "Bridge Assets", icon: ArrowLeftRight, shortcut: "B" },
    { label: "View Analytics", icon: Zap, shortcut: "A" },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-200 cursor-pointer"
          />
          <div className="fixed inset-0 flex items-start justify-center z-201 pointer-events-none pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-white border border-border-subtle rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto shadow-black/20"
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Ask anything or search for invoices, transactions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-16 pr-12 py-6 text-lg font-bold bg-white focus:outline-none placeholder:text-muted/50"
                />
                <button
                  onClick={onClose}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-50 text-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 bg-gray-50/50 border-t border-border-subtle max-h-[60vh] overflow-y-auto">
                {/* Recent Searches */}
                <div className="mb-6">
                  <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
                    <Clock size={12} />
                    Recent Activity
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={idx}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all group group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-muted group-hover:text-brand-orange transition-colors">
                            {item.type === 'invoice' ? <FileText size={16} /> : <ArrowLeftRight size={16} />}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold">{item.label}</div>
                            <div className="text-[10px] text-muted font-medium uppercase tracking-tight">{item.detail}</div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
                    <Zap size={12} />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-border-subtle hover:border-brand-orange/30 hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-orange/5 flex items-center justify-center text-brand-orange">
                            <action.icon size={16} />
                          </div>
                          <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground">{action.label}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-muted group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors">
                          <Command size={10} />
                          <span>{action.shortcut}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border-subtle bg-gray-50 flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-white border border-border-subtle rounded-md shadow-sm">↵</kbd> to select</span>
                  <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-white border border-border-subtle rounded-md shadow-sm">↑↓</kbd> to navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand-orange">
                  <Zap size={12} />
                  <span>Powered by Inflow AI</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
