# Contract Portal Automation

Self-healing end-to-end UI automation for the **Contracts UAT portal**
(`https://uat.contracts.com.sa`), built with **Playwright + TypeScript** using a
strict Page Object Model, per-role session reuse, and an in-house self-healing
locator layer.

## Quick start

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env          # fill in UAT credentials (git-ignored)
npm run test:smoke            # critical-path suite against UAT
```

## Running tests

| Command                                                 | What it runs                                   |
| ------------------------------------------------------- | ---------------------------------------------- |
| `npm run test:smoke`                                    | `@smoke` critical path (runs on every PR)      |
| `npm run test:regression`                               | full `@regression` suite (nightly / on demand) |
| `npx playwright test --grep @healing`                   | the self-healing demos                         |
| `npx playwright test --grep @rbac`                      | role-based access-control checks               |
| `npm run test:ui`                                       | Playwright UI mode (watch/debug)               |
| `npm run test:headed`                                   | headed run                                     |
| `npm run report`                                        | open the last HTML report                      |
| `npm run lint` · `npm run typecheck` · `npm run format` | quality gates                                  |

Tags: every test carries `@smoke` or `@regression`, plus a domain tag
(`@auth`, `@rbac`, `@contracts`, `@i18n`, `@healing`).

## How authentication works (important)

The login API is **rate-limited (HTTP 429)**. To stay under it:

- `tests/auth.setup.ts` is a Playwright **setup project** that performs the
  **only** full logins — one per role — and saves each session to `.auth/`.
- Every other test reuses a session via the **role fixtures** in
  `src/fixtures/roles.ts` (`adminPage`, `companyPage`, `individualPage`).
- A saved session is reused for `SESSION_MAX_AGE_MS` (default 2h); within that
  window setup **skips** re-logging in. Delete `.auth/` to force fresh logins.

So a "skipped" setup test in the output means _"session already fresh — reused"_,
not a failure. The setup logins also serve as the explicit end-to-end login test
per role.

## Reading reports & artifacts

- **HTML report:** `npm run report` (or the `playwright-report/` artifact in CI).
- **Trace / screenshot / video:** captured on failure (and trace on first retry);
  open a trace with `npx playwright show-trace <trace.zip>`.
- **Healing report:** `healing-report/healing-report.json` lists every healed
  locator (key, score, threshold, chosen element). Heals are also logged to the
  console — a heal is never silent.

## Self-healing

A locator that misses its primary selector falls back to a **scored match
against a stored fingerprint** (`healing/fingerprints.json`, committed):

```ts
const healer = new SelfHealingLocator(page);
const btn = await healer.locate('login.companyButton', page.getByTestId('company-login'));
await btn.click();
await expect(page.getByRole('textbox', { name: /Email/i })).toBeVisible(); // functional assertion
```

- A heal is accepted only above `HEAL_CONFIDENCE_THRESHOLD` (default `0.7`);
  below that it **throws** — never a silent pass.
- A healed step is only as safe as its **functional assertion** — always assert
  the real outcome so a wrong-but-similar heal fails the test (see
  `tests/healing/healing.spec.ts`, HEAL-2).
- Toggle with `HEAL_ENABLED=false`.

## Configuration (`.env`)

| Var                                          | Purpose                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| `BASE_URL`                                   | App under test                                               |
| `DEFAULT_LANGUAGE`                           | `en` (default) or `ar` — the suite drives the app in English |
| `*_USERNAME` / `*_PASSWORD` / `*_OTP`        | per-role credentials (UAT OTP is static `111111`)            |
| `HEAL_ENABLED` / `HEAL_CONFIDENCE_THRESHOLD` | self-healing toggle + threshold                              |
| `SESSION_MAX_AGE_MS`                         | session-reuse window                                         |
| `LOGIN_SETUP_COOLDOWN_MS`                    | throttle between setup logins                                |

Secrets live in a **git-ignored `.env`** locally and in **GitHub Secrets** in CI.
Only `.env.example` (placeholders) is committed.

## CI/CD

- **`.github/workflows/smoke.yml`** — `@smoke` on every PR/push: lint + typecheck,
  cached browsers, secrets from GitHub Secrets, HTML report + healing report
  artifacts.
- **`.github/workflows/regression.yml`** — nightly + `workflow_dispatch`: authenticates
  once, **shares the session as an artifact**, then runs the suite **sharded** in
  parallel (shards reuse the session so they don't each trip the rate limit),
  and merges shard blob reports into one HTML report.

## Project layout

```
src/
  config/env.ts          environment + per-role credential resolution
  fixtures/              auth-state (paths + freshness) + role page fixtures
  pages/                 page objects (POM): BasePage, components/, per-role pages
  healing/               self-healing engine (fingerprint, store, report, locator)
  support/data.ts        unique-data builders
tests/
  auth.setup.ts          mints reusable sessions (the only logins)
  smoke/  regression/  healing/
docs/                    feature inventory + test catalog (kept current)
```

## Docs

- [docs/feature-inventory.md](docs/feature-inventory.md) — verified app surface, per role.
- [docs/test-catalog.md](docs/test-catalog.md) — tagged case catalog mapped to features.
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to add a page object and a test.
