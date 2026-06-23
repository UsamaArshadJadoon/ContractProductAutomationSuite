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

  private get emailInput(): Locator {
    return this.page.getByRole('textbox', { name: /Email/i });
  }

  private get idNumberInput(): Locator {
    return this.page.getByRole('textbox', { name: /ID Number/i });
  }

  private get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: /Password/i });
  }

  /** The submit button INSIDE a given tab's panel (not the header "Login"). */
  private loginButtonIn(tab: 'Company Login' | 'Individual Login'): Locator {
    return this.page.getByRole('tabpanel', { name: tab }).getByRole('button', { name: /^Login$/ });
  }

  private get continueButton(): Locator {
    return this.page.getByRole('button', { name: /^Continue$/ });
  }

  /** The six single-character OTP inputs, in order. */
  private otpBox(index: number): Locator {
    return this.page.locator(`#input_${index}`);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.ensureLanguage();
    // Wait out the SPA splash so the role-selection screen is actually rendered
    // before callers interact (otherwise locators probe a blank page).
    await this.companyLoginButton.first().waitFor({ state: 'visible' });
  }

  /**
   * Full credential + OTP login for a role. Used by the explicit end-to-end
   * login tests and to mint storage state for the session-reuse fixtures.
   */
  async loginAs(role: Role): Promise<void> {
    const creds = credentials(role);
    if (creds.method === 'company') {
      await this.companyLogin(creds);
    } else {
      await this.individualLogin(creds);
    }
    await this.enterOtp(creds.otp);
    // Landing on any authenticated route means the OTP was accepted.
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  }

  /** Company / Admin: single-step email + password form. */
  private async companyLogin(creds: RoleCredentials): Promise<void> {
    await this.companyLoginButton.click();
    await this.emailInput.fill(creds.username);
    await this.passwordInput.fill(creds.password);
    await this.loginButtonIn('Company Login').click();
  }

  /**
   * Individual: two-step form — national ID → Continue, then the password
   * field appears → Login. (Verified live in Phase 1.)
   */
  private async individualLogin(creds: RoleCredentials): Promise<void> {
    await this.individualLoginButton.click();
    // Type with real keystrokes (not fill) so the framework commits the value
    // before Continue submits — fill() can race the controlled input.
    await this.idNumberInput.pressSequentially(creds.username);
    await this.continueButton.click();
    // The password panel renders after an async check; type with real
    // keystrokes so the framework's controlled-input state is committed before
    // we submit (a plain fill() can race the re-render and submit empty).
    await this.passwordInput.pressSequentially(creds.password);
    await this.loginButtonIn('Individual Login').click();
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
    // Some roles auto-submit on the final keystroke; others don't. Pressing
    // Enter is the reliable trigger across all roles (verified in Phase 1) and
    // is a no-op once the form has already navigated.
    await this.page.keyboard.press('Enter');
  }
}
