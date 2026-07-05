// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { sha256Base64Url, sha256Base64UrlOfBytes } from '../src/sha256';

/**
 * Reference implementation based on node:crypto.
 */
const reference = (text: string, length: number): string => {
  return createHash('sha256')
    .update(Buffer.from(text, 'utf8'))
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .substring(0, length);
};

describe('sha256Base64Url', () => {
  it('matches the known digest of the empty string', () => {
    expect(sha256Base64Url('', 43)).toBe(
      '47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU',
    );
  });

  it('matches the known digest of "abc"', () => {
    // FIPS 180-4 test vector, digest
    // ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    expect(sha256Base64Url('abc', 43)).toBe(
      'ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0',
    );
  });

  it('matches the FIPS 180-4 two block message test vector', () => {
    // Digest 248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1
    const text = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
    expect(sha256Base64Url(text, 43)).toBe(reference(text, 43));
    expect(sha256Base64Url(text, 43)).toBe(
      'JI1qYdIGOLjlwCaTDD5gOaM85Flk_yFn9uzt1BnbBsE',
    );
  });

  it('matches node:crypto for all message lengths from 0 to 260', () => {
    // Covers all padding and block boundaries (55, 56, 63, 64, 119, ...)
    for (let len = 0; len <= 260; len++) {
      const text = 'a'.repeat(len);
      expect(sha256Base64Url(text, 43)).toBe(reference(text, 43));
    }
  });

  it('matches node:crypto for every truncation length', () => {
    for (let length = 0; length <= 43; length++) {
      expect(sha256Base64Url('hello world', length)).toBe(
        reference('hello world', length),
      );
    }
  });

  it('caps the length at 43 characters', () => {
    expect(sha256Base64Url('hello world', 100)).toBe(
      reference('hello world', 100),
    );
    expect(sha256Base64Url('hello world', 100).length).toBe(43);
  });

  it('returns an empty string for zero and negative lengths', () => {
    expect(sha256Base64Url('hello world', 0)).toBe('');
    expect(sha256Base64Url('hello world', -5)).toBe('');
  });

  it('returns the full 43 characters when no length is given', () => {
    // Matches substring(0, undefined) of the previous implementation
    expect(sha256Base64Url('abc')).toBe(
      'ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0',
    );
  });

  it('handles non-ASCII strings', () => {
    const samples = [
      'ä',
      'äöü',
      '€',
      '😀',
      'a😀b',
      '中文字符串テスト',
      '𝒜𝒷𝒸',
      'ä'.repeat(100),
      '😀'.repeat(50),
      'mixed ascii ä 中 😀 end',
    ];
    for (const text of samples) {
      expect(sha256Base64Url(text, 43)).toBe(reference(text, 43));
    }
  });

  it('handles long strings', () => {
    // Longer than the 128 character TextEncoder threshold
    const t129 = 'x'.repeat(129);
    expect(sha256Base64Url(t129, 43)).toBe(reference(t129, 43));

    // Longer than the initial shared buffer
    const t5000 = 'y'.repeat(5000);
    expect(sha256Base64Url(t5000, 43)).toBe(reference(t5000, 43));

    // Long non-ASCII string
    const tUmlauts = 'ü'.repeat(5000);
    expect(sha256Base64Url(tUmlauts, 43)).toBe(reference(tUmlauts, 43));
  });

  it('handles strings exceeding the retained buffer size', () => {
    // text.length * 3 + 72 > 1 MB => uses a temporary buffer
    const huge = 'z'.repeat(400000);
    expect(sha256Base64Url(huge, 43)).toBe(reference(huge, 43));

    // The shared buffer still works afterwards
    expect(sha256Base64Url('abc', 43)).toBe(reference('abc', 43));
  });

  describe('sha256Base64UrlOfBytes', () => {
    const referenceBytes = (data: Uint8Array, length?: number): string => {
      return createHash('sha256')
        .update(data)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
        .substring(0, length ?? 43);
    };

    it('matches node:crypto for all lengths from 0 to 260', () => {
      for (let len = 0; len <= 260; len++) {
        const data = new Uint8Array(len);
        for (let i = 0; i < len; i++) data[i] = (i * 37 + len) & 0xff;
        expect(sha256Base64UrlOfBytes(data, 43)).toBe(
          referenceBytes(data, 43),
        );
      }
    });

    it('matches node:crypto for Buffers and truncated lengths', () => {
      const buffer = Buffer.from('hello world', 'utf8');
      for (let length = 0; length <= 43; length++) {
        expect(sha256Base64UrlOfBytes(buffer, length)).toBe(
          referenceBytes(buffer, length),
        );
      }
      expect(sha256Base64UrlOfBytes(buffer)).toBe(referenceBytes(buffer));
    });

    it('handles large data', () => {
      // Larger than the initial shared buffer
      const big = new Uint8Array(5000).fill(0x42);
      expect(sha256Base64UrlOfBytes(big, 43)).toBe(referenceBytes(big, 43));

      // Larger than the retained buffer size => uses a temporary buffer
      const huge = new Uint8Array(2 * 1024 * 1024).fill(0x99);
      expect(sha256Base64UrlOfBytes(huge, 43)).toBe(referenceBytes(huge, 43));

      // The shared buffer still works afterwards
      const small = new Uint8Array([1, 2, 3]);
      expect(sha256Base64UrlOfBytes(small, 43)).toBe(
        referenceBytes(small, 43),
      );
    });
  });

  it('matches node:crypto for random strings', () => {
    for (let i = 0; i < 500; i++) {
      const len = Math.floor(Math.random() * 300);
      let text = '';
      for (let j = 0; j < len; j++) {
        text += String.fromCharCode(Math.floor(Math.random() * 0xd7ff));
      }
      expect(sha256Base64Url(text, 22)).toBe(reference(text, 22));
    }
  });
});
