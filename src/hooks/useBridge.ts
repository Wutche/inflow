"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  XRESERVE_CONTRACT,
  XRESERVE_STACKS_CONTRACT,
  USDC_SEPOLIA,
  USDCX_STACKS,
  DOMAIN_IDS,
  stacksAddressToBytes32,
  ethereumAddressToBuffer,
  parseTokenAmount,
  ethereumAddressSchema,
  stacksAddressSchema,
  amountSchema,
  type BridgeDirection,
  type BridgeResult,
} from "@/lib/bridge-utils";
import { openContractCall } from "@stacks/connect";
import {
  uintCV,
  bufferCV,
  standardPrincipalCV,
  noneCV,
  PostConditionMode,
} from "@stacks/transactions";
import type { FungiblePostCondition } from "@stacks/transactions";

// ============================================================================
// TYPES
// ============================================================================

export type BridgeStatus =
  | "idle"
  | "checking"
  | "approving"
  | "bridging"
  | "success"
  | "error";

export interface BridgeState {
  status: BridgeStatus;
  needsApproval: boolean;
  txHash: string | null;
  error: string | null;
  estimatedGas: string | null;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBridge() {
  const { ethAddress, ethConnected, stacksAddress, stacksConnected } =
    useWallet();

  const [state, setState] = useState<BridgeState>({
    status: "idle",
    needsApproval: true,
    txHash: null,
    error: null,
    estimatedGas: "~$0.50", // Mocked for testnet
  });

  /**
   * Resets the bridge state to idle
   */
  const reset = useCallback(() => {
    setState({
      status: "idle",
      needsApproval: true,
      txHash: null,
      error: null,
      estimatedGas: "~$0.50",
    });
  }, []);

  /**
   * Validates the recipient address based on bridge direction
   */
  const validateRecipient = useCallback(
    (recipient: string, direction: BridgeDirection): string | null => {
      if (direction === "eth-to-stacks") {
        const result = stacksAddressSchema.safeParse(recipient);
        if (!result.success) {
          return "Invalid Stacks address (must start with ST or SP)";
        }
      } else {
        const result = ethereumAddressSchema.safeParse(recipient);
        if (!result.success) {
          return "Invalid Ethereum address (must start with 0x)";
        }
      }
      return null;
    },
    [],
  );

  /**
   * Validates the amount
   */
  const validateAmount = useCallback((amount: string): string | null => {
    const result = amountSchema.safeParse(amount);
    if (!result.success) {
      return result.error.errors[0]?.message || "Invalid amount";
    }
    return null;
  }, []);

  /**
   * Gets the Ethereum provider (supports Phantom, MetaMask, and others)
   */
  const getEthereumProvider = useCallback((): EthereumProvider | null => {
    // Check for Phantom's Ethereum provider first
    const phantomEthereum = (
      window as Window & { phantom?: { ethereum?: EthereumProvider } }
    ).phantom?.ethereum;

    if (phantomEthereum) {
      return phantomEthereum;
    }

    // Fall back to window.ethereum (MetaMask or other)
    const ethereum = (window as Window & { ethereum?: EthereumProvider })
      .ethereum;
    return ethereum || null;
  }, []);

  /**
   * Checks USDC allowance for the xReserve contract
   */
  const checkAllowance = useCallback(async (): Promise<boolean> => {
    if (!ethConnected || !ethAddress) {
      setState((s) => ({ ...s, error: "Ethereum wallet not connected" }));
      return false;
    }

    const ethereum = getEthereumProvider();
    if (!ethereum) {
      setState((s) => ({ ...s, error: "No Ethereum provider found" }));
      return false;
    }

    setState((s) => ({ ...s, status: "checking" }));

    try {
      // Encode allowance(owner, spender) call
      const ownerPadded = ethAddress.slice(2).padStart(64, "0");
      const spenderPadded = XRESERVE_CONTRACT.address
        .slice(2)
        .padStart(64, "0");
      const data = `0xdd62ed3e${ownerPadded}${spenderPadded}`;

      const result = (await ethereum.request({
        method: "eth_call",
        params: [
          {
            to: USDC_SEPOLIA.address,
            data,
          },
          "latest",
        ],
      })) as string;

      // Handle empty or invalid responses - "0x" means no data returned
      // This can happen if the contract doesn't exist on the current network
      let allowance = BigInt(0);
      if (result && result !== "0x" && result.length > 2) {
        try {
          allowance = BigInt(result);
        } catch {
          console.warn("Could not parse allowance result:", result);
          // Default to 0 (needs approval)
        }
      }

      const hasAllowance = allowance > BigInt(0);

      setState((s) => ({
        ...s,
        status: "idle",
        needsApproval: !hasAllowance,
      }));

      return hasAllowance;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to check allowance";
      setState((s) => ({
        ...s,
        status: "error",
        error: message,
      }));
      return false;
    }
  }, [ethConnected, ethAddress, getEthereumProvider]);

  /**
   * Approves USDC spending for the xReserve contract
   */
  const approveUSDC = useCallback(
    async (_amount: string): Promise<boolean> => {
      try {
        if (!ethConnected || !ethAddress) {
          setState((s) => ({
            ...s,
            status: "error",
            error: "Ethereum wallet not connected",
          }));
          return false;
        }

        const ethereum = getEthereumProvider();
        if (!ethereum) {
          setState((s) => ({
            ...s,
            status: "error",
            error: "No Ethereum provider found",
          }));
          return false;
        }

        setState((s) => ({ ...s, status: "checking", error: null }));

        // Verify we're on Sepolia network (chain ID 11155111 = 0xaa36a7)
        try {
          const chainId = (await ethereum.request({
            method: "eth_chainId",
          })) as string;
          const sepoliaChainId = "0xaa36a7"; // 11155111 in hex

          if (chainId !== sepoliaChainId) {
            // Try to switch to Sepolia
            try {
              await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: sepoliaChainId }],
              });
            } catch (switchError: unknown) {
              // If Sepolia is not added, add it
              const errCode = (switchError as { code?: number })?.code;
              if (errCode === 4902) {
                try {
                  await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                      {
                        chainId: sepoliaChainId,
                        chainName: "Sepolia Testnet",
                        nativeCurrency: {
                          name: "Sepolia ETH",
                          symbol: "ETH",
                          decimals: 18,
                        },
                        rpcUrls: ["https://rpc.sepolia.org"],
                        blockExplorerUrls: ["https://sepolia.etherscan.io"],
                      },
                    ],
                  });
                } catch {
                  setState((s) => ({
                    ...s,
                    status: "error",
                    error: "Please switch to Sepolia network in your wallet",
                  }));
                  return false;
                }
              } else {
                setState((s) => ({
                  ...s,
                  status: "error",
                  error: "Please switch to Sepolia network in your wallet",
                }));
                return false;
              }
            }
          }
        } catch {
          console.warn("Could not verify chain ID");
        }

        setState((s) => ({ ...s, status: "approving", error: null }));

        // Use max approval for better UX
        const maxApproval =
          "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        const spenderPadded = XRESERVE_CONTRACT.address
          .slice(2)
          .padStart(64, "0");
        const data = `0x095ea7b3${spenderPadded}${maxApproval}`;

        // Send approval transaction - capture both success and error
        let txError: unknown = null;
        let txSuccess = false;

        try {
          await ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: ethAddress,
                to: USDC_SEPOLIA.address,
                data,
                gas: "0x186A0", // 100000 gas - enough for approve
              },
            ],
          });
          txSuccess = true;
        } catch (err) {
          txError = err;
          console.error("Transaction request failed:", err);
        }

        // Handle transaction error
        if (txError || !txSuccess) {
          let message = "Failed to approve USDC";
          if (txError instanceof Error) {
            message = txError.message;
          } else if (typeof txError === "object" && txError !== null) {
            const errObj = txError as Record<string, unknown>;
            message = String(
              errObj.message || errObj.reason || "Transaction failed",
            );
          }

          // User-friendly messages
          if (
            message.includes("rejected") ||
            message.includes("denied") ||
            message.includes("cancel")
          ) {
            message = "Transaction rejected by user";
          } else if (
            message.includes("insufficient") ||
            message.includes("gas")
          ) {
            message =
              "Insufficient ETH for gas fees. Get Sepolia ETH from a faucet.";
          }

          setState((s) => ({
            ...s,
            status: "error",
            error: message,
          }));
          return false;
        }

        // Wait for transaction confirmation (simplified)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setState((s) => ({
          ...s,
          status: "idle",
          needsApproval: false,
        }));

        return true;
      } catch (error: unknown) {
        console.error("Approval error:", error);

        // Extract error message from various formats
        let message = "Failed to approve USDC";
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === "object" && error !== null) {
          const errObj = error as Record<string, unknown>;
          if (errObj.message) {
            message = String(errObj.message);
          } else if (errObj.reason) {
            message = String(errObj.reason);
          } else if (errObj.error && typeof errObj.error === "object") {
            const innerErr = errObj.error as Record<string, unknown>;
            if (innerErr.message) message = String(innerErr.message);
          }
        } else if (typeof error === "string") {
          message = error;
        }

        // User-friendly error messages
        let userMessage = message;
        if (
          message.includes("rejected") ||
          message.includes("denied") ||
          message.includes("cancel")
        ) {
          userMessage = "Transaction rejected by user";
        } else if (
          message.includes("insufficient") ||
          message.includes("gas")
        ) {
          userMessage =
            "Insufficient ETH for gas fees. Get Sepolia ETH from a faucet.";
        }

        setState((s) => ({
          ...s,
          status: "error",
          error: userMessage,
        }));
        return false;
      }
    },
    [ethConnected, ethAddress, getEthereumProvider],
  );

  /**
   * Bridges USDC from Ethereum to Stacks via xReserve
   */
  const bridgeEthToStacks = useCallback(
    async (amount: string, recipient: string): Promise<BridgeResult> => {
      if (!ethConnected || !ethAddress)
        return { success: false, error: "Wallet not connected" };
      const ethereum = getEthereumProvider();
      if (!ethereum) return { success: false, error: "No provider" };

      setState((s) => ({ ...s, status: "bridging", error: null }));
      try {
        const amountInUnits = parseTokenAmount(amount, USDC_SEPOLIA.decimals);
        const recipientBytes32 = stacksAddressToBytes32(recipient);
        const amountHex = amountInUnits.toString(16).padStart(64, "0");
        const domainHex = DOMAIN_IDS.STACKS.toString(16).padStart(64, "0");
        const recipientHex = recipientBytes32.slice(2);
        const tokenHex = USDC_SEPOLIA.address.slice(2).padStart(64, "0");
        const selector = "0xfaadb53b";
        const data = `${selector}${amountHex}${domainHex}${recipientHex}${tokenHex}${"0".padStart(64, "0")}${(6 * 32).toString(16).padStart(64, "0")}${"0".padStart(64, "0")}`;

        const txHash = (await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: ethAddress,
              to: XRESERVE_CONTRACT.address,
              data,
              gas: "0x493E0",
            },
          ],
        })) as string;

        setState((s) => ({ ...s, status: "success", txHash }));
        return { success: true, txHash };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
        return { success: false, error: msg };
      }
    },
    [ethConnected, ethAddress, getEthereumProvider],
  );

  /**
   * Transfers USDC from Ethereum to Ethereum (Local)
   */
  const bridgeEthToEth = useCallback(
    async (amount: string, recipient: string): Promise<BridgeResult> => {
      if (!ethConnected || !ethAddress)
        return { success: false, error: "Wallet not connected" };
      const ethereum = getEthereumProvider();
      if (!ethereum) return { success: false, error: "No provider" };

      setState((s) => ({ ...s, status: "bridging", error: null }));
      try {
        const amountInUnits = parseTokenAmount(amount, USDC_SEPOLIA.decimals);
        const amountHex = amountInUnits.toString(16).padStart(64, "0");
        const recipientPadded = recipient.slice(2).padStart(64, "0");
        const data = `0xa9059cbb${recipientPadded}${amountHex}`;

        const txHash = (await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: ethAddress,
              to: USDC_SEPOLIA.address,
              data,
              gas: "0x186A0",
            },
          ],
        })) as string;

        setState((s) => ({ ...s, status: "success", txHash }));
        return { success: true, txHash };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
        return { success: false, error: msg };
      }
    },
    [ethConnected, ethAddress, getEthereumProvider],
  );

  /**
   * Bridges USDCx from Stacks to Ethereum via xReserve
   */
  const bridgeStacksToEth = useCallback(
    async (amount: string, recipient: string): Promise<BridgeResult> => {
      if (!stacksConnected || !stacksAddress)
        return { success: false, error: "Wallet not connected" };
      setState((s) => ({ ...s, status: "bridging", error: null }));
      try {
        const amountInUnits = parseTokenAmount(amount, USDCX_STACKS.decimals);
        const recipientBuffer = ethereumAddressToBuffer(recipient);
        const postCondition: FungiblePostCondition = {
          type: "ft-postcondition",
          address: stacksAddress,
          condition: "lte",
          asset: `${USDCX_STACKS.principal}::usdcx-token`,
          amount: amountInUnits,
        };

        return new Promise((resolve) => {
          openContractCall({
            contractAddress: XRESERVE_STACKS_CONTRACT.address,
            contractName: XRESERVE_STACKS_CONTRACT.name,
            functionName: "burn",
            functionArgs: [
              uintCV(amountInUnits),
              uintCV(DOMAIN_IDS.ETHEREUM),
              bufferCV(recipientBuffer),
            ],
            network: "testnet",
            postConditionMode: PostConditionMode.Deny,
            postConditions: [postCondition],
            onFinish: (data) => {
              setState((s) => ({ ...s, status: "success", txHash: data.txId }));
              resolve({ success: true, txHash: data.txId });
            },
            onCancel: () => {
              setState((s) => ({ ...s, status: "error", error: "Cancelled" }));
              resolve({ success: false, error: "Cancelled" });
            },
          });
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
        return { success: false, error: msg };
      }
    },
    [stacksConnected, stacksAddress],
  );

  /**
   * Transfers USDCx from Stacks to Stacks (Local)
   */
  const bridgeStacksToStacks = useCallback(
    async (amount: string, recipient: string): Promise<BridgeResult> => {
      if (!stacksConnected || !stacksAddress)
        return { success: false, error: "Wallet not connected" };
      setState((s) => ({ ...s, status: "bridging", error: null }));
      try {
        const amountInUnits = parseTokenAmount(amount, USDCX_STACKS.decimals);
        const [contractAddress, contractName] =
          USDCX_STACKS.principal.split(".");
        const postCondition: FungiblePostCondition = {
          type: "ft-postcondition",
          address: stacksAddress,
          condition: "lte",
          asset: `${USDCX_STACKS.principal}::usdcx-token`,
          amount: amountInUnits,
        };

        return new Promise((resolve) => {
          openContractCall({
            contractAddress,
            contractName,
            functionName: "transfer",
            functionArgs: [
              uintCV(amountInUnits),
              standardPrincipalCV(stacksAddress), // Sender
              standardPrincipalCV(recipient), // Recipient
              noneCV(), // Optional memo (none)
            ],
            network: "testnet",
            postConditionMode: PostConditionMode.Deny,
            postConditions: [postCondition],
            onFinish: (data) => {
              setState((s) => ({ ...s, status: "success", txHash: data.txId }));
              resolve({ success: true, txHash: data.txId });
            },
            onCancel: () => {
              setState((s) => ({ ...s, status: "error", error: "Cancelled" }));
              resolve({ success: false, error: "Cancelled" });
            },
          });
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
        return { success: false, error: msg };
      }
    },
    [stacksConnected, stacksAddress],
  );

  /**
   * Main bridge function that routes to the correct bridge direction
   */
  const bridge = useCallback(
    async (
      direction: BridgeDirection,
      amount: string,
      recipient: string,
    ): Promise<BridgeResult> => {
      switch (direction) {
        case "eth-to-stacks":
          return bridgeEthToStacks(amount, recipient);
        case "stacks-to-eth":
          return bridgeStacksToEth(amount, recipient);
        case "stacks-to-stacks":
          return bridgeStacksToStacks(amount, recipient);
        case "eth-to-eth":
          return bridgeEthToEth(amount, recipient);
        default:
          return { success: false, error: "Invalid direction" };
      }
    },
    [
      bridgeEthToStacks,
      bridgeStacksToEth,
      bridgeEthToEth,
      bridgeStacksToStacks,
    ],
  );

  return {
    // State
    ...state,

    // Validation
    validateRecipient,
    validateAmount,

    // Actions
    checkAllowance,
    approveUSDC,
    bridge,
    reset,

    // Wallet state
    isEthConnected: ethConnected,
    isStacksConnected: stacksConnected,
    ethAddress,
    stacksAddress,
  };
}
