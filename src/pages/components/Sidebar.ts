import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The shared left navigation sidebar (present in every authenticated portal).
 * Nav entries are links (leaf routes) or buttons (collapsible groups); their
 * accessible names embed an icon label + the visible text, so we match on the
 * visible label via regex.
 *
 * Used for navigation and for RBAC assertions (a role must NOT see items
 * outside its surface).
 */
export class Sidebar {
  constructor(private readonly page: Page) {}

  /** The Logout control is present in every authenticated portal's sidebar. */
  private get logoutButton(): Locator {
    return this.page.getByRole('button', { name: /Logout Account/i });
  }

  /** A nav entry (link or button) by its visible label. */
  item(label: string): Locator {
    return this.page
      .getByRole('link', { name: new RegExp(label, 'i') })
      .or(this.page.getByRole('button', { name: new RegExp(label, 'i') }));
  }

  async expectVisible(label: string): Promise<void> {
    await expect(this.item(label).first()).toBeVisible();
  }

  /** Assert a nav entry is absent — the core RBAC negative check. */
  async expectAbsent(label: string): Promise<void> {
    await expect(this.item(label)).toHaveCount(0);
  }

  /** Expand a collapsible group (accordion) if it isn't already open. */
  async expandGroup(label: string): Promise<void> {
    const group = this.page.getByRole('button', { name: new RegExp(label, 'i') });
    await group.click();
  }

  async goTo(label: string): Promise<void> {
    await this.item(label).first().click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }

  /**
   * Confirm the sidebar (hence the authenticated shell) is rendered. The SPA
   * shows a splash while it bootstraps after a deep-link into a session, so
   * allow a generous wait for the shell to appear.
   */
  async expectLoaded(): Promise<void> {
    await expect(this.item('Dashboard').first()).toBeVisible({ timeout: 30_000 });
    await expect(this.logoutButton).toBeVisible();
  }
}
