import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/rpc": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths({
      projects: [path.resolve(__dirname, "tsconfig.json")],
    }),
    checker({ typescript: true }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: { globPatterns: ["**/*.{js,css}"] },
      manifest: {
        id: "tn.back-n-soft.homelab-homepage",
        name: "Homepage",
        short_name: "Homepage",
        description: "Homepage",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "512x512",
            purpose: "maskable",
          },
        ],
        display: "standalone",
        theme_color: "#0f172a",
        orientation: "any",
        start_url: "/",
        scope: "/",
      },
    }),
  ],
});
