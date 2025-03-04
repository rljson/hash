// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { exampleJson } from '../src/json';

describe('json', () => {
  it('should have a hash', () => {
    expect(exampleJson()).toEqual({
      _hash: 'AFhW-fMzdCiz6bUZscp1Lf',
      a: '0',
    });
  });
});
