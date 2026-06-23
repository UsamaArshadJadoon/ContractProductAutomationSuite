import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The shared data-table widget used across listing pages (contracts, invoices,
 * users, …): search box, Filter, Columns, a results table, and pagination.
 * Scoped to a root so a page with multiple tables stays unambiguous.
 */
export class DataTable {
  private readonly scope: Locator | Page;

  constructor(page: Page, root?: Locator) {
    this.scope = root ?? page;
  }

  get table(): Locator {
    return this.scope.getByRole('table');
  }

  /** Body data rows (excludes the header row group). */
  get rows(): Locator {
    return this.table.locator('tbody tr');
  }

  private get searchBox(): Locator {
    return this.scope.getByRole('textbox', { name: /Search/i });
  }

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
  }

  async openFilter(): Promise<void> {
    await this.scope.getByRole('button', { name: /Filter/i }).click();
  }

  async openColumns(): Promise<void> {
    await this.scope.getByRole('button', { name: /Columns/i }).click();
  }

  async expectLoaded(): Promise<void> {
    // Tables render after the SPA splash + a data fetch — allow a generous wait.
    await expect(this.table).toBeVisible({ timeout: 30_000 });
  }

  async expectHasRows(): Promise<void> {
    await expect(this.rows.first()).toBeVisible();
  }

  /** Assert a given column header is present. */
  async expectColumn(name: string): Promise<void> {
    await expect(
      this.table.getByRole('columnheader', { name: new RegExp(name, 'i') }),
    ).toBeVisible();
  }

  /** Open the per-row "More actions" kebab for the row containing `rowText`. */
  async openRowActions(rowText: string): Promise<void> {
    await this.table
      .getByRole('row', { name: new RegExp(rowText) })
      .getByRole('button', { name: /More actions/i })
      .click();
  }
}
