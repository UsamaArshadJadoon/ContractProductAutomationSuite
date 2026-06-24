import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataTable } from '../components/DataTable';

/** Company Admin → Management → Contracts Management. */
export class CompanyContractsPage extends BasePage {
  readonly table: DataTable;

  constructor(page: Page) {
    super(page);
    this.table = new DataTable(page);
  }

  private get createButton(): Locator {
    return this.page.getByRole('button', { name: /Create Contract/i });
  }

  private tab(name: 'Contracts' | 'Drafts'): Locator {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}$`, 'i') });
  }

  async goto(): Promise<void> {
    // domcontentloaded: this SPA holds connections open, so 'load' may never fire.
    await this.page.goto('/company/management/contract-management', {
      waitUntil: 'domcontentloaded',
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/contract-management/);
    // Allow for the SPA splash before the page chrome renders.
    await expect(this.createButton).toBeVisible({ timeout: 30_000 });
    await expect(this.tab('Contracts')).toBeVisible();
    await expect(this.tab('Drafts')).toBeVisible();
  }

  async switchTo(tab: 'Contracts' | 'Drafts'): Promise<void> {
    await this.tab(tab).click();
    await expect(this.tab(tab)).toHaveAttribute('aria-selected', 'true');
  }

  /** Open the 3-step Create Contract wizard (Upload → Recipients → Prepare). */
  async startCreateContract(): Promise<void> {
    await this.createButton.click();
    await expect(this.page).toHaveURL(/create-contract/);
    await expect(this.page.getByText('Upload Document', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
  }

  async search(query: string): Promise<void> {
    const box = this.page.getByRole('textbox', { name: /Search/i }).first();
    await box.fill(query);
    await box.press('Enter');
    await this.page.waitForTimeout(1500); // debounced server search
  }

  /** Assert a row containing the given text is present in the current tab. */
  async expectRowContaining(text: string): Promise<void> {
    await expect(this.page.getByRole('row', { name: new RegExp(text, 'i') }).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  /** Row matching the given text (e.g. reference number or status). */
  private row(match: string | RegExp): Locator {
    return this.page
      .getByRole('row')
      .filter({ hasText: typeof match === 'string' ? new RegExp(match, 'i') : match })
      .first();
  }

  /** Open the per-row Action (kebab) menu for the row matching `match`. */
  async openActionMenu(match: string | RegExp): Promise<void> {
    const row = this.row(match);
    await row.waitFor({ timeout: 30_000 });
    await row.getByRole('button').last().click();
    await expect(this.page.getByRole('menuitem').first()).toBeVisible({ timeout: 10_000 });
  }

  /** Visible action-menu item labels. */
  async actionMenuItems(): Promise<string[]> {
    return this.page.getByRole('menuitem').allInnerTexts();
  }

  async closeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Copy the public approval link for the row matching `match` and return it.
   * Requires clipboard permission (granted by the caller's context).
   */
  async copyApprovalLink(match: string | RegExp): Promise<string> {
    await this.openActionMenu(match);
    await this.page.getByRole('menuitem', { name: /Copy Link/i }).click();
    await this.page.waitForTimeout(500);
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}
