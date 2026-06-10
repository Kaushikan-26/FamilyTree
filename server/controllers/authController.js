import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

/**
 * POST /api/auth/register
 * Create a new user. Password hashing happens in the User pre-save hook.
 */
export const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const user = await User.create({ username, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Verify credentials and return a JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      // Same message for both cases to avoid leaking which usernames exist
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};
