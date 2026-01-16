// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.
import { Sha256 } from '@aws-crypto/sha256-js';

import { fromUint8Array } from 'js-base64';

import { HashConfig } from './hash-config.ts';

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
    const hash = new Sha256();
    hash.update(data);
    const bytes = hash.digestSync();
    const urlSafe = true;
    const base64 = fromUint8Array(bytes, urlSafe).substring(
      0,
      this.config.hashLength,
    );

    return base64;
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
