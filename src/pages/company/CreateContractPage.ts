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

  // ── Step 3: Prepare + Send ───────────────────────────────────────────────────
  get sendForApprovalButton(): Locator {
    return this.page.getByRole('button', { name: /Send For Approval/i });
  }

  /** From Add Recipients, advance to the Prepare editor and wait for it. */
  async continueToPrepare(): Promise<void> {
    await this.continueButton.click();
    await this.page
      .getByText(/being prepared/i)
      .waitFor({ state: 'hidden', timeout: 60_000 })
      .catch(() => {});
    await expect(this.sendForApprovalButton).toBeVisible({ timeout: 60_000 });
  }

  /**
   * Place a Signature field for the given recipient (required before sending).
   * Selecting the recipient switches the palette to THEIR field types; the field
   * is then dragged onto the document via real mouse events (Angular CDK DnD).
   */
  async placeSignatureForRecipient(recipientName: string): Promise<void> {
    await this.page.getByText(recipientName).first().click();
    const field = this.page.getByText('Signature', { exact: true }).first();
    // Selecting the recipient swaps the palette to their fields; wait for the
    // Signature field to appear before dragging (avoids a race under load).
    await expect(field).toBeVisible({ timeout: 20_000 });
    await this.page.waitForTimeout(500);
    const viewer = this.page.locator('dc-pdf-viewer').first();
    const vbox = await viewer.boundingBox();
    const fb = await field.boundingBox();
    if (!vbox || !fb) throw new Error('Could not locate the Signature field or document viewer');
    await this.page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(vbox.x + vbox.width / 2, vbox.y + 220, { steps: 18 });
    await this.page.mouse.move(vbox.x + vbox.width / 2 + 4, vbox.y + 224, { steps: 4 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Send the contract for approval and confirm the "Send Contract" dialog. The
   * contract is created server-side and we return to the contracts list.
   */
  async sendForApproval(): Promise<void> {
    await this.sendForApprovalButton.click();
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: /^Confirm$/ })
      .click({ timeout: 15_000 });
    // A success dialog confirms creation ("...ready for review and signature.
    // Access link has been sent to the recipients.").
    await expect(
      this.page.getByText(/ready for review|has been sent|successfully/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  }
}
