import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Runs the ported pure-logic tests (money, local-queries). These modules have no
// React Native / Expo imports, so they run under plain Node. The "@/" alias
// matches the app's tsconfig paths.
export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  test: { include: ["src/**/*.test.ts"] },
});
