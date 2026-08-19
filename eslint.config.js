import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // Files to ignore globally
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules for all TS/TSX files
  ...tseslint.configs.recommended,

  // Frontend-specific: React hooks and Fast Refresh
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Server-specific overrides
  {
    files: ['server/src/**/*.ts'],
    rules: {
      // Allow void for fire-and-forget promise calls (e.g. activity tracker)
      '@typescript-eslint/no-floating-promises': 'off',
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
