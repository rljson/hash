// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { NumberHashingConfig } from './number-hashing-config.ts';

/**
 * Options for the JSON hash.
 */
export class HashConfig {
  hashLength: number;
  hashAlgorithm: string;
  numberConfig: NumberHashingConfig;

  // ...........................................................................
  /**
   * Constructor
   * @param hashLength - Length of the hash.
   * @param hashAlgorithm - Algorithm to use for hashing.
   * @param numberConfig - Configuration for hashing numbers.
   */
  constructor(
    hashLength?: number,
    hashAlgorithm?: string,
    numberConfig?: NumberHashingConfig,
  ) {
    this.hashLength = hashLength ?? 22;
    this.hashAlgorithm = hashAlgorithm ?? 'SHA-256';
    this.numberConfig = numberConfig ?? NumberHashingConfig.default;
  }

  /**
   * Default configuration.
   */
  static get default(): HashConfig {
    return new HashConfig();
  }
}
