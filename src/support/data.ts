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

export interface ContractDraft {
  name: string;
}

export function buildContractDraft(overrides: Partial<ContractDraft> = {}): ContractDraft {
  return { name: uniqueName('contract'), ...overrides };
}
