# LogiSync

Simple web app for freight pricing and digital waybills — admin-operated, Central America routes.

[Public Site](https://logisync-bsyr.onrender.com/)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 11 (`corepack enable` then `corepack prepare pnpm@11.18.0 --activate`)
- PostgreSQL

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment**

   Copy the template and fill in values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | yes | Postgres connection string |
   | `AUTH_SECRET` | production | Signing key for session cookies. Locally, `pnpm dev` writes one into `.env.local` if unset. Generate with `npx auth secret`. Never commit it. |
   | `APP_URL` | production | Public origin baked into printed waybill QR codes (e.g. `https://your-app.example.com`) |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | for seeding | Used by `pnpm seed:admin` only |

3. **Apply migrations**

   ```bash
   pnpm exec prisma migrate deploy
   ```

4. **Create the first admin**

   ```bash
   pnpm seed:admin
   ```

5. **Start the dev server**

   ```bash
   pnpm dev
   ```

   Opens at http://localhost:3000. Sign in at `/login` with the admin you just seeded.

### Auth secret locally vs production

- **Local:** `pnpm dev` runs `scripts/ensure-auth-secret.mjs`, which generates `AUTH_SECRET` into `.env.local` (gitignored) when neither the environment nor `.env.local` already has one. An empty `AUTH_SECRET=` in `.env` counts as unset.
- **Production:** set a real `AUTH_SECRET` (and `APP_URL`) in the deploy environment. Missing `AUTH_SECRET` fails at boot with a clear error instead of falling back to a committed placeholder.

## Useful commands

```bash
pnpm dev          # ensure auth secret + start Next.js
pnpm build        # prisma generate && next build
pnpm tsgo         # typecheck (the only gate that catches type errors)
pnpm lint         # eslint
pnpm test:price   # pricing integration tests (needs `pnpm dev` running)
pnpm seed:admin   # create or reset the ADMIN user
```

## Demo path

1. Sign in as ADMIN
2. Add a driver on `/drivers`
3. Filter drivers by preferred city
4. Calculate a price on `/calculator`
5. Create a waybill on `/waybill`
6. Assign a driver on `/admin/waybills`
7. Download the PDF and scan the QR — `/verify/[id]` shows cargo data with no financials
8. Sign out via the button in the nav
