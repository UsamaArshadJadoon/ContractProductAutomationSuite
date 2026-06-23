import { test } from '../../src/fixtures/roles';
import { CompanyDashboardPage } from '../../src/pages/company/CompanyDashboardPage';

/** Deeper company dashboard-data assertions (async KPI widgets). Company focus. */
test.describe('Dashboard data @regression', () => {
  test('CO-001b: company dashboard KPI cards render', async ({ companyPage }) => {
    await companyPage.goto('/company/dashboard');
    await new CompanyDashboardPage(companyPage).expectKpiCards();
  });
});
