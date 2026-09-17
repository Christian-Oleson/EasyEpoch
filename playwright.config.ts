import { defineConfig, devices } from '@playwright/test';

// Browser smoke tests. These complement (they do not replace) the jsdom suite
// in tests/: jsdom cannot evaluate CSS, so focus rings, pane visibility and
// real focus management are only observable here.
//
// The fixture loads dist/ over file://, so `npm run build` must have run first
// (the `test:e2e` script does that for you).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The `html` reporter is what writes playwright-report/, which the CI job
  // uploads as an artifact when a run fails; without it that upload would find
  // nothing. `open: 'never'` keeps it from trying to launch a browser on CI.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
