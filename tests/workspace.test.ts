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

  test("exports the compiler from the root package instead of a separate package", () => {
    const rootPackage = JSON.parse(readFileSync("package.json", "utf8")) as {
      exports?: Record<string, string>;
    };

    expect(rootPackage.exports?.["./compiler"]).toBe(
      "./packages/compiler/src/index.ts",
    );
    expect(existsSync("packages/compiler/package.json")).toBe(false);
  });

  test("documents project guidance for coding agents", () => {
    const agents = readFileSync("AGENTS.md", "utf8");

    expect(agents).toContain("van-stack");
    expect(agents).toContain("van-stack/compiler");
    expect(agents).toContain("loadRoutes");
    expect(agents).toContain("README.md");
    expect(agents).toContain("docs/");
    expect(agents).toContain("demo/");
    expect(agents).toContain("bun run test");
    expect(agents).toContain("bun run check");
    expect(agents).toContain("bun run build");
  });
});
