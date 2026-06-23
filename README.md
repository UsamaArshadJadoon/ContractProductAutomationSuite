# Contract Portal Automation

Self-healing end-to-end UI automation for the Contracts UAT portal
(`https://uat.contracts.com.sa`), built with **Playwright + TypeScript** using a
strict Page Object Model.

> **Status:** Phase 0 scaffold complete. Full docs land in Phase 6.

## Quick start

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env   # then fill in UAT credentials (git-ignored)
npm run test:smoke
```

## Scripts

| Command                           | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| `npm run test:smoke`              | Critical-path `@smoke` suite (runs on every PR) |
| `npm run test:regression`         | Full `@regression` suite (nightly / on demand)  |
| `npm run test:ui`                 | Playwright UI mode                              |
| `npm run report`                  | Open the last HTML report                       |
| `npm run lint` / `npm run format` | Lint / format                                   |
| `npm run typecheck`               | Type-check without emitting                     |

## Secrets

Credentials live in a **git-ignored `.env`** locally and in **GitHub Secrets**
in CI. Never commit real values — only `.env.example` (placeholders) is tracked.

## Layout

```
src/
  config/     environment + credential resolution
  pages/      page objects (strict POM; no selectors in tests)
tests/
  smoke/      @smoke critical-path tests
```
