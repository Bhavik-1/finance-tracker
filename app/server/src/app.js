import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import morgan from "morgan";

import { appConfig, isProduction } from "./config/env.js";
import { isDatabaseConnected } from "./config/db.js";
import { clientDistPath } from "./config/paths.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import budgetRoutes from "./routes/budget.routes.js";

const app = express();
const hasClientBuild = fs.existsSync(clientDistPath);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin?.replace(/\/$/, "");
      if (!normalizedOrigin || appConfig.corsOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? "combined" : "dev"));

app.get("/api", (_req, res) => {
  res.json({ message: "Expense Tracker API is running" });
});

app.use("/api/health", healthRoutes);
app.use("/api", (req, res, next) => {
  if (isDatabaseConnected()) {
    return next();
  }

  return res.status(503).json({
    message: "Database is unavailable. Please try again shortly.",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budget", budgetRoutes);

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({ message: "Expense Tracker API is running" });
  });
}

export default app;
