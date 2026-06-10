import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useBackendStatus } from "../hooks/useBackendStatus.js";
import { getErrorMessage } from "../services/errorMessage.js";
import BackendStatus from "../components/BackendStatus.jsx";

export default function Register() {
  const { register } = useAuth();
  const backend = useBackendStatus();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await register(username, password);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>🌳 Family Tree</h1>
        <p className="auth-subtitle">Create your account</p>

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
          placeholder="at least 3 characters"
          autoFocus
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 6 characters"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="re-enter password"
        />

        <button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create Account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
