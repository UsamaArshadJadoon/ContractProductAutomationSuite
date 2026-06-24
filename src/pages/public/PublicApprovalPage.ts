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

  private get verifyOtpButton(): Locator {
    return this.page.getByRole('button', { name: 'ARIA_VERIFY_OTP' });
  }

  async open(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    // The recipient must verify via OTP before reviewing (sent to their
    // email/phone; static in UAT).
    if (await this.verifyOtpButton.isVisible({ timeout: 8_000 }).catch(() => false)) {
      const otp = process.env.INDIVIDUAL_OTP ?? '111111';
      const digits = otp.split('');
      await this.page.locator('#input_0').waitFor({ state: 'visible', timeout: 10_000 });
      await this.page.waitForTimeout(3000); // let the OTP inputs settle
      const boxes = this.page.locator('input');
      for (let i = 0; i < digits.length; i++) {
        await boxes.nth(i).fill(digits[i]);
      }
      await this.page.waitForTimeout(500);
      await this.verifyOtpButton.click();
    }
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

  /** Confirm a follow-up dialog (Approve/Decline often ask to confirm). */
  private async confirmDialog(names: RegExp): Promise<void> {
    await this.page.waitForTimeout(800);
    await this.page
      .getByRole('button', { name: names })
      .last()
      .click({ timeout: 4000 })
      .catch(() => {});
  }

  /** Accept terms and approve the document. */
  async approve(): Promise<void> {
    await this.acceptTerms();
    await this.approveButton.click();
    await this.confirmDialog(/^(Approve|Confirm|Yes|Ok|Submit|Done)$/i);
  }

  /** Accept terms and decline the document (supplies a reason if required). */
  async decline(reason = 'Automated test decline'): Promise<void> {
    await this.acceptTerms();
    await this.declineButton.click();
    await this.page.waitForTimeout(800);
    const reasonBox = this.page.getByRole('textbox').first();
    if (await reasonBox.count()) await reasonBox.fill(reason).catch(() => {});
    await this.confirmDialog(/^(Decline|Reject|Confirm|Yes|Ok|Submit)$/i);
  }
}
