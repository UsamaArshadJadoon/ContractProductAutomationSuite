import { expect, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataTable } from '../components/DataTable';

/** Individual portal → Management → Contracts Management. */
export class IndividualContractsPage extends BasePage {
  readonly table: DataTable;

  /** Columns verified in the inventory. */
  static readonly COLUMNS = [
    'File Name',
    'Company Name',
    'Contract Number',
    'Contract Status',
    'Created Date',
    'Sign Date',
    'Action',
  ] as const;

  /** Row "More actions" menu items verified for a Signed contract. */
  static readonly ROW_ACTIONS = [
    'View Contract Details',
    'Actions History',
    'View Contract File',
  ] as const;

  constructor(page: Page) {
    super(page);
    this.table = new DataTable(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/individual/management/contract-management');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/contract-management/);
    await this.table.expectLoaded();
  }

  async expectColumns(): Promise<void> {
    for (const column of IndividualContractsPage.COLUMNS) {
      await this.table.expectColumn(column);
    }
  }

  /** Open the kebab on the first row and assert the expected actions appear. */
  async expectRowActionsFor(rowText: string): Promise<void> {
    await this.table.openRowActions(rowText);
    for (const action of IndividualContractsPage.ROW_ACTIONS) {
      await expect(this.page.getByRole('menuitem', { name: action })).toBeVisible();
    }
  }
}
