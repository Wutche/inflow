"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wallet,
  ChevronLeft,
  Loader2,
  Check,
  Plus,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Network = "stacks" | "ethereum";
type ViewState =
  | "main"
  | "stacks-options"
  | "ethereum-options"
  | "connect-second";

// Wallet configurations
const stacksWallets = [
  {
    id: "leather",
    name: "Leather",
    icon: "https://leather.io/leather-icon.png",
    description: "Popular Stacks wallet",
  },
  {
    id: "xverse",
    name: "Xverse",
    icon: "https://www.xverse.app/icons/xverse-logo.svg",
    description: "Bitcoin & Stacks wallet",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "https://static.okx.com/cdn/assets/imgs/226/EB771F4B3FD7BCBE.png",
    description: "Multi-chain wallet",
  },
];

const ethereumWallets = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    description: "Popular Ethereum wallet",
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: "https://phantom.app/img/phantom-logo.svg",
    description: "Multi-chain wallet",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-logo.webp",
    description: "Coinbase's wallet",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "https://avatars.githubusercontent.com/u/37784886",
    description: "Connect any wallet",
  },
];

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("stacks");
  const [viewState, setViewState] = useState<ViewState>("main");
  const [justConnectedNetwork, setJustConnectedNetwork] =
    useState<Network | null>(null);
  const {
    connectStacks,
    connectEthereum,
    isConnecting,
    ethConnected,
    stacksConnected,
    ethTruncatedAddress,
    stacksTruncatedAddress,
  } = useWallet();

  // Handle post-connection transition directly in handlers
  const handleConnectionSuccess = (
    connectedNetwork: Network,
    otherAlreadyConnected: boolean
  ) => {
    if (otherAlreadyConnected) {
      // Both wallets connected, close modal
      onClose();
    } else {
      // Show connect-second view
      setJustConnectedNetwork(connectedNetwork);
      setViewState("connect-second");
    }
  };

  const handleMainConnect = async () => {
    if (selectedNetwork === "stacks") {
      await connectStacks();
      handleConnectionSuccess("stacks", ethConnected);
    } else {
      await connectEthereum();
      handleConnectionSuccess("ethereum", stacksConnected);
    }
  };

  const handleConnectSecondWallet = async () => {
    if (justConnectedNetwork === "stacks") {
      await connectEthereum();
    } else {
      await connectStacks();
    }
    onClose();
  };

  const handleSkipSecondWallet = () => {
    onClose();
  };

  const handleWalletOptionConnect = async () => {
    if (selectedNetwork === "stacks") {
      await connectStacks();
      handleConnectionSuccess("stacks", ethConnected);
    } else {
      await connectEthereum();
      handleConnectionSuccess("ethereum", stacksConnected);
    }
  };

  const handleViewMoreOptions = () => {
    setViewState(
      selectedNetwork === "stacks" ? "stacks-options" : "ethereum-options"
    );
  };

  const handleBack = () => {
    if (viewState === "connect-second") {
      onClose();
    } else {
      setViewState("main");
    }
  };

  const handleClose = () => {
    setViewState("main");
    setJustConnectedNetwork(null);
    onClose();
  };

  const currentWallets =
    selectedNetwork === "stacks" ? stacksWallets : ethereumWallets;

  const otherNetwork =
    justConnectedNetwork === "stacks" ? "ethereum" : "stacks";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/5 z-150 backdrop-blur-[2px] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-151 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.08)] pointer-events-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-50 transition-colors text-muted hover:text-foreground cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Back Button (for wallet options) */}
              {viewState !== "main" && viewState !== "connect-second" && (
                <button
                  onClick={handleBack}
                  className="absolute top-8 left-8 p-2 rounded-full hover:bg-gray-50 transition-colors text-muted hover:text-foreground cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="p-10">
                <AnimatePresence mode="wait">
                  {viewState === "main" ? (
                    <motion.div
                      key="main"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      {/* Header */}
                      <div className="mb-10 text-center">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          Connect Wallet
                        </h3>
                        <p className="text-muted text-sm font-medium">
                          Connect both wallets for cross-chain bridging
                        </p>
                      </div>

                      {/* Network Selector */}
                      <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-10 border border-gray-100">
                        <button
                          onClick={() => setSelectedNetwork("stacks")}
                          disabled={stacksConnected}
                          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            stacksConnected
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : selectedNetwork === "stacks"
                              ? "bg-white text-foreground shadow-sm ring-1 ring-gray-100"
                              : "text-muted hover:text-foreground/60"
                          }`}
                        >
                          {stacksConnected ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Image
                              src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                              width={14}
                              height={14}
                              alt="Stacks"
                              unoptimized
                            />
                          )}
                          {stacksConnected ? "Connected" : "Stacks"}
                        </button>
                        <button
                          onClick={() => setSelectedNetwork("ethereum")}
                          disabled={ethConnected}
                          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            ethConnected
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : selectedNetwork === "ethereum"
                              ? "bg-white text-foreground shadow-sm ring-1 ring-gray-100"
                              : "text-muted hover:text-foreground/60"
                          }`}
                        >
                          {ethConnected ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Image
                              src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                              width={14}
                              height={14}
                              alt="Ethereum"
                              unoptimized
                            />
                          )}
                          {ethConnected ? "Connected" : "Ethereum"}
                        </button>
                      </div>

                      {/* Main Action Button */}
                      {(selectedNetwork === "stacks" && !stacksConnected) ||
                      (selectedNetwork === "ethereum" && !ethConnected) ? (
                        <button
                          onClick={handleMainConnect}
                          disabled={isConnecting}
                          className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xl disabled:opacity-70 disabled:cursor-not-allowed ${
                            selectedNetwork === "stacks"
                              ? "bg-black text-white hover:bg-black/90 shadow-black/10"
                              : "bg-[#627EEA] text-white hover:bg-[#627EEA]/90 shadow-[#627EEA]/20"
                          }`}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-sm">Connecting...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                <Wallet size={16} />
                              </div>
                              <span className="text-sm">
                                {selectedNetwork === "stacks"
                                  ? "Connect Stacks Wallet"
                                  : "Connect Ethereum Wallet"}
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-center py-4 text-green-600 font-medium">
                          <Check size={20} className="inline mr-2" />
                          {selectedNetwork === "stacks"
                            ? "Stacks"
                            : "Ethereum"}{" "}
                          wallet connected!
                        </div>
                      )}

                      {/* More Options */}
                      <div className="mt-6">
                        <button
                          onClick={handleViewMoreOptions}
                          className="w-full py-3 text-muted text-[11px] font-bold hover:text-foreground transition-colors cursor-pointer"
                        >
                          View More Wallet Options
                        </button>
                      </div>

                      {/* Footer Info */}
                      <p className="mt-10 pt-8 border-t border-gray-50 text-center text-[10px] text-muted leading-relaxed font-medium">
                        By connecting, you agree to our{" "}
                        <span className="text-foreground cursor-pointer hover:underline">
                          Terms of Service
                        </span>{" "}
                        and{" "}
                        <span className="text-foreground cursor-pointer hover:underline">
                          Privacy Policy
                        </span>
                        .
                      </p>
                    </motion.div>
                  ) : viewState === "connect-second" ? (
                    <motion.div
                      key="connect-second"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center"
                    >
                      {/* Success Icon */}
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-500" />
                      </div>

                      {/* Success Message */}
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {justConnectedNetwork === "stacks"
                          ? "Stacks"
                          : "Ethereum"}{" "}
                        Wallet Connected!
                      </h3>
                      <p className="text-muted text-sm mb-2">
                        {justConnectedNetwork === "stacks"
                          ? stacksTruncatedAddress
                          : ethTruncatedAddress}
                      </p>

                      {/* Prompt for second wallet */}
                      <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-6 my-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <Image
                            src={
                              otherNetwork === "stacks"
                                ? "https://cryptologos.cc/logos/stacks-stx-logo.png"
                                : "https://cryptologos.cc/logos/ethereum-eth-logo.png"
                            }
                            width={24}
                            height={24}
                            alt={otherNetwork}
                            unoptimized
                          />
                          <span className="text-sm font-bold">
                            Connect{" "}
                            {otherNetwork === "stacks" ? "Stacks" : "Ethereum"}{" "}
                            too?
                          </span>
                        </div>
                        <p className="text-xs text-muted mb-6">
                          For cross-chain bridging, you need both wallets
                          connected.
                        </p>

                        <button
                          onClick={handleConnectSecondWallet}
                          disabled={isConnecting}
                          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 ${
                            otherNetwork === "stacks"
                              ? "bg-black text-white hover:bg-black/90"
                              : "bg-[#627EEA] text-white hover:bg-[#627EEA]/90"
                          }`}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-sm">Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              <span className="text-sm">
                                Connect{" "}
                                {otherNetwork === "stacks"
                                  ? "Stacks"
                                  : "Ethereum"}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Skip Option */}
                      <button
                        onClick={handleSkipSecondWallet}
                        className="flex items-center justify-center gap-2 mx-auto text-muted text-sm font-medium hover:text-foreground transition-colors cursor-pointer"
                      >
                        Skip for now
                        <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      {/* Header */}
                      <div className="mb-8 text-center">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {selectedNetwork === "stacks"
                            ? "Stacks Wallets"
                            : "Ethereum Wallets"}
                        </h3>
                        <p className="text-muted text-sm font-medium">
                          Choose your preferred wallet
                        </p>
                      </div>

                      {/* Wallet Options List */}
                      <div className="space-y-3">
                        {currentWallets.map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => handleWalletOptionConnect()}
                            disabled={isConnecting}
                            className="w-full p-4 rounded-2xl border border-gray-100 hover:border-brand-orange/50 hover:bg-gray-50/50 transition-all flex items-center gap-4 cursor-pointer group disabled:opacity-70"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden group-hover:bg-brand-orange/10 transition-colors">
                              <Image
                                src={wallet.icon}
                                alt={wallet.name}
                                width={28}
                                height={28}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-bold text-sm text-foreground">
                                {wallet.name}
                              </div>
                              <div className="text-xs text-muted">
                                {wallet.description}
                              </div>
                            </div>
                            {isConnecting && (
                              <Loader2
                                size={16}
                                className="animate-spin text-muted"
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Footer Info */}
                      <p className="mt-8 pt-6 border-t border-gray-50 text-center text-[10px] text-muted leading-relaxed font-medium">
                        Don&apos;t have a wallet?{" "}
                        <span className="text-brand-orange cursor-pointer hover:underline">
                          Learn how to get one
                        </span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sophisticated Glows */}
              <div
                className={`absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[120px] -z-10 transition-colors duration-1000 ${
                  viewState === "connect-second"
                    ? "bg-green-500/8"
                    : selectedNetwork === "stacks"
                    ? "bg-brand-orange/8"
                    : "bg-brand-blue/8"
                }`}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
