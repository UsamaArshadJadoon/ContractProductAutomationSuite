import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { SelfHealingLocator } from '../../src/healing/SelfHealingLocator';

/**
 * Self-healing demonstrations (public login page — no auth needed).
 *
 * HEAL-1 proves the safety net works: a broken primary locator is healed back
 * to the correct element and the functional assertion passes.
 *
 * HEAL-2 proves the net is honest: when a heal drifts to a wrong-but-similar
 * element, the functional assertion catches it — a healed step is never a
 * silent pass.
 */
test.describe('Self-healing locator @regression @healing', () => {
  test('HEAL-1: heals a broken locator to the right element (assertion passes)', async ({
    page,
  }) => {
    await new LoginPage(page).goto();
    const healer = new SelfHealingLocator(page);

    // Healthy run records the fingerprint for the Company Login button.
    await healer.locate(
      'demo.companyLoginButton',
      page.getByRole('button', { name: /Company Login/i }),
      'getByRole(button, "Company Login")',
    );

    // Simulate a redesign that breaks the primary selector. The healer falls
    // back via the stored fingerprint to the same button.
    const healed = await healer.locate(
      'demo.companyLoginButton',
      page.getByTestId('company-login-btn-REMOVED'),
      'getByTestId("company-login-btn-REMOVED")',
    );
    await healed.click();

    // Functional assertion: the company login form actually opened.
    await expect(page.getByRole('textbox', { name: /Email/i })).toBeVisible();
  });

  test('HEAL-2: a functionally-wrong heal is caught by the assertion', async ({ page }) => {
    await new LoginPage(page).goto();
    const healer = new SelfHealingLocator(page);

    // Fingerprint points at the Individual button — the "wrong but similar"
    // element a drifting heal could land on when we actually want Company.
    await healer.locate(
      'demo.driftsToIndividual',
      page.getByRole('button', { name: /Individual Login/i }),
      'getByRole(button, "Individual Login")',
    );

    const healed = await healer.locate(
      'demo.driftsToIndividual',
      page.getByTestId('gone'),
      'getByTestId("gone")',
    );
    await healed.click(); // opens the Individual form, NOT the intended Company form

    // The functional assertion for the intended (Company) action MUST fail —
    // proving a similar-but-wrong healed element cannot pass silently.
    let assertionRejected = false;
    try {
      await expect(page.getByRole('textbox', { name: /Email/i })).toBeVisible({ timeout: 3000 });
    } catch {
      assertionRejected = true;
    }
    expect(
      assertionRejected,
      'a wrong healed element must be caught by the functional assertion',
    ).toBe(true);
  });
});
