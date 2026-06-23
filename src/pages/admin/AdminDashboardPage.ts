import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * The Admin landing page (/admin/dashboard). Phase 0 only needs the
 * post-login landmark; the full admin surface is built out in Phase 3.
 */
export class AdminDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get sidebarDashboardLink(): Locator {
    return this.page.getByRole('link', { name: /Dashboard/i });
  }

  private get heading(): Locator {
    return this.page.getByText('Dashboard', { exact: true }).first();
  }

  /** Assert we have genuinely landed on the authenticated admin dashboard. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/dashboard/);
    await expect(this.sidebarDashboardLink).toBeVisible();
    await expect(this.heading).toBeVisible();
  }
}
