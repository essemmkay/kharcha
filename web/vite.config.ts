import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Kharcha",
        short_name: "Kharcha",
        description: "Personal finance tracker",
        theme_color: "#4F46E5",
        background_color: "#F4F5FA",
        display: "standalone",
        start_url: "/",
        icons: [
          // ponytail: single maskable SVG icon. Swap for real PNG 192/512 before ship.
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
