import Relationship from "../models/Relationship.js";
import Member from "../models/Member.js";
import { buildGraph, getRelationship } from "../utils/relationshipEngine.js";
import { canonicalKey } from "../utils/relationshipTypes.js";

/** GET /api/relationships — all relationships for the current user. */
export const getRelationships = async (req, res, next) => {
  try {
    const rels = await Relationship.find({ userId: req.user._id });
    res.json(rels);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/relationships
 * Create a relationship between two of the user's members, rejecting
 * self-loops and duplicates (including the equivalent inverse statement).
 */
export const createRelationship = async (req, res, next) => {
  try {
    const { fromMemberId, toMemberId, relationshipType } = req.body;

    // Reject self-loop (A -> A)
    if (String(fromMemberId) === String(toMemberId)) {
      return res.status(400).json({ message: "A member cannot relate to itself" });
    }

    // Both members must exist and belong to the user
    const count = await Member.countDocuments({
      _id: { $in: [fromMemberId, toMemberId] },
      userId: req.user._id,
    });
    if (count !== 2) {
      return res.status(404).json({ message: "One or both members not found" });
    }

    // Reject duplicate — compare canonical keys so equivalent statements
    // (e.g. "A father of B" vs "B son of A") are treated as the same link
    const existing = await Relationship.find({ userId: req.user._id });
    const newKey = canonicalKey(fromMemberId, toMemberId, relationshipType);
    const isDup = existing.some(
      (r) => canonicalKey(r.fromMemberId, r.toMemberId, r.relationshipType) === newKey
    );
    if (isDup) {
      return res.status(409).json({ message: "This relationship already exists" });
    }

    const rel = await Relationship.create({
      userId: req.user._id,
      fromMemberId,
      toMemberId,
      relationshipType,
    });
    res.status(201).json(rel);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/relationships/:id
 * Change a relationship's type, re-checking for duplicates (incl. inverse).
 */
export const updateRelationship = async (req, res, next) => {
  try {
    const { relationshipType } = req.body;

    const rel = await Relationship.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!rel) return res.status(404).json({ message: "Relationship not found" });

    // Reject if another relationship already represents this same link
    const others = await Relationship.find({
      _id: { $ne: rel._id },
      userId: req.user._id,
    });
    const newKey = canonicalKey(rel.fromMemberId, rel.toMemberId, relationshipType);
    const isDup = others.some(
      (r) => canonicalKey(r.fromMemberId, r.toMemberId, r.relationshipType) === newKey
    );
    if (isDup) {
      return res.status(409).json({ message: "This relationship already exists" });
    }

    rel.relationshipType = relationshipType;
    await rel.save();
    res.json(rel);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/relationships/:id — remove a relationship the user owns. */
export const deleteRelationship = async (req, res, next) => {
  try {
    const rel = await Relationship.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!rel) return res.status(404).json({ message: "Relationship not found" });
    res.json({ message: "Relationship deleted", _id: rel._id });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/relationships/between/:aId/:bId
 * Relationship Finder: returns the inferred textual relationship of B to A.
 */
export const findRelationship = async (req, res, next) => {
  try {
    const { aId, bId } = req.params;

    const [members, relationships] = await Promise.all([
      Member.find({ userId: req.user._id }),
      Relationship.find({ userId: req.user._id }),
    ]);

    const graph = buildGraph(members, relationships);
    const relationship = getRelationship(graph, aId, bId);

    const a = graph.memberMap.get(String(aId));
    const b = graph.memberMap.get(String(bId));

    res.json({
      from: a ? { _id: a._id, name: a.name } : null,
      to: b ? { _id: b._id, name: b.name } : null,
      // Reads as "<B> is <A>'s <relationship>"
      relationship,
      description:
        a && b ? `${b.name} is ${a.name}'s ${relationship}` : relationship,
    });
  } catch (err) {
    next(err);
  }
};
