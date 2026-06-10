import { Handle, Position } from "reactflow";

/** Emoji avatar fallback based on gender. */
const avatarFor = (gender) =>
  gender === "male" ? "👨" : gender === "female" ? "👩" : "🧑";

/** Format a date as dd-mm-yyyy. */
const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${dt.getFullYear()}`;
};

/**
 * Age in whole years between `dob` and `end`.
 * When `end` is omitted it uses *today*, so a living member's age is always
 * current and rolls over automatically once their birthday passes.
 */
const calcAge = (dob, end) => {
  if (!dob) return null;
  const start = new Date(dob);
  const e = end ? new Date(end) : new Date();
  let age = e.getFullYear() - start.getFullYear();
  const m = e.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && e.getDate() < start.getDate())) age--;
  return age >= 0 ? age : null;
};

/**
 * Custom React Flow node rendering a family member card.
 * Layout (top → bottom):
 *   gradient header (tag) → overlapping photo → name → AGE pill → dates → bio
 *
 * Dates:
 *   - Living (no death date): birth date shown centered.
 *   - Deceased: birth date on the left (B:), death date on the right (D:).
 * Age: current age for the living, age-at-death for the deceased.
 */
export default function MemberNode({ data, selected }) {
  const { member, onEdit } = data;
  const deceased = Boolean(member.deathDate);
  const age = calcAge(member.dateOfBirth, member.deathDate);

  return (
    <div
      className={`member-node ${selected ? "selected" : ""} ${member.gender} ${
        deceased ? "deceased" : ""
      }`}
    >
      {/* Connection points. Top/bottom are used for parent→child (vertical)
          links; left/right for spouse/sibling (horizontal) links, which keeps
          the arrows clean and easy to read. */}
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="left" type="target" position={Position.Left} />
      <Handle id="right" type="source" position={Position.Right} />

      {/* Gradient header showing the tag (role) */}
      <div className="member-node__header">{member.tag || member.gender}</div>

      <button
        className="member-node__edit"
        title="Edit member"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(member);
        }}
      >
        ✎
      </button>

      {/* Photo (overlaps the header) */}
      <div className="member-node__avatar">
        {member.photo ? (
          <img src={member.photo} alt={member.name} />
        ) : (
          <span>{avatarFor(member.gender)}</span>
        )}
        {deceased && <span className="member-node__memorial">✝</span>}
      </div>

      {/* Name */}
      <div className="member-node__name">{member.name}</div>

      {/* Current age (auto-computed from DOB) */}
      {age !== null && <div className="member-node__age">AGE: {age}</div>}

      {/* Dates: centered birth if living, B left / D right if deceased */}
      {member.dateOfBirth && (
        <div
          className={`member-node__dates ${
            deceased ? "" : "member-node__dates--center"
          }`}
        >
          <span>B: {fmtDate(member.dateOfBirth)}</span>
          {deceased && <span>D: {fmtDate(member.deathDate)}</span>}
        </div>
      )}

      {/* Bio */}
      {member.bio && <div className="member-node__bio">{member.bio}</div>}

      <Handle id="bottom" type="source" position={Position.Bottom} />
    </div>
  );
}
