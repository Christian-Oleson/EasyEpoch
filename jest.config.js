module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    }],
  },
  moduleFileExtensions: ['ts', 'js'],
  // Use a fixed date so the module-level `const today = new Date()` in index.ts
  // doesn't pick up a date that triggers the 4-row February bug (e.g., Feb 2026).
  fakeTimers: {
    enableGlobally: true,
    now: new Date(2024, 5, 15, 12, 0, 0).getTime(),
  },
};
