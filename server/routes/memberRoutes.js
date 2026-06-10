import { Router } from "express";
import { body } from "express-validator";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Every member route requires authentication
router.use(protect);

const memberRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  body("dateOfBirth")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid date of birth"),
  body("deathDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid death date"),
];

router.route("/").get(getMembers).post(memberRules, validate, createMember);

router
  .route("/:id")
  .put(memberRules, validate, updateMember)
  .delete(deleteMember);

export default router;
