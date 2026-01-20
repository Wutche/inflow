"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Settings,
  Check,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useWallet } from "@/context/WalletContext";
import { WalletModal } from "@/components/WalletModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Bridge", href: "/dashboard/bridge", icon: ArrowLeftRight },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const {
    ethConnected,
    ethTruncatedAddress,
    stacksConnected,
    stacksTruncatedAddress,
    connectEthereum,
    connectStacks,
  } = useWallet();

  const handleConnectEth = async () => {
    await connectEthereum();
  };

  const handleConnectStacks = async () => {
    await connectStacks();
  };

  return (
    <>
      <aside className="w-64 h-screen bg-sidebar border-r border-border-subtle flex flex-col p-6 fixed left-0 top-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="relative w-8 h-8">
            <Image
              src="/inflow Logo1 (1).png"
              alt="Inflow Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">Inflow</span>
        </div>

        {/* Primary Action */}
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-orange text-white rounded-2xl font-bold hover:shadow-[0_8px_25px_rgba(255,107,0,0.3)] transition-all shadow-sleek mb-8 cursor-pointer active:scale-95 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-linear-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={18} className="relative z-10" />
          <span className="relative z-10">New Invoice</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-white text-foreground shadow-sm border border-border-subtle"
                    : "text-muted hover:bg-white/50 hover:text-foreground"
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-brand-orange"
                      : "group-hover:text-brand-orange"
                  )}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet Status */}
        <div className="mt-auto pt-6 border-t border-border-subtle space-y-2">
          {/* Ethereum Status */}
          {ethConnected ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-border-subtle">
              <Image
                src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                alt="ETH"
                width={18}
                height={18}
                className="rounded-full"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-muted uppercase">
                  Ethereum
                </div>
                <div className="text-xs font-mono text-foreground truncate">
                  {ethTruncatedAddress}
                </div>
              </div>
              <Check size={14} className="text-green-500 shrink-0" />
            </div>
          ) : (
            <button
              onClick={handleConnectEth}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/50 border border-dashed border-border-subtle hover:border-brand-orange/50 hover:bg-white transition-all cursor-pointer group"
            >
              <Image
                src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                alt="ETH"
                width={18}
                height={18}
                className="rounded-full grayscale group-hover:grayscale-0 transition-all"
                unoptimized
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[10px] font-bold text-muted uppercase">
                  Ethereum
                </div>
                <div className="text-xs font-medium text-brand-orange">
                  Click to connect
                </div>
              </div>
              <Plus
                size={14}
                className="text-muted group-hover:text-brand-orange shrink-0"
              />
            </button>
          )}

          {/* Stacks Status */}
          {stacksConnected ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-border-subtle">
              <Image
                src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                alt="STX"
                width={18}
                height={18}
                className="rounded-full"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-muted uppercase">
                  Stacks
                </div>
                <div className="text-xs font-mono text-foreground truncate">
                  {stacksTruncatedAddress}
                </div>
              </div>
              <Check size={14} className="text-green-500 shrink-0" />
            </div>
          ) : (
            <button
              onClick={handleConnectStacks}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/50 border border-dashed border-border-subtle hover:border-brand-orange/50 hover:bg-white transition-all cursor-pointer group"
            >
              <Image
                src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                alt="STX"
                width={18}
                height={18}
                className="rounded-full grayscale group-hover:grayscale-0 transition-all"
                unoptimized
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[10px] font-bold text-muted uppercase">
                  Stacks
                </div>
                <div className="text-xs font-medium text-brand-orange">
                  Click to connect
                </div>
              </div>
              <Plus
                size={14}
                className="text-muted group-hover:text-brand-orange shrink-0"
              />
            </button>
          )}
        </div>
      </aside>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
