import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  const env = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env;
  const isGitHubPagesBuild = env?.GITHUB_ACTIONS === "true";
  const base = isGitHubPagesBuild ? "/lagerkontrolle/" : "/";

  return {
    base,
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            ionic: ["@ionic/react", "@ionic/pwa-elements", "ionicons"],
            storage: ["dexie"]
          }
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png"],
        manifest: {
          name: "Lagerkontrolle",
          short_name: "Lager",
          description: "Offline-first Lagerkontrolle fuer Orte, Regale, Laden und Ablaufwarnungen.",
          theme_color: "#1b4332",
          background_color: "#f6f3eb",
          display: "standalone",
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}pwa-192.png`,
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: `${base}pwa-512.png`,
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: `${base}pwa-512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      })
    ]
  };
});
