import { expect, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { Sidebar } from '../components/Sidebar';

/** Company Admin landing page (/company/dashboard). */
export class CompanyDashboardPage extends BasePage {
  readonly sidebar: Sidebar;

  constructor(page: Page) {
    super(page);
    this.sidebar = new Sidebar(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/company/dashboard');
  }

  /** Reliable smoke assertion: the authenticated company shell rendered. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/company\/dashboard/);
    await this.sidebar.expectLoaded();
  }

  /** KPI cards load behind spinners — allow a generous wait (regression). */
  async expectKpiCards(): Promise<void> {
    for (const label of ['Total Contracts', 'Admin Users', 'Individuals Users', 'Due Invoices']) {
      await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }
  }
}
