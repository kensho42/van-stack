import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

describe("ssg site demo export", () => {
  test("build.ts writes a runnable static dist tree", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "van-stack-ssg-site-demo-"));
    const outDir = join(tempRoot, "dist");

    try {
      await execFileAsync("bun", ["./demo/ssg-site/build.ts"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          VAN_STACK_SSG_OUT_DIR: outDir,
        },
      });

      expect(await readFile(join(outDir, "index.html"), "utf8")).toContain(
        "SSG Export Demo",
      );
      expect(
        await readFile(
          join(outDir, "posts", "launch-week", "index.html"),
          "utf8",
        ),
      ).toContain("Launch Week");
      expect(await readFile(join(outDir, "robots.txt"), "utf8")).toContain(
        "User-agent: *",
      );
      expect(
        await readFile(join(outDir, "assets", "site.css"), "utf8"),
      ).toContain("font-family");
      expect(
        await readFile(join(outDir, "assets", "images", "pattern.txt"), "utf8"),
      ).toContain("northstar-grid");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
