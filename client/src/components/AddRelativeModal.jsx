import { useState, useRef } from "react";
import Modal from "./Modal.jsx";
import CollapsibleSection from "./CollapsibleSection.jsx";
import { RELATIONSHIP_TYPES } from "../constants/relationshipTypes.js";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

const CHILD_TYPES = new Set(["son", "daughter", "child"]);
const SIBLING_TYPES = new Set(["brother", "sister", "sibling"]);

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th" ... */
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Opened by right-clicking a member node. Creates a NEW member and links it to
 * the right-clicked (anchor) member in one step — the edge appears automatically.
 *
 * - Adding a CHILD asks the birth order (1st child, 2nd child, …).
 * - Adding a SIBLING asks whether they're elder or younger than the anchor.
 * Both are stored (birthOrder for ordering, orderLabel for display).
 */
export default function AddRelativeModal({ anchor, onClose, onSave }) {
  const fileRef = useRef(null);
  const [type, setType] = useState("son");
  const [childOrder, setChildOrder] = useState(1); // 1st, 2nd, …
  const [siblingRank, setSiblingRank] = useState("younger"); // elder | younger
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

  const isChild = CHILD_TYPES.has(type);
  const isSibling = SIBLING_TYPES.has(type);

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

  // Derive the seniority fields from the relationship + chosen order
  const seniority = () => {
    if (isChild) {
      return { birthOrder: childOrder, orderLabel: `${ordinal(childOrder)} child` };
    }
    if (isSibling) {
      const anchorOrder = Number.isFinite(anchor.birthOrder) ? anchor.birthOrder : 1;
      return {
        birthOrder: siblingRank === "elder" ? anchorOrder - 1 : anchorOrder + 1,
        orderLabel: siblingRank === "elder" ? "Elder" : "Younger",
      };
    }
    return { birthOrder: undefined, orderLabel: "" };
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
          ...seniority(),
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

        {/* Birth order — only when adding a child */}
        {isChild && (
          <>
            <label>Which child?</label>
            <select
              value={childOrder}
              onChange={(e) => setChildOrder(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {ordinal(n)} child
                </option>
              ))}
            </select>
          </>
        )}

        {/* Elder / younger — only when adding a sibling */}
        {isSibling && (
          <>
            <label>Elder or younger than {anchor.name}?</label>
            <select value={siblingRank} onChange={(e) => setSiblingRank(e.target.value)}>
              <option value="elder">Elder</option>
              <option value="younger">Younger</option>
            </select>
          </>
        )}

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

        <label>Birth Date</label>
        <input type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />

        {/* Additional info (death date + bio) hidden behind a hamburger toggle */}
        <CollapsibleSection title="Additional info">
          <label>Death Date</label>
          <input type="date" value={form.deathDate} onChange={update("deathDate")} />
          <label>Bio</label>
          <textarea rows={2} value={form.bio} onChange={update("bio")} />
        </CollapsibleSection>

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
