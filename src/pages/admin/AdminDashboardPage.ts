import { expect, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { Sidebar } from '../components/Sidebar';

/** The Admin landing page (/admin/dashboard). */
export class AdminDashboardPage extends BasePage {
  readonly sidebar: Sidebar;

  constructor(page: Page) {
    super(page);
    this.sidebar = new Sidebar(page);
  }

  /** Assert we have genuinely landed on the authenticated admin dashboard. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/dashboard/);
    await this.sidebar.expectLoaded();
  }
}
