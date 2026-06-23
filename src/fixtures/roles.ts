import { test as base, type BrowserContext, type Page } from '@playwright/test';
import type { Role } from '../config/env';
import { authFile } from './auth-state';

/**
 * Per-role authenticated page fixtures. Each opens a fresh browser context
 * seeded with the role's saved storage state (minted once by `auth.setup.ts`),
 * so tests start already logged in WITHOUT hitting the rate-limited login API.
 *
 * A test requests only the role(s) it needs:
 *   test('...', async ({ companyPage }) => { ... });
 */
export type RoleFixtures = {
  adminPage: Page;
  companyPage: Page;
  individualPage: Page;
};

async function withRole(
  browser: { newContext: (opts: { storageState: string }) => Promise<BrowserContext> },
  role: Role,
  use: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ storageState: authFile(role) });
  const page = await context.newPage();
  try {
    await use(page);
  } finally {
    await context.close();
  }
}

export const test = base.extend<RoleFixtures>({
  adminPage: async ({ browser }, use) => {
    await withRole(browser, 'admin', use);
  },
  companyPage: async ({ browser }, use) => {
    await withRole(browser, 'companyAdmin', use);
  },
  individualPage: async ({ browser }, use) => {
    await withRole(browser, 'individual', use);
  },
});

export { expect } from '@playwright/test';
