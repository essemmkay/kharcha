import { useState } from "react";
import { addMonths, format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { netWorth, monthlySummary } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";

export default function Dashboard() {
  const { ready, accounts, transactions, categories, baseCurrency } = useLocalData();
  const [month, setMonth] = useState(new Date());
  const money = (n: number) => formatMoney(n, baseCurrency);

  if (!ready) return <div className="center muted">Loading…</div>;

  const total = netWorth(accounts, transactions);
  const summary = monthlySummary(transactions, categories, month);

  return (
    <>
      <div className="card hero">
        <div className="label">Net worth</div>
        <div className="value tnum">{money(total)}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 4px 8px" }}>
        <button className="btn ghost" onClick={() => setMonth((m) => addMonths(m, -1))}>←</button>
        <strong>{format(month, "MMMM yyyy")}</strong>
        <button className="btn ghost" onClick={() => setMonth((m) => addMonths(m, 1))}>→</button>
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

      <div className="section-title">Expenses by category</div>
      <div className="card">
        {summary.byCategory.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No expenses this month.</p>
        ) : (
          summary.byCategory.map((c) => (
            <div className="row" key={c.id}>
              <span className="dot" style={{ background: c.color ?? "var(--faint)" }} />
              <span className="grow name">{c.name}</span>
              <span className="amt tnum">{money(c.total)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
