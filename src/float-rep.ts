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

  let digits = 2;
  let factor = precision;

  if (value > maxFloat || value < minFloat) {
    throw Error(
      `Float value ${value} must be between ${minFloat} and ${maxFloat}.`,
    );
  }

  const absVal = Math.abs(value);

  // Define thresholds and corresponding digits/factors
  const thresholds = [
    { limit: 10, digits: 8, factor: 1e8 },
    { limit: 100, digits: 7, factor: 1e7 },
    { limit: 1000, digits: 6, factor: 1e6 },
    { limit: 10000, digits: 5, factor: 1e5 },
    { limit: 100000, digits: 4, factor: 1e4 },
    { limit: 1000000, digits: 3, factor: 1e3 },
    { limit: 10000000, digits: 2, factor: 1e2 },
  ];

  for (const { limit, digits: d, factor: f } of thresholds) {
    if (absVal < limit) {
      digits = d;
      factor = f;
      break;
    }
  }

  const rounded = Math.round(absVal * factor);
  const result = (value < 0 ? '-' : '') + rounded.toString() + 'p' + digits;

  return result;
}
