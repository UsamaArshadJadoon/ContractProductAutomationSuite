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
    await this.page.goto('/company/management/contract-management');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/contract-management/);
    await expect(this.createButton).toBeVisible();
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
    await expect(this.page.getByText('Upload Document', { exact: true })).toBeVisible();
  }
}
