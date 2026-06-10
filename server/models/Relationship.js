import mongoose from "mongoose";
import { RELATIONSHIP_TYPES } from "../utils/relationshipTypes.js";

// Re-export so existing imports (routes) keep working
export { RELATIONSHIP_TYPES };

const relationshipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fromMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    toMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    relationshipType: {
      type: String,
      enum: RELATIONSHIP_TYPES,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate relationships of the same type/direction for one user
relationshipSchema.index(
  { userId: 1, fromMemberId: 1, toMemberId: 1, relationshipType: 1 },
  { unique: true }
);

const Relationship = mongoose.model("Relationship", relationshipSchema);
export default Relationship;
