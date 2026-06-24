# Tests — structure & workflow

Tests are organized **by role / portal**, then **by module** within each role:

```
tests/
  auth.setup.ts          mints one reusable session per role (the only logins)
  admin/                 Admin portal (/admin/*)
  company/               Company portal (/company/*)
  individual/            Individual portal (/individual/*)
```

Name each spec by module, e.g. `company/contract-management.spec.ts`,
`company/dashboard.spec.ts`, `admin/service-providers.spec.ts`.

## Workflow: record → adapt → add negatives

1. **Record the happy path** with Playwright codegen (reuse a saved session so you
   skip login + OTP):
   ```bash
   # one-time: ensure a session exists
   npx playwright test --project=setup

   npx playwright codegen --load-storage=.auth/companyAdmin.json \
     https://uat.contracts.com.sa/company/dashboard
   ```
   (Use `admin.json` / `individual.json` for the other portals.)

2. **Hand the recorded code over** — it gets adapted to the framework:
   - selectors → **page objects** in `src/pages/<role>/…` (no raw selectors in specs)
   - data → `src/support/data.ts` builders (unique per run)
   - the test reuses the role fixture (`companyPage` / `adminPage` / `individualPage`)
     so it starts authenticated.

3. **Negative + edge cases are added** alongside each happy path (invalid input,
   required-field/validation, permission/RBAC, boundary conditions).

## Conventions

- Every test is tagged `@smoke` or `@regression`, plus a domain tag
  (`@contracts`, `@auth`, `@rbac`, …).
- Strict POM: specs read like specifications; assertions live in `expect*` page
  methods. Deterministic waits only (web-first assertions).
- Reuse sessions — never log in inside a test (the login API is rate-limited).
