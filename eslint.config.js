import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore all JS files and the coverage folder
  {
    ignores: ['**/*.js', 'coverage/', 'dist/'],
  },

  // Configure eslint for implementation files
  ...tseslint.configs.recommended,
  {
    rules: {
      // Typescript rules
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    ignores: ['**/*.spec.ts'],
  },
  // Configure tsdoc
  {
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
    },
  },

  // Configure eslint for test files
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      jsdoc: 'off',
    },
  },
];
