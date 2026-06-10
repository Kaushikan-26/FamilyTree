import { useState, useEffect, useCallback } from "react";
import { memberService } from "../services/memberService.js";
import { relationshipService } from "../services/relationshipService.js";

/**
 * Loads and manages the logged-in user's members + relationships,
 * exposing CRUD helpers that keep local state in sync with the backend.
 */
export function useFamilyData() {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [m, r] = await Promise.all([
        memberService.list(),
        relationshipService.list(),
      ]);
      setMembers(m);
      setRelationships(r);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load family data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- Member operations ---
  const addMember = async (data) => {
    const created = await memberService.create(data);
    setMembers((prev) => [...prev, created]);
    return created;
  };

  const editMember = async (id, data) => {
    const updated = await memberService.update(id, data);
    setMembers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    return updated;
  };

  const removeMember = async (id) => {
    await memberService.remove(id);
    setMembers((prev) => prev.filter((m) => m._id !== id));
    // Drop relationships that referenced the deleted member
    setRelationships((prev) =>
      prev.filter((r) => r.fromMemberId !== id && r.toMemberId !== id)
    );
  };

  // Persist a node's new position after a drag (no full refresh needed)
  const saveMemberPosition = async (id, position) => {
    const updated = await memberService.update(id, { position });
    setMembers((prev) => prev.map((m) => (m._id === id ? updated : m)));
  };

  // Persist many positions at once (used by Auto Arrange / hierarchy layout)
  const saveMemberPositions = async (positionsById) => {
    // Optimistically update local state so the layout sticks immediately
    setMembers((prev) =>
      prev.map((m) =>
        positionsById[m._id] ? { ...m, position: positionsById[m._id] } : m
      )
    );
    await Promise.all(
      Object.entries(positionsById).map(([id, position]) =>
        memberService.update(id, { position })
      )
    );
  };

  // --- Relationship operations ---
  const addRelationship = async (data) => {
    const created = await relationshipService.create(data);
    setRelationships((prev) => [...prev, created]);
    return created;
  };

  const editRelationship = async (id, data) => {
    const updated = await relationshipService.update(id, data);
    setRelationships((prev) => prev.map((r) => (r._id === id ? updated : r)));
    return updated;
  };

  const removeRelationship = async (id) => {
    await relationshipService.remove(id);
    setRelationships((prev) => prev.filter((r) => r._id !== id));
  };

  return {
    members,
    relationships,
    loading,
    error,
    refresh,
    addMember,
    editMember,
    removeMember,
    saveMemberPosition,
    saveMemberPositions,
    addRelationship,
    editRelationship,
    removeRelationship,
  };
}
