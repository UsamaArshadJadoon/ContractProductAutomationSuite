import { test } from '../../src/fixtures/roles';
import { AdminDashboardPage } from '../../src/pages/admin/AdminDashboardPage';
import { CompanyDashboardPage } from '../../src/pages/company/CompanyDashboardPage';
import { IndividualDashboardPage } from '../../src/pages/individual/IndividualDashboardPage';

/** Per-role dashboard smoke (ADMIN-001 / CO-001 / IND-001). */
test.describe('Dashboards @smoke', () => {
  test('ADMIN-001: admin dashboard loads', async ({ adminPage }) => {
    await adminPage.goto('/admin/dashboard');
    await new AdminDashboardPage(adminPage).expectLoaded();
  });

  test('CO-001: company dashboard loads', async ({ companyPage }) => {
    await companyPage.goto('/company/dashboard');
    await new CompanyDashboardPage(companyPage).expectLoaded();
  });

  test('IND-001: individual dashboard loads', async ({ individualPage }) => {
    await individualPage.goto('/individual/dashboard');
    const dashboard = new IndividualDashboardPage(individualPage);
    await dashboard.expectLoaded();
  });
});
