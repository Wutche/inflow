"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { WalletModal } from "./WalletModal";
import { useWallet } from "@/context/WalletContext";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
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

  // Close dropdown when clicking outside
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

  // Get display info for the primary button
  const getButtonDisplay = () => {
    if (ethConnected && stacksConnected) {
      return { text: "2 Wallets", showBothIcons: true };
    } else if (ethConnected) {
      return { text: ethTruncatedAddress, network: "ethereum" };
    } else if (stacksConnected) {
      return { text: stacksTruncatedAddress, network: "stacks" };
    }
    return null;
  };

  const buttonDisplay = getButtonDisplay();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl w-full flex items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 transition-transform group-hover:scale-105">
              <Image
                src="/inflow Logo1 (1).png"
                alt="Inflow Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Inflow
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted hover:text-brand-orange transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted hover:text-brand-orange transition-colors"
            >
              How it Works
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                {/* Go to Dashboard Link */}
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted hover:text-brand-orange transition-colors hidden md:block"
                >
                  Dashboard
                </Link>

                {/* Wallet Status Button */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/90 transition-all group cursor-pointer"
                  >
                    {buttonDisplay?.showBothIcons ? (
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
                    ) : buttonDisplay?.network === "ethereum" ? (
                      <Image
                        src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                        alt="ETH"
                        width={16}
                        height={16}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <Image
                        src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                        alt="STX"
                        width={16}
                        height={16}
                        className="rounded-full"
                        unoptimized
                      />
                    )}
                    <span className="font-mono">{buttonDisplay?.text}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden z-50"
                      >
                        {/* Connected Wallets */}
                        <div className="p-4 space-y-3">
                          <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-3">
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
                                  onClick={() =>
                                    handleCopyAddress(ethAddress, "eth")
                                  }
                                  className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-foreground transition-colors cursor-pointer"
                                >
                                  {copiedAddress === "eth" ? (
                                    <Check
                                      size={12}
                                      className="text-green-500"
                                    />
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
                                    <Check
                                      size={12}
                                      className="text-green-500"
                                    />
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

                          {/* Add Wallet Button */}
                          {(!ethConnected || !stacksConnected) && (
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false);
                                setIsWalletModalOpen(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-muted hover:text-brand-orange hover:border-brand-orange/50 transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                              Connect {!ethConnected
                                ? "Ethereum"
                                : "Stacks"}{" "}
                              Wallet
                            </button>
                          )}
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 border-t border-gray-50">
                          <Link
                            href="/dashboard"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-muted hover:text-foreground transition-colors cursor-pointer text-left"
                          >
                            <ArrowRight size={16} />
                            <span className="text-sm font-medium">
                              Go to Dashboard
                            </span>
                          </Link>
                          <button
                            onClick={disconnectAll}
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
              </>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-base font-medium hover:bg-black/90 transition-all group cursor-pointer"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
