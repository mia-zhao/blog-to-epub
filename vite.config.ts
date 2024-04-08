import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ManifestV3Export, crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest: manifest as ManifestV3Export })],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
