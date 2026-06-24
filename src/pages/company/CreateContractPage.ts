import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface ContractDetails {
  fileName: string;
  contractNumber: string;
  /** Grace period (days) for the approver to act. */
  gracePeriod?: string;
  description?: string;
}

/**
 * The 3-step "Create Contract" wizard:
 *   1. Upload Document  — main document (.pdf/.docx, <=12MB) + attachments + details
 *   2. Add Recipients   — Individual/Entity recipients; role set via Configure
 *   3. Prepare Document — place fields, then Send
 *
 * Verified live in the company portal. The wizard lives at
 * `/company/management/contract-management/create-contract`.
 */
export class CreateContractPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Step 1: Upload ────────────────────────────────────────────────────────
  /** Main document file input (single). */
  private get mainDocInput(): Locator {
    return this.page.locator('input[type="file"]').first();
  }

  /** Attachments file input (multiple). */
  private get attachmentsInput(): Locator {
    return this.page.locator('input[type="file"]').nth(1);
  }

  private get fileNameInput(): Locator {
    return this.page.getByRole('textbox', { name: /File Name/i });
  }

  private get contractNumberInput(): Locator {
    return this.page.getByRole('textbox', { name: /Contract Number/i });
  }

  private get gracePeriodInput(): Locator {
    return this.page.getByRole('textbox', { name: /Grace Period/i });
  }

  private get descriptionInput(): Locator {
    return this.page.getByRole('textbox', { name: /Add your note/i });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: /^Continue$/ });
  }

  get saveAndCloseButton(): Locator {
    return this.page.getByRole('button', { name: /Save & Close/i });
  }

  async goto(): Promise<void> {
    // domcontentloaded: this SPA holds connections open, so 'load' may never fire.
    await this.page.goto('/company/management/contract-management/create-contract', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByText('Upload Document', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
  }

  async expectOnUploadStep(): Promise<void> {
    await expect(this.page.getByText('Upload Contract Documents')).toBeVisible({ timeout: 30_000 });
  }

  async uploadMainDocument(filePath: string): Promise<void> {
    await this.mainDocInput.setInputFiles(filePath);
    // The widget attaches/validates the file; give it a moment to register.
    await this.page.waitForTimeout(2000);
  }

  async addAttachment(filePath: string): Promise<void> {
    await this.attachmentsInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
  }

  async fillDetails(details: ContractDetails): Promise<void> {
    await this.fileNameInput.fill(details.fileName);
    await this.contractNumberInput.fill(details.contractNumber);
    if (details.gracePeriod && (await this.gracePeriodInput.count())) {
      await this.gracePeriodInput.fill(details.gracePeriod);
    }
    if (details.description && (await this.descriptionInput.count())) {
      await this.descriptionInput.fill(details.description);
    }
  }

  async expectContinueEnabled(): Promise<void> {
    await expect(this.continueButton).toBeEnabled();
  }

  async expectContinueDisabled(): Promise<void> {
    await expect(this.continueButton).toBeDisabled();
  }

  /** Click Continue and assert the wizard did NOT advance past the upload step
   * (required-field validation blocks the submit rather than disabling Continue). */
  async expectAdvanceBlocked(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForTimeout(1500);
    await expect(this.page.getByRole('textbox', { name: /Id Number/i })).toHaveCount(0);
    await expect(this.page.getByText('Upload Contract Documents')).toBeVisible();
  }

  /** Uploading a document auto-populates the File Name field. */
  async expectFileNameAutoFilled(): Promise<void> {
    await expect(this.fileNameInput).not.toHaveValue('', { timeout: 10_000 });
  }

  /** Advance to the Add Recipients step and confirm it rendered. */
  async continueToRecipients(): Promise<void> {
    await this.continueButton.click();
    // The recipient ID field is unique to step 2 (avoids the ambiguous
    // "Add Recipients" text that also appears in the stepper).
    await expect(this.page.getByRole('textbox', { name: /Id Number/i }).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  /** Save the in-progress contract as a draft (returns to the list). */
  async saveAsDraft(): Promise<void> {
    await this.saveAndCloseButton.click();
  }

  // ── Step 2: Recipients ──────────────────────────────────────────────────────
  /**
   * Add the first Individual recipient by national ID. Entering a valid ID
   * auto-fills the (disabled) name and the registered email.
   */
  async addIndividualRecipientById(idNumber: string): Promise<void> {
    await this.page
      .getByRole('textbox', { name: /Id Number/i })
      .first()
      .fill(idNumber);
    // Wait for the ID lookup to auto-populate the name.
    await expect(
      this.page.getByRole('textbox', { name: /Name in English/i }).first(),
    ).not.toHaveValue('', { timeout: 15_000 });
  }
}
