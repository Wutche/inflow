/**
 * @fileoverview Bridge Utilities for Inflow Cross-Chain Bridging
 *
 * This module provides utilities for the xReserve bridge between
 * Ethereum (Sepolia) and Stacks (Testnet).
 *
 * Uses the official xReserve protocol encoding for Stacks addresses.
 */

import { z } from "zod";
import * as P from "micro-packed";
import {
  createAddress,
  addressToString,
  AddressVersion,
  StacksWireType,
} from "@stacks/transactions";
import { hex } from "@scure/base";

// ============================================================================
// CONTRACT CONSTANTS
// ============================================================================

/**
 * Circle xReserve Bridge Contract on Sepolia
 * Source: https://docs.usdcx.io/bridging/usdcx/contracts
 */
export const XRESERVE_CONTRACT = {
  address: "0x008888878f94C0d87defdf0B07f46B93C1934442" as const,
  chainId: 11155111, // Sepolia
} as const;

/**
 * USDC Token Contract on Sepolia
 */
export const USDC_SEPOLIA = {
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const,
  decimals: 6,
  symbol: "USDC",
} as const;

/**
 * USDCx Token Contract on Stacks Testnet
 */
export const USDCX_STACKS = {
  principal: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx" as const,
  decimals: 6,
  symbol: "USDCx",
} as const;

/**
 * xReserve Bridge Contract on Stacks Testnet
 * This is the entry point for bridge operations (Stacks → Ethereum)
 */
export const XRESERVE_STACKS_CONTRACT = {
  address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" as const,
  name: "usdcx-v1" as const,
} as const;

/**
 * Circle CCTP Domain IDs
 * Stacks domain ID is 10003 for all networks
 */
export const DOMAIN_IDS = {
  ETHEREUM: 0,
  STACKS: 10003,
} as const;

// ============================================================================
// ABI FRAGMENTS
// ============================================================================

/**
 * Minimal ABI for xReserve depositToRemote function
 * Matches the official xReserve contract interface
 */
export const XRESERVE_ABI = [
  {
    name: "depositToRemote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "value", type: "uint256" },
      { name: "remoteDomain", type: "uint32" },
      { name: "remoteRecipient", type: "bytes32" },
      { name: "localToken", type: "address" },
      { name: "maxFee", type: "uint256" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/**
 * Minimal ABI for USDC ERC20 functions
 */
export const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Validates Ethereum address format (0x + 40 hex chars)
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

/**
 * Validates Stacks address format (ST or SP + alphanumeric)
 */
export const stacksAddressSchema = z
  .string()
  .regex(
    /^(ST|SP)[A-Z0-9]{38,41}$/,
    "Invalid Stacks address format (must start with ST or SP)",
  );

/**
 * Validates amount as a positive number string
 */
export const amountSchema = z
  .string()
  .regex(
    /^\d+(\.\d{1,6})?$/,
    "Amount must be a valid number (up to 6 decimals)",
  )
  .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0");

// ============================================================================
// STACKS ADDRESS ENCODING (Official xReserve Protocol)
// ============================================================================

/**
 * Remote recipient coder for Stacks addresses.
 * Encodes/decodes Stacks addresses to/from bytes32 format.
 *
 * Format:
 * - 11 zero bytes (left padding)
 * - 1 version byte (from Stacks address)
 * - 20 bytes hash160 (from Stacks address)
 *
 * This is the official encoding required by the xReserve protocol.
 */
export const remoteRecipientCoder = P.wrap<string>({
  encodeStream(w, value: string) {
    const address = createAddress(value);
    // Left pad with 11 zero bytes
    P.bytes(11).encodeStream(w, new Uint8Array(11).fill(0));
    // 1 version byte
    P.U8.encodeStream(w, address.version);
    // 20 hash bytes
    P.bytes(20).encodeStream(w, hex.decode(address.hash160));
  },
  decodeStream(r) {
    // Skip left padding (11 bytes)
    P.bytes(11).decodeStream(r);
    // 1 version byte
    const version = P.U8.decodeStream(r);
    // 20 hash bytes
    const hash = P.bytes(20).decodeStream(r);
    return addressToString({
      hash160: hex.encode(hash),
      version: version as AddressVersion,
      type: StacksWireType.Address,
    });
  },
});

/**
 * Converts bytes to a hex string padded to 32 bytes.
 *
 * @param bytes - Uint8Array to convert
 * @returns bytes32 hex string (0x prefixed, 64 hex chars)
 */
export function bytes32FromBytes(bytes: Uint8Array): `0x${string}` {
  // Pad to 32 bytes (64 hex chars)
  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  const hexStr = hex.encode(padded);
  return `0x${hexStr}` as `0x${string}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts an Ethereum address to bytes32 format for CCTP.
 *
 * The address is left-padded with zeros to fill 32 bytes.
 *
 * @param address - Ethereum address (0x prefixed, 40 hex chars)
 * @returns bytes32 hex string (0x prefixed, 64 hex chars)
 *
 * @example
 * addressToBytes32("0x1234...abcd")
 * // Returns: "0x0000000000000000000000001234...abcd"
 */
export function addressToBytes32(address: string): `0x${string}` {
  // Validate the address format
  const result = ethereumAddressSchema.safeParse(address);
  if (!result.success) {
    throw new Error(`Invalid address: ${result.error.message}`);
  }

  // Remove 0x prefix, pad to 64 chars (32 bytes), add 0x prefix back
  const cleanAddress = address.slice(2).toLowerCase();
  const padded = cleanAddress.padStart(64, "0");
  return `0x${padded}` as `0x${string}`;
}

/**
 * Converts a Stacks principal address to bytes32 format for xReserve.
 *
 * Uses the official xReserve protocol encoding:
 * - 11 zero bytes (left padding)
 * - 1 version byte
 * - 20 bytes hash160
 *
 * @param principal - Stacks principal address (ST... or SP...)
 * @returns bytes32 hex string (0x prefixed, 64 hex chars)
 *
 * @example
 * stacksAddressToBytes32("ST1F1M4YP67NV360FBYR28V7C599AC46F8C4635SH")
 * // Returns: "0x000000000000000000000000..."
 */
export function stacksAddressToBytes32(principal: string): `0x${string}` {
  const result = stacksAddressSchema.safeParse(principal);
  if (!result.success) {
    throw new Error(`Invalid Stacks address: ${result.error.message}`);
  }

  // Use the official xReserve encoding
  const encoded = remoteRecipientCoder.encode(principal);
  return bytes32FromBytes(encoded);
}

/**
 * Converts an Ethereum address to a 32-byte buffer for Stacks contract calls.
 *
 * The address is left-padded with zeros to fill 32 bytes.
 * This is used for Stacks → Ethereum bridge calls where the recipient
 * is an Ethereum address that needs to be passed as a buffer.
 *
 * @param address - Ethereum address (0x prefixed, 40 hex chars)
 * @returns Uint8Array of 32 bytes (12 zero bytes + 20 address bytes)
 *
 * @example
 * ethereumAddressToBuffer("0x1234567890123456789012345678901234567890")
 * // Returns: Uint8Array with 12 zero bytes followed by 20 address bytes
 */
export function ethereumAddressToBuffer(address: string): Uint8Array {
  const result = ethereumAddressSchema.safeParse(address);
  if (!result.success) {
    throw new Error(`Invalid Ethereum address: ${result.error.message}`);
  }
  // Decode the hex address (20 bytes) and left-pad to 32 bytes
  const addressBytes = hex.decode(address.slice(2));
  const padded = new Uint8Array(32);
  padded.set(addressBytes, 12); // 32 - 20 = 12 bytes padding
  return padded;
}

/**
 * Parses a decimal amount string to token units (with decimals).
 *
 * @param amount - Decimal amount as string (e.g., "100.50")
 * @param decimals - Token decimals (default: 6 for USDC)
 * @returns BigInt in smallest unit
 *
 * @example
 * parseTokenAmount("100.50", 6)
 * // Returns: 100500000n
 */
export function parseTokenAmount(amount: string, decimals = 6): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Formats token units to decimal string.
 *
 * @param amount - Amount in smallest unit
 * @param decimals - Token decimals (default: 6 for USDC)
 * @returns Formatted decimal string
 */
export function formatTokenAmount(amount: bigint, decimals = 6): string {
  const str = amount.toString().padStart(decimals + 1, "0");
  const insertPosition = str.length - decimals;
  const whole = str.slice(0, insertPosition);
  const fraction = str.slice(insertPosition);
  return `${whole}.${fraction}`;
}

/**
 * Encodes function call data for Ethereum transactions.
 * Uses raw ABI encoding for browser wallet compatibility.
 */
export function encodeFunctionData(
  functionName: "approve" | "depositToRemote",
  args: unknown[],
): `0x${string}` {
  if (functionName === "approve") {
    // approve(address spender, uint256 amount)
    // Function selector: 0x095ea7b3
    const [spender, amount] = args as [string, bigint];
    const spenderPadded = (spender as string).slice(2).padStart(64, "0");
    const amountHex = amount.toString(16).padStart(64, "0");
    return `0x095ea7b3${spenderPadded}${amountHex}` as `0x${string}`;
  }

  if (functionName === "depositToRemote") {
    // depositToRemote(uint256 value, uint32 remoteDomain, bytes32 remoteRecipient, address localToken, uint256 maxFee, bytes hookData)
    // Function selector needs to be computed from the exact signature
    const [value, remoteDomain, remoteRecipient, localToken, maxFee] = args as [
      bigint,
      number,
      string,
      string,
      bigint,
    ];

    const valueHex = value.toString(16).padStart(64, "0");
    const domainHex = remoteDomain.toString(16).padStart(64, "0");
    // remoteRecipient is already bytes32 format, just remove 0x prefix
    const recipientHex = (remoteRecipient as string).slice(2);
    const tokenHex = (localToken as string).slice(2).padStart(64, "0");
    const feeHex = maxFee.toString(16).padStart(64, "0");
    // hookData is dynamic bytes - offset points to position, then length, then data
    // Offset = 6 * 32 = 192 = 0xc0 (position after all fixed params)
    const hookDataOffset =
      "00000000000000000000000000000000000000000000000000000000000000c0";
    // Length = 0 (empty hookData)
    const hookDataLength =
      "0000000000000000000000000000000000000000000000000000000000000000";

    // Function selector for depositToRemote(uint256,uint32,bytes32,address,uint256,bytes)
    // Computed as keccak256("depositToRemote(uint256,uint32,bytes32,address,uint256,bytes)").slice(0,10)
    const selector = "0xfaadb53b";

    return `${selector}${valueHex}${domainHex}${recipientHex}${tokenHex}${feeHex}${hookDataOffset}${hookDataLength}` as `0x${string}`;
  }

  throw new Error(`Unknown function: ${functionName}`);
}

// ============================================================================
// TYPES
// ============================================================================

export type BridgeDirection = "eth-to-stacks" | "stacks-to-eth";

export interface BridgeParams {
  direction: BridgeDirection;
  amount: string;
  recipient: string;
}

export interface BridgeResult {
  success: boolean;
  txHash?: string;
  error?: string;
}
