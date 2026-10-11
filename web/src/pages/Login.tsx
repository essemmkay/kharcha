import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-hero">
          <span className="chip" aria-hidden />
          <div className="mark">Kharcha</div>
          <div className="tag">Your money, your data.</div>
          <div className="digits" aria-hidden>
            •••• •••• •••• 2048
          </div>
        </div>

        <form className="login-body" onSubmit={submit}>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue.</p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <div className="error">{error}</div> : null}

          <button className="btn block" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
      <p className="login-foot">Self-owned finance tracker</p>
    </div>
  );
}
