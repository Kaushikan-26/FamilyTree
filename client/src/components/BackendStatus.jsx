/**
 * Banner showing backend + database connectivity.
 *
 * Stays calm during the normal startup window (server booting / DB still
 * connecting) and only shows the alarming whitelist / offline message once the
 * problem has persisted for several seconds (persistentDown).
 */
export default function BackendStatus({ status, db, persistentDown }) {
  // Healthy
  if (status === "online" && db === "connected") {
    return (
      <div className="backend-status backend-status--ok">
        <span className="dot" /> Server &amp; database connected
      </div>
    );
  }

  // Genuinely offline for a while → tell them to start the backend
  if (status === "offline" && persistentDown) {
    return (
      <div className="backend-status backend-status--down">
        <span className="dot" /> Server offline — start the backend:
        <code>cd server &amp;&amp; npm run dev</code>
      </div>
    );
  }

  // DB has been unreachable for a while while the server is up → whitelist hint
  if (status === "online" && db !== "connected" && persistentDown) {
    return (
      <div className="backend-status backend-status--warn">
        <span className="dot" /> Server up, but database not connected. Check your
        MongoDB Atlas IP whitelist (Network Access → allow your IP / 0.0.0.0/0).
      </div>
    );
  }

  // Otherwise we're in the brief startup / transient window — stay calm
  return (
    <div className="backend-status backend-status--checking">
      <span className="dot" /> Connecting…
    </div>
  );
}
