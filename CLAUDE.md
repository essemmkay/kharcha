# CLAUDE.md — Kharcha Operating Manual

> Operating manual for this repo. Read this first in every session before touching code.

## 1. Project summary

Kharcha is a self-owned, mobile-first personal finance tracker for a single user. It replaces "Wallet by Budget Bakers" and "Hysab Kytab", which failed on a blocked free tier and on lost server sync. The goal is full data ownership, zero hosting cost, server-side persistence so data survives a phone switch, and a PDF expense report for tax. Scope is one user tracking accounts (bank, cash, asset), income/expense/transfer transactions, categories, dashboard charts, and PDF export.

## 2. Tech stack and versions

- Next.js 14+ (App Router) with React Server Components
- TypeScript (strict mode)
- Tailwind CSS v3
- shadcn/ui (Radix + Tailwind)
- Prisma ORM (latest 5.x)
- Supabase (serverless Postgres + Auth) as the single backend
- Recharts for charts
- date-fns for dates
- react-hook-form + zod for forms and validation
- jsPDF + jspdf-autotable for client-side PDF
- lucide-react for icons
- next-pwa (or manual manifest + service worker) for PWA

Node 20+. Package manager: pnpm.

## 3. Directory structure

```
kharcha/
├── app/                  # App Router routes, layouts, server actions
│   ├── (auth)/           # login, signup (public)
│   ├── (app)/            # authenticated app shell with bottom nav
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/              # route handlers (only where an action cannot serve, e.g. cron backup)
│   └── layout.tsx        # root layout, theme provider
├── components/           # shared UI (ui/ = shadcn primitives, app-level composites alongside)
├── lib/                  # db client, auth helpers, utils, pdf, money math
│   ├── actions/          # server actions grouped by domain (accounts, transactions, ...)
│   ├── schemas/          # zod schemas (one file per domain)
│   ├── supabase/         # supabase server/client helpers
│   └── prisma.ts         # singleton Prisma client
├── prisma/               # schema.prisma, migrations, seed.ts
├── public/               # icons, manifest, service worker
└── *.md                  # CLAUDE.md, PRD.md, DESIGN.md, ARCHITECTURE.md, README.md
```

Top-level purpose: `app/` routes and server actions, `components/` reusable UI, `lib/` all non-UI logic, `prisma/` schema and seed, `public/` static and PWA assets.

## 4. Coding conventions

- TypeScript strict mode on. No `any`; use `unknown` and narrow.
- Server Components by default. Add `"use client"` only when a component needs state, effects, event handlers, or browser APIs. Keep client components small and at the leaves.
- Naming: components PascalCase, files kebab-case for routes and camelCase for lib modules, hooks `useX`, server actions verbs (`createAccount`, `deleteTransaction`).
- shadcn/ui: install primitives with the CLI into `components/ui/`. Do not hand-edit generated primitives; wrap them in app-level composites instead.
- Forms: controlled React components (small forms) that call a server action. The zod schema in `lib/schemas.ts` is the single validation authority and runs inside every action; the client adds only basic UX hints (required, min length). Never trust client input. react-hook-form may be used for larger forms, but is not required.
- Money: store amounts as Prisma `Decimal(14,2)`. Never do float math on money in JS; use integer cents or the decimal helpers in `lib/money.ts`. Format for display only at the edge.
- Dates: use date-fns. Store `DateTime` (UTC) in the DB. Month boundaries computed with `startOfMonth`/`endOfMonth`.
- Errors: server actions return a typed result `{ ok: true, data } | { ok: false, error }`. Surface errors as toasts. Always render loading and empty states.

## 5. Data-fetching conventions

Server Actions are the single write path, and RSC is the read path. Justification: server actions are co-located, type-safe, and need no manual route wiring, which is the lazy and correct default for a single-user app. Route handlers are used only where an action cannot serve (the cron backup endpoint). Client-side fetching (SWR/React Query) is avoided unless a screen has interactive client state that cannot be driven by URL search params; prefer `?month=` and `?account=` search params read by RSC.

## 6. Environment variables (names only)

Local: `.env.local`. Production: Vercel project env settings.

- `DATABASE_URL` (Supabase pooled connection, PgBouncer, port 6543, `?pgbouncer=true`)
- `DIRECT_URL` (Supabase direct connection, port 5432, used by Prisma migrate)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never exposed)
- `BACKUP_REPO_TOKEN` (optional, for GitHub Actions backup cron)

## 7. Run, migrate, seed, deploy

- Install: `pnpm install`
- Dev: `pnpm dev`
- Generate client: `pnpm prisma generate`
- Migrate (dev): `pnpm prisma migrate dev`
- Migrate (prod): `pnpm prisma migrate deploy`
- Seed categories: `pnpm prisma db seed`
- Deploy: push to GitHub, Vercel auto-deploys. Run `prisma migrate deploy` in the build or as a manual step.

## 8. Rules for Claude (this repo)

- If scope changes, update PRD.md in the same change. The four .md files are the contract.
- Never hardcode secrets. Use env vars only.
- Always write a zod schema for every input before writing the server action that consumes it.
- Always access the DB through Prisma. Every query that reads or writes user data must scope by `userId` from the session (see ARCHITECTURE.md security).
- Keep diffs small. Reuse existing helpers before writing new ones.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). One logical change per commit.
- Non-trivial logic ships with one runnable check (Vitest).

## 9. Gotchas (free-tier constraints)

- Supabase cold start: the free project pauses after about 7 days of inactivity. First request after a pause is slow or fails once; the app must handle a transient DB error and retry.
- Serverless + Prisma connections: use the Supabase pooled URL (`DATABASE_URL`) at runtime to avoid exhausting Postgres connections. Use `DIRECT_URL` only for migrations. Keep one Prisma singleton (`lib/prisma.ts`) to avoid re-instantiation in dev.
- Vercel function timeout: default is generous now, but keep actions fast. Do not run long loops; the PDF is generated client-side so no server time is spent on it.
- RLS vs Prisma: Prisma connects with a privileged role and bypasses Supabase Row Level Security. Primary per-user isolation is enforced by `userId` WHERE clauses in every action. RLS is optional defense in depth only if we later add direct client-to-Supabase reads.
- Supabase free tier has no credit card requirement for the Hobby/free project. Vercel Hobby likewise.

## 10. Open questions / assumptions

- The prompt had minor typos ("passworgin/signup" read as "email + password signup", "DABLE 3" read as "DELIVERABLE 3"). Proceeding on that reading.
- Single currency per account is supported; cross-currency net worth (FX) is out of scope for v1. Net worth sums balances as-is and assumes one base currency in practice.
- Attachments are deferred to v2 (free object storage adds complexity); noted in PRD non-goals.
- DB choice is Supabase (justified in ARCHITECTURE.md). Change here and in ARCHITECTURE.md together if revisited.

## 11. Implementation notes (deviations from the original docs)

The docs were written before scaffolding. The build pinned to current releases and adapted:
- Versions: Next.js 16 (App Router), React 19, Tailwind v4 (CSS-first `@theme` in `app/globals.css`, no `tailwind.config`), Prisma 7, zod 4, Recharts 3. "Next 14+" in the stack is satisfied by 16.
- Prisma 7 requires a driver adapter and moves connection URLs out of the schema. Runtime uses `@prisma/adapter-pg` with the pooled `DATABASE_URL` (`lib/prisma.ts`); the CLI uses `DIRECT_URL` via `prisma.config.ts`. The client is generated to `lib/generated/prisma`, and `.npmrc` hoists `@prisma/*` so that custom-output client resolves under pnpm.
- Forms are controlled components with server-side zod as the single validation authority (see section 4), not react-hook-form + zodResolver.
- Transaction row interaction is tap-to-edit (delete lives on the edit page). Swipe-to-delete from DESIGN.md is deferred.
- Backup is implemented as a GitHub Actions `pg_dump` cron (`.github/workflows/backup.yml`); the optional `/api/backup` route handler was not needed.
- Optimistic create sync: new transactions are written to a client-side outbox (`lib/sync/outbox.ts`, localStorage) so they appear instantly and tolerate a flaky/offline connection. The outbox replays each one through the existing `createTransaction` server action (server stays the source of truth, per section 5), auto-flushing on load, on `online`, and on tab focus. `SyncBadge` in the app header shows the unsynced count plus a manual "Sync now" and lets you discard a server-rejected entry. Scope is creates only: edits and deletes still go straight to the server, and server-computed aggregates (dashboard totals, charts, balances) reflect a transaction only after it syncs. Upgrade path if needed: queue edits/deletes too, and move the queue to IndexedDB with the Background Sync API.
