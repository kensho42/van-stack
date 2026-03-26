import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const requiredFiles = [
  "AGENTS.md",
  "compat/bun-tsconfig.json",
  "scripts/build-package.mjs",
  "tsconfig.build.json",
  "packages/core/src/index.ts",
  "packages/core/src/compat/vanjs-core.ts",
  "packages/core/src/compat/vanjs-ext.ts",
  "packages/core/src/compat/bun-preload.ts",
  "packages/core/src/compat/node-register.ts",
  "packages/compiler/src/index.ts",
  "packages/csr/src/index.ts",
  "packages/ssr/src/index.ts",
  "packages/ssg/src/index.ts",
  "packages/third-party-lib/src/index.ts",
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
      private?: boolean;
      files?: string[];
      exports?: Record<string, string>;
    };

    expect(rootPackage.private).toBe(false);
    expect(rootPackage.files).toEqual(
      expect.arrayContaining(["dist", "README.md", "compat"]),
    );
    expect(rootPackage.exports?.["./compiler"]).toBe(
      "./dist/packages/compiler/src/index.js",
    );
    expect(rootPackage.exports?.["./compat/vanjs-core"]).toBe(
      "./dist/packages/core/src/compat/vanjs-core.js",
    );
    expect(rootPackage.exports?.["./compat/vanjs-ext"]).toBe(
      "./dist/packages/core/src/compat/vanjs-ext.js",
    );
    expect(rootPackage.exports?.["./compat/bun-preload"]).toBe(
      "./dist/packages/core/src/compat/bun-preload.js",
    );
    expect(rootPackage.exports?.["./compat/node-register"]).toBe(
      "./dist/packages/core/src/compat/node-register.js",
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
