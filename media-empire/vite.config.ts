import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: { engine: ["three"], ui: ["react", "react-dom"] },
      },
    },
  },
});
