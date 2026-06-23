import { test } from '../../src/fixtures/roles';
import { CompanyDashboardPage } from '../../src/pages/company/CompanyDashboardPage';

/** Company dashboard smoke (CO-001). Admin/Individual disabled — company focus. */
test.describe('Dashboards @smoke', () => {
  test('CO-001: company dashboard loads', async ({ companyPage }) => {
    await companyPage.goto('/company/dashboard');
    await new CompanyDashboardPage(companyPage).expectLoaded();
  });
});
