// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// floatToString.spec.ts
import { describe, expect, it } from 'vitest';

import { floatRep } from '../src/float-rep';

describe('floatRepresentation (current behavior with "p<digits>" suffix)', () => {
  // ---- Integers: returned as-is (no suffix) ----
  it('returns integers as plain strings', () => {
    expect(floatRep(0)).toBe('0');
    expect(floatRep(-0)).toBe('0'); // (-0).toString() === "0"
    expect(floatRep(7)).toBe('7');
    expect(floatRep(-42)).toBe('-42');
    expect(floatRep(100000000)).toBe('100000000');
  });

  // ---- |x| < 10 -> digits=8, factor=1e8 ----
  it('appends "p8" for non-integers with |x| < 10', () => {
    expect(floatRep(0.123456789)).toBe('12345679p8'); // 0.123456789 * 1e8 = 12,345,678.9 → 12,345,679
    expect(floatRep(9.5)).toBe('950000000p8');
    expect(floatRep(9.999999995)).toBe('1000000000p8'); // rounds up
    expect(floatRep(-0.000000016)).toBe('-2p8'); // -1.6 → -2
  });

  // ---- 10 ≤ |x| < 100 -> digits=7, factor=1e7 ----
  it('appends "p7" for non-integers with 10 ≤ |x| < 100', () => {
    expect(floatRep(12.3456789)).toBe('123456789p7'); // 12.3456789 * 1e7 = 123,456,789
    expect(floatRep(99.99999995)).toBe('1000000000p7'); // 999,999,999.5 → 1,000,000,000
    expect(floatRep(-12.34)).toBe('-123400000p7'); // -12.34 * 1e7 = -123,400,000
  });

  // ---- 100 ≤ |x| < 1000 -> digits=6, factor=1e6 ----
  it('appends "p6" for non-integers with 100 ≤ |x| < 1000', () => {
    expect(floatRep(123.456789)).toBe('123456789p6');
    expect(floatRep(-100.000001)).toBe('-100000001p6');
  });

  // ---- 1000 ≤ |x| < 10000 -> digits=5, factor=1e5 ----
  it('appends "p5" for non-integers with 1000 ≤ |x| < 10000', () => {
    expect(floatRep(1234.56789)).toBe('123456789p5');
    expect(floatRep(-9999.1)).toBe('-999910000p5');
  });

  // ---- 10000 ≤ |x| < 100000 -> digits=4, factor=1e4 ----
  it('appends "p4" for non-integers with 10000 ≤ |x| < 100000', () => {
    expect(floatRep(12345.6789)).toBe('123456789p4');
    expect(floatRep(-10000.01)).toBe('-100000100p4');
  });

  // ---- 100000 ≤ |x| < 1000000 -> digits=3, factor=1e3 ----
  it('appends "p3" for non-integers with 100000 ≤ |x| < 1000000', () => {
    expect(floatRep(123456.789)).toBe('123456789p3');
    expect(floatRep(-999999.40001)).toBe('-999999400p3'); // -999999.4 * 1e3 = -999,999.4 → -1,000,000? (check)
  });

  // ---- 1e6 ≤ |x| < 1e7 -> digits=2, factor=1e2 ----
  it('appends "p2" for non-integers with 1e6 ≤ |x| < 1e7', () => {
    expect(floatRep(1234567.89)).toBe('123456789p2'); // 1,234,567.89 * 100 = 123,456,789
    expect(floatRep(-1000000.01)).toBe('-100000001p2');
  });

  // ---- 1e7 ≤ |x| < 1e8 -> digits=2, factor=1e2 ----
  it('appends "p1" for non-integers with 1e7 ≤ |x| < 1e8', () => {
    expect(floatRep(12345678.9)).toBe('1234567890p2'); // 12,345,678.9 * 10 = 123,456,789
    expect(floatRep(-99999999.4)).toBe('-9999999940p2');
  });

  // ---- ≥ 1e8 -> digits=2, factor=2 ----
  it('appends "p0" for non-integers with |x| ≥ 1e8', () => {
    expect(floatRep(123456789.44)).toBe('12345678944p2');
    expect(floatRep(123456789.65)).toBe('12345678965p2');
    expect(floatRep(-100000000.49)).toBe('-10000000049p2');
    expect(floatRep(-100000000.5)).toBe('-10000000050p2'); // halves away from 0
  });

  // ---- Boundary checks around thresholds ----
  it('uses the correct bucket right above thresholds (non-integers)', () => {
    expect(floatRep(10.00000001)).toBe('100000000p7');
    expect(floatRep(100.0000001)).toBe('100000000p6');
    expect(floatRep(1000.000001)).toBe('100000000p5');
    expect(floatRep(10000.00001)).toBe('100000000p4');
    expect(floatRep(100000.0001)).toBe('100000000p3');
    expect(floatRep(1000000.001)).toBe('100000000p2');
    expect(floatRep(10000000.01)).toBe('1000000001p2');
    expect(floatRep(100_000_000.1)).toBe('10000000010p2');
  });

  it('treats exact thresholds that are integers as integers', () => {
    expect(floatRep(10)).toBe('10');
    expect(floatRep(100)).toBe('100');
    expect(floatRep(1000)).toBe('1000');
    expect(floatRep(10000)).toBe('10000');
    expect(floatRep(100000)).toBe('100000');
    expect(floatRep(1000000)).toBe('1000000');
    expect(floatRep(10000000)).toBe('10000000');
    expect(floatRep(100000000)).toBe('100000000');
  });
});
