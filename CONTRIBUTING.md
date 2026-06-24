# Contributing

How to extend the Contracts UAT automation suite. Keep the architecture strict:
**no raw selectors or assertions in test files** — tests read like specifications,
page objects own the "how".

## Prerequisites

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env   # fill in UAT credentials (git-ignored)
```

## Project layout

```
src/
  config/env.ts          # env + per-role credential resolution
  fixtures/
    auth-state.ts         # storage-state paths + freshness check
    roles.ts              # adminPage / companyPage / individualPage fixtures
  pages/                  # page objects (POM)
    BasePage.ts
    components/            # shared widgets (Sidebar, DataTable)
    admin|company|individual/
  support/data.ts         # unique-data builders
tests/
  auth.setup.ts           # mints one reusable session per role (the ONLY logins)
  smoke/                  # @smoke critical-path specs
  regression/             # @regression specs
docs/                     # feature inventory + test catalog (keep current!)
```

## Golden rules

1. **Strict POM.** Test files contain intent (`await contracts.expectLoaded()`),
   never `page.locator(...)` or bare `expect(page.…)`. Selectors + assertions
   live in page objects; assertion helpers are named `expect*`.
2. **Reuse sessions — don't log in.** Use the role fixtures (`companyPage`, …).
   The full login flow runs only in `auth.setup.ts`. The login API is
   **rate-limited (HTTP 429)** — adding per-test logins will break the suite.
3. **Deterministic waits only.** Web-first assertions / auto-wait. No
   `waitForTimeout` in tests (the one in setup is a documented rate-limit throttle).
4. **Idempotent data.** Mutating tests build unique data (`uniqueName()`) and
   clean up after themselves. Never assert on shared UAT totals.
5. **Stable locators.** Prefer role + accessible name, then visible text, then
   stable ids. If an element lacks a good hook, note it for a `data-testid`
   request (see the inventory's risks section).
6. **Tag every test** `@smoke` or `@regression` (plus a domain tag like `@rbac`).

## Add a page object

```ts
// src/pages/company/CompanyInvoicesPage.ts
import { expect, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataTable } from '../components/DataTable';

export class CompanyInvoicesPage extends BasePage {
  readonly table = new DataTable(this.page);

  async goto(): Promise<void> {
    await this.page.goto('/company/my-invoices');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/my-invoices/);
    await this.table.expectLoaded();
  }
}
```

## Add a test

```ts
// tests/regression/invoices.spec.ts
import { test } from '../../src/fixtures/roles';
import { CompanyInvoicesPage } from '../../src/pages/company/CompanyInvoicesPage';

test('CO-305: company invoices list loads @regression @company', async ({ companyPage }) => {
  const invoices = new CompanyInvoicesPage(companyPage);
  await invoices.goto();
  await invoices.expectLoaded();
});
```

Place the spec in the matching role folder (`tests/admin|company|individual/`) —
see [tests/README.md](tests/README.md) for the record→adapt workflow.

## Before you push

```bash
npm run lint && npm run typecheck
npm run test:smoke      # against UAT; mints sessions on first run
```

Use **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`) and keep PRs
small and reviewable. CI runs `@smoke` on every PR; the full `@regression`
suite runs nightly.

## Updating the docs

The feature inventory is a living document. When you cover a new area or
discover new behaviour, update [docs/feature-inventory.md](docs/feature-inventory.md)
in the same PR.
