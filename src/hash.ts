// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.
import { Sha256 } from '@aws-crypto/sha256-js';

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
   *
   * @type {Hash}
   */
  static get default(): Hash {
    return new Hash();
  }

  // ...........................................................................
  /**
   * Writes hashes into the JSON object.
   * @param json - The JSON object to hash.
   * @param [applyConfig=HashApplyToConfig.default] - Options for the operation.
   * @returns The JSON object with hashes added.
   */
  apply<T extends Record<string, any>>(json: T, applyConfig?: ApplyConfig): T {
    applyConfig = applyConfig ?? defaultApplyConfig();
    const copy = applyConfig.inPlace ? json : Hash._copyJson(json);
    this._addHashesToObject(copy, applyConfig);

    if (applyConfig.throwOnWrongHashes) {
      this.validate(copy);
    }
    return copy as T;
  }

  // ...........................................................................
  applyInPlace<T extends Record<string, any>>(
    json: T,
    updateExistingHashes: boolean = false,
    throwOnWrongHashes: boolean = true,
  ): T {
    const applyConfig: ApplyConfig = {
      inPlace: true,
      updateExistingHashes,
      throwOnWrongHashes,
    };

    return this.apply(json, applyConfig) as T;
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
  calcHash(value: string | Array<any> | Record<string, any>): string {
    if (typeof value === 'string') {
      return this._calcStringHash(value);
    } else if (Array.isArray(value)) {
      return this._calcArrayHash(value);
    } else {
      return this.apply(value)._hash;
    }
  }

  // ...........................................................................
  /**
   * Throws if hashes are not correct.
   * @param json - The JSON object to validate.
   */
  validate<T extends Record<string, any>>(json: T): T {
    // Check the hash of the high level element
    const ac = defaultApplyConfig();
    ac.throwOnWrongHashes = false;
    const jsonWithCorrectHashes = this.apply(json, ac);
    this._validate(json, jsonWithCorrectHashes, '');
    return json;
  }

  // ...........................................................................
  /**
   * Copies the JSON object.
   */
  static copyJson = Hash._copyJson;

  /**
   * Copies the list deeply
   */
  static copyList = Hash._copyList;

  /**
   * Returns the value when it is a basic type. Otherwise throws an error.
   */
  static isBasicType = Hash._isBasicType;

  /**
   * Converts a map to a JSON string.
   * @param ap - The map to convert.
   * @returns The JSON string representation of the map.
   */
  static jsonString = Hash._jsonString;

  /**
   * Checks an basic type. Throws an error if the type is not supported.
   */
  checkBasicType = (value: any) => this._checkBasicType(value);

  // ######################
  // Private
  // ######################

  // ...........................................................................
  /**
   * Validates the hashes of the JSON object.
   * @param jsonIs - The JSON object to check.
   * @param jsonShould - The JSON object with correct hashes.
   * @param path - The current path in the JSON object.
   */
  private _validate(
    jsonIs: Record<string, any>,
    jsonShould: Record<string, any>,
    path: string,
  ): void {
    // Check the hashes of the parent element
    const expectedHash = jsonShould['_hash'];
    const actualHash = jsonIs['_hash'];

    if (actualHash == null) {
      const pathHint = path ? ` at ${path}` : '';
      throw new Error(`Hash${pathHint} is missing.`);
    }

    if (expectedHash !== actualHash) {
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
        this._validate(childIs, childShould, `${path}/${key}`);
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'object' && !Array.isArray(value[i])) {
            const itemIs = value[i];
            if (itemIs == null) {
              continue;
            }
            const itemShould = jsonShould[key][i];
            this._validate(itemIs, itemShould, `${path}/${key}/${i}`);
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
    obj: Record<string, any>,
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
        objToHash[key] = null;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        objToHash[key] = value['_hash'];
      } else if (Array.isArray(value)) {
        objToHash[key] = this._flattenList(value);
      } else if (Hash._isBasicType(value)) {
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
      } else if (Hash._isBasicType(element)) {
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
   * Copies the JSON object.
   * @param json - The JSON object to copy.
   * @returns The copied JSON object.
   */
  private static _copyJson(json: Record<string, any>): Record<string, any> {
    const copy: Record<string, any> = {};
    for (const [key, value] of Object.entries(json)) {
      if (value === null) {
        copy[key] = null;
      } else if (Array.isArray(value)) {
        copy[key] = Hash._copyList(value);
      } else if (Hash._isBasicType(value)) {
        copy[key] = value;
      } else if (value.constructor === Object) {
        copy[key] = Hash._copyJson(value);
      } else {
        throw new Error(`Unsupported type: ${typeof value}`);
      }
    }
    return copy;
  }

  // ...........................................................................
  /**
   * Copies the list.
   * @param list - The list to copy.
   * @returns The copied list.
   */
  private static _copyList(list: Array<any>): Array<any> {
    const copy: Array<any> = [];
    for (const element of list) {
      if (element == null) {
        copy.push(null);
      } else if (Array.isArray(element)) {
        copy.push(Hash._copyList(element));
      } else if (Hash._isBasicType(element)) {
        copy.push(element);
      } else if (element.constructor === Object) {
        copy.push(Hash._copyJson(element));
      } else {
        throw new Error(`Unsupported type: ${typeof element}`);
      }
    }
    return copy;
  }

  // ...........................................................................
  /**
   * Checks if a value is a basic type.
   * @param value - The value to check.
   * @returns True if the value is a basic type, false otherwise.
   */
  private static _isBasicType(value: any): boolean {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }

  // ...........................................................................
  /**
   * Turns a number into a string with a given precision.
   * @param {number} value - The number to check.
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
   * @param {number} value - The number to check.
   * @returns True if the number exceeds the given range, false otherwise.
   */
  private _exceedsUpperRange(value: number): boolean {
    return value > this.config.numberConfig.maxNum;
  }

  // ...........................................................................
  /**
   * Checks if a number exceeds the defined range.
   * @param {number} value - The number to check.
   * @returns True if the number exceeds the given range, false otherwise.
   */
  private _exceedsLowerRange(value: number): boolean {
    return value < this.config.numberConfig.minNum;
  }

  // ...........................................................................
  /**
   * Checks if a number exceeds the precision.
   * @param {number} value - The number to check.
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
   * @param Record<string, any>} map - The map to convert.
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

/**
 * A shortcut to a default instance
 */
export const h = Hash.default;
