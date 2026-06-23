# Test Case Catalog — Contracts UAT Portal

> **Phase 2 deliverable.** Every case below maps to a feature verified in
> [feature-inventory.md](./feature-inventory.md). Tags: **`@smoke`** = critical-path,
> runs on every PR (fast, stable); **`@regression`** = full suite (nightly / on demand).
> A case may also carry a domain tag (`@auth`, `@rbac`, `@contracts`, `@i18n`).
>
> **ID scheme:** `AREA-NNN` (AUTH, ADMIN, CO = Company Admin, IND = Individual, RBAC, X = cross-cutting).
> **Status:** ✅ ready to implement · 🔒 blocked on an open inventory gap · 🧪 needs data setup.

## Test strategy (how these run reliably)

- **Session reuse is mandatory** (login API is rate-limited / 429). One real login per
  role mints a **storage state**; ~all other tests start already authenticated. Only the
  `AUTH-E2E-*` cases below perform a full live login, and they run **serially**.
- **Idempotent data:** tests that mutate create their own uniquely-named data
  (`e2e-<role>-<timestamp>-<rand>`) and tear it down / cancel it. No reliance on seeded counts.
- **Structural assertions:** assert state + UI (status chips, row presence, URL, headings),
  never exact shared-data totals.
- **English UI** by default; one `@i18n` case covers the Arabic toggle + RTL.

---

## A. Authentication & session (`@auth`)

| ID | Title | Tag | Type | Status |
| --- | --- | --- | --- | --- |
| AUTH-E2E-001 | Admin logs in (email → OTP) and lands on `/admin/dashboard` | `@smoke` | happy | ✅ *(done in Phase 0)* |
| AUTH-E2E-002 | Company Admin logs in (email → OTP) → `/company/dashboard` | `@smoke` | happy | ✅ |
| AUTH-E2E-003 | Individual logs in (ID → Continue → password → OTP to phone) → `/individual/dashboard` | `@smoke` | happy | ✅ |
| AUTH-101 | Company login: empty email shows validation, submit blocked | `@regression` | negative | 🔒 (validation msgs) |
| AUTH-102 | Company login: malformed email rejected | `@regression` | negative | 🔒 |
| AUTH-103 | Company login: empty password blocked | `@regression` | negative | 🔒 |
| AUTH-104 | Company login: wrong password → error, no OTP step | `@regression` | negative | ✅ |
| AUTH-105 | Individual login: unknown/!valid ID → error at Continue step | `@regression` | negative | ✅ |
| AUTH-106 | OTP: wrong code rejected with error | `@regression` | negative | ✅ |
| AUTH-107 | OTP: boundary — fewer than 6 digits keeps submit inert | `@regression` | boundary | ✅ |
| AUTH-108 | OTP: Resend Code re-enables/refreshes timer | `@regression` | happy | ✅ |
| AUTH-109 | OTP: "Choose Another Login Method" returns to form | `@regression` | happy | ✅ |
| AUTH-110 | Password show/hide toggle reveals/masks value | `@regression` | happy | ✅ |
| AUTH-111 | "Forget Password?" opens reset flow | `@regression` | happy | 🔒 (flow not walked) |
| AUTH-112 | "Register" opens onboarding/registration | `@regression` | happy | 🔒 |
| AUTH-113 | "Onboarding Status" lookup is reachable pre-login | `@regression` | happy | 🔒 |
| AUTH-201 | Logout from each role returns to `/login` and clears session | `@smoke` | happy | ✅ |
| AUTH-202 | Authenticated session (storage state) reaches dashboard without re-login | `@smoke` | happy | ✅ |
| AUTH-203 | Expired/cleared session → protected route redirects to `/login` | `@regression` | auth | ✅ |
| AUTH-204 | Rate limit (429) on rapid logins surfaces gracefully (no crash) | `@regression` | negative | ✅ |

## B. Internationalization (`@i18n`)

| ID | Title | Tag | Type | Status |
| --- | --- | --- | --- | --- |
| X-I18N-001 | Language toggle flips UI Arabic ⇄ English (title + dir=rtl) and persists | `@smoke` | happy | ✅ |
| X-I18N-002 | Hijri/Gregorian year selectors switch dashboard data context | `@regression` | happy | ✅ |

## C. Admin role (`@admin`)

| ID | Title | Tag | Type | Status |
| --- | --- | --- | --- | --- |
| ADMIN-001 | Dashboard loads with all KPI cards + charts present | `@smoke` | happy | ✅ |
| ADMIN-002 | Each top-level nav item routes to its page (Dashboard, Translation, Settings, …) | `@smoke` | happy | ✅ |
| ADMIN-003 | Management section expands and sub-items navigate | `@regression` | happy | 🔒 (sub-menus) |
| ADMIN-004 | Service Providers list/section loads | `@regression` | happy | 🔒 |
| ADMIN-005 | Subscriptions section loads | `@regression` | happy | 🔒 |
| ADMIN-006 | Invoices section loads + table renders | `@regression` | happy | 🔒 |
| ADMIN-007 | Requests / Customer Requests list loads + filters | `@regression` | happy | 🔒 |
| ADMIN-008 | Reports section renders | `@regression` | happy | 🔒 |
| ADMIN-009 | Notifications section renders | `@regression` | happy | 🔒 |
| ADMIN-010 | Translation (`/admin/localization`) loads | `@regression` | happy | ✅ |
| ADMIN-011 | KPI card refresh control re-fetches its metric | `@regression` | happy | ✅ |

## D. Company Admin role (`@company`)

| ID | Title | Tag | Type | Status |
| --- | --- | --- | --- | --- |
| CO-001 | Dashboard loads: KPI cards (Contracts/Admins/Individuals/Due Invoices) + widgets | `@smoke` | happy | ✅ |
| CO-002 | All nav items + sub-items route correctly (Management/Subscriptions/Settings groups) | `@smoke` | happy | ✅ |
| CO-101 | Contracts Management table loads; Contracts/Drafts tabs switch | `@smoke` | happy | ✅ |
| CO-102 | Table search filters rows | `@regression` | happy | ✅ |
| CO-103 | Table Filter panel applies + clears | `@regression` | happy | ✅ |
| CO-104 | Columns show/hide toggles column visibility | `@regression` | happy | ✅ |
| CO-105 | Pagination + Rows-per-page + Go-to-page navigate result set | `@regression` | boundary | ✅ |
| CO-106 | Row "More actions" exposes view/history/file | `@regression` | happy | ✅ |
| CO-201 | **Create Contract** wizard step 1: Upload Document validates file | `@smoke` | happy | 🧪 |
| CO-202 | Create Contract step 2: Add Recipients (required-field validation) | `@regression` | happy/neg | 🧪 |
| CO-203 | Create Contract step 3: Prepare Document → create draft (unique name) | `@regression` | happy | 🧪 |
| CO-204 | Created contract appears in list with expected status; teardown/cancel | `@regression` | happy | 🧪 |
| CO-205 | Cancel/abandon wizard does not create a contract | `@regression` | negative | ✅ |
| CO-301 | Templates page loads + list renders | `@regression` | happy | ✅ |
| CO-302 | Individuals Management table loads + search | `@regression` | happy | ✅ |
| CO-303 | Entities Management table loads | `@regression` | happy | ✅ |
| CO-304 | User Management list loads | `@regression` | happy | ✅ |
| CO-305 | My Invoices table loads; statuses (Paid/Pending/Expired) render | `@regression` | happy | ✅ |
| CO-306 | Bundles Subscriptions page loads | `@regression` | happy | ✅ |
| CO-307 | Company Info Update Requests page loads | `@regression` | happy | ✅ |
| CO-308 | Settings → Portal / APIs / Transactions Logs each load | `@regression` | happy | ✅ |

## E. Individual role (`@individual`)

| ID | Title | Tag | Type | Status |
| --- | --- | --- | --- | --- |
| IND-001 | Dashboard loads: General Info + Signed/Unsigned counts | `@smoke` | happy | ✅ |
| IND-101 | My Contracts table loads with expected columns | `@smoke` | happy | ✅ |
| IND-102 | Search / Filter / Columns / pagination work | `@regression` | happy | ✅ |
| IND-103 | Row "More actions" → View Contract Details opens detail | `@regression` | happy | ✅ |
| IND-104 | Row → Actions History opens audit trail | `@regression` | happy | ✅ |
| IND-105 | Row → View Contract File renders the document | `@regression` | happy | ✅ |
| IND-106 | Status chips render distinct states (Signed/Closed/Canceled) | `@regression` | happy | ✅ |
| IND-201 | Sign an unsigned contract (if test data available) → status updates | `@regression` | happy | 🔒/🧪 (confirm Sign action) |

## F. Role-based access control (`@rbac`) — explicit negative authorization

| ID | Title | Tag | Type | Status |
| --- | --- | --- | --- | --- |
| RBAC-001 | Company Admin sidebar shows **no** Admin-only items (Service Providers, Reports, Translation, etc.) | `@smoke` | rbac | ✅ |
| RBAC-002 | Individual sidebar shows only Dashboard + Management(Contracts) + Logout | `@smoke` | rbac | ✅ |
| RBAC-003 | Individual deep-links to `/admin/dashboard` → redirected/blocked | `@smoke` | rbac | ✅ |
| RBAC-004 | Individual deep-links to `/company/*` → redirected/blocked | `@regression` | rbac | ✅ |
| RBAC-005 | Company Admin deep-links to `/admin/*` → redirected/blocked | `@smoke` | rbac | ✅ |
| RBAC-006 | Company Admin deep-links to `/individual/*` → redirected/blocked | `@regression` | rbac | ✅ |
| RBAC-007 | Unauthenticated deep-link to any protected route → `/login` | `@smoke` | rbac | ✅ |

---

## Coverage summary

- **`@smoke` (critical path, every PR):** AUTH-E2E-001/002/003, AUTH-201/202, X-I18N-001,
  ADMIN-001/002, CO-001/002/101/201, IND-001/101, RBAC-001/002/003/005/007 → **~20 fast tests**.
- **`@regression` (nightly/on-demand):** everything above.
- **Per-role parameterization:** table behaviours (search/filter/columns/pagination) and
  RBAC deep-link checks are data-driven across roles to avoid duplication.

## Blocked / needs follow-up before full implementation

`🔒` cases depend on the [Open gaps](./feature-inventory.md#open-gaps): Admin sub-menus,
Forget-Password, Register/Onboarding, validation messages. These will be unblocked by a
short re-exploration once the login rate limit resets, then promoted from 🔒 to ✅.
`🧪` cases need the contract-creation data flow (authorized in UAT) with teardown.
