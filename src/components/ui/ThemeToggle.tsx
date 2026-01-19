"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show placeholder during SSR/hydration to avoid mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-sidebar border border-border-subtle flex items-center justify-center opacity-50">
        <div className="w-5 h-5" /> {/* Empty placeholder to prevent layout shift */}
      </div>
    );
  }

  // Use resolvedTheme which gives the actual computed theme (not "system")
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-10 h-10 rounded-xl bg-card border border-border-subtle hover:border-brand-orange/50 hover:bg-sidebar-hover transition-all flex items-center justify-center cursor-pointer group"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon size={20} className="text-brand-blue" />
          ) : (
            <Sun size={20} className="text-brand-orange" />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 rounded-xl ring-2 ring-brand-orange/0 group-hover:ring-brand-orange/10 transition-all dark:group-hover:ring-brand-blue/10" />
    </button>
  );
}

