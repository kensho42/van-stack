import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const requiredFiles = [
  "AGENTS.md",
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

  test("documents project guidance for coding agents", () => {
    const agents = readFileSync("AGENTS.md", "utf8");

    expect(agents).toContain("van-stack");
    expect(agents).toContain("loadRoutes");
    expect(agents).toContain("README.md");
    expect(agents).toContain("docs/");
    expect(agents).toContain("demo/");
    expect(agents).toContain("bun run test");
    expect(agents).toContain("bun run check");
    expect(agents).toContain("bun run build");
  });
});
