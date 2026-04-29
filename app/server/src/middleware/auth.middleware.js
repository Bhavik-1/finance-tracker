import jwt from "jsonwebtoken";
import { appConfig } from "../config/env.js";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token is missing." });
    }

    const token = authHeader.split(" ")[1];
    const secret = appConfig.jwtSecret;

    if (!secret) {
      return res.status(500).json({ message: "JWT configuration is missing." });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default authMiddleware;
