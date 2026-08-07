# LogiSync — Sprint 4 backlog

Mirror of the [Trello board](https://trello.com/b/tJSo9Rjp/logisync). **Trello is the source of truth**; this file exists so the work is reviewable in the repo and in pull requests. If they disagree, believe Trello.

Written 2026-08-05 by auditing every card against the code.

## Why this backlog exists

The board had drifted from the codebase in both directions: three cards sat in "In Progress" that were finished, and the largest gaps had no cards at all. In particular:

- **Core Requirement 1 (Driver Management Directory) has no UI.** The CRUD endpoints exist and are properly guarded; nothing in the browser calls `POST` or `PUT`. Drivers can only be created by writing to the database.
- **Core Requirement 3 (Freight Price Calculator) is faked in the UI.** `lib/pricing.ts` is correct and tested, but `app/(app)/calculator/page.tsx` returns `Math.random()` and `/api/calculate-price` discards `driverPayment`, `netMargin`, and `marginPercent` before responding.
- **Only `/api/drivers/*` is authenticated.** Six other endpoints are open, including `/api/admin/waybills`, which returns every shipment's financials to anyone.

## Critical path to a working demo

Sprint 4 holds 16 cards, which is more than one sprint. If you have to cut, these four are what actually gate a demo:

1. **Wire the calculator to the real pricing engine** — otherwise the headline feature is a random number generator.
2. **Require ADMIN on every waybill, pricing, and PDF endpoint** — the financial leak.
3. **Public QR verification page** — must ship with #2, see below.
4. **Add / edit a driver from the web UI** — otherwise Core Requirement 1 cannot be demonstrated.

The rest is visible polish; nothing breaks without it.

## Ordering hazards

**"Require ADMIN…" and "Public QR verification page" must ship together.** The PDF's QR encodes `/api/waybills/:id`. Guarding that endpoint without first repointing the QR silently breaks the scan target on every waybill already printed — the failure appears on paper, not in CI.

**"Require ADMIN…" will break `pnpm test:price`.** `scripts/test-calculate-price.mjs` posts to `/api/calculate-price` over plain `fetch` with no session. Once that endpoint is guarded, every assertion returns 401. Update the script in the same change, or it looks like the pricing engine regressed.

---

## Already done (moved to Done 🎉)

- **Create the database tables for waybills** — Waybill model exists in prisma/schema.prisma with the Driver relation; applied by prisma/migrations/20260721000000_init_postgres/migration.sql.
- **Destination City City Filter** — Admin-only driver page with destination filter is complete: app/(app)/drivers/page.tsx, CityFilter.tsx, whole-token matching in lib/cities.ts, requireAdmin() enforcement.
- **Digital Waybill Creator** — Acceptance criteria met by app/(app)/waybill/page.tsx against app/api/waybills/route.ts: validation, API error handling, successful creation, mobile-usable.
- **PDF download from the dashboard and after creation** — DownloadWaybillPdfButton on each dashboard row (app/(app)/dashboard/page.tsx) and on the waybill-created success state (app/(app)/waybill/page.tsx); shared control also used by /admin/waybills.

---

## Sprint 4

### Add a driver from the web UI

Core Requirement 1, user story "Add driver".

`POST /api/drivers` already exists and is admin-guarded (app/api/drivers/route.ts). There is no form anywhere in the app — drivers can currently only be created by writing to the database directly.

Build a create-driver form (name, phone, truck size, preferred cities) on /drivers, reusing the page's existing table and app/(app)/components/Button.tsx.

**Acceptance**
- An admin can add a driver and see it appear in the list without touching the database.
- A duplicate phone surfaces the existing 409 as a readable message, not a stack trace.
- Required-field validation works before submit.

### Edit a driver's profile and preferred cities

Core Requirement 1, user story "Update routes".

`PUT /api/drivers/:id` exists and is admin-guarded (app/api/drivers/[id]/route.ts). No UI calls it.

Add per-row edit on /drivers covering name, phone, truck size, and preferred cities.

**Acceptance**
- Changing a driver's preferred cities immediately changes which city searches return them on /drivers.
- Phone uniqueness conflict (409) is shown readably.

### Wire the calculator to the real pricing engine

Core Requirement 3. The pricing engine is correct and tested (lib/pricing.ts, scripts/test-calculate-price.mjs) but the calculator page never calls it.

app/(app)/calculator/page.tsx:14 returns `Math.floor(Math.random() * 1500) + 300`, and the page itself renders the disclaimer "Demo value for frontend. It will be replaced by the backend calculation."

Replace with a `POST /api/calculate-price` call. The page's CitySearch inputs also accept free text while the API only accepts the nine cities in lib/waybill-options.ts — constrain the inputs to SERVICE_ORIGINS / SERVICE_DESTINATIONS.

**Acceptance**
- The displayed cost matches `pnpm test:price` output for the same inputs.
- An unserviced city is rejected in the UI, not by a 400 after submit.

**Blocks:** "Show driver payment and net margin".

### Show driver payment and net margin ("Margin View")

Core Requirement 3, user story "Margin View": *As a business owner, I want to see our net profit margin on the screen before confirming the trip.*

`calculatePricing()` in lib/pricing.ts already returns `driverPayment`, `netMargin`, and `marginPercent`. app/api/calculate-price/route.ts throws all three away and returns only `clientCost` and `breakdown`.

Return them from the endpoint and render them on the calculator.

**Note:** this is internal financial data. Ship it together with "Require ADMIN on every waybill, pricing, and PDF endpoint" so the endpoint is admin-only first.

**Acceptance**
- An admin sees client cost, driver payment, and margin percent before confirming a trip.

**Depends on:** "Wire the calculator to the real pricing engine".

### Require ADMIN on every waybill, pricing, and PDF endpoint

Only app/api/drivers/* calls `requireAdminApi()`. Unauthenticated today:

- `/api/waybills` (GET and POST)
- `/api/waybills/[id]` (GET and PUT)
- `/api/admin/waybills`
- `/api/admin/route-pricing`
- `/api/calculate-price`
- `/api/waybills/[id]/pdf`

`/api/admin/waybills` returns full financials — `driverPayment` and `netMargin` for every shipment — to anyone who requests it, signed in or not.

Apply the existing `requireAdminApi()` guard from lib/auth-guard.ts to each, following the pattern already used in app/api/drivers/route.ts.

**Acceptance**
- Every endpoint above returns 401 signed-out and 403 as a DRIVER.
- The app still works end to end signed in as ADMIN.

**Ship with:** "Public QR verification page" — guarding /api/waybills/[id] without repointing the QR first breaks every printed waybill's scan target.

### Extend the page guard beyond /drivers

proxy.ts matches only `/drivers/:path*`. /dashboard, /waybill, /calculator, and /admin/waybills all render for signed-out visitors.

Extend the matcher and add `requireAdmin()` next to the data in each page, matching the pattern app/(app)/drivers/page.tsx already uses (optimistic check in the proxy, authoritative check next to the data).

**Acceptance**
- Signed out, every app page redirects to /login with a working `callbackUrl`.
- Signed in as DRIVER, admin-only pages redirect to /dashboard.

### Public QR verification page

Enhancement user story: *As a warehouse worker, I want to scan the QR code on the PDF using my smartphone to instantly verify cargo data on the web.*

The PDF's QR currently encodes `/api/waybills/:id` (app/api/waybills/[id]/pdf/route.ts:26-29). Scanning it returns raw JSON including `driverPayment` and `netMargin`. Two problems:

1. It exposes internal financials to anyone holding a printed waybill.
2. Once /api/waybills/[id] is admin-guarded, **the QR stops working entirely**.

Build a public `/verify/[id]` page showing cargo data only — sender, receiver, route, weight, volume, status, driver name — with no financials, and point the QR at it. This route stays deliberately outside the auth guard.

**Acceptance**
- Scanning a printed waybill on a phone with no session shows a readable verification page.
- No financial figure appears anywhere on it.

**Ship with:** "Require ADMIN on every waybill, pricing, and PDF endpoint".

### Waybill detail page

The "Frontend mockup" card promises "the user can also select a waybill to see more details".

`GET /api/waybills/:id` exists and returns the waybill with its driver. Dashboard rows are not clickable and there is no detail route.

Add `/waybill/[id]`.

**Acceptance**
- Clicking a dashboard row opens full sender/receiver/cargo/pricing/driver detail.
- The page links to the PDF download.

### Replace the create-next-app starter home page

app/page.tsx is still the unmodified create-next-app template: Next.js logo, the heading "To get started, edit the page.tsx file", and outbound links to Vercel templates and the Next.js learning centre.

It is the first screen anyone visiting the deployed app sees, including a grader.

Replace with a short LogiSync landing page describing the service (per the "Frontend mockup" card: "a main (home) page that describes the service") and a sign-in link.

**Acceptance**
- No Next.js branding or template copy remains on /.

### Demo seed script

scripts/seed-admin.mjs creates only the admin user. A fresh database gives an empty dashboard, an empty driver list, and nothing to demonstrate.

Add a fixture script creating:
- ~6 drivers with overlapping preferred cities drawn from SERVICE_DESTINATIONS (lib/waybill-options.ts), so the city filter visibly narrows results
- ~10 waybills across all three statuses (pending, in_transit, delivered), priced through `calculatePricing()` so the figures on screen are real
- a few assigned to drivers, a few unassigned, so the admin assignment flow has something to do

Wire it up as a `pnpm seed:demo` script alongside the existing `seed:admin`.

**Acceptance**
- A fresh database plus `pnpm seed:admin` and `pnpm seed:demo` yields a demo-ready app.
- Re-running is idempotent.

### Repurpose /routes as a route pricing view

app/(app)/routes/page.tsx hardcodes four Paraguayan cities (Asunción, Ciudad del Este, Encarnación, Luque, San Lorenzo) that exist nowhere else in the system. The app serves Central America — see SERVICE_DESTINATIONS in lib/waybill-options.ts. The page has no database connection and its search does nothing real.

Core Requirement 2 ("Route Filter Engine") is already satisfied by the city filter on /drivers, so this page needs a genuine purpose rather than a duplicate search.

Rebuild it to show real origin→destination pairs with their distance and effective multiplier, sourced from `DESTINATION_DISTANCE_KM`, `getRouteMultiplier()`, and the RoutePricing override table via lib/server/route-pricing.ts.

**Acceptance**
- Every row corresponds to a route the system can actually price.
- Admin overrides set in /admin/waybills are reflected here.

### Setup and demo documentation

README.md currently contains only the project tagline and the team's four favourite quotes — no setup steps at all. A teammate or grader cloning the repo cannot run it.

The existing "Auth Setup Ownership Needed" card explicitly asks for "brief setup docs for the team".

Document:
- env vars, from .env.example (DATABASE_URL, AUTH_SECRET, ADMIN_*)
- database setup and `prisma migrate deploy`
- admin seeding via `pnpm seed:admin`
- demo seeding via `pnpm seed:demo`
- running the dev server
- a short demo script: sign in → add a driver → filter by city → calculate a price → create a waybill → assign a driver → download the PDF → scan the QR

**Acceptance**
- Someone with only the repo and a Postgres URL can reach a working demo from the README alone.

### Mobile browser test pass

Sprint 4 milestone: "test everything on mobile browsers".

Verify on real phone browsers (iOS Safari and Android Chrome):
- the waybill creation form
- the dashboard table (horizontal scroll behaviour)
- the /drivers table and city filter
- PDF download and readability on a phone screen
- the new /verify/[id] page reached by scanning a printed QR

Log each defect found as its own card in Fixes.

**Acceptance**
- All five flows confirmed working on both browsers, or a Fixes card exists for each that isn't.


---

## Fixes

### Sidebar shows "Admin Panel" to every user

app/(app)/components/Sidebar.tsx gates the Drivers link on `isAdmin` but renders the Admin Panel link unconditionally. A non-admin sees a link that bounces them straight back to /dashboard.

Cosmetic only — access is correctly enforced in proxy.ts and requireAdmin() — but visible in a demo.

**Fix:** gate the Admin Panel link on `isAdmin`, matching the Drivers link and the equivalent block in Navbar.tsx (which already does this correctly).

### No way to delete a driver from the UI

`DELETE /api/drivers/:id` exists and is admin-guarded (app/api/drivers/[id]/route.ts). Nothing in the app calls it.

Add a delete action with confirmation on /drivers.

**Note for the confirmation copy:** `Waybill.driverId` is `onDelete: SetNull` in prisma/schema.prisma, so deleting a driver orphans their waybills rather than removing them. The inline comment in the DELETE handler says "waybills cascade delete due to schema" — that comment is wrong and should be corrected while you're in there.

**Acceptance**
- Deleting a driver asks for confirmation and states that their waybills will be unassigned, not deleted.

### Dashboard sorts by date only

Core Requirement 4, user story "Waybill dashboard": *As an admin, I want to see an overview page of all digital waybills sorted by date and destination.*

app/api/waybills/route.ts orders by `createdAt` desc only, and the dashboard offers no sort control (only a status filter).

Add a destination sort option.

**Acceptance**
- The dashboard can be sorted by destination as well as by date.


---

## Enhancements

### Migrate preferredCities to a Postgres String[]

`Driver.preferredCities` stores a comma-separated list in a single column. Filtering therefore needs a `contains` prefilter in the database plus in-memory whole-token matching to avoid false positives — filtering by "York" would otherwise match "New York". lib/cities.ts documents this in detail and both app/(app)/drivers/page.tsx and app/api/drivers/route.ts carry the two-step logic.

A real Postgres `String[]` column with Prisma's `has` removes the two-step filter and the whole helper module.

Data migration — deliberately not before the demo.

### Client accounts with a per-client dashboard

The "Frontend mockup" card describes clients logging in and seeing *their* waybills: "A login page for clients and internal users. Once logged in, the user can see a dashboard with all of their waybills."

The schema cannot express this today: `Role` is ADMIN | DRIVER only, and `Waybill` has no relation to `User`.

Would require a CLIENT role, a User→Waybill relation, a migration, and per-client access rules on the dashboard and waybill endpoints.

**Deliberately out of scope for the demo:** every user story in the project proposal is written "As an admin".

### Waybill status transitions from the dashboard

`PUT /api/waybills/:id` accepts status changes (pending → in_transit → delivered) and validates them against the allowed list, but only the admin panel exposes the control.

Let an admin advance status directly from the dashboard or the waybill detail page.

