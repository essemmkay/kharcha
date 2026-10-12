import { useMemo, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { report } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { Icon } from "@/lib/engraving";

const FALLBACK = ["#9c2b24", "#13553b", "#27456b", "#9a7322", "#5a2f4a", "#1f5a56", "#6b5330", "#4f5a28"];
const iso = (d: Date) => format(d, "yyyy-MM-dd");

export default function Reports() {
  const { ready, accounts, transactions, categories, baseCurrency } = useLocalData();
  const [from, setFrom] = useState(iso(startOfMonth(new Date())));
  const [to, setTo] = useState(iso(endOfMonth(new Date())));
  const money = (n: number) => formatMoney(n, baseCurrency);

  const data = useMemo(() => {
    if (!ready) return null;
    const f = new Date(`${from}T00:00:00`);
    const t = new Date(`${to}T23:59:59`);
    return report(transactions, accounts, categories, f, t);
  }, [ready, transactions, accounts, categories, from, to]);

  if (!ready || !data) return <div className="center muted">Loading…</div>;

  const { totals } = data;
  const expenseCats = data.byCategory.filter((c) => c.expense > 0);
  const totalExpense = totals.expense;

  // donut segments
  const R = 54;
  const circ = 2 * Math.PI * R;
  let acc = 0;
  const segments = expenseCats.map((c, i) => {
    const frac = totalExpense > 0 ? c.expense / totalExpense : 0;
    const len = circ * frac;
    const dash = `${len.toFixed(1)} ${(circ - len).toFixed(1)}`;
    const offset = -circ * (acc / 1);
    acc += frac;
    return { color: c.color ?? FALLBACK[i % FALLBACK.length], dash, offset, name: c.name, value: c.expense };
  });

  const maxAcctExpense = Math.max(1, ...data.byAccount.map((a) => a.expense));

  return (
    <>
      <div className="print-area">
        <div className="appbar">
          <div className="title">Statement</div>
          <div className="kicker">
            {format(new Date(`${from}T00:00:00`), "d MMM")} – {format(new Date(`${to}T00:00:00`), "d MMM yyyy")}
          </div>
        </div>

        <div className="daterange no-print">
          <label className="d">
            <div className="k">From</div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="d">
            <div className="k">To</div>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        <div className="counters">
          <div className="c"><div className="k">Income</div><div className="v in tnum">{money(totals.income)}</div></div>
          <div className="c"><div className="k">Expense</div><div className="v out tnum">{money(totals.expense)}</div></div>
          <div className="c"><div className="k">Net</div><div className="v tnum">{money(totals.net)}</div></div>
        </div>

        <div className="shead"><span className="t">Where it went</span><span className="ln" /></div>
        {expenseCats.length === 0 ? (
          <div className="list-empty">No expenses in this range.</div>
        ) : (
          <div className="donutwrap">
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ flex: "none" }} aria-hidden="true">
              {segments.map((s, i) => (
                <circle
                  key={i}
                  cx="70" cy="70" r={R}
                  fill="none" stroke={s.color} strokeWidth="22"
                  strokeDasharray={s.dash} strokeDashoffset={s.offset}
                  transform="rotate(-90 70 70)"
                />
              ))}
              <text x="70" y="64" textAnchor="middle" fontFamily="Archivo" fontSize="8" letterSpacing="2" fill="var(--ink-soft)">EXPENSE</text>
              <text x="70" y="83" textAnchor="middle" fontFamily="Libre Caslon Display" fontSize="17" fill="var(--ink)">{money(totalExpense)}</text>
            </svg>
            <div className="legend">
              {expenseCats.slice(0, 6).map((c, i) => (
                <div className="lg" key={c.name}>
                  <span className="sw" style={{ background: c.color ?? FALLBACK[i % FALLBACK.length] }} />
                  <span className="nm">{c.name}</span>
                  <b className="tnum">{money(c.expense)}</b>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.byAccount.length > 0 && (
          <>
            <div className="shead"><span className="t">By account</span><span className="ln" /></div>
            <div style={{ padding: "2px 2px" }}>
              {data.byAccount.map((a) => (
                <div className="bar-acct" key={a.name}>
                  <span className="nm">{a.name}</span>
                  <span className="tk"><span className="fl" style={{ width: `${(a.expense / maxAcctExpense) * 100}%` }} /></span>
                  <span className="amt tnum">{money(a.expense)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {data.items.length > 0 && (
          <>
            <div className="shead"><span className="t">Itemized</span><span className="ln" /></div>
            <div className="ledger">
              {data.items.map((it, i) => {
                const sign = it.type === "INCOME" ? "+" : it.type === "EXPENSE" ? "−" : "";
                const cls = it.type === "INCOME" ? "in" : it.type === "EXPENSE" ? "out" : "tr";
                return (
                  <div className="lrow" key={i} style={{ cursor: "default" }}>
                    <div className="body">
                      <div className="nm" style={{ fontSize: 14 }}>{it.category}</div>
                      <div className="sub">{format(it.date, "d MMM")} · {it.account}{it.note ? ` · ${it.note}` : ""}</div>
                    </div>
                    <span className={`amt tnum ${cls}`}>{sign}{money(it.amount)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <button className="btn no-print" style={{ marginTop: 14 }} onClick={() => window.print()}>
        <Icon name="download" /> Issue statement · PDF
      </button>
    </>
  );
}
