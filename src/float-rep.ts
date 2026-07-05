// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

const precision = 100;
export const maxFloat = Math.floor(9007199254740991 / precision);
export const minFloat = Math.floor(-9007199254740991 / precision);

/**
 * Converts a floating-point number to a string representation,
 * depending on the magnitude of the input value. The
 * function rounds the value to a precision that decreases as the absolute value
 * increases, ensuring a compact a robust string output.
 * @param value - The floating-point number to convert.
 * @returns The string representation of the number
 */
export function floatRep(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  if (value > maxFloat || value < minFloat) {
    throw Error(
      `Float value ${value} must be between ${minFloat} and ${maxFloat}.`,
    );
  }

  const absVal = Math.abs(value);

  // The precision decreases as the absolute value increases
  let digits: number;
  let factor: number;
  if (absVal < 10) {
    digits = 8;
    factor = 1e8;
  } else if (absVal < 100) {
    digits = 7;
    factor = 1e7;
  } else if (absVal < 1000) {
    digits = 6;
    factor = 1e6;
  } else if (absVal < 10000) {
    digits = 5;
    factor = 1e5;
  } else if (absVal < 100000) {
    digits = 4;
    factor = 1e4;
  } else if (absVal < 1000000) {
    digits = 3;
    factor = 1e3;
  } else {
    digits = 2;
    factor = precision;
  }

  const rounded = Math.round(absVal * factor);
  const result = (value < 0 ? '-' : '') + rounded.toString() + 'p' + digits;

  return result;
}
