# DESIGN.md — Kharcha (The Engraving)

> Durable visual decisions for the Kharcha **web** client (`web/`). Derived from
> the shipped build (`web/src/styles.css`, `web/src/lib/engraving.tsx`). Replaces
> the earlier "ink card + indigo" system. The native (Expo) client keeps its own
> tokens; this file governs the web app.

## 1. Direction

**The Engraving.** Your money rendered with the gravitas and security craft of
currency itself — the balance IS a banknote you own. Refuses the fintech default
(floating ink "black card" + neon accent + soft donut) and the bare-spreadsheet
opposite. Trust is shown through engraving craft, not chrome. Light-primary (a
record is printed); deep-ink night rendition. One phone-width shell, centered on
a studio ground, so web and native read as one brand.

Mode: **Operate** (a ledger the owner reads and writes daily). Numbers are the
hero: tabular, right-aligned, ruled.

## 2. Color system (CSS custom properties, `:root`)

Committed bottle-green ink owns the note, buttons, nav, and fills — not a neutral
ground with an accent. Warm banknote-paper data field. Semantic money colors.

| Token | Light | Dark (`prefers-color-scheme: dark`) | Role |
|---|---|---|---|
| `--paper` | `#efe8d8` | `#0c1512` | app ground |
| `--paper-2` | `#e6ddc8` | `#0f1b16` | cards, inputs |
| `--paper-edge` | `#d9cfb6` | `#16271f` | tracks, insets |
| `--green` / `--green-2` | `#0e3b2b` / `#0a2c20` | same (the note stays deep green both themes) | banknote ink |
| `--ink` | `#23201a` | `#edefe4` | body text |
| `--ink-soft` | `#4a4336` | `#9fb0a4` | secondary text (tinted, never flat gray) |
| `--sepia` | `#6b5330` | `#c3a86a` | section labels, transfer |
| `--gold` / `--gold-soft` | `#b58a3c` / `#cdae6a` | same | seal, foil hairline, active-nav bar |
| `--accent` / `--on-accent` | `#0e3b2b` / `#f1ead6` | `#3f9d73` / `#06140e` | interactive (buttons, nav-active, fills) |
| `--income` | `#13553b` | `#5cc69a` | money in |
| `--expense` | `#9c2b24` | `#e0756a` | money out / void |
| `--transfer` | `#6b5330` | `#c3a86a` | transfers |
| `--rule` / `--rule-soft` | `rgba(35,32,26,.26)` / `.13` | `rgba(230,224,200,.2)` / `.1` | hairline rules |
| `--studio` | `#1b2320` | `#0a110e` | ground behind the centered shell |

Category / chart palette (intaglio inks, AA on paper, max 8, cycle after 8):
`#9c2b24 #13553b #27456b #9a7322 #5a2f4a #1f5a56 #6b5330 #4f5a28`.

## 3. Typography

Self-hosted via Google Fonts (`index.html`). Numerals are the hero.

- `--display` **Libre Caslon Display** — engraved roman gravitas: masthead, hero
  values (net worth, denomination figures), screen titles.
- `--serif` **Libre Caslon Text** (+ italic) — body, row names, helper text.
- `--cap` / `--fig` **Archivo** — tracked uppercase for apparatus (labels, column
  heads, nav, kickers), and tabular lining figures for ledger/table amounts.
- Caslon and Archivo are tied to the engraving/official-document tradition, not
  defaults. Amounts use `.tnum` (`font-variant-numeric: tabular-nums lining-nums`).

## 4. Shell & layout

- `.app`: centered column, `max-width: 460px`, paper ground + faint engraved
  line texture, lifted off the `--studio` ground with a soft shadow. Flex column:
  `.topstrip` → `.content` → sticky `.nav`.
- `.topstrip`: Kharcha wordmark (left), sync badge + sign-out (right). Global.
- `.appbar`: per-screen header (Caslon title + Archivo kicker/lede).
- `.nav`: 5 tabs (Dashboard, Entries, Accounts, Books, Report), drawn icons +
  tracked caps, gold hairline over the active tab.
- `.fab`: round, `--accent`, fixed bottom-right within the column (New entry).

## 5. Signature material (`web/src/lib/engraving.tsx`)

- **Guilloché** (`<Guilloche>`): real generated epitrochoid security line-work +
  concentric rings, drawn in SVG at render time. Behind the note, account cards,
  certificates, and the amount field. Never an image or gradient.
- **Seal** (`<Seal>`): gold medallion with a ring of micro-caps, a check, and a
  state word. Carries state: `ISSUED` (synced) on the note, `OPEN` on accounts.
- **Icons** (`<Icon>`): one stroke weight (1.6), `viewBox 24`, drawn — never
  emoji/unicode. `typeIcon()` maps INCOME/EXPENSE/TRANSFER → up/down/swap.
- **Account avatar**: drawn monogram medallion, color stable per account id
  (`accountColor`). (The native client's bank-favicon fetch is not used on web.)

## 6. Components

The banknote hero (`.note`): deep-green field, guilloché, double frameline,
masthead (`Kharcha` / `Register of Account`) + seal, denomination label, large
engraved value, delta + issue date, serial, microprint strip.

Ruled containers (`.counters`, `.ledger`, `.cert`, `.donutwrap`, `.daterange`)
on `--paper-2` with 1px `--rule`. Rows (`.lrow`) carry a type-colored icon tile,
Caslon name, Archivo caps sub, carbon figure. Category rows (`.cat`) use an
intaglio fine-line bar (`repeating-linear-gradient` fill) in the category color.
Segmented (`.seg`), fields (`.inp`, `.select`, `.searchbar`), amount counter
(`.amountbox`), buttons (`.btn`, `.btn.ghost`, `.btn.danger`).

Charts: the Statement donut and by-account bars are SVG drawn from `report()`
data in the intaglio palette (no chart library).

## 7. States & interaction

- Sync: the top-strip badge (Synced / N pending / Syncing… / Retry sync) and the
  note seal. Printed-mark vocabulary, not spinners.
- Delete: two-step confirm ("Tap again to void/delete"). Transactions are framed
  as "Void entry" (the register's cancel language; deletes are server-side soft
  tombstones per the sync protocol).
- Tap-to-edit rows; delete lives on the edit screen. Month switcher on the
  dashboard. Empty states in the product's plain voice.

## 8. Accessibility

Icon-only controls carry `aria-label`. Focus ring = 2px `--accent`. Tap targets
≥44px. Secondary text is tinted from the ground, never flat gray. AA contrast in
both themes. Themed selection color. Charts are backed by the adjacent numeric
legend/rows.

## 9. PDF / print

The Statement prints to PDF via the browser (`window.print()` — zero added
dependency). `@media print` hides the shell chrome (`.no-print`) and renders the
`.print-area` as a clean document with color retained.

## 10. Checklist

- [x] Committed bottle-green field (not neutral + accent); warm paper data ground
- [x] Light + dark via `prefers-color-scheme`; note stays deep green in both
- [x] Caslon + Archivo self-hosted; tabular lining figures for amounts
- [x] Generated guilloché + seal + drawn icon set (no emoji, no stock chrome)
- [x] 5-tab shell, per-screen headers, sync badge, FAB
- [x] Intaglio-palette SVG charts (donut, bars); print-to-PDF statement
- [x] AA contrast, 44px targets, aria labels, themed focus/selection
- [x] Verified: `tsc` + `vite build` clean; real Login render; shipped-CSS preview of all screens (light + dark)
