import { useState, useMemo } from "react";
import RelationshipFinder from "./RelationshipFinder.jsx";

/**
 * Dashboard sidebar: add-member button, live search, the filtered member
 * list, and the Relationship Finder.
 */
export default function Sidebar({
  members,
  onAddMember,
  onAddRelationship,
  onSelectMember,
}) {
  const [search, setSearch] = useState("");

  // Client-side name filter (case-insensitive)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, search]);

  return (
    <aside className="sidebar">
      <button className="sidebar__add" onClick={onAddMember}>
        + Add Member
      </button>
      <button
        className="sidebar__add sidebar__add--alt"
        onClick={onAddRelationship}
        disabled={members.length < 2}
        title={members.length < 2 ? "Add at least two members first" : ""}
      >
        🔗 Add Relationship
      </button>

      <input
        className="sidebar__search"
        placeholder="Search members…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="sidebar__list">
        {filtered.length === 0 && <p className="muted">No members found.</p>}
        {filtered.map((m) => (
          <button
            key={m._id}
            className="sidebar__item"
            onClick={() => onSelectMember(m)}
          >
            <span className="sidebar__item-name">{m.name}</span>
            <span className="sidebar__item-meta">{m.gender}</span>
          </button>
        ))}
      </div>

      <RelationshipFinder members={members} />
    </aside>
  );
}
