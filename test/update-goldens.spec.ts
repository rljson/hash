// Copyright (c) 2024 CARAT Gesellschaft für Organisation
// und Softwareentwicklung mbH. All Rights Reserved.
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { expect, suite, test } from 'vitest';

import { updateGoldens } from '../src/update-goldens';

suite('updateGoldens', () => {
  test('should be set to false after updating', () => {
    expect(updateGoldens).toBe(false);
  });
});
