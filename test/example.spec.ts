// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { readFile, writeFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';

import { example } from '../src/example';

import { updateGoldens } from './setup/goldens';

describe('example', () => {
  it('should run without error', async () => {
    // Execute example
    const logMessages: string[] = [];
    const log = console.log;
    console.log = (message: string) => logMessages.push(message);
    example();

    // Write golden file
    const logFilePath = 'test/goldens/example.log';
    if (updateGoldens()) {
      await writeFile(logFilePath, logMessages.join('\n'));
    }

    // Compare log messages with golden file
    const golden = await readFile(logFilePath, 'utf8');
    expect(golden).toBe(logMessages.join('\n'));

    // Restore console.log
    console.log = log;
  });
});
