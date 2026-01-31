import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@server": path.resolve(__dirname, "server"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./client/src/test/setup.ts"],
  },
});
