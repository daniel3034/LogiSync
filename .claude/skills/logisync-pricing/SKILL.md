---
name: logisync-pricing
description: LogiSync's freight pricing engine, waybill lifecycle, and the city/route data they depend on. Load before touching pricing, quotes, margins, waybill creation or status, driver assignment, or anything that accepts a city name from a user.
---

# Pricing and waybills

## Money is calculated on the server, always

`lib/pricing.ts` `calculatePricing()` is the single source of truth. Never compute or accept a price from the client. `POST /api/waybills` deliberately ignores any price in the request body and recalculates from weight, volume, origin, and destination before writing the row.

It returns `clientCost`, `driverPayment`, `netMargin`, `marginPercent`, and a `breakdown`. All five already exist — if the UI needs a margin, the number is there, no engine change required.

Tunables live in `lib/pricing-config.ts` (base fee, per-kg and per-km rates, fuel surcharge, driver share, minimum driver payment, distance brackets). Change pricing behaviour there, not in the formula.

Two rules worth knowing before editing the formula:
- **Billable weight** is `max(actual weight, volume × 250)`, so bulky-but-light cargo is priced on volume.
- **Driver payment** has a floor (`minDriverPayment`), so on very short routes the margin percentage is not simply `1 − driverShareRate`.

## Cities are a closed set

`lib/waybill-options.ts` defines nine service cities (`SERVICE_DESTINATIONS`, with `SERVICE_ORIGINS` aliased to the same list) plus their distances and per-pair route multipliers. Anything else is invalid.

Every endpoint taking a city must canonicalise before use:

```ts
const canonicalDestination = resolveDestination(destination);
const canonicalOrigin = resolveOrigin(origin);
if (!canonicalDestination) return NextResponse.json({ error: "…" }, { status: 400 });
```

Store the canonical form, not the user's spelling. New UI should constrain the input to the list (see the `<select>` pattern on the calculator and waybill forms) rather than letting a free-text field fail with a 400 after submit.

Admins can override a route's multiplier; `getEffectiveRouteMultiplier()` in `lib/server/route-pricing.ts` resolves the `RoutePricing` table override before falling back to the static table. Pass the result into `calculatePricing()` as `routeMultiplierOverride` — both `/api/calculate-price` and `POST /api/waybills` show the pattern.

## Driver preferred cities

`Driver.preferredCities` is a **comma-separated string in one column**, not an array. A plain `contains` query gives false positives — filtering "York" would match "New York". The convention, documented at length in `lib/cities.ts`:

1. Use `contains` as a cheap database prefilter.
2. Then filter in memory with `matchesCity()`, which compares whole comma-separated tokens.

Both steps are required. `app/api/drivers/route.ts` and `app/(app)/drivers/page.tsx` each do both — copy that, and don't "simplify" it to a single `contains`. Migrating the column to a Postgres `String[]` would remove the need entirely and is filed as an Enhancement.

## Waybill lifecycle

Statuses are `pending` → `in_transit` → `delivered`, listed in `INTERNAL_WAYBILL_STATUSES`.

Creation and administration are deliberately separated:

- `POST /api/waybills` **rejects** `driverId` and `status` in the body with a 403. New waybills are always `pending` and unassigned.
- `PUT /api/waybills/[id]` is the only place assignment and status change, and it validates `status` against the allowed list and verifies the driver exists.

Keep that split. If a card asks for status changes from the dashboard, route them through the existing `PUT` rather than widening what `POST` accepts.

`Waybill.driverId` is `onDelete: SetNull` — deleting a driver **unassigns** their waybills rather than deleting them. Any delete-driver UI should say so.

## Financial data is internal

`clientCost` may be shown to a client. `driverPayment`, `netMargin`, and `marginPercent` are internal — they belong only behind an ADMIN guard. This is why the public QR verification page must have its own narrow query rather than reusing a handler that selects financial columns. See the `logisync-auth` skill.

## Verifying a pricing change

`pnpm test:price` runs `scripts/test-calculate-price.mjs` against a **running dev server** (`BASE_URL` overrides the target). It is a hand-rolled `fetch` script, not a test framework, and it authenticates with nothing — so it will need updating once `/api/calculate-price` is guarded. There is no unit-test harness for `calculatePricing()` itself; adding one would be cheap and is not yet on the board.
