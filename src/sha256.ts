// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

/**
 * Fast, dependency-free, synchronous SHA-256.
 *
 * Replaces `@aws-crypto/sha256-js` and `js-base64`. All working buffers are
 * allocated once at module level and reused across calls, so hashing many
 * small strings (the typical `@rljson/hash` workload) is allocation-free.
 */

// SHA-256 round constants (FIPS 180-4)
const K = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

// Message schedule, reused across calls
const W = new Int32Array(64);

// Digest state of the last hash. The 9th word stays 0 so that the base64
// bit extraction below can read past the last word without a bounds check.
const H = new Int32Array(9);

// Input byte buffer, grown on demand and reused across calls
let sharedBuf = new Uint8Array(2048);

// Buffers larger than this are not kept alive between calls
const maxRetainedBufSize = 1024 * 1024;

const textEncoder = new TextEncoder();

const base64UrlAlphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// All two-character base64-url combinations, indexed by their 12-bit value.
// Emitting two characters per lookup halves the encoding work.
const base64UrlPairs: string[] = new Array(4096);
for (let i = 0; i < 4096; i++) {
  base64UrlPairs[i] = base64UrlAlphabet[i >> 6] + base64UrlAlphabet[i & 63];
}

// .............................................................................
/**
 * Runs the SHA-256 compression over `byteLength` bytes of `bytes`
 * (must be a multiple of 64) and stores the digest words in `H`.
 * @param bytes - The padded message.
 * @param byteLength - The padded message length in bytes.
 */
const _compress = (bytes: Uint8Array, byteLength: number): void => {
  let h0 = 0x6a09e667 | 0;
  let h1 = 0xbb67ae85 | 0;
  let h2 = 0x3c6ef372 | 0;
  let h3 = 0xa54ff53a | 0;
  let h4 = 0x510e527f | 0;
  let h5 = 0x9b05688c | 0;
  let h6 = 0x1f83d9ab | 0;
  let h7 = 0x5be0cd19 | 0;

  for (let offset = 0; offset < byteLength; offset += 64) {
    for (let i = 0, j = offset; i < 16; i++, j += 4) {
      W[i] =
        (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) |
        bytes[j + 3];
    }
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15];
      const w2 = W[i - 2];
      const s0 =
        (((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14))) ^
        (w15 >>> 3);
      const s1 =
        (((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13))) ^
        (w2 >>> 10);
      W[i] = (((W[i - 16] + s0) | 0) + ((W[i - 7] + s1) | 0)) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 =
        ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (((h + S1) | 0) + ((ch + ((K[i] + W[i]) | 0)) | 0)) | 0;
      const S0 =
        ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  H[0] = h0;
  H[1] = h1;
  H[2] = h2;
  H[3] = h3;
  H[4] = h4;
  H[5] = h5;
  H[6] = h6;
  H[7] = h7;
};

// .............................................................................
/**
 * Returns a buffer with at least `needed` bytes capacity. Reuses and grows
 * the shared buffer; buffers beyond the retention limit stay temporary.
 * @param needed - The required capacity in bytes.
 * @returns The buffer.
 */
const _bufferWithCapacity = (needed: number): Uint8Array => {
  let buf = sharedBuf;
  if (buf.length < needed) {
    buf = new Uint8Array(needed);
    if (needed <= maxRetainedBufSize) sharedBuf = buf;
  }
  return buf;
};

// .............................................................................
/**
 * Pads the `n` message bytes in `buf`, compresses them, and returns the
 * first `length` characters of the base64-url encoded digest.
 * @param buf - The buffer holding the message bytes with padding headroom.
 * @param n - The message length in bytes.
 * @param length - The number of base64 characters to return.
 * @returns The truncated base64-url encoded hash.
 */
const _padCompressEncode = (
  buf: Uint8Array,
  n: number,
  length?: number,
): string => {
  // Append FIPS 180-4 padding: 0x80, zeros, and the 64-bit big-endian
  // message length in bits.
  let p = n;
  buf[p++] = 0x80;
  while ((p & 63) !== 56) buf[p++] = 0;
  const hi = (n / 0x20000000) | 0;
  buf[p++] = (hi >>> 24) & 0xff;
  buf[p++] = (hi >>> 16) & 0xff;
  buf[p++] = (hi >>> 8) & 0xff;
  buf[p++] = hi & 0xff;
  buf[p++] = (n >>> 21) & 0xff;
  buf[p++] = (n >>> 13) & 0xff;
  buf[p++] = (n >>> 5) & 0xff;
  buf[p++] = (n << 3) & 0xff;

  _compress(buf, p);

  // Encode the digest as base64-url, only as many characters as requested,
  // two characters at a time. Character pair i covers digest bits
  // [12i, 12i + 12). The coercion matches String.prototype.substring.
  let len =
    length === undefined ? 43 : length >= 0 ? Math.floor(length) : 0;
  if (len > 43) len = 43;
  let result = '';
  const pairs = len >> 1;
  for (let i = 0; i < pairs; i++) {
    const bit = i * 12;
    const word = bit >> 5;
    const shift = 20 - (bit & 31);
    const twelveBits =
      shift >= 0
        ? (H[word] >>> shift) & 4095
        : ((H[word] << -shift) | (H[word + 1] >>> (32 + shift))) & 4095;
    result += base64UrlPairs[twelveBits];
  }
  if (len & 1) {
    const bit = (len - 1) * 6;
    const word = bit >> 5;
    const shift = 26 - (bit & 31);
    const sixBits =
      shift >= 0
        ? (H[word] >>> shift) & 63
        : ((H[word] << -shift) | (H[word + 1] >>> (32 + shift))) & 63;
    result += base64UrlAlphabet[sixBits];
  }
  return result;
};

// .............................................................................
/**
 * Calculates the SHA-256 hash of a string and returns the first `length`
 * characters of its base64-url representation.
 *
 * The result is identical to hashing the UTF-8 bytes of `text`, encoding the
 * 32-byte digest as unpadded base64-url and truncating to `length` characters.
 * @param text - The string to hash.
 * @param length - The number of base64 characters to return (capped at 43,
 * the full digest if undefined).
 * @returns The truncated base64-url encoded hash.
 */
export const sha256Base64Url = (text: string, length?: number): string => {
  // Worst case UTF-8 takes 3 bytes per UTF-16 code unit; 72 extra bytes
  // leave room for padding and length.
  const buf = _bufferWithCapacity(text.length * 3 + 72);

  // Encode the string as UTF-8
  const n = textEncoder.encodeInto(text, buf).written;

  return _padCompressEncode(buf, n, length);
};

// .............................................................................
/**
 * Calculates the SHA-256 hash of binary data and returns the first `length`
 * characters of its base64-url representation.
 * @param data - The bytes to hash.
 * @param length - The number of base64 characters to return (capped at 43,
 * the full digest if undefined).
 * @returns The truncated base64-url encoded hash.
 */
export const sha256Base64UrlOfBytes = (
  data: Uint8Array,
  length?: number,
): string => {
  // 72 extra bytes leave room for padding and length
  const buf = _bufferWithCapacity(data.length + 72);
  buf.set(data);
  return _padCompressEncode(buf, data.length, length);
};
