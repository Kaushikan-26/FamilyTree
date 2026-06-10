import { Router } from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Shared validation rules for credentials
const credentialRules = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

router.post("/register", credentialRules, validate, register);
router.post("/login", credentialRules, validate, login);

export default router;
