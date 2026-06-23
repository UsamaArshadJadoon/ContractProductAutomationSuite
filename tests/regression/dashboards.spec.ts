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
    // KNOWN UAT ISSUE: the individual dashboard's data widgets stay on loading
    // spinners indefinitely (>30s) for the test account — the data API does not
    // resolve. The individual's real data is verified via IND-101 (contracts
    // table). See docs/feature-inventory.md "Open gaps". Re-enable once fixed.
    test.fixme(true, 'UAT individual dashboard widgets never finish loading');
    await individualPage.goto('/individual/dashboard');
    await new IndividualDashboardPage(individualPage).expectContractCounts();
  });
});
