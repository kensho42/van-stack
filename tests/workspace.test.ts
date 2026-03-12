import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";

const requiredFiles = [
  "packages/core/src/index.ts",
  "packages/compiler/src/index.ts",
  "packages/csr/src/index.ts",
  "packages/ssr/src/index.ts",
  "packages/ssg/src/index.ts",
  "packages/vite/src/index.ts",
];

describe("workspace layout", () => {
  test("creates the planned package entrypoints", () => {
    for (const file of requiredFiles) {
      expect(existsSync(file)).toBe(true);
    }
  });
});
