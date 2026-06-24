import { test, expect } from '../../src/fixtures/roles';
import { CompanyContractsPage } from '../../src/pages/company/CompanyContractsPage';
import { PublicApprovalPage } from '../../src/pages/public/PublicApprovalPage';
import { createAndSendContract, approvalLinkFor } from '../../src/support/contractFlows';
import type { Browser } from '@playwright/test';

/**
 * Contract Management — full create → send → approve/reject E2E.
 *
 * Each test creates and sends its OWN contract (recipient = the Individual test
 * account as Approver), so submitting an approve/decline only affects our own
 * data. Authorized to create contracts in UAT.
 */

async function openPublicApproval(browser: Browser, url: string): Promise<PublicApprovalPage> {
  const ctx = await browser.newContext();
  const approval = new PublicApprovalPage(await ctx.newPage());
  await approval.open(url);
  return approval;
}

test.describe('Contract approval E2E @regression @contracts @approval @e2e', () => {
  test('CM-E-00: create → send for approval → appears as Need Approval', async ({
    companyPage,
  }) => {
    test.setTimeout(180_000);
    const contractNumber = await createAndSendContract(companyPage);
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.expectStatus(
      contractNumber,
      /Individual Review|Need Approval|No Response|Under Review/i,
    );
  });

  test('CM-E-01: create → send for approval → APPROVE via public link', async ({
    companyPage,
    browser,
  }) => {
    // KNOWN BLOCKERS (mechanism is implemented; enable on a fresh UAT session):
    //  1. The public approval page's OTP verification gets throttled after
    //     heavy OTP usage in a session (same rate limit as login).
    //  2. The placed Signature field must be completed on the public page
    //     before Approve — that signing modal step is not yet automated.
    // The create→send half is fully verified by CM-E-00.
    test.fixme(true, 'Public approval OTP throttled + signature-completion step pending');
    test.setTimeout(180_000);
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const contractNumber = await createAndSendContract(companyPage);
    const url = await approvalLinkFor(companyPage, contractNumber);

    const approval = await openPublicApproval(browser, url);
    await approval.approve();
    // A completed approval removes the approve control from the public page.
    await expect(approval.approveButton).toBeHidden({ timeout: 30_000 });
  });

  test('CM-E-02: create → send for approval → DECLINE via public link', async ({
    companyPage,
    browser,
  }) => {
    test.fixme(true, 'Public approval OTP throttled + signature-completion step pending');
    test.setTimeout(180_000);
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const contractNumber = await createAndSendContract(companyPage);
    const url = await approvalLinkFor(companyPage, contractNumber);

    const approval = await openPublicApproval(browser, url);
    await approval.decline();
    await expect(approval.declineButton).toBeHidden({ timeout: 30_000 });
  });
});
