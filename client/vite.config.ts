// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      // Assicurati che il service worker sia copiato
      input: {
        main: path.resolve(__dirname, "index.html"),
        sw: path.resolve(__dirname, "public/firebase-messaging-sw.js"),
      },
    },
  },
  // Copia file statici nella root del build
  publicDir: "public",
});