import { useState } from "react";
import Modal from "./Modal.jsx";
import { RELATIONSHIP_TYPES as TYPES } from "../constants/relationshipTypes.js";

/**
 * Drag-free way to create a relationship: pick two members and a type.
 * This is the reliable alternative to dragging a connection on the graph.
 *
 * Direction reads as: "<from> is the <type> of <to>".
 */
export default function AddRelationshipModal({ members, onClose, onSave }) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [type, setType] = useState("parent");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fromName = members.find((m) => m._id === fromId)?.name || "…";
  const toName = members.find((m) => m._id === toId)?.name || "…";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fromId || !toId) return setError("Pick both members");
    if (fromId === toId) return setError("Pick two different members");

    setBusy(true);
    try {
      await onSave({ fromMemberId: fromId, toMemberId: toId, relationshipType: type });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create relationship");
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Relationship" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        <label>Member</label>
        <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
          <option value="">Select member…</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>

        <label>is the</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label>of</label>
        <select value={toId} onChange={(e) => setToId(e.target.value)}>
          <option value="">Select member…</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>

        <p className="rel-sentence">
          <strong>{fromName}</strong> is the <em>{type}</em> of{" "}
          <strong>{toName}</strong>
        </p>

        <div className="form__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Relationship"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
