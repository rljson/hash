/*
 * @license
 * Copyright (c) 2025 Rljson
 *
 * Use of this source code is governed by terms that can be
 * found in the LICENSE file in the root of this package.
 */
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...tseslint.configs.recommended,
  {},

  { ignores: ['node_modules', 'dist', 'coverage', 'test'] },
  {
    files: ['./src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          modules: true,
        },
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
    },
    plugins: {
      tsdoc,
      '@typescript-eslint': ts,
      ts,
    },
    rules: {
      ...tsdoc.rules,

      // Typescript rules
      // ...ts.configs['eslint-recommended'].rules,
      // ...ts.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'ts/return-await': 2,
    },
  },
];
