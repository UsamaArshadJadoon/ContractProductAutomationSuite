import { test } from '../../src/fixtures/roles';
import { CompanyDashboardPage } from '../../src/pages/company/CompanyDashboardPage';
import { IndividualDashboardPage } from '../../src/pages/individual/IndividualDashboardPage';

/** Deeper dashboard-data assertions (async widgets behind loading spinners). */
test.describe('Dashboard data @regression', () => {
  test('CO-001b: company dashboard KPI cards render', async ({ companyPage }) => {
    await companyPage.goto('/company/dashboard');
    await new CompanyDashboardPage(companyPage).expectKpiCards();
  });

  test('IND-001b: individual dashboard shows general info + contract counts', async ({
    individualPage,
  }) => {
    await individualPage.goto('/individual/dashboard');
    await new IndividualDashboardPage(individualPage).expectContractCounts();
  });
});
