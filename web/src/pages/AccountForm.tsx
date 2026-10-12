import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalData } from "@/lib/use-data";
import { saveAccount, deleteAccount } from "@/lib/sync/local-writes";
import { accountTypes } from "@/lib/schemas";
import { Icon } from "@/lib/engraving";

const TYPE_LABEL: Record<string, string> = { BANK: "Bank", CASH: "Cash", ASSET: "Asset" };

export default function AccountForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ready, accounts, baseCurrency } = useLocalData();
  const existing = id ? accounts.find((a) => a.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<(typeof accountTypes)[number]>(existing?.type ?? "BANK");
  const [currency, setCurrency] = useState(existing?.currency ?? baseCurrency);
  const [openingBalance, setOpeningBalance] = useState(existing ? String(existing.openingBalance) : "0");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (id && ready && !existing) {
    return <div className="list-empty">This account was not found.</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveAccount({ ...(id ? { id } : {}), name, type, currency, openingBalance, note });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else navigate("/accounts");
  };

  const remove = async () => {
    if (!id) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    await deleteAccount(id);
    navigate("/accounts");
  };

  return (
    <>
      <div className="appbar">
        <div>
          <div className="kicker">Certificate</div>
          <div className="title">{id ? "Edit account" : "Open an account"}</div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="inp" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HBL Current" />
        </div>

        <div className="field">
          <label>Type</label>
          <div className="seg">
            {accountTypes.map((t) => (
              <button type="button" key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="currency">Currency</label>
          <input
            id="currency"
            className="inp"
            required
            maxLength={3}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="USD"
          />
        </div>

        <div className="field">
          <label htmlFor="opening">Opening balance</label>
          <input
            id="opening"
            className="inp tnum"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="note">Note (optional)</label>
          <input id="note" className="inp" value={note ?? ""} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="btnrow">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : id ? "Save" : "Open"}</button>
        </div>

        {id && (
          <button type="button" className="btn danger" style={{ marginTop: 10 }} onClick={remove} disabled={busy}>
            <Icon name="trash" /> {confirmDel ? "Tap again to delete (removes its entries)" : "Delete account"}
          </button>
        )}
      </form>
    </>
  );
}
