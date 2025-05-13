// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.
import { Sha256 } from '@aws-crypto/sha256-js';
import { copy, isBasicType, Json, JsonArray, JsonValue } from '@rljson/json';

import { fromUint8Array } from 'js-base64';

import { ApplyConfig, defaultApplyConfig } from './apply-config.ts';
import { HashConfig } from './hash-config.ts';

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
    this._addHashesToObject(json, applyConfig);

    if (applyConfig.throwOnWrongHashes) {
      this.validate(json as Json);
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

  /**
   * Checks an basic type. Throws an error if the type is not supported.
   * @param value - The value to check.
   */
  checkBasicType = (value: any) => this._checkBasicType(value);

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
    const hash = new Sha256();
    hash.update(string);
    const bytes = hash.digestSync();
    const urlSafe = true;
    const base64 = fromUint8Array(bytes, urlSafe).substring(
      0,
      this.config.hashLength,
    );

    return base64;
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
   */
  private _addHashesToObject(
    obj: Record<string, JsonValue | null | undefined>,
    applyConfig: ApplyConfig,
  ): void {
    const updateExisting = applyConfig.updateExistingHashes;
    const throwOnWrongHashes = applyConfig.throwOnWrongHashes;

    const existingHash = obj['_hash'];
    if (!updateExisting && existingHash) {
      return;
    }

    // Recursively process child elements
    for (const [, value] of Object.entries(obj)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const existingHash = value['_hash'];
        if (existingHash && !updateExisting) {
          continue;
        }

        this._addHashesToObject(value, applyConfig);
      } else if (Array.isArray(value)) {
        this._processList(value, applyConfig);
      }
    }

    // Build a new object to represent the current object for hashing
    const objToHash: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === '_hash') continue;
      if (value === null) {
        // Treat null as not existing
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        objToHash[key] = value['_hash'];
      } else if (Array.isArray(value)) {
        objToHash[key] = this._flattenList(value);
      } else if (isBasicType(value)) {
        objToHash[key] = this._checkBasicType(value);
      }
    }

    const sortedMapJson = Hash._jsonString(objToHash);

    // Compute the SHA-256 hash of the JSON string
    const hash = this.calcHash(sortedMapJson);

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

  private _checkBasicType(value: any): any {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      this._checkNumber(value);
      return value;
    } else if (typeof value === 'boolean') {
      return value;
    } else {
      throw new Error(`Unsupported type: ${typeof value}`);
    }
  }

  // ...........................................................................
  /**
   * Builds a representation of a list for hashing.
   * @param list - The list to flatten.
   * @returns The flattened list.
   */
  private _flattenList(list: Array<any>): Array<any> {
    const flattenedList: Array<any> = [];

    for (const element of list) {
      if (element == null) {
        flattenedList.push(null);
      } else if (typeof element === 'object' && !Array.isArray(element)) {
        flattenedList.push(element['_hash']);
      } else if (Array.isArray(element)) {
        flattenedList.push(this._flattenList(element));
      } else if (isBasicType(element)) {
        flattenedList.push(this._checkBasicType(element));
      }
    }

    return flattenedList;
  }

  // ...........................................................................
  /**
   * Recursively processes a list, adding hashes to nested objects and lists.
   * @param list - The list to process.
   * @param applyConfig - Whether to process recursively.
   */
  private _processList(list: Array<any>, applyConfig: ApplyConfig): void {
    for (const element of list) {
      if (element === null) {
        continue;
      } else if (typeof element === 'object' && !Array.isArray(element)) {
        this._addHashesToObject(element, applyConfig);
      } else if (Array.isArray(element)) {
        this._processList(element, applyConfig);
      }
    }
  }

  // ...........................................................................
  /**
   * Turns a number into a string with a given precision.
   * @param value - The number to check.
   */
  private _checkNumber(value: number): void {
    if (isNaN(value)) {
      throw new Error('NaN is not supported.');
    }

    if (Number.isInteger(value)) {
      return;
    }

    if (this._exceedsPrecision(value)) {
      throw new Error(`Number ${value} has a higher precision than 0.001.`);
    }

    if (this._exceedsUpperRange(value)) {
      throw new Error(`Number ${value} exceeds NumberHashingConfig.maxNum.`);
    }

    if (this._exceedsLowerRange(value)) {
      throw new Error(
        `Number ${value} is smaller than NumberHashingConfig.minNum.`,
      );
    }
  }

  // ...........................................................................
  /**
   * Checks if a number exceeds the defined range.
   * @param value - The number to check.
   * @returns True if the number exceeds the given range, false otherwise.
   */
  private _exceedsUpperRange(value: number): boolean {
    return value > this.config.numberConfig.maxNum;
  }

  // ...........................................................................
  /**
   * Checks if a number exceeds the defined range.
   * @param value - The number to check.
   * @returns True if the number exceeds the given range, false otherwise.
   */
  private _exceedsLowerRange(value: number): boolean {
    return value < this.config.numberConfig.minNum;
  }

  // ...........................................................................
  /**
   * Checks if a number exceeds the precision.
   * @param value - The number to check.
   * @returns True if the number exceeds the precision, false otherwise.
   */
  private _exceedsPrecision(value: number): boolean {
    const precision = this.config.numberConfig.precision;
    const roundedValue = Math.round(value / precision) * precision;
    return Math.abs(value - roundedValue) > Number.EPSILON;
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

    const encodeValue = (value: any): string => {
      if (value == null) {
        return 'null';
      } else if (typeof value === 'string') {
        return `"${value.replace(/"/g, '\\"')}"`; // Escape quotes
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
      } else if (Array.isArray(value)) {
        return `[${value.map(encodeValue).join(',')}]`;
      } else if (value.constructor === Object) {
        return Hash._jsonString(value);
      } else {
        throw new Error(`Unsupported type: ${typeof value}`);
      }
    };

    const result: string[] = [];
    result.push('{');
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      const isLast = i == sortedKeys.length - 1;
      result.push(`"${key}":` + `${encodeValue(map[key])}`);
      if (!isLast) result.push(',');
    }
    result.push('}');

    return result.join('');
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
