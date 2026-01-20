import { describe, it, expect } from 'vitest';
import {
  stacksAddressToBytes32,
  ethereumAddressToBuffer,
  parseTokenAmount,
  ethereumAddressSchema,
  stacksAddressSchema,
  amountSchema,
  DOMAIN_IDS,
  XRESERVE_CONTRACT,
  XRESERVE_STACKS_CONTRACT,
} from '@/lib/bridge-utils';

describe('bridge-utils', () => {
  describe('Address Schemas', () => {
    describe('ethereumAddressSchema', () => {
      it('should validate correct Ethereum address', () => {
        const result = ethereumAddressSchema.safeParse(
          '0x1234567890123456789012345678901234567890'
        );
        expect(result.success).toBe(true);
      });

      it('should reject address without 0x prefix', () => {
        const result = ethereumAddressSchema.safeParse(
          '1234567890123456789012345678901234567890'
        );
        expect(result.success).toBe(false);
      });

      it('should reject address with wrong length', () => {
        const result = ethereumAddressSchema.safeParse('0x1234');
        expect(result.success).toBe(false);
      });

      it('should reject non-hex characters', () => {
        const result = ethereumAddressSchema.safeParse(
          '0xGGGG567890123456789012345678901234567890'
        );
        expect(result.success).toBe(false);
      });
    });

    describe('stacksAddressSchema', () => {
      it('should validate ST testnet address', () => {
        const result = stacksAddressSchema.safeParse(
          'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
        );
        expect(result.success).toBe(true);
      });

      it('should validate SP mainnet address', () => {
        const result = stacksAddressSchema.safeParse(
          'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
        );
        expect(result.success).toBe(true);
      });

      it('should reject address with wrong prefix', () => {
        const result = stacksAddressSchema.safeParse(
          'XX1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
        );
        expect(result.success).toBe(false);
      });

      it('should reject too short address', () => {
        const result = stacksAddressSchema.safeParse('ST123');
        expect(result.success).toBe(false);
      });
    });

    describe('amountSchema', () => {
      it('should validate positive integer', () => {
        const result = amountSchema.safeParse('100');
        expect(result.success).toBe(true);
      });

      it('should validate decimal with up to 6 places', () => {
        const result = amountSchema.safeParse('100.123456');
        expect(result.success).toBe(true);
      });

      it('should reject more than 6 decimal places', () => {
        const result = amountSchema.safeParse('100.1234567');
        expect(result.success).toBe(false);
      });

      it('should reject negative numbers', () => {
        const result = amountSchema.safeParse('-100');
        expect(result.success).toBe(false);
      });

      it('should reject non-numeric strings', () => {
        const result = amountSchema.safeParse('abc');
        expect(result.success).toBe(false);
      });

      it('should reject zero', () => {
        const result = amountSchema.safeParse('0');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Address Conversion', () => {
    describe('stacksAddressToBytes32', () => {
      it('should convert Stacks address to bytes32 hex string', () => {
        const address = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
        const bytes32 = stacksAddressToBytes32(address);
        
        expect(typeof bytes32).toBe('string');
        expect(bytes32.startsWith('0x')).toBe(true);
        expect(bytes32.length).toBe(66); // 0x + 64 hex chars
      });
    });

    describe('ethereumAddressToBuffer', () => {
      it('should convert Ethereum address to buffer', () => {
        const address = '0x1234567890123456789012345678901234567890';
        const buffer = ethereumAddressToBuffer(address);
        
        expect(buffer).toBeInstanceOf(Uint8Array);
        expect(buffer.length).toBe(32);
      });

      it('should handle lowercase address', () => {
        const address = '0x1234567890abcdef1234567890abcdef12345678';
        const buffer = ethereumAddressToBuffer(address);
        
        expect(buffer).toBeInstanceOf(Uint8Array);
        expect(buffer.length).toBe(32);
      });
    });
  });

  describe('parseTokenAmount', () => {
    it('should parse whole number with 6 decimals', () => {
      const result = parseTokenAmount('100', 6);
      expect(result).toBe(BigInt(100_000_000));
    });

    it('should parse decimal with 6 decimals', () => {
      const result = parseTokenAmount('100.5', 6);
      expect(result).toBe(BigInt(100_500_000));
    });

    it('should parse full precision decimal', () => {
      const result = parseTokenAmount('100.123456', 6);
      expect(result).toBe(BigInt(100_123_456));
    });
  });

  describe('Constants', () => {
    it('should have correct domain IDs', () => {
      expect(DOMAIN_IDS.ETHEREUM).toBe(0);
      expect(DOMAIN_IDS.STACKS).toBe(10003); // Circle CCTP domain ID for Stacks
    });

    it('should have xReserve contract addresses defined', () => {
      expect(XRESERVE_CONTRACT).toBeDefined();
      expect(XRESERVE_CONTRACT.address).toBeTruthy();
      expect(XRESERVE_STACKS_CONTRACT).toBeDefined();
      expect(XRESERVE_STACKS_CONTRACT.address).toBeTruthy();
      expect(XRESERVE_STACKS_CONTRACT.name).toBeTruthy();
    });
  });
});
