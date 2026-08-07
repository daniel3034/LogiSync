---
name: logisync-auth
description: How access control works in LogiSync and how to add it correctly. Load before creating any page or API route, before changing proxy.ts or the auth guards, and whenever deciding whether something should be public. Also covers the QR verification page that must stay public.
---

# LogiSync access control

**LogiSync is admin-only by decision.** Every page and endpoint requires an `ADMIN` session. The `Role` enum also has `DRIVER`, but a DRIVER can reach nothing except `/dashboard`. Client accounts were considered and deliberately deferred — see `docs/BACKLOG.md` under Enhancements. Don't propose per-user waybill scoping as part of ordinary work.

There is exactly one intended public route: the QR verification page at `/verify/[id]`.

## The two-layer pattern

Access is checked twice, on purpose.

**Layer 1 — `proxy.ts`, optimistic.** Reads the JWT cookie only, no database. Redirects signed-out users to `/login?callbackUrl=…` and non-admins to `/dashboard` (except `/dashboard` itself, which DRIVER may reach). Its `matcher` covers page routes only; API routes are deliberately excluded so they answer with JSON status codes instead of being redirected into an HTML login page.

**Layer 2 — next to the data, authoritative.** From `lib/auth-guard.ts`:

```ts
// pages — redirects
await requireAdmin("/drivers");
await requireSession("/dashboard"); // any signed-in role

// route handlers — returns the response to send, or null
const denied = await requireAdminApi();
if (denied) return denied;
```

`requireAdminApi()` returns 401 when signed out and 403 for a non-admin. Both guards must be present. The proxy alone is not sufficient — that is the point of the comment in `auth-guard.ts`, and matching the reference implementation in `app/api/drivers/route.ts` and `app/(app)/drivers/page.tsx` is the fastest way to get it right.

`/dashboard` must use `requireSession`, not `requireAdmin` — the latter redirects non-admins _to_ `/dashboard`, which would loop for a DRIVER.

## Adding a new route

1. Add `requireAdminApi()` (handler) or `requireAdmin()` / `requireSession()` (page) as the **first** thing in the function, before any Prisma call.
2. If it is a page, make sure `proxy.ts`'s `matcher` covers it (unless it is deliberately public like `/verify`).
3. Verify signed-out → 401/redirect, DRIVER → 403/redirect, ADMIN → works.

## Config split

`auth.config.ts` holds shared config with `providers: []` and is imported by `proxy.ts`. `auth.ts` adds the credentials provider that touches Prisma and bcrypt. Keep database access out of `auth.config.ts` — not for edge-runtime reasons (Next 16's proxy runs on Node.js; see the `logisync-conventions` skill) but because the proxy runs on every matched request and the Next docs warn against relying on shared modules there.

`passwordHash` must never leave the server. `auth.ts` compares against it and returns only id/email/name/role.

The role is persisted onto the JWT at sign-in via the `jwt` callback so later requests read it from the cookie without a database hit. Anything added to the session needs the same treatment in both `jwt` and `session` callbacks.

## Public QR verification

`/verify/[id]` is the one deliberate exception to the admin-only rule. Printed waybill PDFs encode this URL in their QR code (`app/api/waybills/[id]/pdf/route.ts` uses `APP_URL ?? request.nextUrl.origin`).

The page uses its own narrow Prisma `select` — sender, receiver, origin, destination, weight, volume, status, driver name — and must never expose `clientCost`, `driverPayment`, or `netMargin`. Keep it outside `proxy.ts`'s matcher and do not call `requireAdmin` on it.

If you guard an endpoint the QR still points at, you break every waybill already printed. Prefer changing the PDF generator in the same commit as any auth change that would affect the scan target.

## Environment

`AUTH_SECRET` is required at runtime. `auth.config.ts` throws an actionable error when it is missing (except during `NEXT_PHASE=phase-production-build`, so `pnpm build` can run on hosts that inject secrets only at deploy time).

Locally, `pnpm dev` runs `scripts/ensure-auth-secret.mjs`, which writes a generated secret into `.env.local` (gitignored, higher precedence than `.env`) when neither the environment nor `.env.local` already has a non-empty value. An empty `AUTH_SECRET=` in `.env` counts as unset. Production must set a real secret — generate with `npx auth secret`.

`APP_URL` should be set in production so QR codes embed the public origin rather than an internal proxy hostname.

Never commit `.env` or `.env.local`; `.gitignore` covers `.env*`.
