import fs from 'node:fs';
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { authFile, AUTH_DIR, sessionIsFresh } from '../src/fixtures/auth-state';
import type { Role } from '../src/config/env';

/**
 * Authentication setup project. Runs FIRST (other projects depend on it) and
 * performs the ONLY full credential+OTP logins of a run — one per role — then
 * saves each session as storage state for reuse. This is what keeps us under
 * the login API's rate limit (HTTP 429): every other test replays a session.
 *
 * These cases also satisfy the "explicit end-to-end login test per role"
 * requirement: each asserts the role lands on its expected dashboard.
 *
 * Tagged @smoke @regression so they run under any tag filter (a project's
 * dependency tests are only executed if they match the active --grep).
 */
const LANDING: Record<Role, RegExp> = {
  admin: /\/admin\/dashboard/,
  companyAdmin: /\/company\/dashboard/,
  individual: /\/individual\/dashboard/,
};

/**
 * Cooldown after each login to stay clear of the login rate limit. This is a
 * deliberate throttle against a server-side limit, not a UI synchronization
 * wait (tests themselves use only web-first assertions). Configurable via env.
 */
const COOLDOWN_MS = Number(process.env.LOGIN_SETUP_COOLDOWN_MS ?? '4000');

setup.describe.configure({ mode: 'serial' });

setup.beforeAll(() => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

const roles: Role[] = ['admin', 'companyAdmin', 'individual'];

for (const role of roles) {
  setup(`authenticate ${role} @smoke @regression`, async ({ page }) => {
    // Reuse a recently-minted session rather than logging in again — this is
    // what keeps repeated runs under the login rate limit.
    setup.skip(sessionIsFresh(role), `reusing fresh ${role} session`);

    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(role);

    // Explicit E2E login assertion: correct authenticated landing.
    await expect(page).toHaveURL(LANDING[role]);

    await page.context().storageState({ path: authFile(role) });

    if (COOLDOWN_MS > 0) {
      await page.waitForTimeout(COOLDOWN_MS);
    }
  });
}
