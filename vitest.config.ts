import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import vite from "./vite.config";
export default mergeConfig(
  vite,
  defineConfig({ test: { include: ["src/**/*.test.ts"] } }),
);
