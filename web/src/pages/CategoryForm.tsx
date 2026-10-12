import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalData } from "@/lib/use-data";
import { saveCategory, deleteCategory } from "@/lib/sync/local-writes";
import { categoryKinds } from "@/lib/schemas";
import { Icon } from "@/lib/engraving";

const PALETTE = ["#9c2b24", "#13553b", "#27456b", "#9a7322", "#5a2f4a", "#1f5a56", "#6b5330", "#4f5a28"];
const KIND_LABEL: Record<string, string> = { INCOME: "Income", EXPENSE: "Expense" };

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ready, categories } = useLocalData();
  const existing = id ? categories.find((c) => c.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [kind, setKind] = useState<(typeof categoryKinds)[number]>(existing?.kind ?? "EXPENSE");
  const [color, setColor] = useState(existing?.color ?? PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (id && ready && !existing) {
    return <div className="list-empty">This book was not found.</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveCategory({ ...(id ? { id } : {}), name, kind, color });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else navigate("/categories");
  };

  const remove = async () => {
    if (!id) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    await deleteCategory(id);
    navigate("/categories");
  };

  return (
    <>
      <div className="appbar">
        <div>
          <div className="kicker">Book</div>
          <div className="title">{id ? "Edit book" : "New book"}</div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="inp" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" />
        </div>

        <div className="field">
          <label>Kind</label>
          <div className="seg">
            {categoryKinds.map((k) => (
              <button type="button" key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Color</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: 8, background: c, cursor: "pointer",
                  border: color === c ? "2px solid var(--gold)" : "1px solid var(--rule)",
                  boxShadow: color === c ? "0 0 0 2px var(--paper), 0 0 0 3px var(--gold)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="btnrow">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : id ? "Save" : "Create"}</button>
        </div>

        {id && (
          <button type="button" className="btn danger" style={{ marginTop: 10 }} onClick={remove} disabled={busy}>
            <Icon name="trash" /> {confirmDel ? "Tap again to delete this book" : "Delete book"}
          </button>
        )}
      </form>
    </>
  );
}
