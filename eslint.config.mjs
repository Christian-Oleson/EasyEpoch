import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  {
    files: ['lib/**/*.ts'],
  },
  {
    ignores: ['dist/', 'docs/', 'node_modules/', '*.config.*'],
  },
  {
    rules: {
      // Allow explicit any in existing code — tighten over time
      '@typescript-eslint/no-explicit-any': 'warn',
      // Security rules tuned for this project
      'security/detect-object-injection': 'off', // too noisy for bracket access patterns
    },
  },
);
