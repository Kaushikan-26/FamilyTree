import { validationResult } from "express-validator";

/**
 * Collects express-validator errors and returns a 400 with the first message.
 * Mount after a chain of validation rules on a route.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};
