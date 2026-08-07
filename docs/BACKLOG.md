# LogiSync — Sprint 4 backlog

Mirror of the [Trello board](https://trello.com/b/tJSo9Rjp/logisync). **Trello is the source of truth**; this file exists so the work is reviewable in the repo and in pull requests. If they disagree, believe Trello.

Written 2026-08-05 by auditing every card against the code.

## Why this backlog exists

The board had drifted from the codebase in both directions: three cards sat in "In Progress" that were finished, and the largest gaps had no cards at all. In particular:

- **Core Requirement 1 (Driver Management Directory) has no UI.** The CRUD endpoints exist and are properly guarded; nothing in the browser calls `POST` or `PUT`. Drivers can only be created by writing to the database.
- **Core Requirement 3 (Freight Price Calculator) is faked in the UI.** `lib/pricing.ts` is correct and tested, but `app/(app)/calculator/page.tsx` returns `Math.random()` and `/api/calculate-price` discards `driverPayment`, `netMargin`, and `marginPercent` before responding.

## Critical path to a working demo

Sprint 4 holds several cards. If you have to cut, these three are what actually gate a demo:

1. **Wire the calculator to the real pricing engine** — otherwise the headline feature is a random number generator.
2. **Add / edit a driver from the web UI** — otherwise Core Requirement 1 cannot be demonstrated.
3. **Show driver payment and net margin** — the pricing engine already returns them; the API still strips them.

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

**Note:** this is internal financial data. The calculate-price endpoint is already admin-guarded.

**Acceptance**
- An admin sees client cost, driver payment, and margin percent before confirming a trip.

**Depends on:** "Wire the calculator to the real pricing engine".

### PDF download from the dashboard and after creation

Enhancement user story: *As an admin, I want to click a button to download the waybill as a clean PDF file optimized for mobile screens.*

The PDF endpoint works (app/api/waybills/[id]/pdf/route.ts) but the only button that reaches it is on /admin/waybills (app/(app)/admin/waybills/page.tsx:408). An admin creating a waybill has no way to download it.

Add a download button to each dashboard row and to the waybill-created success state.

**Acceptance**
- An admin can download a waybill PDF without visiting the admin panel.

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

