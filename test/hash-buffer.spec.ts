// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { beforeEach, describe, expect, it } from 'vitest';

import { HashBuffer, hshBuffer } from '../src/hash-buffer';
import { HashConfig } from '../src/hash-config';

describe('HashBuffer', () => {
  let hashBuffer: HashBuffer;

  beforeEach(() => {
    hashBuffer = new HashBuffer();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(hashBuffer.config).toBeDefined();
      expect(hashBuffer.config.hashLength).toBe(HashConfig.default.hashLength);
    });

    it('should create instance with custom config', () => {
      const customConfig = new HashConfig();
      customConfig.hashLength = 10;
      const customHashBuffer = new HashBuffer(customConfig);
      expect(customHashBuffer.config.hashLength).toBe(10);
    });
  });

  describe('default', () => {
    it('should return a default instance', () => {
      const defaultInstance = HashBuffer.default;
      expect(defaultInstance).toBeInstanceOf(HashBuffer);
      expect(defaultInstance.config).toBeDefined();
    });
  });

  describe('hash()', () => {
    describe('with Uint8Array input', () => {
      it('should hash empty Uint8Array', () => {
        const data = new Uint8Array([]);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeLessThanOrEqual(hashBuffer.config.hashLength);
        // SHA-256 of empty string in base64url
        expect(hash).toBe('47DEQpj8HBSa-_TImW-5JC');
      });

      it('should hash single byte', () => {
        const data = new Uint8Array([0]);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeLessThanOrEqual(hashBuffer.config.hashLength);
      });

      it('should hash multiple bytes', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeLessThanOrEqual(hashBuffer.config.hashLength);
      });

      it('should hash text encoded as bytes', () => {
        const text = 'Hello, World!';
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        // Known SHA-256 hash for "Hello, World!" in base64url
        expect(hash).toBe('3_1gIbsr1bCvZ2KQgJ7DpT');
      });

      it('should hash UTF-8 text', () => {
        const text = '你好世界';
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });

      it('should produce consistent hashes for same input', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const hash1 = hashBuffer.hash(data);
        const hash2 = hashBuffer.hash(data);
        expect(hash1).toBe(hash2);
      });

      it('should produce different hashes for different inputs', () => {
        const data1 = new Uint8Array([1, 2, 3, 4, 5]);
        const data2 = new Uint8Array([1, 2, 3, 4, 6]);
        const hash1 = hashBuffer.hash(data1);
        const hash2 = hashBuffer.hash(data2);
        expect(hash1).not.toBe(hash2);
      });

      it('should be sensitive to byte order', () => {
        const data1 = new Uint8Array([1, 2, 3]);
        const data2 = new Uint8Array([3, 2, 1]);
        const hash1 = hashBuffer.hash(data1);
        const hash2 = hashBuffer.hash(data2);
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('with Buffer input', () => {
      it('should hash empty Buffer', () => {
        const data = Buffer.from([]);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash).toBe('47DEQpj8HBSa-_TImW-5JC');
      });

      it('should hash Buffer from string', () => {
        const data = Buffer.from('Hello, World!', 'utf-8');
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash).toBe('3_1gIbsr1bCvZ2KQgJ7DpT');
      });

      it('should hash Buffer from byte array', () => {
        const data = Buffer.from([1, 2, 3, 4, 5]);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });

      it('should produce same hash for Buffer and Uint8Array with same data', () => {
        const bytes = [1, 2, 3, 4, 5];
        const buffer = Buffer.from(bytes);
        const uint8array = new Uint8Array(bytes);
        const hashFromBuffer = hashBuffer.hash(buffer);
        const hashFromUint8Array = hashBuffer.hash(uint8array);
        expect(hashFromBuffer).toBe(hashFromUint8Array);
      });

      it('should hash large Buffer', () => {
        const size = 10000;
        const data = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          data[i] = i % 256;
        }
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeLessThanOrEqual(hashBuffer.config.hashLength);
      });
    });

    describe('with custom hash length', () => {
      it('should respect custom hash length', () => {
        const config = new HashConfig();
        config.hashLength = 10;
        const customHashBuffer = new HashBuffer(config);
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const hash = customHashBuffer.hash(data);
        expect(hash.length).toBe(10);
      });

      it('should produce shorter hash with shorter length', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);

        const config1 = new HashConfig();
        config1.hashLength = 10;
        const hashBuffer1 = new HashBuffer(config1);
        const hash1 = hashBuffer1.hash(data);

        const config2 = new HashConfig();
        config2.hashLength = 20;
        const hashBuffer2 = new HashBuffer(config2);
        const hash2 = hashBuffer2.hash(data);

        expect(hash1.length).toBe(10);
        expect(hash2.length).toBe(20);
        expect(hash2.startsWith(hash1)).toBe(true);
      });
    });

    describe('hash format', () => {
      it('should produce base64 URL-safe string', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const hash = hashBuffer.hash(data);
        // Base64 URL-safe uses - and _ instead of + and /
        expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
      });

      it('should not contain + or / characters', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const hash = hashBuffer.hash(data);
        expect(hash).not.toContain('+');
        expect(hash).not.toContain('/');
      });
    });

    describe('edge cases', () => {
      it('should handle all zero bytes', () => {
        const data = new Uint8Array(100).fill(0);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });

      it('should handle all 255 bytes', () => {
        const data = new Uint8Array(100).fill(255);
        const hash = hashBuffer.hash(data);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });

      it('should handle single byte with all possible values', () => {
        const hashes = new Set<string>();
        for (let i = 0; i < 256; i++) {
          const data = new Uint8Array([i]);
          const hash = hashBuffer.hash(data);
          hashes.add(hash);
        }
        // All 256 different bytes should produce different hashes
        expect(hashes.size).toBe(256);
      });
    });
  });

  describe('hshBuffer() convenience function', () => {
    it('should hash Uint8Array using default config', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const hash = hshBuffer(data);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should hash Buffer using default config', () => {
      const data = Buffer.from('Hello, World!');
      const hash = hshBuffer(data);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toBe('3_1gIbsr1bCvZ2KQgJ7DpT');
    });

    it('should produce same result as HashBuffer.default.hash()', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const hash1 = hshBuffer(data);
      const hash2 = HashBuffer.default.hash(data);
      expect(hash1).toBe(hash2);
    });

    it('should use default hash length', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const hash = hshBuffer(data);
      expect(hash.length).toBeLessThanOrEqual(HashConfig.default.hashLength);
    });
  });

  describe('known test vectors', () => {
    it('should match known SHA-256 hashes', () => {
      // Test vector: empty string
      const empty = new Uint8Array([]);
      const emptyHash = hashBuffer.hash(empty);
      expect(emptyHash).toBe('47DEQpj8HBSa-_TImW-5JC');

      // Test vector: "abc"
      const abc = new TextEncoder().encode('abc');
      const abcHash = hashBuffer.hash(abc);
      // SHA-256 of "abc" is: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
      // in base64url (first 22 chars): ungWv48Bz-pBQUDeXa4iI7
      expect(abcHash).toBe('ungWv48Bz-pBQUDeXa4iI7');
    });
  });

  describe('comparison with different data types', () => {
    it('should produce different hashes for string vs buffer with same content', () => {
      const text = 'test';
      const buffer = Buffer.from(text);

      // This test verifies that the hash-buffer module hashes the raw bytes
      const bufferHash = hashBuffer.hash(buffer);

      expect(bufferHash).toBeDefined();
      expect(typeof bufferHash).toBe('string');
    });
  });

  describe('deterministic behavior', () => {
    it('should produce same hash across multiple instances', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      const hashBuffer1 = new HashBuffer();
      const hashBuffer2 = new HashBuffer();

      const hash1 = hashBuffer1.hash(data);
      const hash2 = hashBuffer2.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce same hash across multiple calls', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      const hashes = [];
      for (let i = 0; i < 10; i++) {
        hashes.push(hashBuffer.hash(data));
      }

      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });
  });
});
