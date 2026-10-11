import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { listLocalTransactions } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import type { TxRow } from "@/lib/tx-row";

export default function Transactions() {
  const { ready, accounts, transactions, categories } = useLocalData();
  if (!ready) return <div className="center muted">Loading…</div>;

  const rows = listLocalTransactions(transactions, accounts, categories);

  return (
    <>
      <div className="section-title">Transactions</div>
      <div className="card">
        {rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No transactions yet.</p>
        ) : (
          rows.map((t) => <Row key={t.id} t={t} />)
        )}
      </div>
      <Link to="/transactions/new" className="btn fab">+ Add</Link>
    </>
  );
}

function Row({ t }: { t: TxRow }) {
  const title =
    t.type === "TRANSFER" ? `${t.account} → ${t.toAccount}` : t.category ?? "Uncategorized";
  const sub = [t.account, t.note].filter(Boolean).join(" · ");
  const sign = t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "−" : "";
  const cls = t.type === "INCOME" ? "income" : t.type === "EXPENSE" ? "expense" : "";

  return (
    <div className="row">
      {t.type !== "TRANSFER" ? (
        <span className="dot" style={{ background: t.categoryColor ?? "var(--faint)" }} />
      ) : (
        <span className="dot" style={{ background: "var(--faint)" }} />
      )}
      <div className="grow">
        <div className="name">{title}</div>
        <div className="sub">
          {sub}
          {sub ? " · " : ""}
          {format(new Date(t.date), "MMM d")}
        </div>
      </div>
      <span className={`amt tnum ${cls}`}>
        {sign}
        {formatMoney(t.amount, t.currency)}
      </span>
    </div>
  );
}
