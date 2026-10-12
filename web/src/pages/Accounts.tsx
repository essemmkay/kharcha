import { Link } from "react-router-dom";
import { useLocalData } from "@/lib/use-data";
import { accountsWithBalances } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { Guilloche, Seal, monogram, accountColor } from "@/lib/engraving";

const TYPE_LABEL: Record<string, string> = { BANK: "Bank", CASH: "Cash", ASSET: "Asset" };

export default function Accounts() {
  const { ready, accounts, transactions, baseCurrency } = useLocalData();
  if (!ready) return <div className="center muted">Loading…</div>;

  const accts = accountsWithBalances(accounts, transactions).filter((a) => !a.archived);
  const sumOf = (type: string) =>
    accts.filter((a) => a.type === type).reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <div className="appbar">
        <div className="title">Accounts</div>
        <div className="kicker">{accts.length} open</div>
      </div>

      <div className="counters">
        <div className="c"><div className="k">Bank</div><div className="v tnum">{formatMoney(sumOf("BANK"), baseCurrency)}</div></div>
        <div className="c"><div className="k">Cash</div><div className="v tnum">{formatMoney(sumOf("CASH"), baseCurrency)}</div></div>
        <div className="c"><div className="k">Assets</div><div className="v tnum">{formatMoney(sumOf("ASSET"), baseCurrency)}</div></div>
      </div>

      <div className="shead"><span className="t">Your certificates</span><span className="ln" /></div>

      {accts.length === 0 ? (
        <div className="list-empty">No accounts yet. Open your bank, cash, or an asset to start tracking.</div>
      ) : (
        accts.map((a) => (
          <Link to={`/accounts/${a.id}`} className="cert" key={a.id}>
            <Guilloche w={420} h={120} stroke="rgba(14,59,43,.35)" sw={0.5} layers={4} f={6} R={120} />
            <div className="top">
              <span className="logo" style={{ background: accountColor(a.id) }}>{monogram(a.name)}</span>
              <div>
                <div className="nm">{a.name}</div>
                <div className="ty">{TYPE_LABEL[a.type] ?? a.type} · {a.currency}</div>
              </div>
              <Seal state="OPEN" className="seal small" />
            </div>
            <div className="bal tnum">{formatMoney(a.balance, a.currency)}</div>
          </Link>
        ))
      )}

      <Link to="/accounts/new" className="btn ghost" style={{ marginTop: 6 }}>＋ Open an account</Link>
    </>
  );
}
