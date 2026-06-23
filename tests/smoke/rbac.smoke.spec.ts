import { test, expect } from '../../src/fixtures/roles';
import { Sidebar } from '../../src/pages/components/Sidebar';

/**
 * Role-based access control (RBAC) — explicit negative authorization.
 * Lower-privilege roles must neither SEE admin-only nav nor REACH admin routes.
 */
test.describe('RBAC @smoke @rbac', () => {
  // Admin-only sidebar entries that must never appear for other roles.
  const ADMIN_ONLY = ['Service Providers', 'Reports', 'Translation', 'Notifications'];

  test('RBAC-001: Company Admin sidebar hides all admin-only items', async ({ companyPage }) => {
    await companyPage.goto('/company/dashboard');
    const sidebar = new Sidebar(companyPage);
    await sidebar.expectLoaded();
    for (const item of ADMIN_ONLY) {
      await sidebar.expectAbsent(item);
    }
  });

  // Deep-linking a non-admin into /admin/* leaves a blank shell (the admin app
  // doesn't render for them) and may not change the URL — so the reliable
  // security assertion is that NO admin-only functionality is reachable.
  test('RBAC-005: Company Admin cannot access the admin area', async ({ companyPage }) => {
    await companyPage.goto('/admin/dashboard');
    const sidebar = new Sidebar(companyPage);
    for (const item of ADMIN_ONLY) {
      await sidebar.expectAbsent(item);
    }
  });

  test('RBAC-007: unauthenticated deep-link grants no authenticated session', async ({ page }) => {
    await page.goto('/company/dashboard');
    await expect(page.getByRole('button', { name: /Logout Account/i })).toHaveCount(0);
  });
});
