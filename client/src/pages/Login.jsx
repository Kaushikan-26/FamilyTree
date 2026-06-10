import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useBackendStatus } from "../hooks/useBackendStatus.js";
import { getErrorMessage } from "../services/errorMessage.js";
import BackendStatus from "../components/BackendStatus.jsx";

export default function Login() {
  const { login } = useAuth();
  const backend = useBackendStatus();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
      // Navigation handled by App route guard once user state updates
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>🌳 Family Tree</h1>
        <p className="auth-subtitle">Sign in to manage your family tree</p>

        <BackendStatus
          status={backend.status}
          db={backend.db}
          persistentDown={backend.persistentDown}
        />
        {error && <div className="alert">{error}</div>}

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your username"
          autoFocus
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </button>

        <p className="auth-switch">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
