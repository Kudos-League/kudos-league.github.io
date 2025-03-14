import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: { globals: globals.browser },
    rules: {
      // Enforce 2-space indentation
      indent: ['error', 2, { SwitchCase: 1 }],

      // Other rules you might find helpful
      // 'linebreak-style': ['error', 'unix'], // Ensure consistent line endings
      'quotes': ['error', 'single'], // Use single quotes
      'semi': ['error', 'always'], // Always use semicolons

      // Enable ESLint auto-fix for common formatting issues
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error'
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];
