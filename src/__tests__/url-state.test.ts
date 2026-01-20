import { describe, it, expect } from 'vitest';
import {
  encodeInvoice,
  decodeInvoice,
  createPaymentUrl,
  InvoiceSchema,
} from '@/lib/url-state';

describe('url-state', () => {
  describe('encodeInvoice', () => {
    it('should encode valid invoice data', () => {
      const data = {
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '100.50',
        token: 'USDC',
        network: 'stacks' as const,
      };

      const encoded = encodeInvoice(data);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      // URL-safe Base64 should not contain +, /, or =
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it('should handle UTF-8 characters in memo', () => {
      const data = {
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '50',
        memo: 'Thanks! 🎉',
        token: 'USDC',
        network: 'stacks' as const,
      };

      const encoded = encodeInvoice(data);
      const decoded = decodeInvoice(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.memo).toBe('Thanks! 🎉');
    });
  });

  describe('decodeInvoice', () => {
    it('should decode valid token back to original data', () => {
      const original = {
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '100.50',
        token: 'USDC',
        network: 'stacks' as const,
      };

      const encoded = encodeInvoice(original);
      const decoded = decodeInvoice(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.recipient).toBe(original.recipient);
      expect(decoded?.amount).toBe(original.amount);
      expect(decoded?.token).toBe(original.token);
      expect(decoded?.network).toBe(original.network);
    });

    it('should return null for null input', () => {
      expect(decodeInvoice(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(decodeInvoice('')).toBeNull();
    });

    it('should return null for invalid base64', () => {
      expect(decodeInvoice('not-valid-base64!!!')).toBeNull();
    });

    it('should return null for valid base64 but invalid JSON', () => {
      const invalidJson = btoa('not json');
      expect(decodeInvoice(invalidJson)).toBeNull();
    });

    it('should return null for valid JSON but invalid schema', () => {
      const invalidSchema = btoa(JSON.stringify({ foo: 'bar' }));
      expect(decodeInvoice(invalidSchema)).toBeNull();
    });
  });

  describe('createPaymentUrl', () => {
    it('should create valid payment URL', () => {
      const data = {
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '100',
      };

      const url = createPaymentUrl(data);
      expect(url).toMatch(/^\/pay\?i=/);
    });

    it('should create URL with base URL', () => {
      const data = {
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '100',
      };

      const url = createPaymentUrl(data, 'https://example.com');
      expect(url).toMatch(/^https:\/\/example\.com\/pay\?i=/);
    });
  });

  describe('InvoiceSchema', () => {
    it('should validate correct Stacks address', () => {
      const result = InvoiceSchema.safeParse({
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '100',
      });
      expect(result.success).toBe(true);
    });

    it('should validate correct Ethereum address', () => {
      const result = InvoiceSchema.safeParse({
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '100',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid address', () => {
      const result = InvoiceSchema.safeParse({
        recipient: 'invalid-address',
        amount: '100',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid amount format', () => {
      const result = InvoiceSchema.safeParse({
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 'not-a-number',
      });
      expect(result.success).toBe(false);
    });

    it('should reject memo over 50 characters', () => {
      const result = InvoiceSchema.safeParse({
        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '100',
        memo: 'a'.repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });
});
