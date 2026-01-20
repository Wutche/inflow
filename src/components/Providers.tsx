"use client";

import { WalletProvider } from "@/context/WalletContext";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <WalletProvider>{children}</WalletProvider>;
}
