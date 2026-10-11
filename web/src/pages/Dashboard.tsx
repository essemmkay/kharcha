import { useState } from "react";
import { addMonths, format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import {
  netWorth,
  monthlySummary,
  accountsWithBalances,
  listLocalTransactions,
} from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";

export default function Dashboard() {
  const { ready, accounts, transactions, categories, baseCurrency } = useLocalData();
  const [month, setMonth] = useState(new Date());
  const money = (n: number) => formatMoney(n, baseCurrency);

  if (!ready) return <div className="center muted">Loading…</div>;

  const total = netWorth(accounts, transactions);
  const summary = monthlySummary(transactions, categories, month);
  const accts = accountsWithBalances(accounts, transactions).filter((a) => !a.archived);
  const recent = listLocalTransactions(transactions, accounts, categories, {}, 5);
  const up = summary.net >= 0;

  return (
    <>
      <div className="card hero">
        <div className="label">Net worth</div>
        <div className="value tnum">{money(total)}</div>
        <div className={`delta ${up ? "up" : "down"}`}>
          <span>{up ? "▲" : "▼"} {money(Math.abs(summary.net))}</span>
          <span className="sub2">{format(month, "MMM")} net</span>
        </div>
      </div>

      {accts.length > 0 && (
        <div className="acct-strip">
          {accts.map((a) => (
            <div className="acct-card" key={a.id}>
              <div className="nm">{a.name}</div>
              <div className="bal tnum">{formatMoney(a.balance, a.currency)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="month-nav">
        <button aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}>←</button>
        <strong>{format(month, "MMMM yyyy")}</strong>
        <button aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>→</button>
      </div>

      <div className="card">
        <div className="summary-grid">
          <div>
            <div className="k">Income</div>
            <div className="v tnum" style={{ color: "var(--income)" }}>{money(summary.income)}</div>
          </div>
          <div>
            <div className="k">Expense</div>
            <div className="v tnum" style={{ color: "var(--danger)" }}>{money(summary.expense)}</div>
          </div>
          <div>
            <div className="k">Net</div>
            <div className="v tnum">{money(summary.net)}</div>
          </div>
        </div>
      </div>

      <div className="section-title">Spending by category</div>
      <div className="card">
        {summary.byCategory.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No expenses this month.</p>
        ) : (
          summary.byCategory.map((c) => {
            const pct = summary.expense > 0 ? (c.total / summary.expense) * 100 : 0;
            const color = c.color ?? "var(--faint)";
            return (
              <div className="cat" key={c.id}>
                <div className="top">
                  <span className="dot" style={{ background: color }} />
                  <span className="name">{c.name}</span>
                  <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {Math.round(pct)}%
                  </span>
                  <span className="amt tnum">{money(c.total)}</span>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="section-title">Recent activity</div>
      <div className="card">
        {recent.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No transactions yet.</p>
        ) : (
          recent.map((r) => {
            const sign = r.type === "INCOME" ? "+" : r.type === "EXPENSE" ? "−" : "";
            const cls = r.type === "INCOME" ? "income" : r.type === "EXPENSE" ? "expense" : "";
            const title =
              r.type === "TRANSFER"
                ? `${r.account} → ${r.toAccount ?? "?"}`
                : r.category ?? r.note ?? "Uncategorized";
            return (
              <div className="row" key={r.id}>
                <span className="dot" style={{ background: r.categoryColor ?? "var(--faint)" }} />
                <div className="grow">
                  <div className="name">{title}</div>
                  <div className="sub">
                    {r.account} · {format(new Date(r.date), "MMM d")}
                  </div>
                </div>
                <span className={`amt tnum ${cls}`}>
                  {sign}
                  {money(r.amount)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
