import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Lets tests import app modules via the "@/" alias used throughout the app.
export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, ".") } },
  // The Expo app in mobile/ is a standalone project with its own test setup.
  test: { exclude: ["**/node_modules/**", "mobile/**"] },
});
