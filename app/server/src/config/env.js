import path from "path";
import dotenv from "dotenv";
import { workspaceRoot } from "./paths.js";

dotenv.config({ path: path.resolve(workspaceRoot, ".env") });

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");

const parseOrigins = (value) => {
  const configured = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  const defaults = ["http://localhost:5173", "http://localhost:5000"];
  return Array.from(new Set([...defaults, ...configured]));
};

export const appConfig = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN || "http://localhost:5173"),
});

export const isProduction = appConfig.nodeEnv === "production";

export const assertRequiredConfig = () => {
  const requiredEntries = {
    MONGODB_URI: appConfig.mongoUri,
    JWT_SECRET: appConfig.jwtSecret,
  };

  const missing = Object.entries(requiredEntries)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
