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

  test('RBAC-002: Individual sidebar exposes only its own surface', async ({ individualPage }) => {
    await individualPage.goto('/individual/dashboard');
    const sidebar = new Sidebar(individualPage);
    await sidebar.expectLoaded();
    for (const item of [...ADMIN_ONLY, 'Templates', 'My Invoices', 'My Subscriptions']) {
      await sidebar.expectAbsent(item);
    }
  });

  test('RBAC-003: Individual cannot deep-link into the admin area', async ({ individualPage }) => {
    await individualPage.goto('/admin/dashboard');
    await expect(individualPage).not.toHaveURL(/\/admin\/dashboard/);
  });

  test('RBAC-005: Company Admin cannot deep-link into the admin area', async ({ companyPage }) => {
    await companyPage.goto('/admin/dashboard');
    await expect(companyPage).not.toHaveURL(/\/admin\/dashboard/);
  });

  test('RBAC-007: unauthenticated deep-link to a protected route lands on login', async ({
    page,
  }) => {
    await page.goto('/company/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
