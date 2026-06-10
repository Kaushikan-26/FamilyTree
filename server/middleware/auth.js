import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Auth middleware.
 * Verifies the Bearer JWT, loads the user, and attaches it to req.user.
 * Any route mounted behind this is only reachable by an authenticated user,
 * and downstream handlers scope all DB queries to req.user._id.
 */
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user without the password hash
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
