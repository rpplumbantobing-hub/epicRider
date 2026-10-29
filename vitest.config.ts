// Konfigurasi Vitest — epicRider (Phase 3; diperbarui Phase 4).
// Lingkungan jsdom untuk unit + component test; file integration meng-override
// ke node via anotasi `// @vitest-environment node` dan memakai helper database
// test terisolasi (tests/integration/test-db.ts).

import { fileURLToPath } from "node:url";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
