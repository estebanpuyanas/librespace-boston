import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  // Files to ignore globally. backend/ is Kotlin (its own ktlintCheck task
  // handles linting); data-service/ is Python + a venv full of vendored JS
  // that isn't ours to lint.
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'backend/**',
      'data-service/**',
      'mobile/.expo/**',
      'shared/generated/**',
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules for all TS/TSX files
  ...tseslint.configs.recommended,

  // Frontend-specific: React hooks and Fast Refresh
  {
    files: ['webclient/src/**/*.{ts,tsx}', 'mobile/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Cypress support/e2e files run in Cypress's own browser+test-runner global scope
  {
    files: ['testing/cypress/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, cy: 'readonly', Cypress: 'readonly' },
    },
  },

  // Shared rules across the whole monorepo
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  }
);
