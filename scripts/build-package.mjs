import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const declarationEntries = ["tsconfig.build.json"];
const buildEntries = [
  ["packages/core/src/index.ts", "dist/packages/core/src/index.js"],
  ["packages/core/src/render.ts", "dist/packages/core/src/render.js"],
  [
    "packages/core/src/compat/vanjs-core.ts",
    "dist/packages/core/src/compat/vanjs-core.js",
  ],
  [
    "packages/core/src/compat/vanjs-ext.ts",
    "dist/packages/core/src/compat/vanjs-ext.js",
  ],
  [
    "packages/core/src/compat/bun-preload.ts",
    "dist/packages/core/src/compat/bun-preload.js",
  ],
  [
    "packages/core/src/compat/node-register.ts",
    "dist/packages/core/src/compat/node-register.js",
  ],
  ["packages/compiler/src/index.ts", "dist/packages/compiler/src/index.js"],
  ["packages/csr/src/index.ts", "dist/packages/csr/src/index.js"],
  ["packages/ssr/src/index.ts", "dist/packages/ssr/src/index.js"],
  ["packages/ssg/src/index.ts", "dist/packages/ssg/src/index.js"],
  ["packages/vite/src/index.ts", "dist/packages/vite/src/index.js"],
];

async function main() {
  process.chdir(repoRoot);
  await rm("dist", { recursive: true, force: true });

  for (const entry of declarationEntries) {
    await execFileAsync("bun", ["x", "tsc", "-p", entry], {
      cwd: repoRoot,
    });
  }

  for (const [entrypoint, outfile] of buildEntries) {
    const result = await Bun.build({
      entrypoints: [entrypoint],
      external: [
        "actual-vanjs-core",
        "actual-vanjs-ext",
        "mini-van-plate",
        "vite",
        "van-stack/render",
        "van-stack/ssr",
      ],
      format: "esm",
      minify: false,
      outfile,
      splitting: false,
      target: "node",
    });

    if (!result.success) {
      const message = result.logs.map((log) => log.message).join("\n");
      throw new Error(`Bundle build failed for ${entrypoint}\n${message}`);
    }

    const output = result.outputs[0];
    if (!output) {
      throw new Error(`Bundle build produced no output for ${entrypoint}.`);
    }

    await mkdir(dirname(outfile), { recursive: true });
    await writeFile(outfile, await output.text(), "utf8");
  }
}

await main();
