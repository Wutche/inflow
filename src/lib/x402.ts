/**
 * x402 Payment Protocol Utilities for Next.js App Router
 *
 * This module provides middleware and utilities for implementing
 * HTTP 402 Payment Required flows using x402-stacks.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  X402PaymentVerifier,
  STXtoMicroSTX,
  type X402PaymentRequired,
} from "x402-stacks";

// Environment configuration
const X402_RECEIVE_ADDRESS =
  process.env.X402_RECEIVE_ADDRESS ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"; // Default testnet address
const X402_NETWORK = (process.env.X402_NETWORK || "testnet") as
  | "mainnet"
  | "testnet";
const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "https://x402-backend-7eby.onrender.com";

// Default expiration: 5 minutes
const DEFAULT_EXPIRATION_SECONDS = 300;

/**
 * Configuration for x402 protected endpoints
 */
export interface X402Config {
  /** Amount in STX (will be converted to microSTX) */
  amountSTX: number;
  /** Optional resource identifier (defaults to request path) */
  resource?: string;
  /** Expiration in seconds (default: 300) */
  expirationSeconds?: number;
}

/**
 * Generates a 402 Payment Required response
 */
export function generate402Response(
  request: NextRequest,
  config: X402Config,
): NextResponse<X402PaymentRequired> {
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() +
      (config.expirationSeconds || DEFAULT_EXPIRATION_SECONDS) * 1000,
  ).toISOString();

  const paymentRequired: X402PaymentRequired = {
    maxAmountRequired: STXtoMicroSTX(config.amountSTX).toString(),
    resource: config.resource || request.nextUrl.pathname,
    payTo: X402_RECEIVE_ADDRESS,
    network: X402_NETWORK,
    nonce,
    expiresAt,
    tokenType: "STX",
  };

  return NextResponse.json(paymentRequired, {
    status: 402,
    headers: {
      "X-Payment-Required": "true",
      "X-Payment-Network": X402_NETWORK,
    },
  });
}

/**
 * Verifies and settles payment from X-PAYMENT header
 */
export async function verifyAndSettlePayment(
  request: NextRequest,
  config: X402Config,
): Promise<{
  isValid: boolean;
  txId?: string;
  error?: string;
}> {
  const paymentHeader = request.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    return { isValid: false, error: "Missing X-PAYMENT header" };
  }

  try {
    const verifier = new X402PaymentVerifier(
      X402_FACILITATOR_URL,
      X402_NETWORK,
    );

    const result = await verifier.settlePayment(paymentHeader, {
      expectedRecipient: X402_RECEIVE_ADDRESS,
      minAmount: BigInt(STXtoMicroSTX(config.amountSTX)),
      tokenType: "STX",
    });

    if (result.isValid) {
      return { isValid: true, txId: result.txId };
    } else {
      return {
        isValid: false,
        error: "Payment verification failed",
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { isValid: false, error: message };
  }
}

/**
 * x402 middleware for Next.js App Router
 *
 * Returns null if payment is valid, otherwise returns 402 response
 */
export async function x402Middleware(
  request: NextRequest,
  config: X402Config,
): Promise<{
  response: NextResponse | null;
  txId?: string;
}> {
  const hasPayment = request.headers.has("X-PAYMENT");

  if (!hasPayment) {
    // No payment provided - return 402
    return { response: generate402Response(request, config) };
  }

  // Payment provided - verify and settle
  const result = await verifyAndSettlePayment(request, config);

  if (result.isValid) {
    // Payment verified - proceed with request
    return { response: null, txId: result.txId };
  }

  // Payment invalid - return error
  return {
    response: NextResponse.json(
      { error: result.error, code: "PAYMENT_FAILED" },
      { status: 402 },
    ),
  };
}

/**
 * Helper to add payment response headers
 */
export function addPaymentResponseHeaders<T>(
  response: NextResponse<T>,
  txId: string,
): NextResponse<T> {
  const paymentResponse = JSON.stringify({
    txId,
    status: "confirmed",
    network: X402_NETWORK,
  });

  response.headers.set(
    "X-PAYMENT-RESPONSE",
    Buffer.from(paymentResponse).toString("base64"),
  );

  return response;
}

/**
 * Configuration constants for pricing
 */
export const X402_PRICING = {
  CREATE_INVOICE: 0.001, // 0.001 STX to create an invoice
  GET_INVOICE: 0.0005, // 0.0005 STX to fetch invoice status
  VERIFY_PAYMENT: 0.0002, // 0.0002 STX to verify a payment
} as const;
