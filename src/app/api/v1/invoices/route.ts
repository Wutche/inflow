/**
 * x402-Protected Invoice API
 *
 * POST /api/v1/invoices - Create a new invoice (requires 0.001 STX payment)
 *
 * This endpoint demonstrates the x402 payment protocol:
 * 1. Request without X-PAYMENT header → 402 response with payment details
 * 2. Client signs STX transaction and retries with X-PAYMENT header
 * 3. Server settles payment via facilitator, then creates invoice
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  x402Middleware,
  addPaymentResponseHeaders,
  X402_PRICING,
} from "@/lib/x402";
import { encodeInvoice, createPaymentUrl } from "@/lib/url-state";

// Request body schema
const CreateInvoiceSchema = z.object({
  recipient: z
    .string()
    .min(10, "Recipient address is too short")
    .refine(
      (val) =>
        val.startsWith("ST") || val.startsWith("SP") || val.startsWith("0x"),
      { message: "Must be a valid Stacks or Ethereum address" },
    ),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount format"),
  token: z.string().default("USDC"),
  memo: z.string().max(50).optional(),
  network: z.enum(["stacks", "ethereum"]).default("stacks"),
});

export async function POST(request: NextRequest) {
  // Step 1: Check for x402 payment
  const { response: paymentResponse, txId } = await x402Middleware(request, {
    amountSTX: X402_PRICING.CREATE_INVOICE,
    resource: "/api/v1/invoices",
  });

  // If payment required or failed, return the 402 response
  if (paymentResponse) {
    return paymentResponse;
  }

  // Step 2: Payment verified - parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  // Step 3: Validate request body
  const validation = CreateInvoiceSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: validation.error.issues,
      },
      { status: 400 },
    );
  }

  const { recipient, amount, token, memo, network } = validation.data;

  // Step 4: Create the invoice
  const invoiceId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Generate the payment URL
  const invoiceData = {
    invoiceId,
    recipient,
    amount,
    token,
    memo,
    network,
    createdAt,
  };

  const paymentUrl = createPaymentUrl(invoiceData);
  const encodedToken = encodeInvoice(invoiceData);

  // Step 5: Build response
  const responseData = {
    success: true,
    invoice: {
      id: invoiceId,
      recipient,
      amount,
      token,
      memo,
      network,
      createdAt,
      paymentUrl,
      encodedToken,
    },
    payment: {
      txId,
      amountPaid: `${X402_PRICING.CREATE_INVOICE} STX`,
    },
  };

  // Add payment confirmation header
  let response = NextResponse.json(responseData, { status: 201 });

  if (txId) {
    response = addPaymentResponseHeaders(response, txId);
  }

  return response;
}

// GET endpoint info
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/invoices",
    methods: ["POST", "GET"],
    description: "x402-protected invoice creation API",
    pricing: {
      POST: `${X402_PRICING.CREATE_INVOICE} STX per invoice`,
    },
    documentation: "https://github.com/x402-stacks/x402-stacks",
    example: {
      request: {
        recipient: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        amount: "100.00",
        token: "USDC",
        memo: "Payment for services",
        network: "stacks",
      },
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": "<signed-stx-transaction>",
      },
    },
  });
}
