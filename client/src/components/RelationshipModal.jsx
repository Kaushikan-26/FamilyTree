import { useState } from "react";
import Modal from "./Modal.jsx";
import { RELATIONSHIP_TYPES as TYPES } from "../constants/relationshipTypes.js";

/**
 * Prompt shown after a user connects two nodes on the graph.
 * Asks which relationship type the edge represents, then saves it.
 *
 * `from` is parent->child source. Label reads:
 *   "<from> is the <type> of <to>"
 */
export default function RelationshipModal({ from, to, onClose, onSave }) {
  const [type, setType] = useState("parent");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        fromMemberId: from._id,
        toMemberId: to._id,
        relationshipType: type,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save relationship");
      setBusy(false);
    }
  };

  return (
    <Modal title="Define Relationship" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        <p className="rel-sentence">
          <strong>{from.name}</strong> is the{" "}
          <em>{type}</em> of <strong>{to.name}</strong>
        </p>

        <label>Relationship type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="form__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Relationship"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
