import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { formOptions } from "@/lib/local-queries";
import { saveTransaction, deleteTransaction } from "@/lib/sync/local-writes";
import { transactionTypes } from "@/lib/schemas";
import { Guilloche, Icon } from "@/lib/engraving";

type Type = (typeof transactionTypes)[number];

const TINT: Record<Type, string> = {
  INCOME: "rgba(19,85,59,.4)",
  EXPENSE: "rgba(156,43,36,.4)",
  TRANSFER: "rgba(107,83,48,.4)",
};
const LABEL: Record<Type, string> = { INCOME: "In", EXPENSE: "Out", TRANSFER: "Transfer" };

export default function TransactionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ready, accounts, categories, transactions, baseCurrency } = useLocalData();
  const existing = id ? transactions.find((t) => t.id === id) : undefined;
  const opts = formOptions(accounts, categories);

  const [type, setType] = useState<Type>(existing?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [date, setDate] = useState(
    existing ? format(new Date(existing.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
  );
  const [accountId, setAccountId] = useState(existing?.accountId ?? "");
  const [toAccountId, setToAccountId] = useState(existing?.toAccountId ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (id && ready && !existing) {
    return <div className="list-empty">This entry was not found. It may have been voided.</div>;
  }

  const catList = type === "INCOME" ? opts.categories.INCOME : opts.categories.EXPENSE;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const base = { ...(id ? { id } : {}), type, amount, date, accountId, note };
    const values = type === "TRANSFER" ? { ...base, toAccountId } : { ...base, categoryId };
    const res = await saveTransaction(values);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else navigate("/transactions");
  };

  const remove = async () => {
    if (!id) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    await deleteTransaction(id);
    navigate("/transactions");
  };

  return (
    <>
      <div className="appbar">
        <div>
          <div className="kicker">Counterfoil</div>
          <div className="title">{id ? "Edit entry" : "New entry"}</div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="seg" style={{ marginTop: 6 }}>
          {transactionTypes.map((t) => (
            <button type="button" key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>
              {LABEL[t]}
            </button>
          ))}
        </div>

        <div className="amountbox">
          <Guilloche w={360} h={130} stroke={TINT[type]} sw={0.5} layers={4} f={6} R={120} />
          <div className="k">Amount</div>
          <div className="row">
            <span className="cur">{baseCurrency}</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Amount"
            />
          </div>
        </div>

        {type === "TRANSFER" ? (
          <>
            <div className="field">
              <label htmlFor="account">From account</label>
              <div className="select">
                <select id="account" required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Select…</option>
                  {opts.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="to">To account</label>
              <div className="select">
                <select id="to" required value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                  <option value="">Select…</option>
                  {opts.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="category">Book (category)</label>
              <div className="select">
                <select id="category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select…</option>
                  {catList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="account">Account</label>
              <div className="select">
                <select id="account" required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Select…</option>
                  {opts.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" className="inp" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="note">Note (optional)</label>
          <input id="note" className="inp" value={note ?? ""} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="btnrow">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : id ? "Save" : "Enter"}</button>
        </div>

        {id && (
          <button type="button" className="btn danger" style={{ marginTop: 10 }} onClick={remove} disabled={busy}>
            <Icon name="trash" /> {confirmDel ? "Tap again to void this entry" : "Void entry"}
          </button>
        )}

        {!id && <p className="helper">Saved to your device at once, then stamped to the server.</p>}
      </form>
    </>
  );
}
