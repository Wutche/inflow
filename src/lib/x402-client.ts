/**
 * x402 Example Client
 *
 * Demonstrates how to consume x402-protected APIs using the
 * withPaymentInterceptor pattern from x402-stacks.
 *
 * This file serves as documentation and can be used for testing.
 */

import axios from "axios";
import {
  withPaymentInterceptor,
  privateKeyToAccount,
  decodeXPaymentResponse,
} from "x402-stacks";

/**
 * Creates an x402-enabled API client for consuming Inflow's paid API.
 *
 * @param privateKey - Stacks wallet private key (hex)
 * @param baseUrl - API base URL
 * @returns Configured axios instance with automatic payment handling
 *
 * @example
 * // Usage in an AI agent or external service:
 * const client = createInflowClient(process.env.STACKS_PRIVATE_KEY!, 'https://inflow.app');
 * const invoice = await client.post('/api/v1/invoices', {
 *   recipient: 'ST1...',
 *   amount: '100.00',
 *   token: 'USDC'
 * });
 * console.log('Invoice created:', invoice.data.invoice.paymentUrl);
 */
export function createInflowClient(privateKey: string, baseUrl: string) {
  const account = privateKeyToAccount(privateKey, "testnet");

  const client = withPaymentInterceptor(
    axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    }),
    account,
  );

  return client;
}

/**
 * Example: Create an invoice using the paid API
 */
export async function createInvoiceExample(
  client: ReturnType<typeof createInflowClient>,
  invoiceData: {
    recipient: string;
    amount: string;
    token?: string;
    memo?: string;
    network?: "stacks" | "ethereum";
  },
) {
  try {
    const response = await client.post("/api/v1/invoices", invoiceData);

    // Decode payment confirmation from headers
    const paymentInfo = decodeXPaymentResponse(
      response.headers["x-payment-response"],
    );

    console.log("✅ Invoice created successfully!");
    console.log("Invoice ID:", response.data.invoice.id);
    console.log("Payment URL:", response.data.invoice.paymentUrl);

    if (paymentInfo) {
      console.log("Payment TX:", paymentInfo.txId);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 402) {
      console.log("Payment required:", error.response.data);
    }
    throw error;
  }
}

/**
 * Example usage (for documentation):
 *
 * ```typescript
 * import { createInflowClient, createInvoiceExample } from '@/lib/x402-client';
 *
 * const client = createInflowClient(
 *   process.env.STACKS_PRIVATE_KEY!,
 *   'http://localhost:3000'
 * );
 *
 * const result = await createInvoiceExample(client, {
 *   recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   amount: '50.00',
 *   token: 'USDC',
 *   memo: 'API-generated invoice',
 *   network: 'stacks'
 * });
 *
 * console.log('Created invoice:', result.invoice.paymentUrl);
 * ```
 */
