"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { useWallet } from "@/context/WalletContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isConnected } = useWallet();
  const [isChecking, setIsChecking] = useState(true);
  const wasConnected = useRef(false);

  useEffect(() => {
    // Small delay to allow localStorage check to complete
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track if user was ever connected
  useEffect(() => {
    if (isConnected) {
      wasConnected.current = true;
    }
  }, [isConnected]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-8 h-8 text-brand-orange" />
          </motion.div>
          <p className="text-muted text-sm font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Allow viewing dashboard even if disconnected (no redirect)
  return <>{children}</>;
}
