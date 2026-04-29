import "./config/env.js";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import { appConfig, assertRequiredConfig } from "./config/env.js";

const DB_RETRY_MS = 5000;

const connectWithRetry = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.log(`Retrying MongoDB connection in ${DB_RETRY_MS / 1000}s...`);
    setTimeout(connectWithRetry, DB_RETRY_MS);
  }
};

const startServer = async () => {
  try {
    assertRequiredConfig();
    app.listen(appConfig.port, () => {
      console.log(`Server running on http://localhost:${appConfig.port}`);
    });
    connectWithRetry();
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
