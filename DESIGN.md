# DESIGN.md — Kharcha

## 1. Design principles

Mobile-first, thumb-friendly, minimal, fast, data-dense but readable. Primary actions sit in the bottom third of the screen. Every screen works at 375px first, then scales up. No decorative chrome that costs taps.

## 2. Layout system

- Bottom tab navigation on mobile: Dashboard, Transactions, Add (+, center, raised), Reports, Settings.
- Top bar: app title or screen name, a month selector, and an account filter. Both persist across Dashboard, Transactions, and Reports.
- On tablet/desktop, the bottom nav becomes a left sidebar; content widens to a max of about 960px and centers.
- Primary editing happens in bottom sheets on mobile and in a centered dialog on desktop.

## 3. Component inventory

Buttons (primary, secondary, ghost, destructive), inputs (text, number, select, date, segmented control, tag input), cards (account card, stat card), list items (transaction row, category row), bottom sheet / dialog, toast, confirmation dialog, empty state, loading skeleton, chart cards, month selector, filter chips, FAB for Add.

## 4. Color system (light and dark)

Semantic tokens as CSS variables (HSL), consumed by Tailwind. Income green, expense red, transfer neutral.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 10%;
  --card: 0 0% 100%;
  --muted: 240 5% 96%;
  --muted-foreground: 240 4% 46%;
  --border: 240 6% 90%;
  --primary: 221 83% 53%;        /* blue, app accent */
  --primary-foreground: 0 0% 100%;
  --income: 142 71% 40%;         /* green */
  --expense: 0 72% 51%;          /* red */
  --transfer: 240 4% 46%;        /* neutral gray */
  --ring: 221 83% 53%;
  --radius: 0.75rem;
}
:root[data-theme="dark"], :root.dark {
  --background: 240 10% 8%;
  --foreground: 0 0% 98%;
  --card: 240 9% 12%;
  --muted: 240 6% 18%;
  --muted-foreground: 240 5% 65%;
  --border: 240 6% 22%;
  --primary: 217 91% 60%;
  --primary-foreground: 240 10% 8%;
  --income: 142 69% 48%;
  --expense: 0 72% 60%;
  --transfer: 240 5% 65%;
  --ring: 217 91% 60%;
}
```

## 5. Typography scale

System font stack (fast, no web font cost). Scale: xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24, 3xl 30. Numbers use `tabular-nums` so columns align. Amounts are the heaviest weight on each row.

## 6. Spacing scale (4px base)

1=4, 2=8, 3=12, 4=16, 6=24, 8=32. Screen gutter 16px. Card padding 16px. Row height min 56px for comfortable taps.

## 7. Iconography

Lucide via `lucide-react`. Common: Wallet, Landmark (bank), Coins (cash), Gem (asset), ArrowUpRight (income), ArrowDownRight (expense), ArrowLeftRight (transfer), Plus, Filter, Calendar, FileDown, Settings, Trash2, Pencil.

## 8. Chart design guidelines

- Donut: expense breakdown by category for the selected month. Center label shows total expense.
- Bar: income vs expense per month, last 6 to 12 months, two series (income green, expense red).
- Line: net-worth trend over time, single series, filled area optional.
- Category palette, max 8 distinct hues, cycle after 8: blue 221, green 142, amber 38, red 0, violet 262, teal 173, pink 330, orange 24 (all HSL hues). Keep contrast AA against card background.

## 9. Interaction patterns

- Pull-to-refresh on list screens (Dashboard, Transactions).
- Swipe a transaction row left to reveal Edit and Delete.
- Bottom sheets for quick add/edit on mobile; full pages for Reports and Settings.
- Confirmation dialog for every delete and for archiving an account with history.
- Optimistic UI on add/edit where safe, with toast rollback on error.

## 10. Accessibility

- Minimum tap target 44x44px.
- Contrast AA for text and semantic colors in both themes.
- Every icon-only control has an aria-label. Form fields have associated labels and inline error text tied via `aria-describedby`.
- Focus-visible rings using `--ring`. Charts include an accessible data table fallback or summary text.

## 11. Wireframes (ASCII)

Dashboard
```
+------------------------------------------+
|  Kharcha        [ Oct 2026 v ] [ All v ] |
+------------------------------------------+
|  Net worth                               |
|  $ 12,480.50            ^ +3.2% this mo  |
+------------------------------------------+
|  Expenses by category        (donut)     |
|      (  $2,140  )     Food  32%          |
|                       Rent  28%          |
|                       ...                |
+------------------------------------------+
|  Income vs Expense     (bar, 6 mo)       |
|   | | | | | |                            |
+------------------------------------------+
|  Top categories     Recent transactions  |
|  Food    $680       Groceries   -$42.10  |
|  Rent    $600       Salary     +$3,000   |
+------------------------------------------+
| [Dash] [Txns]  ( + )  [Reports] [More]   |
+------------------------------------------+
```

Add Transaction
```
+------------------------------------------+
|  <  Add transaction                      |
+------------------------------------------+
|  [ Income | Expense | Transfer ]         |
+------------------------------------------+
|           $  0.00                        |
|        (large amount field)              |
+------------------------------------------+
|  Account      [ Cash           v ]       |
|  Category     [ Food           v ]       |
|  Date         [ 10/04/2026        ]      |
|  Note         [ ................. ]       |
|  Tags         [ + add tag        ]       |
+------------------------------------------+
|            [    Save    ]                |
+------------------------------------------+
```
(For Transfer, Category is replaced by "To account".)

Reports
```
+------------------------------------------+
|  Reports        [ Month | Custom range ] |
+------------------------------------------+
|  10/01/2026  to  10/31/2026   [ edit ]   |
|  Filters: [ Account v ] [ Category v ]   |
+------------------------------------------+
|  Total expense  $2,140    Income $3,000  |
+------------------------------------------+
|  By category (donut)   By account (list) |
+------------------------------------------+
|  Itemized                                |
|  10/02  Groceries   Cash     -$42.10     |
|  10/03  Salary      Bank   +$3,000.00    |
+------------------------------------------+
|            [  Export PDF  ]              |
+------------------------------------------+
```

## 12. Empty states copy

- No accounts: "No accounts yet. Add your bank, cash, or an asset to start tracking."
- No transactions: "Nothing here yet. Tap + to add your first income or expense."
- No results after filter: "No transactions match these filters."
- No data for charts: "Add a few transactions to see your trends."

## 13. Summary and checklist

The design is a mobile-first app shell with bottom nav, a persistent month and account filter, semantic income/expense/transfer colors, and bottom-sheet editing.

Design checklist:
- [ ] Bottom nav + top filter bar
- [ ] Light and dark tokens wired to Tailwind
- [ ] 44px tap targets, AA contrast, aria labels
- [ ] Three chart types with the 8-hue palette
- [ ] Bottom sheets for add/edit, confirm on delete
- [ ] Empty and loading states for every list
- [ ] Verified at 375px
