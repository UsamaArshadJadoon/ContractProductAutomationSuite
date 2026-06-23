import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { credentials, type Role, type RoleCredentials } from '../config/env';

/**
 * The login experience: a single-page flow that begins on a role-selection
 * screen, opens a tabbed Company/Individual form, then a 6-digit OTP step.
 *
 * Verified in Phase 1 for the Company Login (email) flow. The Individual
 * (national-ID) flow is wired the same way and asserted in its own test.
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get companyLoginButton(): Locator {
    return this.page.getByRole('button', { name: /Company Login/i });
  }

  private get individualLoginButton(): Locator {
    return this.page.getByRole('button', { name: /Individual Login/i });
  }

  private get usernameInput(): Locator {
    // Email (company) and national-ID (individual) share the first textbox slot.
    return this.page.getByRole('textbox', { name: /Email|National|Identity|رقم/i }).first();
  }

  private get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: /Password/i });
  }

  private get submitButton(): Locator {
    return this.page.getByRole('button', { name: /^Login$/ }).last();
  }

  /** The six single-character OTP inputs, in order. */
  private otpBox(index: number): Locator {
    return this.page.locator(`#input_${index}`);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.ensureLanguage();
  }

  /**
   * Full credential + OTP login for a role. Used by the explicit end-to-end
   * login tests and to mint storage state for the session-reuse fixtures.
   */
  async loginAs(role: Role): Promise<void> {
    const creds = credentials(role);
    await this.openForm(creds);
    await this.usernameInput.fill(creds.username);
    await this.passwordInput.fill(creds.password);
    await this.submitButton.click();
    await this.enterOtp(creds.otp);
    // Landing on any authenticated route means the OTP was accepted.
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  }

  private async openForm(creds: RoleCredentials): Promise<void> {
    // The role-selection screen exposes Company/Individual entry buttons that
    // open the tabbed form with the matching tab preselected.
    const entry = creds.method === 'company' ? this.companyLoginButton : this.individualLoginButton;
    await entry.click();
  }

  /**
   * Enter the 6-digit OTP. The component auto-submits on the final real
   * keystroke, so we type digit-by-digit (`pressSequentially`) rather than
   * `fill()`, which does not fire the key handler that triggers submission.
   */
  private async enterOtp(otp: string): Promise<void> {
    const digits = otp.split('');
    expect(digits, 'OTP must be 6 digits').toHaveLength(6);
    for (let i = 0; i < digits.length; i++) {
      await this.otpBox(i).pressSequentially(digits[i]);
    }
  }
}
