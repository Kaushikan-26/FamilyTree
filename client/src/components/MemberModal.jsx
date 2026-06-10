import { useState, useRef } from "react";
import Modal from "./Modal.jsx";

/** Format a Date/ISO value into the yyyy-mm-dd a date input expects. */
const toDateInput = (value) => (value ? value.substring(0, 10) : "");

// Reject overly large images so we don't blow past Mongo's document limit
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Add/Edit member form in a modal.
 * `member` prop (optional) switches the form into edit mode.
 * Photos are uploaded from the device and stored inline as base64 data URIs.
 */
export default function MemberModal({ member, onClose, onSave, onDelete }) {
  const editing = Boolean(member);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: member?.name || "",
    tag: member?.tag || "",
    gender: member?.gender || "other",
    dateOfBirth: toDateInput(member?.dateOfBirth),
    deathDate: toDateInput(member?.deathDate),
    photo: member?.photo || "",
    bio: member?.bio || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Read the chosen file from disk and embed it as a base64 data URI
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Image too large (max 2 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setForm((f) => ({ ...f, photo: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Send null for empty dates so the backend stores nothing
      await onSave({
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        deathDate: form.deathDate || null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save member");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${member.name}? This also removes their relationships.`)) {
      return;
    }
    setBusy(true);
    try {
      await onDelete(member._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete member");
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? "Edit Member" : "Add Member"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        {/* Photo uploader with live preview */}
        <label>Photo</label>
        <div className="photo-upload">
          <div className="photo-upload__preview">
            {form.photo ? (
              <img src={form.photo} alt="preview" />
            ) : (
              <span>No photo</span>
            )}
          </div>
          <div className="photo-upload__actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
            />
            {form.photo && (
              <button type="button" className="btn-secondary" onClick={clearPhoto}>
                Remove photo
              </button>
            )}
          </div>
        </div>

        <label>Tag (heading)</label>
        <input
          value={form.tag}
          onChange={update("tag")}
          placeholder="e.g. Grandfather, Self, Aunt"
        />

        <label>Name *</label>
        <input value={form.name} onChange={update("name")} />

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
        <textarea rows={3} value={form.bio} onChange={update("bio")} />

        <div className="form__actions">
          {editing && (
            <button type="button" className="btn-danger" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Add Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
