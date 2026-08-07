# Auth setup ownership: production-safe secret + permissions flow

## Context

Trello card #18 ("Auth Setup Ownership Needed") asks someone to take over final Auth.js
configuration and permissions hardening. Its acceptance criteria are:

1. No `MissingSecret` in any environment
2. Approved env-based secret setup
3. Correct role-based access behavior
4. Brief setup docs for the team

Two things stand behind this today:

**The secret is a committed placeholder.** `auth.config.ts:4-7` hardcodes
`"logisync-dev-auth-secret-change-me"` and uses it whenever `NODE_ENV === "development"`.
`AUTH_SECRET` is empty in `.env` and absent from CI, so this string is currently the _only_
signing key in use — and it is in the repo, meaning anyone who can read the repo can forge an
ADMIN JWT against any deployment that isn't strictly `NODE_ENV=production`.

**Most of the app is unauthenticated.** Only `app/api/drivers/*` and `app/(app)/drivers/page.tsx`
call the guards in `lib/auth-guard.ts`. `proxy.ts`'s matcher covers `/drivers/:path*` alone, so
`/dashboard`, `/waybill`, `/calculator`, `/routes`, and `/admin/waybills` render for signed-out
visitors, and six API routes answer anyone — including `/api/admin/waybills`, which returns
`driverPayment` and `netMargin` for every shipment, and `PUT`/`DELETE /api/admin/route-pricing`,
which lets an anonymous caller rewrite pricing multipliers.

Scope confirmed with the user: **full hardening**, absorbing backlog cards "Require ADMIN on every
waybill, pricing, and PDF endpoint" and "Public QR verification page" — `docs/BACKLOG.md` records
that those two cannot safely ship apart, because the printed QR points at an endpoint we're about
to guard. Dev secret strategy confirmed: **keep a zero-config dev fallback, but generate it per
machine instead of committing it.**

The intended end state is the one `.claude/skills/logisync-auth/SKILL.md` already describes:
admin-only everywhere, two layers (optimistic proxy + authoritative check next to the data), with
exactly one public route — the QR verification page.

---

## Part 1 — Secret management

### `scripts/ensure-auth-secret.mjs` (new)

Node script, no dependencies beyond `node:crypto` and `node:fs`:

- If `process.env.AUTH_SECRET` is a non-empty string, exit 0 silently.
- Else if `.env.local` already contains a non-empty `AUTH_SECRET=`, exit 0 silently.
- Else append `AUTH_SECRET="<crypto.randomBytes(32).toString("base64")>"` to `.env.local`
  (creating it if absent) and log one line saying a dev secret was generated.

`.env.local` is already gitignored by `.gitignore:35` (`.env*` with only `!.env.example` exempt),
and Next.js loads it automatically at higher precedence than `.env` — which matters, because `.env`
currently holds `AUTH_SECRET=""` and the empty value must be treated as unset.

Writing to a file rather than generating in-process is deliberate: `proxy.ts` and `auth.ts` are
bundled into separate runtimes, so a per-process random value would sign a JWT in one and fail to
verify it in the other. It also keeps sessions alive across dev-server restarts.

### `package.json`

Change `"dev": "next dev"` to `"dev": "node scripts/ensure-auth-secret.mjs && next dev"`.
Explicit `&&` rather than a `predev` script — pnpm does not run pre/post scripts by default.

### `auth.config.ts`

Delete `devFallbackSecret` (lines 4-7) and the `secret:` property (line 17) entirely.
`next-auth/lib/env.js:22` already resolves `config.secret ?? process.env.AUTH_SECRET ??
process.env.NEXTAUTH_SECRET`, so the property is redundant once the fallback is gone.

Add a module-scope assertion in its place — this file is imported by both `proxy.ts` and `auth.ts`,
so one check covers every runtime:

```ts
if (
  !process.env.AUTH_SECRET &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  throw new Error(
    'AUTH_SECRET is not set. Run `npx auth secret`, or `pnpm dev` to generate one into .env.local. See README.md.',
  );
}
```

The `NEXT_PHASE` exemption (`phase-production-build`, confirmed at
`node_modules/next/dist/shared/lib/constants.js:333`) keeps `pnpm build` working on a build host
that injects secrets only at runtime. This satisfies "no `MissingSecret` in any environment" by
replacing Auth.js's opaque error with an actionable one, and by making dev self-provisioning.

### `.env.example`

Note that `pnpm dev` auto-generates `AUTH_SECRET` into `.env.local` for local work and that
production must set a real one. Add `APP_URL` (see Part 4).

---

## Part 2 — Page guards

### `lib/auth-guard.ts`

Add a fourth helper alongside the three that exist, matching their style and doc-comment density:

```ts
export async function requireSession(callbackUrl?: string): Promise<Session>;
```

Redirects to `/login?callbackUrl=…` when signed out; returns the session for any role. Needed for
`/dashboard`, which must stay reachable by a DRIVER — `requireAdmin()` redirects non-admins _to_
`/dashboard`, so guarding that page with `requireAdmin()` would loop.

### Page splits

`/waybill`, `/calculator`, `/routes`, and `/admin/waybills` are all `"use client"` at line 1, so
they cannot call an async guard. Convert each to the pattern `app/(app)/drivers/` already uses —
a server `page.tsx` beside a client component:

- Move the existing client component body to a sibling (`WaybillClient.tsx`, `CalculatorClient.tsx`,
  `RoutesClient.tsx`, `AdminWaybillsClient.tsx`), keeping `"use client"` on it and changing nothing else.
- Replace `page.tsx` with a small server component: `await requireAdmin("/waybill")` first, then
  render the client component.

`app/(app)/dashboard/page.tsx` gets the same split but calls `requireSession("/dashboard")`, and
renders a short "your account doesn't have access to shipment data" notice instead of the client
component when `session.user.role !== "ADMIN"` — its data source (`/api/waybills`) becomes
admin-only in Part 3.

**Do not put the check in `app/(app)/layout.tsx`.** Next 16's own guide is explicit
(`node_modules/next/dist/docs/01-app/02-guides/authentication.md:1348-1352`): partial rendering
means layouts don't re-render on navigation, so the session wouldn't be re-checked on route change.
Leave that file's existing `auth()` call alone — it only computes `isAdmin` for nav rendering.

### `proxy.ts`

Extend the matcher to the rest of the app group:

```ts
matcher: [
  "/dashboard/:path*",
  "/drivers/:path*",
  "/waybill/:path*",
  "/calculator/:path*",
  "/routes/:path*",
  "/admin/:path*",
],
```

`/verify/:id` and `/login` stay off the list. The ADMIN branch at `proxy.ts:20-22` must skip
`/dashboard` (`if (pathname !== "/dashboard" && session.user.role !== "ADMIN")`) or a DRIVER hits a
redirect loop. Keep the existing comment explaining that API routes are excluded on purpose.

---

## Part 3 — API guards

Apply the existing `requireAdminApi()` from `lib/auth-guard.ts:56` as the **first** statement in
each handler, before any Prisma call — the pattern already in `app/api/drivers/route.ts:13`:

```ts
const denied = await requireAdminApi();
if (denied) return denied;
```

| File                                   | Handlers         |
| -------------------------------------- | ---------------- |
| `app/api/waybills/route.ts`            | GET, POST        |
| `app/api/waybills/[id]/route.ts`       | GET, PUT         |
| `app/api/admin/waybills/route.ts`      | GET              |
| `app/api/admin/route-pricing/route.ts` | GET, PUT, DELETE |
| `app/api/calculate-price/route.ts`     | POST             |
| `app/api/waybills/[id]/pdf/route.ts`   | GET              |

Also audit `app/actions/drivers.ts` — it already calls `getAdminSession()` at :39-42; confirm every
exported action in the file does, not just the one. Next's guide is explicit that Server Actions are
public POST endpoints (`authentication.md:1449-1451`).

---

## Part 4 — Public verification page (must ship in the same commit)

`app/api/waybills/[id]/pdf/route.ts:26-29` builds the QR payload as a URL to `/api/waybills/:id`.
Guarding that endpoint without repointing the QR breaks the scan target on **every waybill already
printed**, and the failure shows up on paper rather than in CI.

### `app/verify/[id]/page.tsx` (new, public)

Server component outside the `(app)` group and outside the proxy matcher — the one deliberate
exception to the guard. Give it its own narrow Prisma `select` rather than reusing a query that
touches financial columns; that way a future edit can't leak margins into it by accident.

Show sender, receiver, origin, destination, weight, volume, status, and driver name. Show **no**
`clientCost`, `driverPayment`, or `netMargin`. Render a plain "waybill not found" state for an
unknown id, and keep it mobile-first — it's read on a phone in a warehouse.

### `app/api/waybills/[id]/pdf/route.ts`

Repoint the QR to `/verify/${waybill.id}`. Replace `request.nextUrl.origin` with
`process.env.APP_URL ?? request.nextUrl.origin` — behind Prisma Compute's proxy the request origin
can resolve to an internal hostname, and a wrong origin baked into a printed QR is permanent.
Add `APP_URL` to `.env.example`.

---

## Part 5 — Cleanup

- **Sign-out.** `logout()` exists at `app/actions/auth.ts:31` and nothing imports it — a signed-in
  user currently cannot sign out. Wire it to a submit button in `app/(app)/components/Navbar.tsx`
  and `Sidebar.tsx`, styled with the existing `Button` component.
- **`Sidebar.tsx:28`** renders the "Admin Panel" link unconditionally while gating "Drivers" on
  `isAdmin` at :20. `Navbar.tsx:28-37` gets this right; match it.
- **`scripts/test-calculate-price.mjs`** posts to `/api/calculate-price` with no session, so Part 3
  turns all seven assertions into 401s and it reads as a pricing regression. Add a sign-in step at
  the top of `run()`: `GET /api/auth/csrf` for the token and cookie, `POST
/api/auth/callback/credentials` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` and `redirect: false`, then
  carry the returned `authjs.session-token` cookie on every request. Add one new assertion that an
  unauthenticated POST returns 401.
- **`scripts/seed-admin.mjs:35-39`** upserts `role: "ADMIN"` on an existing email, silently
  promoting any account to admin. Log loudly when updating an existing user rather than creating one.

---

## Part 6 — Docs

- **`README.md`** is 12 lines with no setup steps. Write the brief team setup doc the card asks for:
  env vars from `.env.example`, `prisma migrate deploy`, `pnpm seed:admin`, `pnpm dev`, and how
  `AUTH_SECRET` works locally vs. in production (`npx auth secret`, never committed).
- **`API_DOCUMENTATION.md`** is actively misleading: `:269` still lists "Authentication: Add user
  auth before moving to production" as a next step, and the env template at `:277-283` omits
  `AUTH_SECRET` entirely — following it produces a broken deploy. Fix both, and document the new
  401/403 behavior on the endpoints from Part 3 plus the public `/verify/[id]` route.
- **`.claude/skills/logisync-auth/SKILL.md`** — rewrite the "Known gaps" section (:45-56) and the
  QR-dependency section (:60-68), which describe problems this change resolves, and update the
  "Environment" section (:70-74) for the new secret flow.
- **`docs/BACKLOG.md`** — move "Require ADMIN on every…", "Public QR verification page", and
  "Extend the page guard beyond /drivers" to Done, and drop the now-stale ordering hazards.

---

## Verification

`next.config.ts` sets `typescript.ignoreBuildErrors: true` and no CI workflow runs on PRs, so
`pnpm build` passing proves nothing about types. Run `pnpm tsgo` and `pnpm lint` explicitly.

Then, against `pnpm dev`:

1. **Secret.** Delete `.env.local`, run `pnpm dev` — it generates a secret and boots. Run it again;
   the same secret is reused and an existing session survives. Then `AUTH_SECRET= NODE_ENV=production
pnpm start` — expect the new named error, not `MissingSecret`.
2. **Signed out.** Every page in `/dashboard`, `/drivers`, `/waybill`, `/calculator`, `/routes`,
   `/admin/waybills` redirects to `/login` with a `callbackUrl` that lands on the right page after
   sign-in. Every endpoint in the Part 3 table returns 401 via `curl`, and
   `curl -s localhost:3000/api/admin/waybills` shows no `driverPayment` or `netMargin`.
3. **As DRIVER.** Temporarily set a user's role to `DRIVER` in the database: admin pages redirect to
   `/dashboard`, `/dashboard` itself loads without looping, and the endpoints return 403.
4. **As ADMIN.** Full demo path still works: sign in → add a driver → filter by city → calculate a
   price → create a waybill → assign a driver → download the PDF. Then sign out via the new button.
5. **QR.** Download a waybill PDF, scan the QR with a phone that has no session — `/verify/[id]`
   renders cargo data and no financial figure appears anywhere on it.
6. **Pricing tests.** `pnpm test:price` passes with the new sign-in step, including the 401 assertion.

Deployment is out-of-band and is the "ownership" half of the card: `AUTH_SECRET` and `APP_URL` must
be set in the Prisma Compute app environment. `.github/workflows/prisma-compute-deploy.yml`
references only `PRISMA_SERVICE_TOKEN`, `PRISMA_PROJECT_ID`, and `PRISMA_APP_ID`, and nothing
verifies the auth vars exist — worth confirming in the Prisma dashboard before the first deploy
after this change, since a missing `AUTH_SECRET` now fails loudly at boot instead of silently
falling back.
