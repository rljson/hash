/*
 * @license
 * Copyright (c) 2025 Rljson
 *
 * Use of this source code is governed by terms that can be
 * found in the LICENSE file in the root of this package.
 */
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsdoc from 'eslint-plugin-jsdoc';
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
      jsdoc,
      '@typescript-eslint': ts,
      ts,
    },
    rules: {
      // Example JSDoc rules
      'jsdoc/check-alignment': 'error', // Ensure JSDoc comments are aligned correctly
      'jsdoc/check-param-names': 'error', // Ensure parameter names match documentation
      'jsdoc/check-tag-names': 'error', // Ensure JSDoc tags are valid
      'jsdoc/check-types': 'error', // Ensure type names are valid

      'jsdoc/require-description': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],

      // Typescript rules
      // ...ts.configs['eslint-recommended'].rules,
      // ...ts.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'ts/return-await': 2,
    },
  },
];
