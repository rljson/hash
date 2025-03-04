// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { example } from '../src/example';

describe('example', () => {
  it('should run without error', () => {
    // Mock console.log
    const logMessages: string[] = [];
    console.log = (message: string) => logMessages.push(message);
    example();
    const l = logMessages;
    expect(l[0]).toBe('Create a json structure');
    expect(l[1]).toBe('Add hashes to the json structure.');
    expect(l[2]).toBe(
      [
        '{',
        '  "a": "0",',
        '  "b": "1",',
        '  "child": {',
        '    "d": 3,',
        '    "e": 4,',
        '    "_hash": "nfTEHYDoqVPb3ieJSmBxft"',
        '  },',
        '  "_hash": "k-3v5I-Q6Q9vPdVJxsMYUk"',
        '}',
      ].join('\n'),
    );

    expect(l[3]).toBe('Set a maximum floating point precision.');
    expect(l[4]).toBe('Number 1.000001 has a higher precision than 0.001.');
    expect(l[5]).toBe(
      'Use the "inPlace" option to modify the input object directly.',
    );
    expect(l[6]).toBe(
      'Set "upateExistingHashes: false" to create missing hashes but without touching existing ones.',
    );
    expect(l[7]).toBe(
      'If existing hashes do not match new ones, an error is thrown.',
    );
    expect(l[8]).toBe(
      'Hash "invalid" does not match the newly calculated one "AVq9f1zFei3ZS3WQ8ErYCE". ' +
        'Please make sure that all systems are producing the same hashes.',
    );
    expect(l[9]).toBe(
      'Set "throwOnWrongHashes" to false to replace invalid hashes.',
    );
    expect(l[10]).toBe('invalid');
    expect(l[11]).toBe('Use validate to check if the hashes are correct');
    expect(l[12]).toBe(
      'Hash "invalid" is wrong. Should be "cHeM4BrY0agsgKNQC-5Hbz".',
    );

    console.log = console.log;
  });
});
