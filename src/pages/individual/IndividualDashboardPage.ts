import { expect, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { Sidebar } from '../components/Sidebar';

/** Individual portal landing page (/individual/dashboard). */
export class IndividualDashboardPage extends BasePage {
  readonly sidebar: Sidebar;

  constructor(page: Page) {
    super(page);
    this.sidebar = new Sidebar(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/individual/dashboard');
  }

  /** Reliable smoke assertion: the authenticated individual shell rendered. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/individual\/dashboard/);
    await this.sidebar.expectLoaded();
  }

  /**
   * Deeper assertion on the async data widgets (General Information + contract
   * counts). These load behind spinners, so allow a generous wait — use in
   * regression rather than fast smoke.
   */
  async expectContractCounts(): Promise<void> {
    await expect(this.page.getByText('General Information')).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText('Number Of Signed Contract')).toBeVisible();
    await expect(this.page.getByText('Number Of Un Signed Contract')).toBeVisible();
  }
}
