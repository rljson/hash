// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

/**
 * When writing hashes into a given JSON object, we have various options.
 */
export interface ApplyConfig {
  /**
   * Whether to modify the JSON object in place.
   */
  inPlace?: boolean;

  /**
   * Whether to update existing hashes.
   */
  updateExistingHashes?: boolean;

  /**
   * Whether to throw an error if existing hashes are wrong.
   */
  throwOnWrongHashes?: boolean;
}

/**
 * Default configuration for applying hashes.
 */
export const defaultApplyConfig = (): ApplyConfig => {
  return {
    inPlace: false,
    updateExistingHashes: true,
    throwOnWrongHashes: true,
  };
};
