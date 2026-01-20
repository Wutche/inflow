/**
 * @fileoverview URL State Utilities for Inflow Invoice System
 *
 * This module implements the "State-in-URL" pattern for sharing invoice data
 * via a single Base64-encoded URL parameter. This approach:
 * 1. Prevents naive URL manipulation by obfuscating parameters.
 * 2. Ensures data integrity through Zod schema validation on decode.
 * 3. Handles UTF-8 characters (including emojis) correctly.
 *
 * URL Format: `?i=eyJyZWNpcGllbnQiOiJTVDEuLi4iLCJhbW91bnQiOiIxMDAifQ==`
 *
 * @example
 * import { encodeInvoice, decodeInvoice } from '@/lib/url-state';
 *
 * // Encoding
 * const token = encodeInvoice({ recipient: 'ST1...', amount: '100' });
 * const url = `/pay?i=${token}`;
 *
 * // Decoding
 * const data = decodeInvoice(searchParams.get('i'));
 * if (!data) {
 *   // Show "Invalid Invoice" UI
 * }
 */

import { z } from "zod";

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Zod schema for validating invoice URL parameters.
 * This provides runtime type safety for data decoded from URL tokens.
 */
export const InvoiceSchema = z.object({
  /**
   * Unique invoice ID for tracking payments.
   */
  invoiceId: z.string().uuid().optional(),

  /**
   * The recipient's blockchain address.
   * Must be at least 10 characters (basic Stacks/Ethereum address validation).
   * For stricter validation, add regex patterns per chain.
   */
  recipient: z
    .string()
    .min(10, "Recipient address is too short")
    .refine(
      (val) =>
        val.startsWith("ST") || val.startsWith("SP") || val.startsWith("0x"),
      { message: "Must be a valid Stacks (ST/SP) or Ethereum (0x) address" },
    ),

  /**
   * The payment amount as a string.
   * Stored as string to avoid floating-point precision issues.
   * Must be a positive numeric value.
   */
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,6})?$/,
      "Amount must be a valid number (up to 6 decimal places)",
    ),

  /**
   * Optional memo/note for the invoice.
   * Limited to 50 characters to prevent abuse.
   */
  memo: z.string().max(50, "Memo cannot exceed 50 characters").optional(),

  /**
   * The token symbol for payment.
   * Defaults to "USDC" if not specified.
   */
  token: z.string().default("USDC"),

  /**
   * The payment network - which chain the payer will pay on.
   * - "stacks": Payer pays with USDCx on Stacks, recipient receives on Ethereum
   * - "ethereum": Payer pays with USDC on Ethereum, recipient receives on Stacks
   */
  network: z.enum(["stacks", "ethereum"]).default("stacks"),

  /**
   * ISO 8601 date string when the invoice was created.
   * Using simple string validation since datetime() is too strict.
   */
  createdAt: z.string().optional(),
});

/**
 * TypeScript type inferred from the InvoiceSchema.
 * Use this for type-safe invoice data handling.
 */
export type InvoiceData = z.infer<typeof InvoiceSchema>;

/**
 * Input type for encoding (allows partial data before defaults are applied).
 */
export type InvoiceInput = z.input<typeof InvoiceSchema>;

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

/**
 * Encodes an invoice object into a URL-safe Base64 string.
 *
 * The encoding process:
 * 1. Stringify the invoice object to JSON.
 * 2. Encode to UTF-8 bytes to handle special characters (emojis, accents).
 * 3. Convert bytes to Base64 string.
 * 4. Make Base64 URL-safe by replacing +/ with -_ and removing padding.
 *
 * @param data - The invoice data to encode. Must be a valid InvoiceInput.
 * @returns A URL-safe Base64 encoded string representing the invoice.
 *
 * @example
 * const token = encodeInvoice({
 *   recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   amount: '100.50',
 *   memo: 'Thanks! 🎉',
 *   token: 'USDC'
 * });
 * // Returns: "eyJyZWNpcGllbnQiOiJTVDFQUUhRS1Yw..."
 */
export function encodeInvoice(data: InvoiceInput): string {
  // Step 1: Stringify the object
  const jsonString = JSON.stringify(data);

  // Step 2: Encode to UTF-8 bytes using TextEncoder (handles emojis correctly)
  const utf8Bytes = new TextEncoder().encode(jsonString);

  // Step 3: Convert bytes to a binary string for btoa()
  // btoa() only works with Latin-1 characters, so we convert byte-by-byte
  let binaryString = "";
  utf8Bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });

  // Step 4: Base64 encode
  const base64 = btoa(binaryString);

  // Step 5: Make URL-safe (RFC 4648 Section 5)
  // Replace: + → -, / → _, remove trailing =
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ============================================================================
// DECODING UTILITIES
// ============================================================================

/**
 * Decodes a Base64 URL token back into validated invoice data.
 *
 * This function is designed to be completely safe:
 * - It will NEVER throw an exception.
 * - It returns `null` for ANY invalid input (malformed Base64, invalid JSON,
 *   schema validation failure, etc.).
 *
 * The decoding process:
 * 1. Restore standard Base64 characters from URL-safe format.
 * 2. Add back any missing padding (=).
 * 3. Decode Base64 to binary string.
 * 4. Convert binary string to UTF-8 bytes.
 * 5. Decode UTF-8 bytes to a string.
 * 6. Parse JSON.
 * 7. Validate against InvoiceSchema.
 *
 * @param token - The Base64 encoded string from the URL, or null.
 * @returns Validated InvoiceData if successful, `null` otherwise.
 *
 * @example
 * const data = decodeInvoice(searchParams.get('i'));
 * if (data === null) {
 *   // Show "Invalid or Corrupted Invoice Link" message
 *   return <ErrorUI />;
 * }
 * // data is now typed as InvoiceData
 */
export function decodeInvoice(token: string | null): InvoiceData | null {
  // Guard: null or empty token
  if (!token || token.trim() === "") {
    return null;
  }

  try {
    // Step 1: Restore standard Base64 from URL-safe format
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");

    // Step 2: Add padding if necessary (Base64 strings must have length % 4 === 0)
    const paddingNeeded = (4 - (base64.length % 4)) % 4;
    base64 += "=".repeat(paddingNeeded);

    // Step 3: Decode Base64 to binary string
    const binaryString = atob(base64);

    // Step 4: Convert binary string to UTF-8 byte array
    const utf8Bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      utf8Bytes[i] = binaryString.charCodeAt(i);
    }

    // Step 5: Decode UTF-8 bytes to string
    const jsonString = new TextDecoder("utf-8").decode(utf8Bytes);

    // Step 6: Parse JSON
    const parsed: unknown = JSON.parse(jsonString);

    // Step 7: Validate against schema
    const result = InvoiceSchema.safeParse(parsed);

    if (!result.success) {
      // Log validation errors for debugging (non-blocking)
      console.warn("[url-state] Validation failed:", result.error.issues);
      return null;
    }

    return result.data;
  } catch (error) {
    // Catch any errors from atob, JSON.parse, or TextDecoder
    console.warn("[url-state] Decode error:", error);
    return null;
  }
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Creates a full payment URL with the encoded invoice data.
 *
 * @param data - The invoice data to encode.
 * @param baseUrl - The base URL of the application (defaults to empty for relative URLs).
 * @returns A complete URL string like "/pay?i=eyJ..."
 *
 * @example
 * const paymentUrl = createPaymentUrl({
 *   recipient: 'ST1...',
 *   amount: '50'
 * });
 * // Returns: "/pay?i=eyJyZWNpcGllbnQi..."
 */
export function createPaymentUrl(data: InvoiceInput, baseUrl = ""): string {
  const encoded = encodeInvoice(data);
  return `${baseUrl}/pay?i=${encoded}`;
}
