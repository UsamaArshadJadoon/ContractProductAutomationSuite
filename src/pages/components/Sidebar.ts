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

  private get root(): Locator {
    return this.page.getByRole('navigation').first();
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
    await this.page.getByRole('button', { name: /Logout Account/i }).click();
    await this.page.waitForURL(/\/login/);
  }

  /** Confirm the sidebar (hence an authenticated shell) is rendered. */
  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await this.expectVisible('Dashboard');
  }
}
