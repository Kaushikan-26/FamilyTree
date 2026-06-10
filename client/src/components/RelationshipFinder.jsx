import { useState } from "react";
import { relationshipService } from "../services/relationshipService.js";

/**
 * Relationship Finder widget.
 * Pick two members; calls the backend inference endpoint and shows the
 * textual relationship (e.g. "uncle", "grandmother", "second cousin").
 */
export default function RelationshipFinder({ members }) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const find = async () => {
    if (!aId || !bId) {
      setError("Select two members");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await relationshipService.between(aId, bId));
    } catch (err) {
      setError(err.response?.data?.message || "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="finder">
      <h3>🔍 Relationship Finder</h3>

      <select value={aId} onChange={(e) => setAId(e.target.value)}>
        <option value="">Member A…</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </select>

      <select value={bId} onChange={(e) => setBId(e.target.value)}>
        <option value="">Member B…</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </select>

      <button onClick={find} disabled={busy}>
        {busy ? "Finding…" : "Find Relationship"}
      </button>

      {error && <div className="alert">{error}</div>}
      {result && (
        <div className="finder__result">
          {result.description}
          <div className="finder__badge">{result.relationship}</div>
        </div>
      )}
    </div>
  );
}
