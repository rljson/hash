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
   * @param {number} [hashLength=22] - Length of the hash.
   * @param {string} [hashAlgorithm='SHA-256'] - Algorithm to use for hashing.
   * @param {NumberHashingConfig} [numberConfig=HashNumberHashingConfig.default] - Configuration for hashing numbers.
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
   *
   * @type {HashConfig}
   */
  static get default(): HashConfig {
    return new HashConfig();
  }
}
