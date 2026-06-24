import { test } from '../../src/fixtures/roles';
import { CreateContractPage } from '../../src/pages/company/CreateContractPage';
import { CompanyContractsPage } from '../../src/pages/company/CompanyContractsPage';
import { buildContractDetails, sampleFiles } from '../../src/support/data';

/**
 * Contract Management — Upload (Create Contract, Step 1).
 * Covers the happy path, required-field + file-type validation, optional
 * attachments, and saving as a draft. Creating drafts in UAT is authorized.
 */
test.describe('Contract upload @regression @contracts @upload', () => {
  test('CM-U-01: upload valid PDF + details advances to Add Recipients @smoke', async ({
    companyPage,
  }) => {
    const wizard = new CreateContractPage(companyPage);
    await wizard.goto();
    await wizard.expectOnUploadStep();
    await wizard.uploadMainDocument(sampleFiles.pdf);
    await wizard.fillDetails(buildContractDetails());
    await wizard.expectContinueEnabled();
    await wizard.continueToRecipients();
  });

  test('CM-U-02: Continue is disabled before a main document is uploaded', async ({
    companyPage,
  }) => {
    const wizard = new CreateContractPage(companyPage);
    await wizard.goto();
    await wizard.expectOnUploadStep();
    await wizard.expectContinueDisabled();
  });

  test('CM-U-03: uploading a document auto-populates the File Name', async ({ companyPage }) => {
    const wizard = new CreateContractPage(companyPage);
    await wizard.goto();
    await wizard.uploadMainDocument(sampleFiles.pdf);
    await wizard.expectFileNameAutoFilled();
  });

  test('CM-U-06: Contract Number is required (advance blocked without it)', async ({
    companyPage,
  }) => {
    const details = buildContractDetails();
    const wizard = new CreateContractPage(companyPage);
    await wizard.goto();
    await wizard.uploadMainDocument(sampleFiles.pdf);
    await companyPage.getByRole('textbox', { name: /File Name/i }).fill(details.fileName);
    await companyPage.getByRole('textbox', { name: /Grace Period/i }).fill(details.gracePeriod);
    await wizard.expectAdvanceBlocked();
  });

  test('CM-U-04: an unsupported file type is not accepted as the main document', async ({
    companyPage,
  }) => {
    const wizard = new CreateContractPage(companyPage);
    await wizard.goto();
    await wizard.uploadMainDocument(sampleFiles.unsupported);
    await wizard.fillDetails(buildContractDetails());
    // With no valid main document, the form must not allow continuing.
    await wizard.expectContinueDisabled();
  });

  test('CM-U-05: Save & Close stores the contract as a Draft', async ({ companyPage }) => {
    const details = buildContractDetails();
    const wizard = new CreateContractPage(companyPage);
    await wizard.goto();
    await wizard.uploadMainDocument(sampleFiles.pdf);
    await wizard.fillDetails(details);
    await wizard.saveAsDraft();

    // The draft should be findable in the Drafts tab by its contract number.
    // The Drafts tab indexes by document name (not contract number).
    const contracts = new CompanyContractsPage(companyPage);
    await contracts.expectLoaded();
    await contracts.switchTo('Drafts');
    await contracts.search(details.fileName);
    await contracts.expectRowContaining(details.fileName);
  });
});
