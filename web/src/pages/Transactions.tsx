import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { listLocalTransactions } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { Icon, typeIcon } from "@/lib/engraving";
import type { TxRow } from "@/lib/tx-row";

type Filter = "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";
const TABS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "INCOME", label: "In" },
  { key: "EXPENSE", label: "Out" },
  { key: "TRANSFER", label: "Transfer" },
];

type DayGroup = { key: string; label: string; rows: TxRow[]; net: number; flow: boolean };

// Group the (already date-desc) rows by calendar day, with each day's net flow
// (income − expense; transfers don't move net worth, so they're excluded).
function groupByDay(rows: TxRow[]): DayGroup[] {
  const groups: DayGroup[] = [];
  const index = new Map<string, DayGroup>();
  for (const r of rows) {
    const d = new Date(r.date);
    const key = format(d, "yyyy-MM-dd");
    let g = index.get(key);
    if (!g) {
      g = { key, label: format(d, "EEE · d MMMM"), rows: [], net: 0, flow: false };
      index.set(key, g);
      groups.push(g);
    }
    g.rows.push(r);
    if (r.type === "INCOME") { g.net += r.amount; g.flow = true; }
    else if (r.type === "EXPENSE") { g.net -= r.amount; g.flow = true; }
  }
  return groups;
}

export default function Transactions() {
  const { ready, accounts, transactions, categories, baseCurrency } = useLocalData();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    if (!ready) return [];
    const base = listLocalTransactions(
      transactions,
      accounts,
      categories,
      filter === "ALL" ? {} : { type: filter },
    );
    const needle = q.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((t) =>
      [t.category, t.account, t.toAccount, t.note, ...t.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [ready, transactions, accounts, categories, filter, q]);

  const groups = useMemo(() => groupByDay(rows), [rows]);

  if (!ready) return <div className="center muted">Loading…</div>;

  return (
    <>
      <div className="appbar">
        <div className="title">Entries</div>
      </div>

      <div className="seg">
        {TABS.map((t) => (
          <button key={t.key} className={filter === t.key ? "on" : ""} onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <label className="searchbar">
        <Icon name="search" />
        <input
          type="search"
          placeholder="Search entry, book, or note…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {groups.length === 0 ? (
        <div className="list-empty">
          {q || filter !== "ALL" ? "No matching entries." : "Nothing here yet. Tap + to add your first entry."}
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key}>
            <div className="dayhead">
              <span className="d">{g.label}</span>
              {g.flow && (
                <span className={`t ${g.net >= 0 ? "in" : "out"}`}>
                  {g.net >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(g.net), baseCurrency)}
                </span>
              )}
            </div>
            <div className="ledger">
              {g.rows.map((t) => (
                <Row key={t.id} t={t} />
              ))}
            </div>
          </div>
        ))
      )}

      <Link to="/transactions/new" className="fab no-print" aria-label="New entry"><Icon name="plus" /></Link>
    </>
  );
}

function Row({ t }: { t: TxRow }) {
  const title = t.type === "TRANSFER" ? `${t.account} → ${t.toAccount}` : t.category ?? "Uncategorized";
  const sub = [t.account, t.note].filter(Boolean).join(" · ");
  const sign = t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "−" : "";
  const cls = t.type === "INCOME" ? "in" : t.type === "EXPENSE" ? "out" : "tr";
  const color = t.type !== "TRANSFER" ? t.categoryColor ?? "var(--sepia)" : "var(--transfer)";

  return (
    <Link to={`/transactions/${t.id}`} className="lrow">
      <span className="ic" style={{ color }}><Icon name={typeIcon(t.type)} /></span>
      <div className="body">
        <div className="nm">{title}</div>
        <div className="sub">{sub}{sub ? " · " : ""}{format(new Date(t.date), "d MMM")}</div>
      </div>
      <span className={`amt tnum ${cls}`}>{sign}{formatMoney(t.amount, t.currency)}</span>
    </Link>
  );
}
