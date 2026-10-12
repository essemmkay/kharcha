# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single owner-user tracking their own personal finances. Pakistani context (the
app curates Pakistani banks for account logos; base currency per account). They
check and record money mostly on a phone, often in the moment — logging an
expense right after paying, or reviewing where the month went. Private, daily,
personal. They arrived here after "Wallet by Budget Bakers" and "Hysab Kytab"
failed them: a blocked free tier and lost server sync. Emotionally, data
ownership and permanence matter.

## Product Purpose

Kharcha is a self-owned, offline-first personal finance tracker. It records
accounts (bank, cash, asset), transactions (income, expense, transfer),
categories, a dashboard of where money stands and where it went, and a PDF
expense report for tax. Success is: full data ownership, zero hosting cost,
server-side persistence that survives a phone switch, and money that is legible
at a glance and instant to log.

## Positioning

Your money, fully yours and fully legible. Not a subscription SaaS that can
block your tier or lose your sync — a self-hosted ledger where the browser owns
the complete dataset, reads and writes locally, and the server reconciles in the
background. No lock-in, no paywall, survives a device switch.

## Operating Context

- Local-first: the client holds the full dataset in IndexedDB and reads/writes
  locally; a delta-sync engine pushes a mutation queue and pulls changes from a
  headless API (same backend as the Expo mobile app). A sync badge shows pending
  count / syncing / synced.
- Core flows: review the dashboard (net worth, this-month income/expense/net,
  spending by category, recent activity, per-account balances), scan and search
  the transaction ledger grouped by day, add/edit a transaction, manage accounts
  and categories, and export a report (with charts) to PDF.
- Money ritual: amounts must align and read like a statement — tabular figures,
  semantic income/expense/transfer treatment, running day totals.

## Capabilities and Constraints

- Single user; single currency per account (cross-currency net worth is out of
  scope for v1 — balances sum as-is).
- Transaction types: INCOME, EXPENSE, TRANSFER. Accounts: BANK, CASH, ASSET.
- Money stored as decimal; never float math; format only at the display edge.
- Web stack (existing): Vite + React 19, react-router-dom, Dexie/IndexedDB,
  Supabase auth, plain CSS. Talks to the headless API with Bearer auth.
- Web is currently phase-1 (login, dashboard, transactions list, add form).
  Accounts, categories, edit/delete, reports + PDF, and charts are not yet built
  in the web client — this redesign designs the full target vision for all of them.
- An account can be linked to a curated Pakistani bank for a real logo
  (device-local, not synced); cash/asset show a type icon.

## Brand Commitments

- Name: **Kharcha** (Urdu/Hindi for "expense/spending").
- Voice: simple, direct, plain. American English. No corporate jargon.
- Tagline in use: "Your money, your data."
- The product reads as one brand across its mobile (Expo) and web clients.
- [Inferred from code, not a pinned visual constraint, open to replacement in
  this redesign: the current look is a deep-"ink" balance hero + single indigo
  accent + mint/rose money colors.]

## Evidence on Hand

- Real shipping web code in `web/src` (Login, Dashboard, Transactions,
  TransactionForm) and shared pure query/money/date helpers.
- Real data shapes: accounts with balances, day-grouped transaction rows,
  monthly summary with by-category breakdown, net worth.
- No invented customers, testimonials, pricing, or benchmarks exist; this is a
  single-user tool. Demonstration data in any mock is synthetic and labeled.

## Product Principles

1. The number is the hero. Balances and amounts must be the most legible thing
   on every screen, aligned and scannable like a financial statement.
2. Ownership and permanence over features. The design should feel like a durable
   personal record the user holds, not a rented dashboard.
3. Logging is instant; reviewing is at-a-glance. Primary actions reachable by
   thumb; the month's shape readable in one viewport.
4. One brand, phone-first. A centered mobile-width shell that reads identically
   to the native app.

## Accessibility & Inclusion

Tap targets ≥44px, AA contrast in both light and dark, aria-labels on icon-only
controls, visible focus. Charts carry a text/number fallback.
