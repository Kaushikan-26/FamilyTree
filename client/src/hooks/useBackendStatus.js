import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";

/**
 * Polls /health so the UI knows whether the server is reachable and whether
 * its database is connected.
 *
 * It distinguishes a brief startup window (server just booted, DB still
 * "connecting") from a genuine, persistent problem. The alarming "check your
 * Atlas whitelist" message is only surfaced once the DB has been unreachable
 * for several seconds — so a normal restart just shows a calm "connecting…".
 *
 * Returns { status: "checking"|"online"|"offline", db, persistentDown }.
 */
export function useBackendStatus(intervalMs = 2000) {
  const [state, setState] = useState({
    status: "checking",
    db: null,
    persistentDown: false,
  });
  const downSince = useRef(null);

  useEffect(() => {
    let active = true;

    const markDown = () => {
      if (!downSince.current) downSince.current = Date.now();
      return Date.now() - downSince.current > 8000; // persistent after ~8s
    };

    const check = async () => {
      try {
        const res = await api.get("/health", { timeout: 4000 });
        const db = res.data?.db || null;
        if (db === "connected") {
          downSince.current = null;
          if (active) setState({ status: "online", db, persistentDown: false });
        } else {
          const persistentDown = markDown();
          if (active)
            setState({ status: "online", db: db || "connecting", persistentDown });
        }
      } catch {
        const persistentDown = markDown();
        if (active) setState({ status: "offline", db: null, persistentDown });
      }
    };

    check();
    const t = setInterval(check, intervalMs);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [intervalMs]);

  return state;
}
