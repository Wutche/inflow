"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
  ExternalLink,
  Fuel,
} from "lucide-react";
import Image from "next/image";
import { useBridge } from "@/hooks/useBridge";
import { useBridgeHistory } from "@/hooks/useBridgeHistory";
import type { BridgeDirection } from "@/lib/bridge-utils";

// ============================================================================
// TYPES
// ============================================================================

type NetworkType = "Ethereum" | "Stacks";

interface NetworkConfig {
  name: NetworkType;
  logo: string;
  color: string;
  bgColor: string;
  token: string;
  addressPrefix: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NETWORKS: Record<NetworkType, NetworkConfig> = {
  Ethereum: {
    name: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    color: "#627EEA",
    bgColor: "bg-[#627EEA]/10",
    token: "USDC",
    addressPrefix: "0x",
  },
  Stacks: {
    name: "Stacks",
    logo: "https://cryptologos.cc/logos/stacks-stx-logo.png",
    color: "#5546FF",
    bgColor: "bg-[#5546FF]/10",
    token: "USDCx",
    addressPrefix: "SP",
  },
};

// ============================================================================
// BRIDGING ANIMATION COMPONENT
// ============================================================================

function BridgingAnimation() {
  return (
    <div className="flex items-center justify-center gap-1">
      {/* Animated bridge dots */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-white"
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SUCCESS MODAL COMPONENT
// ============================================================================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  fromNetwork: NetworkType;
}

function SuccessModal({
  isOpen,
  onClose,
  txHash,
  fromNetwork,
}: SuccessModalProps) {
  const explorerUrl =
    fromNetwork === "Ethereum"
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : `https://explorer.stacks.co/txid/${txHash}?chain=testnet`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-3xl p-8 shadow-2xl mx-4">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                >
                  <Check size={40} className="text-white" strokeWidth={3} />
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-center mb-2">
                Bridge Successful!
              </h3>
              <p className="text-muted text-center text-sm mb-6">
                Your transaction has been submitted to the network.
              </p>

              {/* Transaction ID */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">
                  Transaction ID
                </p>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-orange hover:underline group"
                >
                  <span className="font-mono text-sm truncate">{txHash}</span>
                  <ExternalLink
                    size={14}
                    className="shrink-0 group-hover:translate-x-0.5 transition-transform"
                  />
                </a>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
              >
                <span>Close</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BridgePaymentCard() {
  // Network state
  const [fromNetwork, setFromNetwork] = useState<NetworkType>("Ethereum");
  const [toNetwork, setToNetwork] = useState<NetworkType>("Stacks");

  // Form state
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Track the saved transaction hash for the success modal
  const [savedTxHash, setSavedTxHash] = useState<string | null>(null);

  // Modal is shown when we have a saved tx hash
  const showSuccessModal = savedTxHash !== null;

  // Bridge hook
  const {
    status,
    needsApproval,
    txHash,
    error,
    estimatedGas,
    validateRecipient,
    validateAmount,
    checkAllowance,
    approveUSDC,
    bridge,
    reset,
    isEthConnected,
    isStacksConnected,
  } = useBridge();

  // Derive bridge direction (must come before hooks that use it)
  const direction: BridgeDirection =
    fromNetwork === "Ethereum" ? "eth-to-stacks" : "stacks-to-eth";

  // Bridge history hook
  const { addTransaction } = useBridgeHistory();

  // Track if we've already processed this success to avoid double-adding
  const processedTxRef = useRef<string | null>(null);

  // Save to history when bridge succeeds
  // This effect synchronizes with the bridge hook's status change - setState is intentional
  useEffect(() => {
    if (status === "success" && txHash && amount && recipient) {
      // Only process if we haven't already processed this txHash
      if (processedTxRef.current !== txHash) {
        processedTxRef.current = txHash;
        // Save transaction to history (external side effect)
        addTransaction({
          txHash,
          direction,
          amount,
          recipientAddress: recipient,
        });
        // eslint-disable-next-line -- Intentional: show modal when external hook reports success
        setSavedTxHash(txHash);
      }
    }
  }, [status, txHash, amount, recipient, direction, addTransaction]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setSavedTxHash(null);
    reset();
    setAmount("");
    setRecipient("");
  }, [reset]);

  // Check if wallet is connected for the source chain
  const isSourceWalletConnected =
    fromNetwork === "Ethereum" ? isEthConnected : isStacksConnected;

  // Get network configs
  const fromConfig = NETWORKS[fromNetwork];
  const toConfig = NETWORKS[toNetwork];

  // Check allowance on mount and when direction changes
  useEffect(() => {
    if (fromNetwork === "Ethereum" && isEthConnected) {
      checkAllowance();
    }
  }, [fromNetwork, isEthConnected, checkAllowance]);

  // Handle network switch
  const handleSwitchNetworks = useCallback(() => {
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
    setRecipient("");
    setAddressError(null);
    setAmountError(null);
    reset();
  }, [fromNetwork, toNetwork, reset]);

  // Validate recipient on change
  const handleRecipientChange = useCallback(
    (value: string) => {
      setRecipient(value);
      if (value.length > 0) {
        const error = validateRecipient(value, direction);
        setAddressError(error);
      } else {
        setAddressError(null);
      }
    },
    [validateRecipient, direction],
  );

  // Validate amount on change
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value);
      if (value.length > 0) {
        const error = validateAmount(value);
        setAmountError(error);
      } else {
        setAmountError(null);
      }
    },
    [validateAmount],
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate inputs
    const recipientValidation = validateRecipient(recipient, direction);
    const amountValidation = validateAmount(amount);

    if (recipientValidation) {
      setAddressError(recipientValidation);
      return;
    }
    if (amountValidation) {
      setAmountError(amountValidation);
      return;
    }

    // For Eth->Stacks, check if approval is needed
    if (direction === "eth-to-stacks" && needsApproval) {
      const approved = await approveUSDC(amount);
      if (!approved) return;
    }

    // Execute bridge
    await bridge(direction, amount, recipient);
  }, [
    recipient,
    amount,
    direction,
    needsApproval,
    validateRecipient,
    validateAmount,
    approveUSDC,
    bridge,
  ]);

  // Get button content based on state
  const getButtonContent = (): { text: string; icon: React.ReactNode } => {
    if (!isSourceWalletConnected) {
      return {
        text: `Connect ${fromNetwork} Wallet`,
        icon: null,
      };
    }

    switch (status) {
      case "checking":
        return {
          text: "Checking...",
          icon: <BridgingAnimation />,
        };
      case "approving":
        return {
          text: "Approving USDC",
          icon: <BridgingAnimation />,
        };
      case "bridging":
        return {
          text: "Bridging",
          icon: <BridgingAnimation />,
        };
      case "success":
        return {
          text: "Bridge Complete!",
          icon: <Check size={16} />,
        };
      case "error":
        return {
          text: "Try Again",
          icon: <AlertTriangle size={16} />,
        };
      default:
        if (direction === "eth-to-stacks" && needsApproval) {
          return {
            text: "Approve USDC",
            icon: <ArrowRight size={16} />,
          };
        }
        return {
          text: "Send Payment",
          icon: <ArrowRight size={16} />,
        };
    }
  };

  const buttonContent = getButtonContent();
  const isLoading = ["checking", "approving", "bridging"].includes(status);
  const isDisabled =
    isLoading ||
    !isSourceWalletConnected ||
    !amount ||
    !recipient ||
    !!addressError ||
    !!amountError;

  return (
    <>
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        txHash={txHash || ""}
        fromNetwork={fromNetwork}
      />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white border border-border-subtle rounded-[32px] p-8 shadow-sm relative overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            Send Payment
          </h2>
          <p className="text-muted text-xs font-medium">
            Bridge USDC to another network with xReserve.
          </p>
        </div>

        {/* Network Selector */}
        <div className="bg-sidebar rounded-2xl p-5 border border-border-subtle mb-8">
          <div className="flex items-center justify-between gap-6 relative">
            {/* From Network */}
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted mb-3 text-center">
                From
              </div>
              <div className="flex items-center justify-center gap-3 py-2.5 px-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fromConfig.bgColor} ring-1 ring-[${fromConfig.color}]/20`}
                >
                  <Image
                    src={fromConfig.logo}
                    width={16}
                    height={16}
                    alt={fromConfig.name}
                    unoptimized
                  />
                </div>
                <span className="text-xs font-bold tracking-tight">
                  {fromConfig.name}
                </span>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwitchNetworks}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-white border border-border-subtle shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer group z-10 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftRight
                size={14}
                className="text-brand-orange group-hover:rotate-180 transition-transform duration-500"
              />
            </button>

            {/* To Network */}
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted mb-3 text-center">
                To
              </div>
              <div className="flex items-center justify-center gap-3 py-2.5 px-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toConfig.bgColor} ring-1 ring-[${toConfig.color}]/20`}
                >
                  <Image
                    src={toConfig.logo}
                    width={16}
                    height={16}
                    alt={toConfig.name}
                    unoptimized
                  />
                </div>
                <span className="text-xs font-bold tracking-tight">
                  {toConfig.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6 flex-1">
          {/* Amount Input */}
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-3">
              Amount
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                $
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isLoading}
                className={`w-full pl-8 pr-16 py-3 bg-sidebar border rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all disabled:opacity-50 ${
                  amountError ? "border-red-300" : "border-border-subtle"
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-blue opacity-60">
                {fromConfig.token}
              </div>
            </div>
            {amountError && (
              <p className="text-red-500 text-[10px] font-medium mt-2">
                {amountError}
              </p>
            )}
          </div>

          {/* Recipient Input */}
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-3">
              Recipient Address
            </label>
            <input
              type="text"
              placeholder={`${toConfig.addressPrefix}...`}
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-sidebar border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all disabled:opacity-50 ${
                addressError ? "border-red-300" : "border-border-subtle"
              }`}
            />
            {addressError && (
              <p className="text-red-500 text-[10px] font-medium mt-2">
                {addressError}
              </p>
            )}
          </div>

          {/* Gas Estimate */}
          {estimatedGas && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted">
              <Fuel size={12} />
              <span>Estimated gas: {estimatedGas}</span>
            </div>
          )}

          {/* Security Badge */}
          <div className="bg-brand-orange/5 border border-dashed border-brand-orange/20 rounded-xl p-4 flex items-center gap-3">
            <ShieldCheck size={14} className="text-brand-orange shrink-0" />
            <p className="text-[10px] font-bold text-muted uppercase tracking-tight">
              Secured by Bitcoin Finality
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-[10px] font-bold text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl group cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed ${
              status === "success"
                ? "bg-green-500 text-white shadow-green-500/20"
                : status === "error"
                  ? "bg-red-500 text-white shadow-red-500/20"
                  : isLoading
                    ? "bg-gradient-to-r from-brand-orange to-orange-400 text-white shadow-brand-orange/20"
                    : "bg-black text-white shadow-black/10 hover:bg-black/90"
            }`}
          >
            {buttonContent.icon && (
              <span
                className={
                  !isLoading
                    ? "group-hover:translate-x-1 transition-transform"
                    : ""
                }
              >
                {buttonContent.icon}
              </span>
            )}
            <span className="text-sm">{buttonContent.text}</span>
          </button>
        </div>

        {/* Decorative Glow */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-orange/4 rounded-full blur-[100px] -z-10" />
      </motion.div>
    </>
  );
}
