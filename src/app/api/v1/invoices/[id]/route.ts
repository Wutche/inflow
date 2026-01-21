/**
 * x402-Protected Invoice Status API
 *
 * GET /api/v1/invoices/[id] - Get invoice by ID (requires 0.0005 STX payment)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  x402Middleware,
  addPaymentResponseHeaders,
  X402_PRICING,
} from "@/lib/x402";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: "Invalid invoice ID format", code: "INVALID_ID" },
      { status: 400 },
    );
  }

  // Check for x402 payment
  const { response: paymentResponse, txId } = await x402Middleware(request, {
    amountSTX: X402_PRICING.GET_INVOICE,
    resource: `/api/v1/invoices/${id}`,
  });

  if (paymentResponse) {
    return paymentResponse;
  }

  // In a real implementation, you would fetch from a database
  // For this demo, we return a mock response showing the pattern works
  const responseData = {
    success: true,
    invoice: {
      id,
      status: "pending",
      message:
        "Invoice lookup requires database integration. This endpoint demonstrates x402 payment flow.",
    },
    payment: {
      txId,
      amountPaid: `${X402_PRICING.GET_INVOICE} STX`,
    },
  };

  let response = NextResponse.json(responseData);

  if (txId) {
    response = addPaymentResponseHeaders(response, txId);
  }

  return response;
}
