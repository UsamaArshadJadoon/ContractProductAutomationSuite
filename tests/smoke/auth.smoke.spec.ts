import { test, expect } from '../../src/fixtures/roles';

/**
 * Session-reuse authentication smoke (AUTH-202 / AUTH-203).
 *
 * The explicit full credential+OTP login per role lives in `auth.setup.ts`
 * (the only place we log in, to respect the login rate limit). These tests
 * verify the reused session works and that protected routes are guarded.
 */
test.describe('Authentication — session @smoke @auth', () => {
  test('AUTH-202: stored Admin session reaches the dashboard without re-login', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/dashboard');
    await expect(adminPage).toHaveURL(/\/admin\/dashboard/);
  });

  test('AUTH-202: stored Company session reaches the dashboard', async ({ companyPage }) => {
    await companyPage.goto('/company/dashboard');
    await expect(companyPage).toHaveURL(/\/company\/dashboard/);
  });

  test('AUTH-202: stored Individual session reaches the dashboard', async ({ individualPage }) => {
    await individualPage.goto('/individual/dashboard');
    await expect(individualPage).toHaveURL(/\/individual\/dashboard/);
  });

  test('AUTH-203: unauthenticated access to a protected route redirects to login', async ({
    page,
  }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
