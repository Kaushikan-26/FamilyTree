import { useState } from "react";
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
 * Face (always shown): tag → photo → name → order badge → AGE → birth date.
 * Death date and bio live behind an "Additional info" expander to keep the
 * card compact.
 */
export default function MemberNode({ data, selected }) {
  const { member, onEdit } = data;
  const [showInfo, setShowInfo] = useState(false);
  const deceased = Boolean(member.deathDate);
  const age = calcAge(member.dateOfBirth, member.deathDate);
  const hasExtra = Boolean(member.deathDate || member.bio);

  return (
    <div
      className={`member-node ${selected ? "selected" : ""} ${member.gender} ${
        deceased ? "deceased" : ""
      }`}
    >
      {/* Connection points. Top/bottom = parent→child (vertical); left/right =
          spouse/sibling (horizontal), which keeps the arrows clean. */}
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="left" type="target" position={Position.Left} />
      <Handle id="right" type="source" position={Position.Right} />

      {/* Gradient header showing the tag (role) */}
      <div className="member-node__header">{member.tag || member.gender}</div>

      <button
        className="member-node__edit nodrag"
        title="Edit member"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(member);
        }}
      >
        ✎
      </button>

      {/* Hamburger toggle for Additional info (top-left), shown only if there's
          extra info to reveal */}
      {hasExtra && (
        <button
          className="member-node__menu nodrag"
          title="Additional info"
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo((s) => !s);
          }}
        >
          {showInfo ? "✕" : "☰"}
        </button>
      )}

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

      {/* Seniority badge (e.g. "1st child", "Elder") */}
      {member.orderLabel && (
        <div className="member-node__order">{member.orderLabel}</div>
      )}

      {/* Current age (auto-computed from DOB) */}
      {age !== null && <div className="member-node__age">AGE: {age}</div>}

      {/* Birth date (death date moved into Additional info) */}
      {member.dateOfBirth && (
        <div className="member-node__dates member-node__dates--center">
          <span>B: {fmtDate(member.dateOfBirth)}</span>
        </div>
      )}

      {/* Additional info panel: revealed by the hamburger toggle */}
      {hasExtra && showInfo && (
        <div className="member-node__info">
          {member.deathDate && (
            <div className="member-node__info-row">
              <strong>Died:</strong> {fmtDate(member.deathDate)}
            </div>
          )}
          {member.bio && (
            <div className="member-node__info-row">
              <strong>Bio:</strong> {member.bio}
            </div>
          )}
        </div>
      )}

      <Handle id="bottom" type="source" position={Position.Bottom} />
    </div>
  );
}
