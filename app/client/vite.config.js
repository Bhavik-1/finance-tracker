import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../../", "");
  const apiTarget = env.VITE_DEV_API_URL || "http://localhost:5000";
  const clientPort = Number(env.CLIENT_PORT) || 5173;

  return {
    plugins: [react()],
    envDir: "../../",
    server: {
      port: clientPort,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: clientPort,
    },
  };
});
