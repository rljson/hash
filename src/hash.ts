// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.
import { copy, isBasicType, Json, JsonArray, JsonValue } from '@rljson/json';

import { ApplyConfig, defaultApplyConfig } from './apply-config.ts';
import { floatRep } from './float-rep.ts';
import { HashConfig } from './hash-config.ts';
import { sha256Base64Url } from './sha256.ts';

// .............................................................................
/**
 * State shared across one apply run.
 */
interface _ApplyState {
  /**
   * True if the result still needs a full validation run: either objects
   * with existing hashes were skipped because updateExistingHashes is
   * false, or an empty hash was written (hashLength <= 0). All other
   * hashes are correct by construction.
   */
  needsValidation: boolean;
}

// .............................................................................
/**
 * Adds hashes to JSON object.
 */
export class Hash {
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
  static get default(): Hash {
    return new Hash();
  }

  // ...........................................................................
  /**
   * Writes hashes into the JSON object.
   * @param json - The JSON object to hash.
   * @param applyConfig - Options for the operation.
   * @returns The JSON object with hashes added.
   */
  apply<T extends Json>(json: T, applyConfig?: ApplyConfig): T {
    applyConfig = applyConfig ?? defaultApplyConfig();
    json = applyConfig.inPlace ? json : copy(json);
    const state: _ApplyState = { needsValidation: false };
    this._addHashesToObject(json, applyConfig, state);

    // Freshly written hashes are correct by construction and were already
    // verified inline. A full validation run is only needed when objects
    // with existing hashes were skipped or empty hashes were written.
    if (applyConfig.throwOnWrongHashes) {
      if (state.needsValidation) {
        this.validate(json as Json);
      } else if (applyConfig.inPlace) {
        // Reject values @rljson/json cannot copy. In the non-in-place case
        // the copy above already did; in the in-place case the copy inside
        // validate used to.
        Hash._checkCopyable(json);
      }
    }
    return json;
  }

  // ...........................................................................
  /**
   * Writes hashes into the JSON object in place.
   * @param json - The JSON object to hash.
   * @param applyConfig - Options for the operation.
   * @returns The JSON object with hashes added.
   */
  applyInPlace<T extends Json>(json: T, applyConfig?: ApplyConfig): T {
    applyConfig = applyConfig ?? {};
    applyConfig.updateExistingHashes ??= false;
    applyConfig.throwOnWrongHashes ??= true;
    applyConfig.inPlace = true;
    return this.apply(json, applyConfig);
  }

  // ...........................................................................
  /**
   * Writes hashes into a JSON string.
   * @param jsonString - The JSON string to hash.
   * @returns The JSON string with hashes added.
   */
  applyToJsonString(jsonString: string): string {
    const json = JSON.parse(jsonString);
    const applyConfig = defaultApplyConfig();
    applyConfig.inPlace = true;
    const hashedJson = this.apply(json, applyConfig);
    return JSON.stringify(hashedJson);
  }

  // ...........................................................................
  /**
   * Calculates a SHA-256 hash of a string with base64 url.
   * @param value - The string to hash.
   * @returns The calculated hash.
   */
  calcHash(value: JsonValue): string {
    if (typeof value === 'string') {
      return this._calcStringHash(value);
    } else if (Array.isArray(value)) {
      return this._calcArrayHash(value);
    } else {
      return (this.apply(value as Json) as Hashed<Json>)._hash;
    }
  }

  // ...........................................................................
  /**
   * Throws if hashes are not correct.
   * @param json - to be validated
   * @param config - validation options
   * @param config.ignoreMissingHashes - ignore missing or empty hashes
   */
  validate<T extends Json>(
    json: T,
    config: { ignoreMissingHashes: boolean } = { ignoreMissingHashes: false },
  ): T {
    // Check the hash of the high level element
    const ac = defaultApplyConfig();
    ac.throwOnWrongHashes = false;
    const jsonWithCorrectHashes = this.apply(json as Json, ac);
    this._validate(json, jsonWithCorrectHashes, '', config.ignoreMissingHashes);
    return json;
  }

  /**
   * Converts a map to a JSON string.
   * @param ap - The map to convert.
   * @returns The JSON string representation of the map.
   */
  static jsonString = Hash._jsonString;

  // ######################
  // Private
  // ######################

  // ...........................................................................
  private _validate(
    jsonIs: Json,
    jsonShould: Json,
    path: string,
    ignoreMissingHashes: boolean,
  ): void {
    // Check the hashes of the parent element
    const expectedHash = jsonShould['_hash'];
    const actualHash = jsonIs['_hash'];

    // Hash is not empty
    if (!actualHash && !ignoreMissingHashes) {
      const pathHint = path ? ` at ${path}` : '';
      throw new Error(`Hash${pathHint} is missing.`);
    }

    // Hash is given?
    else if (actualHash && expectedHash !== actualHash) {
      const pathHint = path ? ` at ${path}` : '';
      throw new Error(
        `Hash${pathHint} "${actualHash}" is wrong. Should be "${expectedHash}".`,
      );
    }

    // Check the hashes of the child elements
    for (const [key, value] of Object.entries(jsonIs)) {
      if (key === '_hash') continue;
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const childIs = value;
        const childShould = jsonShould[key];
        this._validate(
          childIs,
          childShould as Json,
          `${path}/${key}`,
          ignoreMissingHashes,
        );
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'object' && !Array.isArray(value[i])) {
            const itemIs = value[i];
            if (itemIs == null) {
              continue;
            }
            const itemShould = (jsonShould[key] as JsonArray)[i] as Json;
            this._validate(
              itemIs as Json,
              itemShould,
              `${path}/${key}/${i}`,
              ignoreMissingHashes,
            );
          }
        }
      }
    }
  }

  // ...........................................................................
  private _calcStringHash(string: string): string {
    return sha256Base64Url(string, this.config.hashLength);
  }

  // ...........................................................................
  private _calcArrayHash(array: Array<any>): string {
    const object = { array: array, _hash: '' };
    this.applyInPlace(object);
    return object._hash;
  }

  // ...........................................................................
  /**
   * Recursively adds hashes to a nested object.
   * @param obj - The object to add hashes to.
   * @param applyConfig - Whether to process recursively.
   * @param state - State shared across the apply run.
   */
  private _addHashesToObject(
    obj: Record<string, JsonValue | null | undefined>,
    applyConfig: ApplyConfig,
    state: _ApplyState,
  ): void {
    const updateExisting = applyConfig.updateExistingHashes;
    const throwOnWrongHashes = applyConfig.throwOnWrongHashes;

    const existingHash = obj['_hash'];
    if (!updateExisting && existingHash) {
      state.needsValidation = true;
      return;
    }

    const keys = Object.keys(obj);

    // Recursively process child elements
    for (const key of keys) {
      const value = obj[key];
      if (value !== null && typeof value === 'object') {
        if (Array.isArray(value)) {
          this._processList(value, applyConfig, state);
        } else {
          this._addHashesToObject(value, applyConfig, state);
        }
      }
    }

    // Reject NaN values before encoding anything
    for (const key of keys) {
      if (key === '_hash') continue;
      const value = obj[key];
      if (typeof value === 'number') {
        Hash._checkNumber(value);
      } else if (Array.isArray(value)) {
        Hash._checkNumbersInList(value);
      }
    }

    // Build the canonical JSON representation of the current object,
    // with child objects replaced by their hashes and keys sorted.
    // "__proto__" keys are not part of the hash: assigning them to a plain
    // object silently sets its prototype, so they have always been dropped.
    keys.sort();
    let json = '{';
    let first = true;
    for (const key of keys) {
      if (key === '_hash' || key === '__proto__') continue;
      const value = obj[key];

      let encoded: string;
      if (value === null || value === undefined) {
        // Treat null as not existing
        continue;
      } else if (typeof value === 'string') {
        encoded = Hash._encodeString(value);
      } else if (typeof value === 'number') {
        encoded = floatRep(value);
      } else if (typeof value === 'boolean') {
        encoded = value ? 'true' : 'false';
      } else if (Array.isArray(value)) {
        encoded = Hash._encodeList(value);
      } else if (typeof value === 'object') {
        encoded = Hash._encodeAnyValue((value as Json)['_hash']);
      } else {
        // Values of other types (e.g. functions) are not part of the hash
        continue;
      }

      json += first ? '"' : ',"';
      json += key;
      json += '":';
      json += encoded;
      first = false;
    }
    json += '}';

    // Compute the SHA-256 hash of the JSON string
    const hash = this._calcStringHash(json);
    if (hash === '') {
      state.needsValidation = true;
    }

    // Throw if old and new hash do not match
    if (throwOnWrongHashes) {
      const oldHash = obj['_hash'];
      if (oldHash && oldHash !== hash) {
        throw new Error(
          `Hash "${oldHash}" does not match the newly calculated one "${hash}". ` +
            'Please make sure that all systems are producing the same hashes.',
        );
      }
    }

    // Add the hash to the original object
    obj['_hash'] = hash;
  }

  // ...........................................................................
  /// Throws if a number is not supported.
  private static _checkNumber(value: number): void {
    if (Number.isNaN(value)) {
      throw new Error('NaN is not supported.');
    }
  }

  // ...........................................................................
  /// Recursively rejects NaN values in a list.
  private static _checkNumbersInList(list: Array<any>): void {
    for (const element of list) {
      if (typeof element === 'number') {
        Hash._checkNumber(element);
      } else if (Array.isArray(element)) {
        Hash._checkNumbersInList(element);
      }
    }
  }

  // ...........................................................................
  /// Encodes a string value for the canonical JSON representation.
  private static _encodeString(value: string): string {
    return value.indexOf('"') < 0
      ? '"' + value + '"'
      : '"' + value.replace(/"/g, '\\"') + '"'; // Escape quotes
  }

  // ...........................................................................
  /**
   * Builds the canonical representation of a list for hashing.
   * Child objects must already carry their hashes.
   * @param list - The list to encode.
   * @returns The canonical JSON representation of the list.
   */
  private static _encodeList(list: Array<any>): string {
    let result = '[';
    let first = true;
    for (const element of list) {
      let encoded: string;
      if (element === null || element === undefined) {
        encoded = 'null';
      } else if (typeof element === 'string') {
        encoded = Hash._encodeString(element);
      } else if (typeof element === 'number') {
        encoded = floatRep(element);
      } else if (typeof element === 'boolean') {
        encoded = element ? 'true' : 'false';
      } else if (Array.isArray(element)) {
        encoded = Hash._encodeList(element);
      } else if (typeof element === 'object') {
        encoded = Hash._encodeAnyValue(element['_hash']);
      } else {
        // Values of other types (e.g. functions) are not part of the hash
        continue;
      }
      result += first ? encoded : ',' + encoded;
      first = false;
    }
    return result + ']';
  }

  // ...........................................................................
  /// Encodes an arbitrary value for the canonical JSON representation.
  private static _encodeAnyValue(value: any): string {
    if (value == null) {
      return 'null';
    } else if (typeof value === 'string') {
      return Hash._encodeString(value);
    } else if (typeof value === 'number') {
      return floatRep(value);
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    } else if (Array.isArray(value)) {
      // map skips holes of sparse arrays while join keeps them empty
      return `[${value.map((v) => Hash._encodeAnyValue(v)).join(',')}]`;
    } else if (value.constructor === Object) {
      return Hash._jsonString(value);
    } else {
      throw new Error(`Unsupported type: ${typeof value}`);
    }
  }

  // ...........................................................................
  /**
   * Throws for values that `copy` of `@rljson/json` cannot copy, in the same
   * order and with the same messages as `copy` does. Used to preserve the
   * validation the previous implementation performed as a side effect of
   * deep-copying the JSON during re-validation.
   * @param json - The object to check.
   */
  private static _checkCopyable(json: Json): void {
    for (const key of Object.keys(json)) {
      const value = (json as Record<string, any>)[key];
      if (value === null || value === undefined) {
        continue;
      } else if (Array.isArray(value)) {
        Hash._checkListCopyable(value);
      } else if (isBasicType(value)) {
        continue;
      } else if (value.constructor === Object) {
        Hash._checkCopyable(value);
      } else {
        throw new Error(`Unsupported type: ${typeof value}`);
      }
    }
  }

  // ...........................................................................
  /// List part of _checkCopyable, mirroring copyList of @rljson/json.
  private static _checkListCopyable(list: Array<any>): void {
    for (const element of list) {
      if (element === null || element === undefined) {
        continue;
      } else if (Array.isArray(element)) {
        Hash._checkListCopyable(element);
      } else if (isBasicType(element)) {
        continue;
      } else if (element.constructor === Object) {
        Hash._checkCopyable(element);
      } else {
        throw new Error(`Unsupported type: ${typeof element}`);
      }
    }
  }

  // ...........................................................................
  /**
   * Recursively processes a list, adding hashes to nested objects and lists.
   * @param list - The list to process.
   * @param applyConfig - Whether to process recursively.
   * @param state - State shared across the apply run.
   */
  private _processList(
    list: Array<any>,
    applyConfig: ApplyConfig,
    state: _ApplyState,
  ): void {
    for (const element of list) {
      if (element === null) {
        continue;
      } else if (typeof element === 'object' && !Array.isArray(element)) {
        this._addHashesToObject(element, applyConfig, state);
      } else if (Array.isArray(element)) {
        this._processList(element, applyConfig, state);
      }
    }
  }

  // ...........................................................................
  /**
   * Converts a map to a JSON string.
   * @param map - The map to convert.
   * @returns The JSON string representation of the map.
   */
  private static _jsonString(map: Record<string, any>): string {
    // Sort the object keys to ensure consistent key order
    const sortedKeys = Object.keys(map).sort();

    let result = '{';
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      if (i > 0) result += ',';
      result += '"' + key + '":' + Hash._encodeAnyValue(map[key]);
    }
    return result + '}';
  }
}

// .............................................................................
/** Turns Json types into Hashed Json types */
export type Hashed<T extends Json> = {
  [K in keyof T]: T[K] extends Json ? Hashed<T[K]> : T[K];
} & { _hash: string };

// .............................................................................

/**
 * Writes hashes inplace into a JSON object.
 */
export const hip = Hash.default.applyInPlace.bind(Hash.default);

/**
 * Returns a hashed version of a JSON object
 */
export const hsh = Hash.default.apply.bind(Hash.default);

// .............................................................................
/**
 * Removes hashes from a JSON object in place.
 * @param json - The JSON object to remove hashes from.
 */
const _rmhip = <T extends Json>(json: T): T => {
  delete (json as any)._hash;
  for (const key in json) {
    if (json[key] !== null && typeof json[key] === 'object') {
      _rmhip(json[key] as Json);
    }
  }
  return json;
};

/**
 * Returns a copied JSON object without hashes.
 * @param json - The JSON object to remove hashes from.
 */
export const rmhsh = <T extends Json>(json: T) => {
  json = copy(json);
  return _rmhip(json);
};
