"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
// No router hooks needed - using window.location for navigation
import {
  connect as stacksConnect,
  disconnect as stacksDisconnect,
  isConnected as stacksIsConnected,
  getLocalStorage as stacksGetLocalStorage,
  clearLocalStorage as stacksClearLocalStorage,
} from "@stacks/connect";

interface EthereumProvider {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  providers?: EthereumProvider[];
}

interface WalletContextType {
  ethConnected: boolean;
  ethAddress: string | null;
  ethTruncatedAddress: string | null;
  connectEthereum: () => Promise<void>;
  disconnectEthereum: () => void;

  stacksConnected: boolean;
  stacksAddress: string | null;
  stacksTruncatedAddress: string | null;
  connectStacks: () => Promise<void>;
  disconnectStacks: () => void;

  isConnected: boolean;
  isConnecting: boolean;
  disconnectAll: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const ETH_STORAGE_KEY = "inflow_eth_wallet";
const STX_STORAGE_KEY = "inflow_stx_wallet";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ethConnected, setEthConnected] = useState(false);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [stacksConnected, setStacksConnected] = useState(false);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const initialized = useRef(false);

  // Track client-side mount for safe navigation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for existing sessions on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Check Ethereum storage
    const savedEth = localStorage.getItem(ETH_STORAGE_KEY);
    if (savedEth) {
      try {
        const { address } = JSON.parse(savedEth);
        if (address) {
          setEthAddress(address);
          setEthConnected(true);
        }
      } catch {
        localStorage.removeItem(ETH_STORAGE_KEY);
      }
    }

    // Check Stacks storage
    const savedStx = localStorage.getItem(STX_STORAGE_KEY);
    if (savedStx) {
      try {
        const { address } = JSON.parse(savedStx);
        if (address) {
          setStacksAddress(address);
          setStacksConnected(true);
        }
      } catch {
        localStorage.removeItem(STX_STORAGE_KEY);
      }
    }

    // Also check @stacks/connect native storage
    if (stacksIsConnected()) {
      const storageData = stacksGetLocalStorage();
      const stxAddress = storageData?.addresses?.stx?.[0]?.address;
      if (stxAddress && !savedStx) {
        setStacksAddress(stxAddress);
        setStacksConnected(true);
        localStorage.setItem(
          STX_STORAGE_KEY,
          JSON.stringify({ address: stxAddress }),
        );
      }
    }
  }, []);

  const connectStacks = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Pass options to force wallet selection - fixes Xverse "Failed to get selected account" error
      const result = await stacksConnect({
        forceWalletSelect: true,
      });

      const stxAddresses = result.addresses.filter(
        (addr) => addr.symbol === "STX" || !addr.symbol,
      );
      const address = stxAddresses[0]?.address;

      if (address) {
        setStacksAddress(address);
        setStacksConnected(true);
        localStorage.setItem(STX_STORAGE_KEY, JSON.stringify({ address }));

        // Only redirect to dashboard if not on a /pay page
        const isPayPage =
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/pay");
        if (!ethConnected && !isPayPage && isMounted) {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // Ignore user-initiated cancellations
      if (
        !msg.includes("cancel") &&
        !msg.includes("reject") &&
        !msg.includes("closed") &&
        !msg.includes("denied")
      ) {
        console.error("Failed to connect Stacks wallet:", error);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [ethConnected, isMounted]);

  const connectEthereum = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Check for Phantom's Ethereum provider first
      const phantomEthereum = (
        window as Window & { phantom?: { ethereum?: EthereumProvider } }
      ).phantom?.ethereum;

      const windowEthereum = (
        window as Window & { ethereum?: EthereumProvider }
      ).ethereum;

      let ethereum: EthereumProvider | undefined;

      // Priority: 1. Phantom, 2. MetaMask, 3. Any available provider
      if (phantomEthereum?.isPhantom) {
        ethereum = phantomEthereum;
      } else if (windowEthereum) {
        if (windowEthereum.isMetaMask) {
          ethereum = windowEthereum;
        } else if (windowEthereum.providers?.length) {
          ethereum =
            windowEthereum.providers.find((p) => p.isMetaMask) ||
            windowEthereum.providers.find((p) => p.isPhantom) ||
            windowEthereum.providers[0];
        } else {
          ethereum = windowEthereum;
        }
      }

      if (ethereum) {
        const accounts = (await ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (accounts?.[0]) {
          setEthAddress(accounts[0]);
          setEthConnected(true);
          localStorage.setItem(
            ETH_STORAGE_KEY,
            JSON.stringify({ address: accounts[0] }),
          );

          // Only redirect to dashboard if not on a /pay page
          const isPayPage =
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/pay");
          if (!stacksConnected && !isPayPage && isMounted) {
            window.location.href = "/dashboard";
          }
        }
      } else {
        window.open("https://metamask.io/download/", "_blank");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: number })?.code;
      if (
        code !== 4001 &&
        !msg.includes("cancel") &&
        !msg.includes("rejected")
      ) {
        console.error("Failed to connect Ethereum wallet:", error);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [stacksConnected, isMounted]);

  const disconnectEthereum = useCallback(() => {
    setEthAddress(null);
    setEthConnected(false);
    localStorage.removeItem(ETH_STORAGE_KEY);
  }, []);

  const disconnectStacksWallet = useCallback(() => {
    stacksDisconnect();
    stacksClearLocalStorage();
    setStacksAddress(null);
    setStacksConnected(false);
    localStorage.removeItem(STX_STORAGE_KEY);
  }, []);

  const disconnectAll = useCallback(() => {
    stacksDisconnect();
    stacksClearLocalStorage();
    setEthAddress(null);
    setEthConnected(false);
    setStacksAddress(null);
    setStacksConnected(false);
    localStorage.removeItem(ETH_STORAGE_KEY);
    localStorage.removeItem(STX_STORAGE_KEY);
  }, []);

  const value: WalletContextType = {
    ethConnected,
    ethAddress,
    ethTruncatedAddress: ethAddress ? truncateAddress(ethAddress) : null,
    connectEthereum,
    disconnectEthereum,
    stacksConnected,
    stacksAddress,
    stacksTruncatedAddress: stacksAddress
      ? truncateAddress(stacksAddress)
      : null,
    connectStacks,
    disconnectStacks: disconnectStacksWallet,
    isConnected: ethConnected || stacksConnected,
    isConnecting,
    disconnectAll,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
