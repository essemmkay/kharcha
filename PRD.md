# PRD.md — Kharcha

## 1. Problem statement

I tracked income and expenses with "Wallet by Budget Bakers" and "Hysab Kytab". Wallet's free tier blocked adding new accounts. Hysab Kytab stopped syncing to its server, so switching phones risked losing all my history. I want a self-owned, mobile-first web app where I control the data, it persists server-side, and it costs nothing to host.

## 2. Target user

A single user (me): mobile-first, privacy-conscious, tax-aware. Comfortable installing a web app to the phone home screen. Wants to migrate years of history and hand a clean PDF to an accountant.

## 3. Goals and non-goals (v1)

Goals:
- Record accounts, income, expenses, and transfers on a phone in a few taps.
- See net worth and monthly spend at a glance, with charts.
- Filter and review transactions by date, account, category, and type.
- Export a PDF expense report for any date range.
- Own the data; it lives in my own Postgres and survives a phone switch.
- Zero hosting cost.
- **Offline-first**: the whole app works with no connection. The device owns the full dataset locally; every read renders instantly from the local store and every write (add/edit/delete of accounts, categories, transactions) applies immediately and syncs in the background. A visible count of unsynced changes plus a manual "Sync now" is shown, and server-rejected changes can be discarded. Sync is incremental delta (push the local queue, pull only rows changed since last sync, including deletions). See CLAUDE.md §12 / ARCHITECTURE.md §6.

Non-goals (v1): bank sync, multi-currency FX conversion, budgets, recurring transactions, shared accounts, native mobile app, receipt OCR, attachments. Multi-device concurrent editing is supported only under last-write-wins (single user assumed); profile edits (name/base currency) require a connection.

## 4. User stories

Auth
- As a user, I want to sign up with email and password so that only I can see my data.
- As a user, I want my session to persist across devices and days so that I do not log in constantly.
- As a user, I want to log out so that I can secure the app on a shared device.

Accounts
- As a user, I want to create bank, cash, and asset accounts so that I can track where my money sits.
- As a user, I want each account to have a name, type, currency, opening balance, and note so that it reflects reality.
- As a user, I want the current balance computed from transactions so that I never update it by hand.
- As a user, I want to edit, archive, and delete accounts so that stale accounts do not clutter the view.
- As a user, I want total net worth on the dashboard so that I see my overall position.

Transactions
- As a user, I want to add income or an expense with amount, date, account, category, optional subcategory, note, and tags so that each entry is complete.
- As a user, I want to record a transfer between two accounts so that moving money does not change net worth.
- As a user, I want to edit and delete transactions so that I can fix mistakes.
- As a user, I want to filter by date range, account, category, and type so that I can find anything.

Categories
- As a user, I want sensible default categories so that I can start immediately.
- As a user, I want to add, edit, and delete categories so that they fit my life.
- As a user, I want income and expense categories kept separate so that reports stay clean.

Dashboard and reports
- As a user, I want a monthly view by default with a month switcher so that I review one month at a time.
- As a user, I want an expense-by-category donut, an income-vs-expense bar across recent months, and a net-worth line so that trends are visible.
- As a user, I want top categories and recent transactions lists so that I see detail without digging.
- As a user, I want to filter the dashboard by account so that I can isolate one account.

PDF export
- As a user, I want a PDF expense report for a date range so that I can give it to my accountant.
- As a user, I want it to include my name, the date range, per-category totals, per-account totals, an itemized list, and a grand total so that it is audit-ready.
- As a user, I want the PDF to download or share on my phone so that I can send it from anywhere.

## 5. Feature specs and acceptance criteria

5.1 Auth
- Email + password signup and login via Supabase Auth. Logout clears the session.
- Acceptance: unauthenticated access to any `(app)` route redirects to login. After login the session persists across a browser restart and on another device.

5.2 Accounts
- Fields: name (required), type (BANK | CASH | ASSET), currency (default base), openingBalance (default 0), note (optional), archived flag.
- Current balance = openingBalance + income into account - expense from account - transfers out + transfers in.
- Acceptance: creating an account shows it on the accounts list and in net worth. Archiving hides it from pickers but keeps its history. Delete is blocked or cascades with a confirm if the account has transactions (confirm dialog, explicit).

5.3 Transactions
- Types: INCOME, EXPENSE, TRANSFER. Fields: amount (> 0), date, account, category (required for income/expense, none for transfer), toAccount (required for transfer, must differ from account), note, tags.
- Transfers create one record linking two accounts and do not change net worth.
- Acceptance: a saved transaction updates the source and destination balances and the dashboard for the correct month. Validation rejects amount <= 0 and a transfer to the same account.

5.4 Categories
- Seeded expense categories: Food, Rent, Transport, Utilities, Health, Shopping, Entertainment, Education, Groceries, Dining, Other. Seeded income categories: Salary, Freelance, Interest, Gift, Refund, Other.
- Optional one level of subcategory (parent/child).
- Acceptance: editing a category renames it everywhere; deleting a used category requires reassignment or a confirm that sets affected transactions to "Other".

5.5 Dashboard and reports
- Default to the current month; a top-bar month selector switches months; a top-bar account filter scopes all widgets.
- Charts: donut (expense by category, current month), bar (income vs expense, last 6 to 12 months), line (net-worth trend over time).
- Lists: top categories this month, recent transactions.
- Acceptance: switching month or account updates every widget via URL search params with no full reload jank.

5.6 PDF export
- Inputs: date range (presets plus custom). Output includes user name, range, per-category totals, per-account totals, itemized transactions, grand total.
- Generated client-side; downloads, and offers the Web Share API on supporting mobile browsers.
- Acceptance: the PDF opens on a phone, totals reconcile with on-screen reports, and no server time is used to build it.

## 6. Screen-by-screen breakdown

1. Login / Signup: email, password, submit, switch between login and signup, inline validation.
2. Dashboard: net-worth header, month + account filter, three charts, top categories, recent transactions.
3. Accounts: list with per-account balance and type; account detail shows that account's transactions and running balance; create/edit via bottom sheet.
4. Add/Edit Transaction: segmented control (Income | Expense | Transfer), amount keypad, account picker, category picker (hidden for transfer, replaced by destination account), date, note, tags, save.
5. Categories: two tabs (Income, Expense), list with add/edit/delete, subcategory nesting.
6. Reports: month view and custom range; charts and totals; filters for account, category, type.
7. PDF export: pick range, preview summary, generate, download or share.
8. Settings: profile name, base currency, theme toggle, logout, data export (JSON and trigger PDF).

## 7. Success metrics (qualitative)

- I can migrate all my Wallet and Hysab Kytab history within one weekend.
- The PDF is clean enough that my accountant accepts it without edits.
- Adding a transaction takes under 10 seconds on a phone.
- Data is intact after I switch phones and log in on the new one.

## 8. Out of scope / future roadmap

Bank sync, multi-currency FX, budgets and goals, recurring transactions, shared or multi-user accounts, native mobile app, receipt OCR, and attachments.

## 9. Summary and checklist

Kharcha is a single-user, mobile-first, zero-cost finance tracker with server-side data, charts, and a tax PDF. v1 ships auth, accounts, transactions (including transfers), categories, dashboard/reports, and PDF export.

Acceptance checklist for v1:
- [ ] Signup, login, logout, protected routes
- [ ] Accounts CRUD with computed balances and net worth
- [ ] Categories seeded plus CRUD, income and expense separated
- [ ] Transactions CRUD including transfers, with filters
- [ ] Dashboard with donut, bar, line charts and lists
- [ ] Reports with month and custom range plus filters
- [ ] PDF export with totals and itemized list, mobile download/share
- [ ] PWA installable
- [ ] Verified at 375px width
