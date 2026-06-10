import { useState } from "react";
import Modal from "./Modal.jsx";
import { RELATIONSHIP_TYPES as TYPES } from "../constants/relationshipTypes.js";

/**
 * Opened when a user clicks an existing edge.
 * Lets them change the relationship type or delete the relationship entirely.
 */
export default function EditRelationshipModal({
  relationship,
  from,
  to,
  onClose,
  onSave,
  onDelete,
}) {
  const [type, setType] = useState(relationship.relationshipType);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (type === relationship.relationshipType) {
      onClose(); // nothing changed
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(relationship._id, { relationshipType: type });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update relationship");
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this relationship?")) return;
    setBusy(true);
    setError("");
    try {
      await onDelete(relationship._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete relationship");
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit Relationship" onClose={onClose}>
      <form className="form" onSubmit={save}>
        {error && <div className="alert">{error}</div>}

        <p className="rel-sentence">
          <strong>{from?.name || "?"}</strong> is the <em>{type}</em> of{" "}
          <strong>{to?.name || "?"}</strong>
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
          <button type="button" className="btn-danger" onClick={remove} disabled={busy}>
            Delete
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
