import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    // Owner of this member record — every query is scoped to this field
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    // Short label shown as the card heading (e.g. "Grandfather", "Self", "Aunt")
    tag: {
      type: String,
      default: "",
      trim: true,
      maxlength: [40, "Tag must be at most 40 characters"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    dateOfBirth: {
      type: Date,
    },
    // Date of death (optional) — left empty for living members
    deathDate: {
      type: Date,
    },
    // Optional fields
    photo: {
      type: String, // URL or base64 data URI (uploaded from device)
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio must be at most 500 characters"],
    },
    // Persisted React Flow node position so the layout survives reloads
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);
export default Member;
