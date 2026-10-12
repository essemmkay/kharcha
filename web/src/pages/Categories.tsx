import { Link } from "react-router-dom";
import { useLocalData } from "@/lib/use-data";
import { Icon } from "@/lib/engraving";
import type { SyncCategory } from "@/lib/sync/types";

export default function Categories() {
  const { ready, categories } = useLocalData();
  if (!ready) return <div className="center muted">Loading…</div>;

  const live = categories
    .filter((c) => !c.deletedAt && !c.archived)
    .sort((a, b) => a.name.localeCompare(b.name));
  const income = live.filter((c) => c.kind === "INCOME");
  const expense = live.filter((c) => c.kind === "EXPENSE");

  return (
    <>
      <div className="appbar">
        <div className="title">Books</div>
        <div className="kicker">{live.length} categories</div>
      </div>

      <Group title="Income" rows={income} />
      <Group title="Expense" rows={expense} />

      <Link to="/categories/new" className="btn ghost" style={{ marginTop: 12 }}>＋ New book</Link>
    </>
  );
}

function Group({ title, rows }: { title: string; rows: SyncCategory[] }) {
  return (
    <>
      <div className="shead"><span className="t">{title}</span><span className="ln" /></div>
      {rows.length === 0 ? (
        <div className="list-empty" style={{ padding: "18px 10px" }}>No {title.toLowerCase()} books yet.</div>
      ) : (
        <div className="ledger">
          {rows.map((c) => (
            <Link to={`/categories/${c.id}`} className="lrow" key={c.id}>
              <span className="sw" style={{ width: 14, height: 14, borderRadius: 4, background: c.color ?? "var(--sepia)", border: "1px solid rgba(0,0,0,.2)", flex: "none" }} />
              <div className="body"><div className="nm" style={{ fontSize: 14 }}>{c.name}</div></div>
              <span className="chev"><Icon name="chevR" /></span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
