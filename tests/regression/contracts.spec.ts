import { test } from '../../src/fixtures/roles';
import { CompanyContractsPage } from '../../src/pages/company/CompanyContractsPage';
import { IndividualContractsPage } from '../../src/pages/individual/IndividualContractsPage';

/** Contracts listing & navigation (CO-101, IND-101/103). */
test.describe('Contracts management @regression @contracts', () => {
  test('CO-101: company contracts page loads and Contracts/Drafts tabs switch', async ({
    companyPage,
  }) => {
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.switchTo('Drafts');
    await contracts.switchTo('Contracts');
  });

  test('CO-201: Create Contract opens the upload step of the wizard', async ({ companyPage }) => {
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.startCreateContract();
  });

  test('IND-101: individual contracts table loads with expected columns', async ({
    individualPage,
  }) => {
    const contracts = new IndividualContractsPage(individualPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.expectColumns();
  });
});
