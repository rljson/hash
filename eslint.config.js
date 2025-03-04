import pluginJs from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';
// import eslintPlugin from 'vite-plugin-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['node_modules', 'dist', 'test'] },
  { files: ['./src/**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: { ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: { jsdoc },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-shadow': 'error',
      'no-redeclare': 'error',
      'no-unused-expressions': 'error',
      'no-unused-labels': 'error',
      'no-undef-init': 'error',
      'no-undefined': 'error',

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
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.spec.js'], // Match test files
    rules: {
      'jsdoc/require-jsdoc': 'off', // Disable requiring JSDoc
      'jsdoc/require-description': 'off', // Disable requiring a description
    },
  },
];
