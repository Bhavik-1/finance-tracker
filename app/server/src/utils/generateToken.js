import jwt from "jsonwebtoken";
import { appConfig } from "../config/env.js";

const generateToken = (userId) => {
  const secret = appConfig.jwtSecret;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: "7d",
  });
};

export default generateToken;
