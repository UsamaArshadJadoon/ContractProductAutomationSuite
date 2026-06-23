import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { AdminDashboardPage } from '../../src/pages/admin/AdminDashboardPage';

/**
 * Phase 0 pipeline-proving smoke test: a real end-to-end Admin login
 * (credentials → OTP → authenticated landing) against UAT. This single test
 * exercises the whole stack — config, env, page objects, OTP handling — so the
 * CI pipeline is proven before the suite is scaled up.
 */
test.describe('Authentication @smoke', () => {
  test('Admin can log in and reach the dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('admin');

    const dashboard = new AdminDashboardPage(page);
    await dashboard.expectLoaded();
  });
});
