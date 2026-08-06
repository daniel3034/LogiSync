---
name: logisync-auth
description: How access control works in LogiSync and how to add it correctly. Load before creating any page or API route, before changing proxy.ts or the auth guards, and whenever deciding whether something should be public. Also covers the currently-unguarded endpoints and the QR code that depends on one of them.
---

# LogiSync access control

**LogiSync is admin-only by decision.** Every page and endpoint requires an `ADMIN` session. The `Role` enum also has `DRIVER`, but a DRIVER can reach nothing except `/dashboard`. Client accounts were considered and deliberately deferred — see `docs/BACKLOG.md` under Enhancements. Don't propose per-user waybill scoping as part of ordinary work.

There is exactly one intended public route: the QR verification page (see below).

## The two-layer pattern

Access is checked twice, on purpose.

**Layer 1 — `proxy.ts`, optimistic.** Reads the JWT cookie only, no database. Redirects signed-out users to `/login?callbackUrl=…` and non-admins to `/dashboard`. Its `matcher` covers page routes only; API routes are deliberately excluded so they answer with JSON status codes instead of being redirected into an HTML login page.

**Layer 2 — next to the data, authoritative.** From `lib/auth-guard.ts`:

```ts
// pages — redirects
await requireAdmin("/drivers");

// route handlers — returns the response to send, or null
const denied = await requireAdminApi();
if (denied) return denied;
```

`requireAdminApi()` returns 401 when signed out and 403 for a non-admin. Both guards must be present. The proxy alone is not sufficient — that is the point of the comment in `auth-guard.ts`, and matching the reference implementation in `app/api/drivers/route.ts` and `app/(app)/drivers/page.tsx` is the fastest way to get it right.

## Adding a new route

1. Add `requireAdminApi()` (handler) or `requireAdmin()` (page) as the **first** thing in the function, before any Prisma call.
2. If it is a page, make sure `proxy.ts`'s `matcher` covers it.
3. Verify signed-out → 401/redirect, DRIVER → 403/redirect, ADMIN → works.

## Config split

`auth.config.ts` holds shared config with `providers: []` and is imported by `proxy.ts`. `auth.ts` adds the credentials provider that touches Prisma and bcrypt. Keep database access out of `auth.config.ts` — not for edge-runtime reasons (Next 16's proxy runs on Node.js; see the `logisync-conventions` skill) but because the proxy runs on every matched request and the Next docs warn against relying on shared modules there.

`passwordHash` must never leave the server. `auth.ts` compares against it and returns only id/email/name/role.

The role is persisted onto the JWT at sign-in via the `jwt` callback so later requests read it from the cookie without a database hit. Anything added to the session needs the same treatment in both `jwt` and `session` callbacks.

## Known gaps (as of 2026-08-05)

Only `app/api/drivers/*` calls `requireAdminApi()`. **Unauthenticated today:**

- `/api/waybills` (GET, POST)
- `/api/waybills/[id]` (GET, PUT)
- `/api/admin/waybills` — returns `driverPayment` and `netMargin` for every shipment to anyone
- `/api/admin/route-pricing`
- `/api/calculate-price`
- `/api/waybills/[id]/pdf`

And `proxy.ts`'s matcher is only `/drivers/:path*`, so `/dashboard`, `/waybill`, `/calculator`, and `/admin/waybills` render for signed-out visitors.

**Before fixing this, read the next section.** Two things break.

## The QR dependency — read before guarding `/api/waybills/[id]`

`app/api/waybills/[id]/pdf/route.ts` builds the QR payload as a URL to `/api/waybills/:id`. Scanning a printed waybill therefore returns raw JSON including the financials.

Guarding that endpoint without repointing the QR **breaks every waybill already printed**, and the failure surfaces on paper rather than in CI. The fix is to ship the public `/verify/[id]` page in the same change: cargo data only — sender, receiver, route, weight, volume, status, driver name — no financial figures, and deliberately outside the guard.

That page is the only route that should skip `requireAdmin`. Give it its own narrow query rather than reusing a handler that selects financial columns.

Second breakage: `scripts/test-calculate-price.mjs` calls `/api/calculate-price` with no session, so guarding it turns every assertion into a 401. Update the script in the same change.

## Environment

`AUTH_SECRET` is required. `auth.config.ts` falls back to a hardcoded development secret when `NODE_ENV === "development"` — a deliberate local unblock for `MissingSecret`. It must never be relied on outside development, and production must set a real one. Generate with `npx auth secret`.

Never commit `.env`; `.gitignore` covers `.env*`.
