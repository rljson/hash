// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.
import { HashConfig } from './hash-config.ts';
import { sha256Base64UrlOfBytes } from './sha256.ts';

// .............................................................................
/**
 * Hashes Buffer or Uint8Array data using SHA-256.
 */
export class HashBuffer {
  config: HashConfig;

  // ...........................................................................
  /**
   * Constructor
   * @param config - Configuration for the hash.
   */
  constructor(config?: HashConfig) {
    this.config = config ?? HashConfig.default;
  }

  /**
   * Default instance.
   */
  static get default(): HashBuffer {
    return new HashBuffer();
  }

  // ...........................................................................
  /**
   * Calculates a SHA-256 hash of a Buffer or Uint8Array with base64 url.
   * @param data - The buffer or Uint8Array to hash.
   * @returns The calculated hash as a base64 URL-safe string.
   */
  hash(data: Buffer | Uint8Array): string {
    return sha256Base64UrlOfBytes(data, this.config.hashLength);
  }
}

// .............................................................................
/**
 * Calculates a SHA-256 hash of a Buffer or Uint8Array using default configuration.
 * @param data - The buffer or Uint8Array to hash.
 * @returns The calculated hash as a base64 URL-safe string.
 */
export function hshBuffer(data: Buffer | Uint8Array): string {
  return HashBuffer.default.hash(data);
}
