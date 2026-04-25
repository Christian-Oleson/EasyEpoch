import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // Setup file installs fake timers before module imports, ensuring the
    // module-level `const today = new Date()` in index.ts gets a safe date.
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['lib/**/*.ts'],
      exclude: ['**/*.test.ts', 'tests/**', 'dist/**', 'docs/**'],
      reportsDirectory: 'coverage',
    },
  },
});
