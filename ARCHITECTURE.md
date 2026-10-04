# ARCHITECTURE.md — Kharcha

## 1. High-level diagram

```
  Phone browser (PWA, installed to home screen)
        |  HTTPS
        v
  Vercel (Next.js App Router, Hobby plan)
    - RSC pages (reads)
    - Server Actions (writes)
    - Route handler: /api/backup (cron only)
        |  Prisma (pooled connection)
        v
  Supabase (free project)
    - Postgres (data)
    - Auth (email + password, session cookies)
        ^
        |  GitHub Actions nightly cron -> pg_dump -> private repo/storage
```

PDF generation runs entirely in the phone browser (jsPDF). No server compute for PDF.

## 2. DB choice: Supabase (justified)

Supabase is chosen over Neon. Reasoning:
- Built-in email/password auth with session cookies. Neon would require adding NextAuth or Lucia plus a sessions table, which is more code for a single-user app. Ponytail: fewer moving parts wins.
- Free Postgres with a connection pooler (PgBouncer) that fits Vercel serverless.
- No credit card required for the free project.
- Room to grow (storage for attachments) if v2 needs it.

Trade-off accepted: Supabase pauses an idle free project after about a week, so the app handles a transient first-request error. Vendor lock-in is low because the data is plain Postgres and can be dumped and moved to Neon later with no schema change.

## 3. Data model (Prisma schema)

A single `Transaction` model with a `type` enum covers income, expense, and transfer (a transfer sets `toAccountId`). This avoids a separate Transfer table and the joins it would add.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // pooled (PgBouncer)
  directUrl = env("DIRECT_URL")        // direct, for migrations
}

enum AccountType {
  BANK
  CASH
  ASSET
}

enum CategoryKind {
  INCOME
  EXPENSE
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

model User {
  id           String        @id @default(cuid())
  authId       String        @unique            // Supabase auth user id
  email        String        @unique
  name         String?
  baseCurrency String        @default("USD")
  createdAt    DateTime      @default(now())
  accounts     Account[]
  categories   Category[]
  transactions Transaction[]
  tags         Tag[]
}

model Account {
  id             String        @id @default(cuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  type           AccountType
  currency       String        @default("USD")
  openingBalance Decimal       @default(0) @db.Decimal(14, 2)
  note           String?
  archived       Boolean       @default(false)
  createdAt      DateTime      @default(now())
  transactions   Transaction[] @relation("AccountTransactions")
  transfersIn    Transaction[] @relation("TransferToAccount")

  @@index([userId])
}

model Category {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  kind         CategoryKind
  icon         String?
  color        String?
  parentId     String?
  parent       Category?     @relation("Subcategories", fields: [parentId], references: [id], onDelete: SetNull)
  children     Category[]    @relation("Subcategories")
  archived     Boolean       @default(false)
  transactions Transaction[]

  @@unique([userId, kind, name, parentId])
  @@index([userId])
}

model Transaction {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        TransactionType
  amount      Decimal         @db.Decimal(14, 2)
  date        DateTime
  accountId   String
  account     Account         @relation("AccountTransactions", fields: [accountId], references: [id], onDelete: Cascade)
  toAccountId String?                                            // set only for TRANSFER
  toAccount   Account?        @relation("TransferToAccount", fields: [toAccountId], references: [id], onDelete: Cascade)
  categoryId  String?                                            // null for TRANSFER
  category    Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  note        String?
  tags        Tag[]           @relation("TransactionTags")
  createdAt   DateTime        @default(now())

  @@index([userId, date])
  @@index([accountId])
  @@index([toAccountId])
  @@index([categoryId])
}

model Tag {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  transactions Transaction[] @relation("TransactionTags")

  @@unique([userId, name])
  @@index([userId])
}
```

Balance rule (computed, not stored):
`balance = openingBalance + SUM(INCOME where accountId) - SUM(EXPENSE where accountId) - SUM(TRANSFER where accountId) + SUM(TRANSFER where toAccountId)`.

Net worth = SUM of non-archived account balances. Transfers net to zero across net worth by construction.

## 4. Auth flow

1. Signup: email + password to Supabase Auth. On first login, an app `User` row is created or linked by `authId`.
2. Session: Supabase sets an http-only cookie; the `@supabase/ssr` helper reads it in RSC, actions, and middleware.
3. Middleware protects `(app)` routes: no session redirects to `/login`.
4. Email verification: optional. v1 can allow immediate login (single user); if enabled in Supabase, show a "check your email" state.

## 5. Server action / route handler surface

All actions scope by the current user's `userId`. Each returns `{ ok: true, data } | { ok: false, error }`. zod schemas live in `lib/schemas/`.

Accounts
- `createAccount(input)`: `{ name, type, currency, openingBalance, note? }` -> Account
- `updateAccount(input)`: `{ id, ...partial }` -> Account
- `archiveAccount({ id, archived })` -> Account
- `deleteAccount({ id })` -> `{ id }` (confirm required if it has transactions)
- `listAccounts()` (RSC query) -> Account[] with computed balance

Categories
- `createCategory({ name, kind, parentId?, icon?, color? })` -> Category
- `updateCategory({ id, ...partial })` -> Category
- `deleteCategory({ id, reassignToId? })` -> `{ id }`
- `listCategories({ kind? })` (RSC) -> Category[]

Transactions
- `createTransaction(input)`: discriminated zod union on `type`
  - income/expense: `{ type, amount, date, accountId, categoryId, note?, tagIds? }`
  - transfer: `{ type: "TRANSFER", amount, date, accountId, toAccountId, note?, tagIds? }`
  -> Transaction
- `updateTransaction({ id, ...input })` -> Transaction
- `deleteTransaction({ id })` -> `{ id }`
- `listTransactions(filter)` (RSC): `{ from?, to?, accountId?, categoryId?, type? }` -> Transaction[]

Dashboard/reports (RSC query helpers in `lib/actions`)
- `getMonthlySummary({ month, accountId? })` -> totals, by-category, by-account
- `getIncomeExpenseSeries({ months })` -> per-month income/expense
- `getNetWorthSeries()` -> cumulative balance over time
- `getReport({ from, to, accountId?, categoryId?, type? })` -> everything the PDF needs

Settings
- `updateProfile({ name, baseCurrency })` -> User
- `exportData()` -> JSON blob of the user's rows

Route handler
- `GET /api/backup` (cron, token-guarded): triggers or confirms the logical dump. Primary backup is the GitHub Actions cron (section 10).

## 6. Data fetching strategy

RSC for all reads, driven by URL search params (`?month=`, `?account=`, `?from=`, `?to=`). Server actions for all writes, followed by `revalidatePath`. No SWR/React Query in v1; the only client state is form state (react-hook-form) and the segmented transaction-type control.

## 7. Security

- Per-user isolation: every query includes `where: { userId }` from the session. This is the primary and required control (Prisma bypasses RLS).
- Input validation: zod at the trust boundary inside every action. Amounts must be positive; transfer source and destination must differ and both must belong to the user.
- RLS: optional defense in depth, only relevant if we later read Supabase directly from the client. Not relied on in v1.
- Transport: HTTPS only (Vercel default). Auth cookies are http-only and secure.
- Rate limiting: single-user app; rely on Vercel platform limits in v1. Add per-IP limiting on auth if abuse appears (noted, not built).

## 8. Free-tier optimization

- Pooled connection (`DATABASE_URL` via PgBouncer, `?pgbouncer=true`) at runtime; `DIRECT_URL` only for migrations.
- One Prisma singleton to avoid connection storms in dev.
- Keep actions short; no long-running server work. PDF is client-side.
- Cache-friendly reads via RSC and `revalidatePath` on write. No image handling in v1.
- Handle Supabase cold-start: wrap the first query path to show a friendly retry if the project is waking.

## 9. PDF generation approach

Client-side with jsPDF + jspdf-autotable. Reasoning: the tax report is mostly tabular (itemized list, per-category and per-account totals), which autotable renders directly with pagination. jsPDF has a smaller footprint than @react-pdf/renderer for this shape, runs in the browser (zero server cost), and integrates with the Web Share API for mobile sharing. The report data comes from `getReport` already computed on the server, so the client only lays it out.

## 10. Deployment pipeline

- GitHub repo connected to Vercel; push to `main` auto-deploys production, PRs get preview URLs.
- Env vars set in Vercel project settings (see CLAUDE.md section 6).
- Migrations: `prisma migrate deploy` as a build step (or a manual run against `DIRECT_URL`) so the DB schema matches the deployed code.

## 11. Backup strategy

- Nightly GitHub Actions cron runs `pg_dump` against `DIRECT_URL` and commits the gzip dump to a private repo (or uploads to free object storage).
- Restore: `pg_restore` (or `psql`) the chosen dump into a fresh Postgres, point `DATABASE_URL`/`DIRECT_URL` at it, run `prisma migrate deploy`.
- Secondary: the in-app Settings "Export data" produces a JSON the user can keep.

## 12. Testing strategy

- Vitest for pure logic: balance computation, net worth, money math, zod schemas, report aggregation.
- Playwright for happy paths (login, add transaction, see it on dashboard, export PDF): optional in v1, recommended before heavy data migration.

## 13. Folder structure

Matches CLAUDE.md section 3.

## 14. Future extension points

- Attachments: add a `Attachment` model and Supabase Storage bucket.
- Multi-currency FX: add a rates table and convert to base currency for net worth.
- Budgets and recurring transactions: add `Budget` and `RecurringRule` models.
- Multi-user/shared: `userId` scoping already present; add membership/sharing tables and turn on RLS.

## 15. Summary and checklist

Vercel + Supabase + Prisma, RSC reads and server-action writes, unified Transaction model with a type enum, per-user WHERE-clause isolation, client-side jsPDF reports, and a GitHub Actions backup cron. Zero paid services.

Architecture checklist:
- [ ] Supabase project, pooled + direct URLs set
- [ ] Prisma schema migrated, categories seeded
- [ ] Auth + middleware-protected routes
- [ ] All actions scoped by userId with zod validation
- [ ] RSC reads via search params, revalidate on write
- [ ] Client-side PDF with Web Share
- [ ] Backup cron + documented restore
- [ ] Vitest on money and aggregation logic
