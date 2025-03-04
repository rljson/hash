// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

/**
 * Number config for hashing.
 *
 * We need to make sure that the hashing of numbers is consistent
 * across different platforms. Especially rounding errors can lead to
 * different hashes although the numbers are considered equal. This
 * class provides a configuration for hashing numbers.
 */
export class NumberHashingConfig {
  precision: number = 0.001;
  maxNum: number = 1000 * 1000 * 1000;
  minNum: number = -this.maxNum;
  throwOnRangeError: boolean = true;

  /**
   * Default configuration.
   */
  static get default(): NumberHashingConfig {
    return new NumberHashingConfig();
  }
}
