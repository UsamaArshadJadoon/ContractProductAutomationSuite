import { test, expect } from '../../src/fixtures/roles';
import { CompanyContractsPage } from '../../src/pages/company/CompanyContractsPage';
import { PublicApprovalPage } from '../../src/pages/public/PublicApprovalPage';

/**
 * Contract Management — Approval (recipient-as-Approver via public link).
 *
 * These cases are NON-DESTRUCTIVE: they cover the approval entry points, the
 * public approval link, and the public page's terms gating WITHOUT submitting an
 * approve/decline (the listed Need-Approval contracts belong to other users).
 * The full approve/reject mutation belongs to a self-created+sent contract and
 * is built with the Send flow.
 *
 * Relies on an existing Need-Approval contract in UAT (reference below).
 */
const PENDING_REF = 'conttesting';

const APPROVAL_URL = /\/public\/approval\?p=/;

test.describe('Contract approval @regression @contracts @approval', () => {
  test('CM-A-01: a pending contract exposes the approval-link actions', async ({ companyPage }) => {
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.search(PENDING_REF);
    await contracts.openActionMenu(PENDING_REF);

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
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.search(PENDING_REF);

    const url = await contracts.copyApprovalLink(PENDING_REF);
    expect(url).toMatch(APPROVAL_URL);
  });

  test('CM-A-03: the public approval page renders Accept/Reject controls @smoke', async ({
    companyPage,
    browser,
  }) => {
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.search(PENDING_REF);
    const url = await contracts.copyApprovalLink(PENDING_REF);

    // Open the public link in a fresh, UNAUTHENTICATED context.
    const ctx = await browser.newContext();
    const approval = new PublicApprovalPage(await ctx.newPage());
    await approval.open(url);
    await approval.expectLoaded();
    await ctx.close();
  });

  test('CM-A-04: Accept is gated by the terms checkbox', async ({ companyPage, browser }) => {
    await companyPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.goto();
    await contracts.expectLoaded();
    await contracts.search(PENDING_REF);
    const url = await contracts.copyApprovalLink(PENDING_REF);

    const ctx = await browser.newContext();
    const approval = new PublicApprovalPage(await ctx.newPage());
    await approval.open(url);
    await approval.expectAcceptGatedByTerms();
    await ctx.close();
  });
});
