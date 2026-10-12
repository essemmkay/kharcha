import { useState } from "react";
import { Link } from "react-router-dom";
import { addMonths, format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import {
  netWorth,
  monthlySummary,
  accountsWithBalances,
  listLocalTransactions,
} from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { Guilloche, Seal, Icon, typeIcon, monogram, accountColor } from "@/lib/engraving";

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
      <div className="appbar">
        <div>
          <div className="kicker">{format(new Date(), "EEEE · d MMMM yyyy")}</div>
          <div className="lede">Your register</div>
        </div>
      </div>

      {/* The banknote */}
      <div className="note">
        <Guilloche w={360} h={210} stroke="rgba(241,234,214,.5)" sw={0.55} layers={5} f={7} R={150} />
        <div className="frameline" />
        <div className="masthead">
          <div>
            <div className="m-name">Kharcha</div>
            <div className="m-sub">Register of Account</div>
          </div>
          <Seal state="ISSUED" />
        </div>
        <div className="denomlabel">Net worth</div>
        <div className="value tnum">{money(total)}</div>
        <div className="meta">
          <div className={`delta ${up ? "up" : "down"}`}>
            {up ? "▲" : "▼"} <b className="tnum">{money(Math.abs(summary.net))}</b> · {format(month, "MMMM")} net
          </div>
          <div className="issue">
            Issued
            <br />
            {format(new Date(), "d MMM yyyy")}
          </div>
        </div>
        <div className="microprint">
          your money your data · kharcha · your money your data · kharcha · your money your data · kharcha
        </div>
      </div>

      {accts.length > 0 && (
        <div className="strip">
          {accts.map((a) => (
            <Link to={`/accounts/${a.id}`} className="acct" key={a.id}>
              <Guilloche w={152} h={90} stroke="rgba(14,59,43,.45)" sw={0.5} layers={4} f={6} R={76} />
              <div className="top">
                <span className="mono" style={{ background: accountColor(a.id) }}>{monogram(a.name)}</span>
                <span className="nm">{a.name}</span>
              </div>
              <div className="bal tnum">{formatMoney(a.balance, a.currency)}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="month">
        <button aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}>
          <Icon name="chevL" />
        </button>
        <span className="m">{format(month, "MMMM yyyy")}</span>
        <button aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <Icon name="chevR" />
        </button>
      </div>

      <div className="counters">
        <div className="c"><div className="k">In</div><div className="v in tnum">{money(summary.income)}</div></div>
        <div className="c"><div className="k">Out</div><div className="v out tnum">{money(summary.expense)}</div></div>
        <div className="c"><div className="k">Net</div><div className="v tnum">{money(summary.net)}</div></div>
      </div>

      <div className="shead">
        <span className="t">Spending by book</span>
        <span className="ln" />
        <Link to="/reports">All</Link>
      </div>
      <div className="ledger">
        {summary.byCategory.length === 0 ? (
          <div className="cat"><span className="muted" style={{ fontStyle: "italic" }}>No expenses this month.</span></div>
        ) : (
          summary.byCategory.map((c) => {
            const pct = summary.expense > 0 ? (c.total / summary.expense) * 100 : 0;
            const color = c.color ?? "var(--sepia)";
            return (
              <div className="cat" key={c.id}>
                <div className="top">
                  <span className="sw" style={{ background: color }} />
                  <span className="nm">{c.name}</span>
                  <span className="pct">{Math.round(pct)}%</span>
                  <span className="amt tnum">{money(c.total)}</span>
                </div>
                <div className="track"><div className="fill" style={{ width: `${pct}%`, color }} /></div>
              </div>
            );
          })
        )}
      </div>

      <div className="shead">
        <span className="t">Recent entries</span>
        <span className="ln" />
        <Link to="/transactions">Ledger</Link>
      </div>
      <div className="ledger">
        {recent.length === 0 ? (
          <div className="lrow" style={{ cursor: "default" }}><span className="muted" style={{ fontStyle: "italic" }}>No entries yet.</span></div>
        ) : (
          recent.map((r) => {
            const sign = r.type === "INCOME" ? "+" : r.type === "EXPENSE" ? "−" : "";
            const cls = r.type === "INCOME" ? "in" : r.type === "EXPENSE" ? "out" : "tr";
            const title = r.type === "TRANSFER" ? `${r.account} → ${r.toAccount ?? "?"}` : r.category ?? r.note ?? "Uncategorized";
            const color = r.type !== "TRANSFER" ? r.categoryColor ?? "var(--sepia)" : "var(--transfer)";
            return (
              <Link to={`/transactions/${r.id}`} className="lrow" key={r.id}>
                <span className="ic" style={{ color }}><Icon name={typeIcon(r.type)} /></span>
                <div className="body">
                  <div className="nm">{title}</div>
                  <div className="sub">{r.account} · {format(new Date(r.date), "d MMM")}</div>
                </div>
                <span className={`amt tnum ${cls}`}>{sign}{formatMoney(r.amount, r.currency)}</span>
              </Link>
            );
          })
        )}
      </div>

      <Link to="/transactions/new" className="fab no-print" aria-label="New entry"><Icon name="plus" /></Link>
    </>
  );
}
