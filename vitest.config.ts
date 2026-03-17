import { defineConfig } from "vitest/config";

import { getVanStackCompatAliases } from "./packages/vite/src/index";

export default defineConfig({
  resolve: {
    alias: getVanStackCompatAliases(),
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
