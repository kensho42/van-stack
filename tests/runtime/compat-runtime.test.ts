import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = new URL("../../", import.meta.url);
const runtimeCheckPath = new URL(
  "../fixtures/runtime-app/runtime-check.ts",
  import.meta.url,
);
const bunTsconfigPath = new URL(
  "../../compat/bun-tsconfig.json",
  import.meta.url,
);
const bunCompatPath = fileURLToPath(
  new URL("../../packages/core/src/compat/vanjs-core.ts", import.meta.url),
);

function parseResult(stdout: string) {
  return JSON.parse(stdout) as {
    routeIds: string[];
    ssr: string;
    ssg: string | null;
  };
}

describe("runtime compatibility hooks", () => {
  test("bun tsconfig example can extend the shipped compat config from node_modules", async () => {
    const appRoot = await mkdtemp(join(tmpdir(), "van-stack-bun-app-"));

    try {
      await mkdir(join(appRoot, "node_modules"));
      await symlink(
        repoRoot.pathname,
        join(appRoot, "node_modules", "van-stack"),
      );
      await writeFile(join(appRoot, "package.json"), '{"type":"module"}\n');
      await writeFile(
        join(appRoot, "tsconfig.bun.json"),
        [
          "{",
          '  "extends": "./node_modules/van-stack/compat/bun-tsconfig.json"',
          "}",
          "",
        ].join("\n"),
      );
      await writeFile(
        join(appRoot, "index.ts"),
        [
          "import van from 'vanjs-core';",
          "console.log(",
          "  van ===",
          `    (await import(${JSON.stringify(bunCompatPath)})).default`,
          "    ? 'compat'",
          "    : 'direct',",
          ");",
          "",
        ].join("\n"),
      );

      const { stdout } = await execFileAsync(
        "bun",
        ["run", "--tsconfig-override", "./tsconfig.bun.json", "./index.ts"],
        {
          cwd: appRoot,
        },
      );

      expect(stdout.trim().split("\n")[0]).toBe("compat");
    } finally {
      await rm(appRoot, { recursive: true, force: true });
    }
  });

  test("bun tsconfig override resolves third-party van imports for loadRoutes, SSR, and SSG", async () => {
    const { stdout } = await execFileAsync(
      "bun",
      [
        "run",
        "--tsconfig-override",
        bunTsconfigPath.pathname,
        runtimeCheckPath.pathname,
      ],
      {
        cwd: repoRoot,
      },
    );
    const result = parseResult(stdout);

    expect(result.routeIds).toEqual(["csr", "ssg", "ssr"]);
    expect(result.ssr).toContain('data-third-party-card=""');
    expect(result.ssr).toContain("Third-party SSR compatibility");
    expect(result.ssg).toContain('data-third-party-reactive=""');
  });

  test("node register resolves third-party van imports for loadRoutes, SSR, and SSG", async () => {
    const { stdout } = await execFileAsync(
      "node",
      ["--import", "van-stack/compat/node-register", runtimeCheckPath.pathname],
      {
        cwd: repoRoot,
      },
    );
    const result = parseResult(stdout);

    expect(result.routeIds).toEqual(["csr", "ssg", "ssr"]);
    expect(result.ssr).toContain('data-third-party-card=""');
    expect(result.ssr).toContain("Third-party SSR compatibility");
    expect(result.ssg).toContain('data-third-party-reactive=""');
  });
});
