"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Search,
  Wallet,
  ChevronDown,
  LogOut,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: () => void;
  onNotifications?: () => void;
  onConnect?: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  onSearch,
  onNotifications,
  onConnect,
}: DashboardHeaderProps) {
  const {
    isConnected,
    ethConnected,
    ethAddress,
    ethTruncatedAddress,
    stacksConnected,
    stacksAddress,
    stacksTruncatedAddress,
    disconnectEthereum,
    disconnectStacks,
    disconnectAll,
  } = useWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<"eth" | "stx" | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const connectedCount = (ethConnected ? 1 : 0) + (stacksConnected ? 1 : 0);
  const buttonText =
    connectedCount === 2
      ? "2 Wallets"
      : ethTruncatedAddress || stacksTruncatedAddress;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyAddress = async (address: string, type: "eth" | "stx") => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(type);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted text-sm font-medium mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSearch}
          className="p-2.5 rounded-xl text-muted hover:bg-white hover:text-brand-orange hover:shadow-sm border border-transparent hover:border-border-subtle transition-all cursor-pointer group"
        >
          <Search
            size={20}
            className="group-hover:scale-110 transition-transform"
          />
        </button>

        <button
          onClick={onNotifications}
          className="p-2.5 rounded-xl text-muted hover:bg-white hover:text-brand-orange hover:shadow-sm border border-transparent hover:border-border-subtle transition-all relative cursor-pointer group"
        >
          <Bell
            size={20}
            className="group-hover:rotate-12 transition-transform"
          />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-orange rounded-full border-2 border-white ring-4 ring-brand-orange/10 animate-pulse" />
        </button>

        {isConnected ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 flex items-center gap-2.5 cursor-pointer active:scale-95"
            >
              {connectedCount === 2 ? (
                <div className="flex -space-x-1">
                  <Image
                    src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                    alt="ETH"
                    width={16}
                    height={16}
                    className="rounded-full ring-2 ring-black"
                    unoptimized
                  />
                  <Image
                    src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                    alt="STX"
                    width={16}
                    height={16}
                    className="rounded-full ring-2 ring-black"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                  <Wallet size={14} />
                </div>
              )}
              <span className="text-sm font-mono">{buttonText}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden z-50"
                >
                  {/* Connected Wallets Section */}
                  <div className="p-4 space-y-3">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wide">
                      Connected Wallets
                    </div>

                    {/* Ethereum Wallet */}
                    {ethConnected && ethAddress && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Image
                          src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                          alt="ETH"
                          width={24}
                          height={24}
                          className="rounded-full"
                          unoptimized
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground">
                            Ethereum
                          </div>
                          <code className="text-[10px] font-mono text-muted truncate block">
                            {ethTruncatedAddress}
                          </code>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyAddress(ethAddress, "eth")}
                            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            {copiedAddress === "eth" ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button
                            onClick={disconnectEthereum}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <LogOut size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stacks Wallet */}
                    {stacksConnected && stacksAddress && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Image
                          src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                          alt="STX"
                          width={24}
                          height={24}
                          className="rounded-full"
                          unoptimized
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground">
                            Stacks
                          </div>
                          <code className="text-[10px] font-mono text-muted truncate block">
                            {stacksTruncatedAddress}
                          </code>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleCopyAddress(stacksAddress, "stx")
                            }
                            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            {copiedAddress === "stx" ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button
                            onClick={disconnectStacks}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <LogOut size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 border-t border-gray-50">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ArrowRight size={16} />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        disconnectAll();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-muted hover:text-red-600 transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={16} />
                      <span className="text-sm font-medium">
                        Disconnect All
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Wallet size={16} />
            <span>Connect</span>
          </button>
        )}
      </div>
    </header>
  );
}
