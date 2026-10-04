# Kharcha

Self-owned, mobile-first personal finance tracker. You own the data, it persists
server-side (so switching phones keeps your history), and it runs free on Vercel
+ Supabase. Installable as a PWA.

Full design docs live in `CLAUDE.md`, `PRD.md`, `DESIGN.md`, and `ARCHITECTURE.md`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Prisma 7 (pg
driver adapter) · Supabase (Postgres + Auth) · Recharts · date-fns · jsPDF.

## Features

- Email + password auth (Supabase), sessions persist across devices.
- Accounts (Bank, Cash, Asset) with computed balances and total net worth.
- Transactions: income, expense, and transfers between accounts.
- Categories: seeded defaults plus custom, income and expense kept separate.
- Dashboard: expense donut, income vs expense bar, net worth trend, recent list.
- Reports: custom date range + filters, with a tax-ready PDF export (client-side).
- PWA: installable to the home screen.

## 1. Create the Supabase project (free, no card)

1. Create a project at https://supabase.com.
2. Authentication > Providers > Email: keep Email enabled. For v1, turn **off**
   "Confirm email" (Authentication > Sign In / Providers) so signup logs in
   immediately.
3. Copy connection strings and keys into `.env.local` (see `.env.example`):
   - Project Settings > Database: the pooled "Transaction" string into
     `DATABASE_URL` (add `?pgbouncer=true`) and the "Direct connection" string
     into `DIRECT_URL`.
   - Project Settings > API: `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Prisma reads `DATABASE_URL` / `DIRECT_URL` from `.env`, so also put those two in
`.env` (or symlink). Everything else goes in `.env.local`.

## 2. Install and set up the database

```bash
pnpm install
pnpm db:deploy     # applies prisma/migrations to your Supabase database
pnpm db:seed       # optional: seeds default categories for existing users
pnpm dev           # http://localhost:3000
```

New users get default categories automatically on first login. The seed script
is only needed for users created before categories existed.

To change the schema during development: edit `prisma/schema.prisma`, then
`pnpm db:migrate`.

## 3. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (Hobby plan).
2. Add the same environment variables in Vercel > Project > Settings >
   Environment Variables.
3. Deploy. `prisma generate` runs on install (`postinstall`). Apply migrations
   to production once with `pnpm db:deploy` (locally pointed at prod, or as a
   Vercel build step by setting the build command to
   `prisma migrate deploy && next build`).

## 4. Backups

`.github/workflows/backup.yml` runs a nightly `pg_dump` and uploads a gzipped
dump as a GitHub Actions artifact (90-day retention). Set a repo secret
`DIRECT_URL` to your Supabase direct connection string. Restore with:

```bash
gunzip -c kharcha-backup-YYYYMMDD.sql.gz | psql "$DIRECT_URL"
```

## 5. Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm test` | Vitest unit tests (money + schema logic) |
| `pnpm db:migrate` | Create + apply a dev migration |
| `pnpm db:deploy` | Apply migrations (production) |
| `pnpm db:seed` | Seed default categories |

## Notes

- Per-user data isolation is enforced by `userId` WHERE clauses in every server
  action (Prisma bypasses Supabase RLS). See `ARCHITECTURE.md` section 7.
- Verified at 375px width; the UI is mobile-first with a bottom tab bar.
