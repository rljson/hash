// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

/**
 * Options for the JSON hash.
 */
export class HashConfig {
  hashLength: number;
  hashAlgorithm: string;

  // ...........................................................................
  /**
   * Constructor
   * @param hashLength - Length of the hash.
   * @param hashAlgorithm - Algorithm to use for hashing.
   */
  constructor(hashLength?: number, hashAlgorithm?: string) {
    this.hashLength = hashLength ?? 22;
    this.hashAlgorithm = hashAlgorithm ?? 'SHA-256';
  }

  /**
   * Default configuration.
   */
  static get default(): HashConfig {
    return new HashConfig();
  }
}
