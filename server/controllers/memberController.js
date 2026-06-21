import Member from "../models/Member.js";
import Relationship from "../models/Relationship.js";

/**
 * GET /api/members
 * List the logged-in user's members, optional ?search= by name.
 */
export const getMembers = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.search) {
      // Case-insensitive partial name match
      filter.name = { $regex: req.query.search.trim(), $options: "i" };
    }
    const members = await Member.find(filter).sort({ createdAt: 1 });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

/** POST /api/members — create a member owned by the current user. */
export const createMember = async (req, res, next) => {
  try {
    const {
      name,
      tag,
      gender,
      birthOrder,
      orderLabel,
      dateOfBirth,
      deathDate,
      photo,
      bio,
      position,
    } = req.body;
    const member = await Member.create({
      userId: req.user._id,
      name,
      tag,
      gender,
      birthOrder,
      orderLabel,
      dateOfBirth,
      deathDate,
      photo,
      bio,
      position,
    });
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/members/:id — update a member the user owns. */
export const updateMember = async (req, res, next) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      userId: req.user._id, // ownership scope
    });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const fields = [
      "name",
      "tag",
      "gender",
      "birthOrder",
      "orderLabel",
      "dateOfBirth",
      "deathDate",
      "photo",
      "bio",
      "position",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) member[f] = req.body[f];
    }

    await member.save();
    res.json(member);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/members/:id
 * Remove a member and cascade-delete any relationships referencing it.
 */
export const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!member) return res.status(404).json({ message: "Member not found" });

    await Relationship.deleteMany({
      userId: req.user._id,
      $or: [{ fromMemberId: member._id }, { toMemberId: member._id }],
    });

    res.json({ message: "Member deleted", _id: member._id });
  } catch (err) {
    next(err);
  }
};
