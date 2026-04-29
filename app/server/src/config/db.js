import mongoose from "mongoose";
import { appConfig } from "./env.js";

mongoose.set("bufferCommands", false);

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const connectDatabase = async () => {
  const uri = appConfig.mongoUri;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment variables.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 4000,
  });
  console.log("MongoDB connected");
};

export default connectDatabase;
