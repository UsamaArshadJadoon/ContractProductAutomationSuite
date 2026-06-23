/**
 * Test-data builders. Keep generated data unique per run so mutating tests are
 * idempotent and self-contained against shared UAT data.
 *
 * (Date.now()/Math.random() are fine in test code — the restriction only
 * applies to Workflow orchestration scripts.)
 */
export function uniqueName(prefix = 'e2e'): string {
  const stamp = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e4)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${stamp}-${rand}`;
}

import path from 'node:path';

/** Absolute paths to committed sample documents for upload tests. */
export const sampleFiles = {
  pdf: path.resolve('tests/fixtures/files/sample-contract.pdf'),
  unsupported: path.resolve('tests/fixtures/files/not-a-document.txt'),
} as const;

/** National ID of the Individual test account, used as the contract recipient. */
export const TEST_RECIPIENT_ID = process.env.INDIVIDUAL_USERNAME ?? '1012131452';

export interface ContractDetails {
  fileName: string;
  contractNumber: string;
  gracePeriod: string;
  description?: string;
}

/** Unique, idempotent contract details for an upload/create run. */
export function buildContractDetails(overrides: Partial<ContractDetails> = {}): ContractDetails {
  const stamp = Date.now().toString().slice(-9);
  return {
    fileName: uniqueName('contract'),
    contractNumber: `AUT-${stamp}`,
    gracePeriod: '3',
    ...overrides,
  };
}
