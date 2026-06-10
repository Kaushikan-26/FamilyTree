import { Router } from "express";
import { body } from "express-validator";
import {
  getRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  findRelationship,
} from "../controllers/relationshipController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { RELATIONSHIP_TYPES } from "../models/Relationship.js";

const router = Router();

router.use(protect);

const relationshipRules = [
  body("fromMemberId").notEmpty().withMessage("fromMemberId is required"),
  body("toMemberId").notEmpty().withMessage("toMemberId is required"),
  body("relationshipType")
    .isIn(RELATIONSHIP_TYPES)
    .withMessage(`relationshipType must be one of: ${RELATIONSHIP_TYPES.join(", ")}`),
];

router
  .route("/")
  .get(getRelationships)
  .post(relationshipRules, validate, createRelationship);

// Relationship Finder — inferred relationship between two members
router.get("/between/:aId/:bId", findRelationship);

// Validate just the type for updates (members don't change)
const typeRule = [
  body("relationshipType")
    .isIn(RELATIONSHIP_TYPES)
    .withMessage(`relationshipType must be one of: ${RELATIONSHIP_TYPES.join(", ")}`),
];

router
  .route("/:id")
  .put(typeRule, validate, updateRelationship)
  .delete(deleteRelationship);

export default router;
