import type { Page } from '@playwright/test';
import { CreateContractPage } from '../pages/company/CreateContractPage';
import { CompanyContractsPage } from '../pages/company/CompanyContractsPage';
import { buildContractDetails, sampleFiles, TEST_RECIPIENT_ID, TEST_RECIPIENT_NAME } from './data';

/**
 * Create + send a contract for approval to the Individual test account
 * (recipient = Approver, with a Signature field placed). Returns the contract
 * reference number. Creating contracts in UAT is authorized.
 */
export async function createAndSendContract(companyPage: Page): Promise<string> {
  const details = buildContractDetails();
  const wizard = new CreateContractPage(companyPage);
  await wizard.goto();
  await wizard.uploadMainDocument(sampleFiles.pdf);
  await wizard.fillDetails(details);
  await wizard.continueToRecipients();
  await wizard.addIndividualRecipientById(TEST_RECIPIENT_ID);
  await wizard.continueToPrepare();
  await wizard.placeSignatureForRecipient(TEST_RECIPIENT_NAME);
  await wizard.sendForApproval();
  return details.contractNumber;
}

/** Copy the public approval link for a just-sent contract (needs clipboard perm). */
export async function approvalLinkFor(companyPage: Page, contractNumber: string): Promise<string> {
  const contracts = new CompanyContractsPage(companyPage);
  await contracts.goto();
  await contracts.expectLoaded();
  await contracts.search(contractNumber);
  return contracts.copyApprovalLink(contractNumber);
}
