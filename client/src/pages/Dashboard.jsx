import { useState, useCallback } from "react";
import { ReactFlowProvider } from "reactflow";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamilyData } from "../hooks/useFamilyData.js";
import Sidebar from "../components/Sidebar.jsx";
import FamilyGraph from "../components/FamilyGraph.jsx";
import MemberModal from "../components/MemberModal.jsx";
import RelationshipModal from "../components/RelationshipModal.jsx";
import AddRelationshipModal from "../components/AddRelationshipModal.jsx";
import AddRelativeModal from "../components/AddRelativeModal.jsx";
import EditRelationshipModal from "../components/EditRelationshipModal.jsx";

// Approx card size for placing a new relative next to its anchor
const COL = 230;
const ROW = 300;

const CHILD_TYPES = new Set(["son", "daughter", "child"]);
const PARENT_TYPES = new Set(["father", "mother", "parent"]);

// Where to drop a new relative relative to the anchor, based on the relationship
const placeRelative = (anchor, type) => {
  const x = anchor.position?.x || 0;
  const y = anchor.position?.y || 0;
  if (PARENT_TYPES.has(type)) return { x, y: y - ROW };
  if (["grandfather", "grandmother"].includes(type)) return { x, y: y - ROW * 2 };
  if (CHILD_TYPES.has(type)) return { x, y: y + ROW };
  // spouse / sibling / cousin → beside the anchor
  return { x: x + COL, y };
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    members,
    relationships,
    loading,
    error,
    addMember,
    editMember,
    removeMember,
    saveMemberPosition,
    saveMemberPositions,
    addRelationship,
    editRelationship,
    removeRelationship,
  } = useFamilyData();

  // Member modal state: null = closed, {} = add, {member} = edit
  const [memberModal, setMemberModal] = useState(null);
  // Relationship modal state: { from, to } when connecting two nodes
  const [relModal, setRelModal] = useState(null);
  // Drag-free "Add Relationship" modal toggle
  const [addRelOpen, setAddRelOpen] = useState(false);
  // Edit-relationship modal state: the relationship id clicked on an edge
  const [editRelId, setEditRelId] = useState(null);
  // "Add relative" (right-click) state: the anchor member id
  const [relativeAnchorId, setRelativeAnchorId] = useState(null);

  const openAdd = () => setMemberModal({ member: null });
  const openEdit = useCallback((member) => setMemberModal({ member }), []);
  // Right-click empty canvas → add a standalone member at that position
  const openAddAt = useCallback(
    (position) => setMemberModal({ member: null, position }),
    []
  );

  // Triggered when the user drags a connection between two nodes
  const handleConnect = useCallback(
    (fromId, toId) => {
      const from = members.find((m) => m._id === fromId);
      const to = members.find((m) => m._id === toId);
      if (from && to) setRelModal({ from, to });
    },
    [members]
  );

  const handleSaveMember = async (data) => {
    if (memberModal.member) {
      await editMember(memberModal.member._id, data);
    } else {
      // Use the right-click position if present, else a slight random offset
      const position =
        memberModal.position || {
          x: 120 + Math.random() * 240,
          y: 120 + Math.random() * 160,
        };
      await addMember({ ...data, position });
    }
  };

  // Spouses of a member (from the current relationships)
  const spousesOf = (id) => {
    const out = new Set();
    relationships.forEach((r) => {
      if (r.relationshipType !== "spouse") return;
      if (r.fromMemberId === id) out.add(r.toMemberId);
      else if (r.toMemberId === id) out.add(r.fromMemberId);
    });
    return out;
  };

  // Direct children of a member (from the current relationships)
  const childrenOf = (id) => {
    const out = new Set();
    relationships.forEach((r) => {
      if (PARENT_TYPES.has(r.relationshipType) && r.fromMemberId === id)
        out.add(r.toMemberId);
      else if (CHILD_TYPES.has(r.relationshipType) && r.toMemberId === id)
        out.add(r.fromMemberId);
    });
    return out;
  };

  // Right-click flow: create the new member near its anchor and connect it.
  // When adding a CHILD, also connect it to the anchor's spouse(s) (so it
  // descends from the couple) and to any existing children as siblings.
  const handleAddRelative = async ({ relationshipType, member }) => {
    const anchor = members.find((m) => m._id === relativeAnchorId);
    if (!anchor) return;
    const created = await addMember({
      ...member,
      position: placeRelative(anchor, relationshipType),
    });

    const links = [
      { fromMemberId: created._id, toMemberId: anchor._id, relationshipType },
    ];

    if (CHILD_TYPES.has(relationshipType)) {
      const spouseIds = [...spousesOf(anchor._id)];
      // child of the anchor's spouse too → becomes the couple's child
      spouseIds.forEach((sid) =>
        links.push({ fromMemberId: created._id, toMemberId: sid, relationshipType })
      );
      // sibling of every existing child of either parent
      const siblingType =
        created.gender === "male"
          ? "brother"
          : created.gender === "female"
          ? "sister"
          : "sibling";
      const existing = new Set();
      [anchor._id, ...spouseIds].forEach((pid) =>
        childrenOf(pid).forEach((cid) => existing.add(cid))
      );
      existing.delete(created._id);
      existing.forEach((cid) =>
        links.push({
          fromMemberId: created._id,
          toMemberId: cid,
          relationshipType: siblingType,
        })
      );
    }

    // Create each link; skip any the backend rejects (e.g. duplicates)
    for (const link of links) {
      try {
        await addRelationship(link);
      } catch {
        /* ignore duplicate / invalid */
      }
    }
  };

  const relativeAnchor = members.find((m) => m._id === relativeAnchorId);

  return (
    <div className="dashboard">
      <header className="topbar">
        <h1>🌳 Family Tree Manager</h1>
        <div className="topbar__right">
          <span className="topbar__user">👤 {user?.username}</span>
          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard__body">
        <Sidebar
          members={members}
          onAddMember={openAdd}
          onAddRelationship={() => setAddRelOpen(true)}
          onSelectMember={openEdit}
        />

        <main className="canvas">
          {error && <div className="alert canvas__alert">{error}</div>}
          {loading ? (
            <div className="canvas__empty">Loading family tree…</div>
          ) : members.length === 0 ? (
            <div className="canvas__empty">
              No members yet. Click <strong>+ Add Member</strong> to begin building
              your family tree.
            </div>
          ) : (
            <ReactFlowProvider>
              <FamilyGraph
                members={members}
                relationships={relationships}
                onEditMember={openEdit}
                onConnectMembers={handleConnect}
                onMoveMember={saveMemberPosition}
                onDeleteRelationship={removeRelationship}
                onSelectRelationship={setEditRelId}
                onAddRelative={setRelativeAnchorId}
                onAddMemberAt={openAddAt}
                onAutoLayout={saveMemberPositions}
              />
            </ReactFlowProvider>
          )}
        </main>
      </div>

      {memberModal && (
        <MemberModal
          member={memberModal.member}
          onClose={() => setMemberModal(null)}
          onSave={handleSaveMember}
          onDelete={removeMember}
        />
      )}

      {relModal && (
        <RelationshipModal
          from={relModal.from}
          to={relModal.to}
          onClose={() => setRelModal(null)}
          onSave={addRelationship}
        />
      )}

      {addRelOpen && (
        <AddRelationshipModal
          members={members}
          onClose={() => setAddRelOpen(false)}
          onSave={addRelationship}
        />
      )}

      {relativeAnchor && (
        <AddRelativeModal
          anchor={relativeAnchor}
          onClose={() => setRelativeAnchorId(null)}
          onSave={handleAddRelative}
        />
      )}

      {editRelId &&
        (() => {
          const rel = relationships.find((r) => r._id === editRelId);
          if (!rel) return null;
          return (
            <EditRelationshipModal
              relationship={rel}
              from={members.find((m) => m._id === rel.fromMemberId)}
              to={members.find((m) => m._id === rel.toMemberId)}
              onClose={() => setEditRelId(null)}
              onSave={editRelationship}
              onDelete={removeRelationship}
            />
          );
        })()}
    </div>
  );
}
