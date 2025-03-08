// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { updateGoldens } from './update-goldens';


describe('updateGoldens', () => {
  it('should be set to false after updating', () => {
    expect(updateGoldens).toBe(false);
  });
});
