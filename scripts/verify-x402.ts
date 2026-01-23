/**
 * x402 Verification Script
 *
 * This script performs a real end-to-end test of the x402 payment flow.
 * It connects to the local API, triggers a payment request, signs the transaction,
 * and verifies the successful invoice creation.
 *
 * Usage: npx tsx scripts/verify-x402.ts
 */

import { loadEnvConfig } from "@next/env";
import { createInflowClient, createInvoiceExample } from "@/lib/x402-client";
import axios from "axios";

// Load environment variables from .env.local, .env, etc.
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY?.trim();
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function main() {
  console.log("🔐 x402 Verification Script");
  console.log("===========================");

  if (!PRIVATE_KEY) {
    console.error(
      "❌ Error: STACKS_PRIVATE_KEY is missing in environment variables.",
    );
    console.error("   Please add it to .env.local to run this verification.");
    process.exit(1);
  }

  console.log(`🌍 Target API: ${BASE_URL}`);

  if (PRIVATE_KEY) {
    console.log(`🔑 Key Length: ${PRIVATE_KEY.length}`);
    console.log(`   Is Hex: ${/^[0-9a-fA-F]+$/.test(PRIVATE_KEY)}`);
  }

  console.log(`👤 Wallet identity loaded`);

  try {
    const client = createInflowClient(PRIVATE_KEY, BASE_URL);

    console.log("\n1️⃣  Initiating Invoice Creation Request...");
    // We send a request. The client interceptor will handle the 402 loop automatically.
    const result = await createInvoiceExample(client, {
      recipient: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // Example testnet address
      amount: "5.00",
      token: "USDC",
      memo: "x402-verification-" + Date.now(),
      network: "stacks",
    });

    console.log("\n✅ Success! Invoice Created.");
    console.log(`   ID: ${result.invoice.id}`);
    console.log(`   URL: ${result.invoice.paymentUrl}`);

    if (result.payment) {
      console.log(`   Payment TX: ${result.payment.txId}`);
      console.log(`   Amount Paid: ${result.payment.amountPaid}`);
    }
  } catch (error) {
    console.error("\n❌ Verification Failed");
    if (axios.isAxiosError(error) && error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main().catch(console.error);
