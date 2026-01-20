"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { WalletModal } from "@/components/WalletModal";
import { SearchModal } from "./SearchModal";
import { NotificationModal } from "./NotificationModal";
import { AuthGuard } from "@/components/AuthGuard";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 ml-64 px-[20px] py-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <DashboardHeader 
              title={title} 
              subtitle={subtitle}
              onConnect={() => setIsWalletModalOpen(true)}
              onSearch={() => setIsSearchModalOpen(true)}
              onNotifications={() => setIsNotificationModalOpen(true)}
            />
            {children}
          </div>
        </main>

        {/* Modals */}
        <WalletModal 
          isOpen={isWalletModalOpen} 
          onClose={() => setIsWalletModalOpen(false)} 
        />
        <SearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)} 
        />
        <NotificationModal 
          isOpen={isNotificationModalOpen} 
          onClose={() => setIsNotificationModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
}

