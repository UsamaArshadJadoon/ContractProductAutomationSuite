import { defineConfig, devices } from '@playwright/test';
import { config as appConfig } from './src/config/env';

/**
 * Playwright configuration for the Contract Portal UAT automation suite.
 *
 * Tag conventions (filter with `--grep`):
 *   @smoke      critical-path subset, runs on every PR — fast & stable
 *   @regression full suite, runs nightly and on demand
 */
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // Each test is fully isolated; safe to parallelise.
  fullyParallel: true,
  // Fail the CI build if someone leaves `test.only` in the source.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // In CI we shard across machines; locally use all cores.
  workers: isCI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: isCI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['github'],
        ['blob'], // merged across shards in CI
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: appConfig.baseURL,
    locale: appConfig.defaultLanguage === 'ar' ? 'ar-SA' : 'en-US',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Mints one reusable session per role; everything else depends on it.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts$/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Only spec files — never the setup file — run as chromium tests.
      testMatch: /\.spec\.ts$/,
      dependencies: ['setup'],
    },
  ],
});
