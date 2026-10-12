import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Guilloche, Seal } from "@/lib/engraving";

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
    <div className="app">
      <div className="login">
        <div className="note">
          <Guilloche w={360} h={210} stroke="rgba(241,234,214,.5)" sw={0.55} layers={5} f={7} R={150} />
          <div className="frameline" />
          <div className="masthead">
            <div>
              <div className="m-name">Kharcha</div>
              <div className="m-sub">Register of Account</div>
            </div>
            <Seal state="ISSUE" />
          </div>
          <div className="denomlabel">Bearer</div>
          <div className="value">
            Your money,
            <br />
            <span style={{ color: "rgba(241,234,214,.72)" }}>your data.</span>
          </div>
          <div className="serial tnum" style={{ marginTop: 16 }}>
            •••• •••• •••• 2048
          </div>
          <div className="microprint">
            self-owned · offline-first · survives a phone switch · self-owned · offline-first · survives a phone switch
          </div>
        </div>

        <form onSubmit={submit}>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to open your register.</p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="inp"
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
              className="inp"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <div className="error">{error}</div> : null}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="foot">Self-owned finance · No subscription</p>
        </form>
      </div>
    </div>
  );
}
