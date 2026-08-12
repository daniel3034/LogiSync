---
name: logisync-conventions
description: LogiSync's stack, tooling, and the version-specific traps in it. Load before writing or reviewing any code in this repo — especially before touching proxy.ts, Prisma, route handlers, page params, or Tailwind, and before assuming a Next.js or Prisma API works the way it does in older versions.
---

# LogiSync stack and conventions

A Next.js 16 freight waybill app. The versions here are new enough that habits from Next 14/15 and Prisma 5/6 are actively wrong. `AGENTS.md` says it plainly: read `node_modules/next/dist/docs/` before writing code. That bundle is the installed version's own documentation and beats anything remembered.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2.10, App Router | React 19.2.4 |
| Language | TypeScript 6 | typechecked with `tsgo`, not `tsc` |
| Styling | Tailwind CSS v4 | CSS-first config; there is no `tailwind.config.js` |
| Auth | Auth.js (next-auth) 5 beta | credentials provider, JWT sessions |
| ORM | Prisma 7 | driver adapters, not the built-in engine |
| Database | PostgreSQL | via `pg` Pool |
| PDF | `pdf-lib` + `qrcode` | server-side generation |
| Package manager | pnpm 11.18.0 | lockfile is committed |
| Deploy | Prisma Compute | `.github/workflows/prisma-compute-deploy.yml`, manual dispatch |

Note the deploy target: the project proposal says Vercel or Render, but the actual pipeline deploys to Prisma Compute via `bunx @prisma/cli@latest app deploy`. It is `workflow_dispatch` only — nothing deploys on push. Use `@latest` (beta), not `@preview` (alpha) — preview's app commands falsely report `PROJECT_NOT_FOUND`.

## Commands

```bash
pnpm dev              # dev server
pnpm build            # prisma generate && next build
pnpm tsgo             # typecheck — the ONLY thing that catches type errors
pnpm lint             # eslint
pnpm test:price       # integration test, needs a running dev server
pnpm seed:admin       # create/reset the first ADMIN user
```

## Traps

**`pnpm build` does not catch type errors.** `next.config.ts` sets `typescript: { ignoreBuildErrors: true }`. A build passing means nothing about type safety. Always run `pnpm tsgo` before claiming a change compiles.

**`proxy.ts`, not `middleware.ts`.** Next 16 renamed the convention (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` §"`middleware` to `proxy`"). Do not create `middleware.ts` — it is deprecated.

**Proxy runs on Node.js, not edge.** The upgrade guide states the edge runtime is *not* supported in `proxy` and the runtime `cannot be configured`. `auth.config.ts` carries a comment describing itself as "Edge-safe" and forbidding Prisma/`pg`/bcrypt imports — that rationale predates the rename and is now inaccurate as stated. Keeping the config split is still right (proxy runs on every matched request, and the docs warn against relying on shared modules there), but do not repeat "because edge" as the reason.

**Route handler and page params are Promises.** Next 15+ made these async and the repo follows it consistently:

```ts
{ params }: { params: Promise<{ id: string }> }   // route handlers
const { id } = await params;

searchParams: Promise<{ city?: string }>          // pages
const { city } = await searchParams;
```

**Prisma 7 uses driver adapters.** `lib/prisma.ts` builds a `pg` `Pool`, wraps it in `PrismaPg`, and passes it as `adapter`. Connection config lives there, not in `schema.prisma` — the datasource block has no `url`. `prisma.config.ts` supplies the URL for CLI commands and imports `dotenv/config` to do it.

**`mode: "insensitive"` is Postgres-only.** `schema.prisma` carries commented instructions for switching to SQLite; several queries would silently change behaviour if anyone took that path.

**Tailwind v4 is CSS-first.** `app/globals.css` uses `@import "tailwindcss"` and `@theme inline`. Do not add a `tailwind.config.js`.

## Patterns to follow

**Server components read Prisma directly.** `app/(app)/drivers/page.tsx` queries `prisma` in the component and calls `requireAdmin()` next to that query. Client components (`"use client"`) go through `fetch` to a route handler instead — see `app/(app)/dashboard/page.tsx`. Match whichever the surrounding page already does.

**Route handlers return `NextResponse.json` with explicit status,** wrap the body in `try/catch`, `console.error` the caught error, and return a generic message. Every handler in `app/api/` follows this shape; copy it rather than inventing error formats.

**Financial and canonicalisation logic lives on the server.** See the `logisync-pricing` skill.

**Comments explain *why*, and several are load-bearing.** `lib/cities.ts` documents why a `contains` query alone is wrong; `auth-guard.ts` documents why the check is duplicated. Preserve that reasoning when editing.

## Testing reality

There is no test framework — no jest, no vitest. The only automated check is `scripts/test-calculate-price.mjs`, a hand-rolled integration script that `fetch`es a running dev server. It signs in as ADMIN (via `ADMIN_EMAIL` / `ADMIN_PASSWORD`) before hitting `/api/calculate-price`, and asserts that an unauthenticated POST returns 401. Treat "tests pass" claims accordingly, and verify changes by running the app.
