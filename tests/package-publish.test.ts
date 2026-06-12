import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

type PackFile = {
  path: string;
};

describe("npm package publishing", () => {
  test("packs the built dist surface without workspace sources", async () => {
    const { stdout } = await execFileAsync("npm", [
      "pack",
      "--dry-run",
      "--json",
    ]);
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
    expect(filePaths).toContain("dist/packages/core/src/render.js");
    expect(filePaths).toContain("dist/packages/core/src/compat/vanjs-core.js");
    expect(filePaths).toContain("dist/packages/core/src/compat/vanjs-ext.js");
    expect(filePaths).toContain("dist/packages/core/src/compat/bun-preload.js");
    expect(filePaths).toContain(
      "dist/packages/core/src/compat/node-register.js",
    );
    expect(filePaths).toContain("dist/packages/compiler/src/index.js");
    expect(filePaths).toContain("dist/packages/csr/src/index.js");
    expect(filePaths).toContain("dist/packages/ssr/src/index.js");
    expect(filePaths).toContain("dist/packages/ssg/src/index.js");
    expect(filePaths).toContain("dist/packages/vite/src/index.js");
    expect(filePaths).toContain("dist/packages/vite/src/client.js");
    expect(filePaths).toContain("dist/packages/vite/src/client.d.ts");
    expect(filePaths.some((path) => path.startsWith("packages/"))).toBe(false);
    expect(filePaths.some((path) => path.startsWith("tests/"))).toBe(false);
    expect(filePaths.some((path) => path.startsWith("demo/"))).toBe(false);
  });

  test("keeps CSR bundle on real browser Van without CSR compat aliases or VanX", () => {
    const csrBundle = readFileSync("dist/packages/csr/src/index.js", "utf8");
    const renderBundle = readFileSync(
      "dist/packages/core/src/render.js",
      "utf8",
    );

    expect(csrBundle).toContain("vanjs-core");
    expect(csrBundle).not.toContain("vanjs-ext");
    expect(csrBundle).not.toContain("actual-vanjs-core");
    expect(csrBundle).not.toContain("actual-vanjs-ext");
    expect(renderBundle).not.toContain("vanX");
  });
});
