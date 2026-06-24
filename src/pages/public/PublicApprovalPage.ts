import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The PUBLIC contract approval/sign page (`/public/approval?p=<token>`),
 * reached via a recipient's link — no authentication required.
 *
 * Flow: accept the terms (checkbox enables Accept) → review the document →
 * Approve or Decline. Buttons expose stable aria keys
 * (ARIA_ACCEPT_TERMS / ARIA_REJECT_TERMS / ARIA_APPROVE_DOCUMENT /
 * ARIA_DECLINE_DOCUMENT).
 */
export class PublicApprovalPage {
  constructor(private readonly page: Page) {}

  private get termsCheckbox(): Locator {
    return this.page.getByRole('checkbox').first();
  }
  get acceptTermsButton(): Locator {
    return this.page.getByRole('button', { name: 'ARIA_ACCEPT_TERMS' });
  }
  get rejectTermsButton(): Locator {
    return this.page.getByRole('button', { name: 'ARIA_REJECT_TERMS' });
  }
  get approveButton(): Locator {
    return this.page.getByRole('button', { name: 'ARIA_APPROVE_DOCUMENT' });
  }
  get declineButton(): Locator {
    return this.page.getByRole('button', { name: 'ARIA_DECLINE_DOCUMENT' });
  }

  async open(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    // Slow-bootstrapping SPA — wait for the terms gate to render.
    await expect(this.acceptTermsButton).toBeVisible({ timeout: 30_000 });
  }

  /** The page rendered its approval controls. */
  async expectLoaded(): Promise<void> {
    await expect(this.acceptTermsButton).toBeVisible({ timeout: 30_000 });
    await expect(this.rejectTermsButton).toBeVisible();
  }

  /** Terms gating: Accept is disabled until the checkbox is ticked. */
  async expectAcceptGatedByTerms(): Promise<void> {
    await expect(this.acceptTermsButton).toBeDisabled();
    await this.termsCheckbox.check();
    await expect(this.acceptTermsButton).toBeEnabled();
  }

  /** Accept the terms to reveal the document approve/decline controls. */
  async acceptTerms(): Promise<void> {
    if (!(await this.termsCheckbox.isChecked())) await this.termsCheckbox.check();
    await this.acceptTermsButton.click();
    await expect(this.approveButton).toBeVisible({ timeout: 30_000 });
  }
}
