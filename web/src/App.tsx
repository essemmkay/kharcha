import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSync } from "@/lib/sync/use-sync";
import { clearLocal } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import TransactionForm from "@/pages/TransactionForm";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <div className="center muted">Loading…</div>;
  if (!session) return <Login />;
  return <Shell />;
}

function Shell() {
  const { syncing, pending, error, syncNow } = useSync();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearLocal(); // don't leak one user's data to the next
    navigate("/");
  };

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Kharcha</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="badge sync"
            onClick={syncNow}
            title={error ?? undefined}
            style={{ border: "none", cursor: "pointer" }}
          >
            {syncing ? "Syncing…" : error ? "Retry sync" : pending > 0 ? `${pending} pending` : "Synced"}
          </button>
          <button className="btn ghost" onClick={signOut} style={{ padding: "6px 10px" }}>
            Sign out
          </button>
        </span>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<TransactionForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => (isActive ? "active" : "")}>
          Transactions
        </NavLink>
      </nav>
    </div>
  );
}
