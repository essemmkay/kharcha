import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSync } from "@/lib/sync/use-sync";
import { clearLocal } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Icon, type IconName } from "@/lib/engraving";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import TransactionForm from "@/pages/TransactionForm";
import Accounts from "@/pages/Accounts";
import AccountForm from "@/pages/AccountForm";
import Categories from "@/pages/Categories";
import CategoryForm from "@/pages/CategoryForm";
import Reports from "@/pages/Reports";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <div className="center muted">Loading…</div>;
  if (!session) return <Login />;
  return <Shell />;
}

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: "dash", end: true },
  { to: "/transactions", label: "Entries", icon: "entries" },
  { to: "/accounts", label: "Accounts", icon: "accounts" },
  { to: "/categories", label: "Books", icon: "books" },
  { to: "/reports", label: "Report", icon: "report" },
];

function Shell() {
  const { syncing, pending, error, syncNow } = useSync();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearLocal(); // don't leak one user's data to the next
    navigate("/");
  };

  const syncLabel = syncing
    ? "Syncing…"
    : error
      ? "Retry sync"
      : pending > 0
        ? `${pending} pending`
        : "Synced";

  return (
    <div className="app">
      <header className="topstrip no-print">
        <span className="wm">Kharcha</span>
        <span className="right">
          <button
            className={`tag ${error ? "warn" : ""}`}
            onClick={syncNow}
            title={error ?? undefined}
          >
            <span className="d" />
            {syncLabel}
          </button>
          <button className="iconbtn" onClick={signOut} aria-label="Sign out" title="Sign out">
            <Icon name="signout" />
          </button>
        </span>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<TransactionForm />} />
          <Route path="/transactions/:id" element={<TransactionForm />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/new" element={<AccountForm />} />
          <Route path="/accounts/:id" element={<AccountForm />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/new" element={<CategoryForm />} />
          <Route path="/categories/:id" element={<CategoryForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="nav no-print">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? "on" : "")}>
            <Icon name={n.icon} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
