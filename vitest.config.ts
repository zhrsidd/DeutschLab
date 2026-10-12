import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.ts so the Tauri dev-server settings and the
// Tailwind plugin stay out of the unit-test pipeline.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    restoreMocks: true,
    // user-event flows through whole lessons are slow under jsdom.
    testTimeout: 30_000,
  },
});
