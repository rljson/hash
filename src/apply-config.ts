// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

/**
 * When writing hashes into a given JSON object, we have various options.
 */
export class ApplyConfig {
  inPlace: boolean;
  updateExistingHashes: boolean;
  throwIfOnWrongHashes: boolean;

  /**
   * Constructor
   * @param {boolean} [inPlace=false] - Whether to modify the JSON object in place.
   * @param {boolean} [updateExistingHashes=true] - Whether to update existing hashes.
   * @param {boolean} [throwOnHashMismatch=true] - Whether to throw an error if existing hashes are wrong.
   */
  constructor(
    inPlace?: boolean,
    updateExistingHashes?: boolean,
    throwOnHashMismatch?: boolean,
  ) {
    this.inPlace = inPlace ?? false;
    this.updateExistingHashes = updateExistingHashes ?? true;
    this.throwIfOnWrongHashes = throwOnHashMismatch ?? true;
  }

  /**
   * Default configuration.
   *
   * @type {ApplyConfig}
   */
  static get default(): ApplyConfig {
    return new ApplyConfig();
  }
}
