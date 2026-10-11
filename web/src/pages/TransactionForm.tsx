import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { formOptions } from "@/lib/local-queries";
import { saveTransaction } from "@/lib/sync/local-writes";
import { transactionTypes } from "@/lib/schemas";

type Type = (typeof transactionTypes)[number];

export default function TransactionForm() {
  const navigate = useNavigate();
  const { accounts, categories } = useLocalData();
  const opts = formOptions(accounts, categories);

  const [type, setType] = useState<Type>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const catList = type === "INCOME" ? opts.categories.INCOME : opts.categories.EXPENSE;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const base = { type, amount, date, accountId, note };
    const values =
      type === "TRANSFER"
        ? { ...base, toAccountId }
        : { ...base, categoryId };
    const res = await saveTransaction(values);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else navigate("/transactions");
  };

  return (
    <>
      <div className="section-title">New transaction</div>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>Type</label>
          <div className="segmented">
            {transactionTypes.map((t) => (
              <button
                type="button"
                key={t}
                className={type === t ? "on" : ""}
                onClick={() => setType(t)}
              >
                {t[0] + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="account">{type === "TRANSFER" ? "From account" : "Account"}</label>
          <select id="account" required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Select…</option>
            {opts.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {type === "TRANSFER" ? (
          <div className="field">
            <label htmlFor="to">To account</label>
            <select id="to" required value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Select…</option>
              {opts.accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {catList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="note">Note (optional)</label>
          <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn block" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </>
  );
}
