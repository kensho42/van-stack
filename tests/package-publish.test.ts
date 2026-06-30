import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

type PackFile = {
  path: string;
};

describe("npm package publishing", () => {
  test("packs the built dist surface without workspace sources", async () => {
    const npmCache = await mkdtemp(join(tmpdir(), "van-stack-npm-cache-"));

    try {
      const { stdout } = await execFileAsync(
        "npm",
        ["pack", "--dry-run", "--json", "--ignore-scripts"],
        {
          env: {
            ...process.env,
            npm_config_cache: npmCache,
          },
        },
      );
      const packResult = JSON.parse(stdout) as Array<{
        name: string;
        version: string;
        files: PackFile[];
      }>;
      const packageInfo = packResult[0];
      const rootPackage = JSON.parse(readFileSync("package.json", "utf8")) as {
        version: string;
      };

      expect(packageInfo).toBeTruthy();
      if (!packageInfo) {
        throw new Error("npm pack did not return package metadata.");
      }

      const filePaths = packageInfo.files.map((file) =>
        file.path.replace(/^package\//, ""),
      );

      expect(packageInfo.name).toBe("van-stack");
      expect(packageInfo.version).toBe(rootPackage.version);
      expect(filePaths).toContain("README.md");
      expect(filePaths).toContain("compat/bun-tsconfig.json");
      expect(filePaths).toContain("dist/packages/core/src/index.js");
      expect(filePaths).toContain("dist/packages/core/src/index.d.ts");
      expect(filePaths).not.toContain("dist/packages/core/src/render.js");
      expect(filePaths).toContain("dist/packages/core/src/compat/van-env.js");
      expect(filePaths).toContain(
        "dist/packages/core/src/compat/vanjs-core.js",
      );
      expect(filePaths).toContain("dist/packages/core/src/compat/vanjs-ext.js");
      expect(filePaths).toContain(
        "dist/packages/core/src/compat/bun-preload.js",
      );
      expect(filePaths).toContain(
        "dist/packages/core/src/compat/node-register.js",
      );
      expect(filePaths).toContain("dist/packages/compiler/src/index.js");
      expect(filePaths).toContain("dist/packages/csr/src/index.js");
      expect(filePaths).toContain("dist/packages/csr/src/router.js");
      expect(filePaths).toContain("dist/packages/csr/src/stack.js");
      expect(filePaths).toContain("dist/packages/ssr/src/index.js");
      expect(filePaths).toContain("dist/packages/ssg/src/index.js");
      expect(filePaths).toContain("dist/packages/vite/src/index.js");
      expect(filePaths).toContain("dist/packages/vite/src/client.js");
      expect(filePaths).toContain("dist/packages/vite/src/client.d.ts");
      expect(filePaths.some((path) => path.startsWith("packages/"))).toBe(
        false,
      );
      expect(filePaths.some((path) => path.startsWith("tests/"))).toBe(false);
      expect(filePaths.some((path) => path.startsWith("demo/"))).toBe(false);
    } finally {
      await rm(npmCache, { recursive: true, force: true });
    }
  });

  test("keeps CSR bundle free of VanStack render and compat aliases", () => {
    const csrBundle = readFileSync("dist/packages/csr/src/index.js", "utf8");

    expect(csrBundle).not.toContain("vanjs-ext");
    expect(csrBundle).not.toContain("actual-vanjs-core");
    expect(csrBundle).not.toContain("actual-vanjs-ext");
    expect(csrBundle).not.toContain("van-stack/render");
    expect(csrBundle).not.toContain("bindRenderEnv");
    expect(csrBundle).not.toContain("__VAN_STACK_NATIVE_NAV_SENTINEL__");

    const stackBundle = readFileSync("dist/packages/csr/src/stack.js", "utf8");
    expect(stackBundle).toContain("__VAN_STACK_NATIVE_NAV_SENTINEL__");
  });
});
