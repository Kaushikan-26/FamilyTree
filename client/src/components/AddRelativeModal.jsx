import { useState, useRef } from "react";
import Modal from "./Modal.jsx";
import { RELATIONSHIP_TYPES } from "../constants/relationshipTypes.js";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Opened by right-clicking a member node. Creates a NEW member and links it to
 * the right-clicked (anchor) member in one step — the edge then appears
 * automatically.
 *
 * The relationship reads: "<new member> is the <type> of <anchor>".
 * So picking "son" on a right-clicked "Ravi" creates Ravi's son, connected.
 */
export default function AddRelativeModal({ anchor, onClose, onSave }) {
  const fileRef = useRef(null);
  const [type, setType] = useState("son");
  const [form, setForm] = useState({
    name: "",
    tag: "",
    gender: "other",
    dateOfBirth: "",
    deathDate: "",
    photo: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file");
    if (file.size > MAX_PHOTO_BYTES) return setError("Image too large (max 2 MB)");
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required");
    setBusy(true);
    setError("");
    try {
      await onSave({
        relationshipType: type,
        member: {
          ...form,
          dateOfBirth: form.dateOfBirth || null,
          deathDate: form.deathDate || null,
        },
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add relative");
      setBusy(false);
    }
  };

  return (
    <Modal title={`Add a relative of ${anchor.name}`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        <label>Relationship</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="rel-sentence">
          <strong>{form.name || "New member"}</strong> is the <em>{type}</em> of{" "}
          <strong>{anchor.name}</strong>
        </p>

        <label>Photo</label>
        <div className="photo-upload">
          <div className="photo-upload__preview">
            {form.photo ? <img src={form.photo} alt="preview" /> : <span>No photo</span>}
          </div>
          <div className="photo-upload__actions">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} />
          </div>
        </div>

        <label>Tag (heading)</label>
        <input value={form.tag} onChange={update("tag")} placeholder="e.g. Son, Aunt" />

        <label>Name *</label>
        <input value={form.name} onChange={update("name")} autoFocus />

        <label>Gender</label>
        <select value={form.gender} onChange={update("gender")}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <div className="form__row">
          <div>
            <label>Birth Date</label>
            <input type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />
          </div>
          <div>
            <label>Death Date</label>
            <input type="date" value={form.deathDate} onChange={update("deathDate")} />
          </div>
        </div>

        <label>Bio</label>
        <textarea rows={2} value={form.bio} onChange={update("bio")} />

        <div className="form__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add & Connect"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
