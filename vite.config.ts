/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/v1/systemone": {
        target: "https://api.typesafe.ai",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
