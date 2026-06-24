import { test, expect } from '../../src/fixtures/roles';
import { CompanyContractsPage } from '../../src/pages/company/CompanyContractsPage';
import { PublicApprovalPage } from '../../src/pages/public/PublicApprovalPage';
import { createAndSendContract, approvalLinkFor } from '../../src/support/contractFlows';

/**
 * Contract Management — Approval entry points (recipient-as-Approver).
 *
 * Self-contained: each test creates + sends its OWN contract, then exercises the
 * approval-link surface. The actual approve/decline submission lives in
 * contract-approval-e2e.spec.ts.
 */
const APPROVAL_URL = /\/public\/approval\?p=/;

test.describe('Contract approval @regression @contracts @approval', () => {
  test('CM-A-01: a sent contract exposes the approval-link actions', async ({ companyPage }) => {
    test.setTimeout(180_000);
    const contractNumber = await createAndSendContract(companyPage);

    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.search(contractNumber);
    await contracts.openActionMenu(contractNumber);

    const items = (await contracts.actionMenuItems()).join(' | ');
    for (const expected of [
      'Copy Link',
      'Resend approval URL',
      'View Contract Details',
      'Cancel',
    ]) {
      expect(items, `action menu should include "${expected}"`).toContain(expected);
    }
    await contracts.closeMenu();
  });

  test('CM-A-02: Copy Link yields a valid public approval URL', async ({ companyPage }) => {
    test.setTimeout(180_000);
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const contractNumber = await createAndSendContract(companyPage);
    const url = await approvalLinkFor(companyPage, contractNumber);
    expect(url).toMatch(APPROVAL_URL);
  });

  test('CM-A-03: the public approval page renders the OTP/terms gate @smoke', async ({
    companyPage,
    browser,
  }) => {
    // KNOWN BLOCKER: our own contract's public page requires OTP verification,
    // which is throttled after heavy OTP use in a session. Enable on a fresh
    // session. (Mechanism implemented in PublicApprovalPage.)
    test.fixme(true, 'Public approval OTP verification throttled');
    test.setTimeout(180_000);
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const contractNumber = await createAndSendContract(companyPage);
    const url = await approvalLinkFor(companyPage, contractNumber);

    const ctx = await browser.newContext();
    const approval = new PublicApprovalPage(await ctx.newPage());
    await approval.open(url);
    await approval.expectLoaded();
    await ctx.close();
  });

  test('CM-A-04: Accept is gated by the terms checkbox', async ({ companyPage, browser }) => {
    test.fixme(true, 'Public approval OTP verification throttled');
    test.setTimeout(180_000);
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const contractNumber = await createAndSendContract(companyPage);
    const url = await approvalLinkFor(companyPage, contractNumber);

    const ctx = await browser.newContext();
    const approval = new PublicApprovalPage(await ctx.newPage());
    await approval.open(url);
    await approval.expectAcceptGatedByTerms();
    await ctx.close();
  });
});
