import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = new URL("../../", import.meta.url);
const runtimeCheckPath = new URL(
  "../fixtures/runtime-app/runtime-check.ts",
  import.meta.url,
);
const bunPreloadPath = new URL(
  "../../packages/core/src/compat/bun-preload.ts",
  import.meta.url,
);
const nodeRegisterPath = new URL(
  "../../packages/core/src/compat/node-register.ts",
  import.meta.url,
);

function parseResult(stdout: string) {
  return JSON.parse(stdout) as {
    routeIds: string[];
    ssr: string;
    ssg: string | null;
  };
}

describe("runtime compatibility hooks", () => {
  test.skip("bun preload resolves third-party van imports for loadRoutes, SSR, and SSG", async () => {
    const { stdout } = await execFileAsync(
      "bun",
      ["--preload", bunPreloadPath.pathname, runtimeCheckPath.pathname],
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
      ["--import", nodeRegisterPath.pathname, runtimeCheckPath.pathname],
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
