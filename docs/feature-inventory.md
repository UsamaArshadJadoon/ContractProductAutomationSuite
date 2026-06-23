# Feature Inventory — Contracts UAT Portal

> **Phase 1 deliverable.** Written from live exploration of `https://uat.contracts.com.sa`
> on 2026-06-23 across all three roles. This is the source of truth that the Phase 2
> test catalog maps back to. Items marked **⚠️ not yet walked** are known gaps to close
> before/while implementing (see [Open gaps](#open-gaps)).

## 1. Application overview

- **Type:** Single-page application (Angular-style routing; URL stays on `/login`
  through the whole auth flow, then redirects to a role-specific route).
- **API host:** `https://api-uat.contracts.com.sa` (separate from the web origin).
- **Product:** E-signature / digital contracts platform ("Digital Contracts" /
  "العقود الرقمية").
- **Roles & landing routes:**
  | Role | Login | Landing route |
  | --- | --- | --- |
  | Admin | Company tab (email + password) | `/admin/dashboard` |
  | Company Admin | Company tab (email + password) | `/company/dashboard` |
  | Individual | Individual tab (national ID → password) | `/individual/dashboard` |

## 2. Cross-cutting behaviours (apply to all roles)

- **Language:** Defaults to **Arabic (RTL)**. A header **language toggle** flips the
  whole UI to English (document title flips `العقود الرقمية` ⇄ `Digital Contracts`).
  Choice persists client-side across navigation. **The suite drives the app in English.**
- **Arabic-in-English:** Some data (e.g. company names like
  `شركة عزم الرقمية للاتصالات وتقنية المعلومات`) renders in Arabic even in English mode —
  it's data, not UI copy. Locators/assertions must not assume Latin text for data cells.
- **Dates:** Tables and dashboards use **Hijri** dates (e.g. `22/12/1447 - 02:36 PM`)
  and offer **both Gregorian (2026) and Hijri (1448) year selectors** on dashboards.
  Date assertions must be format-aware, not hard-coded.
- **Navigation:** Left sidebar is an **accordion** — expanding one section collapses the
  others. Collapsible groups use `<button>`; leaf items are `<a>` with real `/…` hrefs.
- **Tables (shared widget):** Search box, **Filter**, **Columns** (show/hide), **Rows
  Per Page**, numbered **Pagination** + **Go To Page**, and a per-row **"More actions"**
  kebab menu. Totals can be large (Individual contracts = 650; Company = 2108).
- **OTP component (shared):** Six single-character boxes (`#input_0`…`#input_5`),
  a ~2-minute **countdown**, **Resend Code**, and **Choose Another Login Method**.
  Static UAT OTP is `111111`. **Submits on the final keystroke _or_ on Enter** — a plain
  `fill()` of all six does **not** trigger submission (must type the last digit as a real
  keystroke, then Enter is the reliable trigger).
- **🚨 Rate limiting:** `POST /public/ValidateLogin` returns **HTTP 429** after repeated
  logins in a short window. **This is the single most important constraint:** tests must
  reuse authenticated **storage state** (log in once per role, replay the session) rather
  than logging in per test, and full-login tests must be few and throttled.
- **Header (post-login):** sidebar toggle, language toggle, and a user avatar/menu
  (shows display name, e.g. "Admin qqw", "Moath", "Mohammed Mohammed").

## 3. Pre-login features (public)

| Feature                | Details                                                                                                 | Status            |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| Role-selection landing | "Company Login" / "Individual Login" entry buttons; tagline; footer (copyright © 2026, Saudi/gov logos) | ✅ walked         |
| Language toggle        | Arabic ⇄ English, persists                                                                              | ✅ walked         |
| Company Login form     | Email + Password (with show/hide), "Forget Password?", "Login", "Don't have an account? Register"       | ✅ walked         |
| Individual Login form  | **Two-step**: "ID Number" + "Continue" → Password + "Login"                                             | ✅ walked         |
| Onboarding Status      | Header button (`طلب الانضمام للمنصة` / "Onboarding Status") — public onboarding/application status      | ⚠️ not yet walked |
| Forget Password        | Link on both login forms                                                                                | ⚠️ not yet walked |
| Register               | "Register" link on both forms (new-account onboarding)                                                  | ⚠️ not yet walked |
| Field validation       | Empty/invalid email, empty password, invalid OTP, expired OTP, lockout                                  | ⚠️ not yet walked |

## 4. Authentication flows

**Company / Admin (email):** role select → Company tab → Email + Password → Login →
OTP **sent to email** (`Az****in@Azm.com`) → 6-digit OTP → landing.

**Individual (national ID):** role select → Individual tab → **ID Number → Continue** →
Password → Login → OTP **sent to phone** (`059****579`) → 6-digit OTP → landing.

**Logout:** Sidebar "Logout Account" → immediate redirect to `/login` (no confirm dialog observed).

## 5. Role surfaces

### 5.1 Admin (`/admin/*`)

**Top-level navigation** (✅ captured):
Dashboard (`/admin/dashboard`) · Management ▾ · Service Providers ▾ · Subscriptions ▾ ·
Invoices ▾ · Requests ▾ · Reports ▾ · Notifications ▾ · Translation (`/admin/localization`) ·
Settings (`/admin/settings`) · Logout.

> ▾ = collapsible group; **sub-items ⚠️ not yet walked** (exploration hit the 429 rate
> limit re-logging into Admin). To be detailed once the limit resets — see Open gaps.

**Dashboard KPI cards (✅):** Signed Total, Total Delayed, Un Signed Total, All Individual,
Total Contracts, Total Paid, Customer Requests, Companies Count, Pending Customer Requests,
Edit Customer Requests, Edit Pending Requests. **Charts** (with Year selector): Contracts,
Contracts Status, Create Requests, Active Postpaid, Active Prepaid, Top 5 Companies in
Creating Contracts, Edit Requests.

### 5.2 Company Admin (`/company/*`)

**Navigation (✅ fully captured):**

- Dashboard — `/company/dashboard`
- Company Info Update Requests — `/company/company-info-update-requests`
- **Management ▾**
  - Contracts Management — `/company/management/contract-management`
  - Individuals Management — `/company/management/individual-management`
  - Entities Management — `/company/management/entities-management`
  - User Management — `/company/management/company-user-management`
- **My Subscriptions ▾**
  - Bundles Subscriptions — `/company/my-subscriptions/bundle-subscriptions`
- My Invoices — `/company/my-invoices`
- Templates — `/company/template`
- **Settings ▾**
  - Portal Settings — `/company/settings/portal-settings`
  - APIs Settings — `/company/settings/api-settings`
  - Transactions Logs — `/company/settings/transactions-logs`
- Logout

**Dashboard (✅):** profile card (company name, email, phone, last-updated); KPI cards
**Total Contracts (2108), Admin Users (7), Individuals Users (114), Due Invoices (3)**;
**Pending Contracts** (Need Approval / Partially Signed / Under Review); **Contracts Status**
chart (with Filter); **Invoices Summary** (Pending / Paid / Expired); **Bundles Consumption**
chart; Gregorian + Hijri year selectors; Refresh.

**Contracts Management (✅):**

- **"Create Contract"** → 3-step wizard at `…/create-contract`:
  **Upload Document → Add Recipients → Prepare Document** (core e-signature flow;
  **creating contracts is authorized in UAT** — see Open gaps / data strategy).
- Tabs: **Contracts** / **Drafts**.
- Standard data table (search/filter/columns/pagination/row actions).

### 5.3 Individual (`/individual/*`)

**Navigation (✅ fully captured):**

- Dashboard — `/individual/dashboard`
- **Management ▾** → Contracts Management — `/individual/management/contract-management`
- Logout

**Dashboard (✅):** General Information (name, masked ID / email / phone); **Number of
Signed Contracts (164)**, **Number of Un Signed Contracts (11)**; per-card **sign ("draw")**
action.

**Contracts Management (✅):** table columns — File Name, Company Name (CR), Contract Number
(Reference), **Contract Status** (Signed / Canceled By Creator / Closed / …), Created Date,
Sign Date, **Action**. Row "More actions" menu (for a Signed contract): **View Contract
Details, Actions History, View Contract File**. Search / Filter / Columns / Rows-per-page /
Pagination (Total 650) / Go-to-page. Unsigned rows are expected to expose a **Sign** action
(⚠️ to confirm).

## 6. Role-based access control (RBAC) — for explicit negative tests

Derived from the captured navigation. Phase 2 will assert that lower-privilege roles
**cannot** see/reach Admin-only areas.

| Capability / route                                                                                                                | Admin | Company Admin | Individual |
| --------------------------------------------------------------------------------------------------------------------------------- | :---: | :-----------: | :--------: |
| `/admin/*` (Management, Service Providers, Subscriptions, Invoices, Requests, Reports, Notifications, Translation, Settings)      |  ✅   |      ❌       |     ❌     |
| Company management (Contracts/Individuals/Entities/Users), Templates, Subscriptions, Invoices, Portal/API settings (`/company/*`) | n/a¹  |      ✅       |     ❌     |
| Create Contract (3-step wizard)                                                                                                   | n/a¹  |      ✅       |     ❌     |
| Own contracts list + view/history/file                                                                                            | n/a¹  |      ✅       |     ✅     |
| Sign a contract                                                                                                                   | n/a¹  |     ✅(?)     |     ✅     |

¹ Admin has its own surface; whether Admin can also reach `/company/*` or `/individual/*`
routes directly is **⚠️ to verify** (good RBAC test: deep-link each role into the others'
routes and assert redirect/forbidden).

## 7. Risks & things flagged for automation

1. **🚨 Login rate limit (429).** Mandates storage-state reuse; keep full-login E2E tests
   to one-per-role and serialise them. Biggest stability risk if ignored.
2. **No `data-testid`s observed.** The DOM is mostly unnamed `generic` containers; reliable
   hooks are role + visible text + stable element ids on inputs (`#input_n`, `#email`-style).
   This is exactly why the self-healing fingerprint layer matters. **Recommend the team add
   `data-testid` to: login fields, OTP container, primary action buttons (Create Contract,
   Login, Continue), table rows, and the row "More actions" menu.**
3. **Shared UAT data.** Counts (2108, 650, 164…) drift. Assert structure/state, not exact
   totals; create unique data per run and tear down.
4. **Hijri dates + Arabic data in English UI.** Format-aware, locale-tolerant assertions.
5. **OTP submit quirk.** Type digit-by-digit + Enter; never rely on `fill()` to submit.
6. **Irreversible actions to avoid without confirmation:** payment/invoice finalization,
   bulk state changes, real notifications, user deletion. Contract _creation_ is authorized.

## 8. Open gaps (to close during Phase 1 wrap / early Phase 3)

- [ ] Admin sub-menu items for: Management, Service Providers, Subscriptions, Invoices,
      Requests, Reports, Notifications (blocked by 429 during exploration).
- [ ] Forget Password flow (both forms).
- [ ] Register / Onboarding application flow + "Onboarding Status" lookup.
- [ ] Login validation messages (empty email, malformed email, empty/short password,
      wrong password, wrong OTP, expired OTP) and any account lockout.
- [ ] Confirm Individual "Sign" action and the Company "Sign/Approve" actions.
- [ ] Cross-role deep-link RBAC behaviour (redirect vs. 403).

## 9. Findings surfaced during implementation (Phase 3)

- **Unauth/forbidden routing is inconsistent.** Deep-linking an unauthenticated
  user — or a non-admin into `/admin/*` — does **not** reliably redirect to
  `/login`; the SPA often leaves the URL unchanged and renders a **blank shell**.
  Tests therefore assert the _security property_ (no authenticated shell / no
  admin-only nav) rather than a URL redirect. Worth confirming with the team
  whether a hard redirect is intended.
- **Individual dashboard data widgets never finish loading.** For the test
  account, the individual dashboard's General Information + signed/unsigned
  count cards sit on loading spinners indefinitely (>30s); the data API does not
  resolve. Company KPIs load fine. Tracked as `IND-001b` (test.fixme) — the
  individual's real data is still covered via the contracts table (`IND-101`).
- **SPA splash on deep-link.** Landing directly on a dashboard with a restored
  session shows a splash before the shell renders; page objects allow a generous
  wait for the authenticated shell.
