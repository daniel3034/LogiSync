# LogiSync — Sprint 4 backlog

Mirror of the [Trello board](https://trello.com/b/tJSo9Rjp/logisync). **Trello is the source of truth**; this file exists so the work is reviewable in the repo and in pull requests. If they disagree, believe Trello.

Written 2026-08-05 by auditing every card against the code.

## Why this backlog exists

Originally written 2026-08-05 after auditing every card against the code. Calculator wiring, margin view, add-driver UI, PDF/QR, and the `/routes` pricing view are now done; remaining Sprint 4 gaps are edit-driver, demo seed, and the mobile test pass.

Auth hardening (ADMIN on every endpoint, page guards, public QR verification) is done — see Done below.

---

## Already done (moved to Done 🎉)

- **Create the database tables for waybills** — Waybill model exists in prisma/schema.prisma with the Driver relation; applied by prisma/migrations/20260721000000_init_postgres/migration.sql.
- **Destination City City Filter** — Admin-only driver page with destination filter is complete: app/(app)/drivers/page.tsx, CityFilter.tsx, whole-token matching in lib/cities.ts, requireAdmin() enforcement.
- **Digital Waybill Creator** — Acceptance criteria met by app/(app)/waybill/page.tsx against app/api/waybills/route.ts: validation, API error handling, successful creation, mobile-usable.
- **Require ADMIN on every waybill, pricing, and PDF endpoint** — `requireAdminApi()` on `/api/waybills`, `/api/waybills/[id]`, `/api/admin/waybills`, `/api/admin/route-pricing`, `/api/calculate-price`, and `/api/waybills/[id]/pdf`.
- **Public QR verification page** — public `/verify/[id]` shows cargo data only; PDF QR points at it via `APP_URL`.
- **Extend the page guard beyond /drivers** — `proxy.ts` matcher covers the app group; server `page.tsx` wrappers call `requireAdmin` / `requireSession`.
- **Auth Setup Ownership Needed** — per-machine `AUTH_SECRET` via `scripts/ensure-auth-secret.mjs`, no committed fallback, setup docs in README.
- **Setup and demo documentation** — README covers env vars, migrate, seed:admin, AUTH_SECRET local vs production, and the demo path.
- **PDF download from the dashboard and after creation** — DownloadWaybillPdfButton on each dashboard row (app/(app)/dashboard/DashboardClient.tsx) and on the waybill-created success state (app/(app)/waybill/WaybillClient.tsx); shared control also used by /admin/waybills.
- **PDF Export & QR Codes** — PDF generation embeds a QR pointing at `/verify/[id]`; download wired from dashboard, waybill success, and admin.
- **Add a driver from the web UI** — AddDriverForm on /drivers posts through the existing admin-guarded create path.
- **Wire the calculator to the real pricing engine** — CalculatorClient POSTs `/api/calculate-price`; origin/destination limited to SERVICE_ORIGINS / SERVICE_DESTINATIONS.
- **Show driver payment and net margin ("Margin View")** — calculate-price returns driverPayment/netMargin/marginPercent; calculator renders them.
- **Waybill detail page** — `/waybill/[id]` with PDF download link.
- **Replace the create-next-app starter home page** — branded LogiSync landing with sign-in; no Next.js template copy on `/`.
- **Repurpose /routes as a route pricing view** — `/routes` lists priced origin→destination pairs with distance and effective multiplier; admin overrides from `/admin/waybills` are reflected.

---

## Sprint 4

### Edit a driver's profile and preferred cities

Core Requirement 1, user story "Update routes".

`PUT /api/drivers/:id` exists and is admin-guarded (app/api/drivers/[id]/route.ts). No UI calls it.

Add per-row edit on /drivers covering name, phone, truck size, and preferred cities.

**Acceptance**
- Changing a driver's preferred cities immediately changes which city searches return them on /drivers.
- Phone uniqueness conflict (409) is shown readably.

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

