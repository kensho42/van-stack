import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { buildRouteManifest, writeRouteManifest } from "van-stack/compiler";

type ShowcaseAssetPath =
  | "/assets/showcase-hydrated.js"
  | "/assets/showcase-islands.js"
  | "/assets/showcase-shell.js"
  | "/assets/showcase-custom.js"
  | "/assets/showcase-chunked.js"
  | `/assets/${string}`;

const assetEntrypoints = {
  "/assets/showcase-hydrated.js": fileURLToPath(
    new URL("../client/hydrated.ts", import.meta.url),
  ),
  "/assets/showcase-islands.js": fileURLToPath(
    new URL("../client/islands.ts", import.meta.url),
  ),
  "/assets/showcase-shell.js": fileURLToPath(
    new URL("../client/shell.ts", import.meta.url),
  ),
  "/assets/showcase-custom.js": fileURLToPath(
    new URL("../client/custom.ts", import.meta.url),
  ),
  "/assets/showcase-chunked.js": fileURLToPath(
    new URL("../client/chunked.ts", import.meta.url),
  ),
} satisfies Record<ShowcaseAssetPath, string>;

let assetsPromise: Promise<Map<ShowcaseAssetPath, string>> | null = null;
const execFileAsync = promisify(execFile);
const routesRoot = fileURLToPath(new URL("../routes", import.meta.url));
const chunkedBrowserRoutesManifestPath = join(
  routesRoot,
  "..",
  "..",
  ".van-stack",
  "routes.chunked.generated.ts",
);

async function getBunBuild() {
  const bunGlobal = (
    globalThis as {
      Bun?: { build?: (options: object) => Promise<unknown> };
    }
  ).Bun;

  if (typeof bunGlobal?.build === "function") {
    return bunGlobal.build.bind(bunGlobal);
  }

  const bunModule = (await Function('return import("bun")')()) as {
    build?: (options: object) => Promise<unknown>;
  };

  if (typeof bunModule.build === "function") {
    return bunModule.build;
  }

  throw new Error("Bun.build is unavailable in the current runtime.");
}

async function buildAsset(entrypoint: string) {
  try {
    const build = await getBunBuild();
    const result = await build({
      entrypoints: [entrypoint],
      format: "esm",
      minify: false,
      splitting: false,
      target: "browser",
      write: false,
    });

    const typedResult = result as {
      logs: Array<{ message: string }>;
      outputs: Array<{ text: () => Promise<string> }>;
      success: boolean;
    };

    if (!typedResult.success) {
      throw new Error(
        `Showcase asset build failed for ${entrypoint}: ${typedResult.logs
          .map((log) => log.message)
          .join("; ")}`,
      );
    }

    const output = typedResult.outputs[0];
    if (!output) {
      throw new Error(
        `Showcase asset build produced no output for ${entrypoint}.`,
      );
    }

    return await output.text();
  } catch {
    const outdir = await mkdtemp(join(tmpdir(), "van-stack-showcase-"));
    const outfile = join(outdir, `${basename(entrypoint, ".ts")}.js`);

    try {
      await execFileAsync("bun", [
        "build",
        entrypoint,
        "--outfile",
        outfile,
        "--target=browser",
        "--format=esm",
      ]);
      return await readFile(outfile, "utf8");
    } finally {
      await rm(outdir, { force: true, recursive: true });
    }
  }
}

async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const resolved = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(resolved)));
      continue;
    }

    files.push(resolved);
  }

  return files.sort();
}

async function collectRouteSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const resolved = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectRouteSourceFiles(resolved)));
      continue;
    }

    if (resolved.endsWith(".ts")) {
      files.push(resolved);
    }
  }

  return files.sort();
}

async function buildChunkedAsset(entrypoint: string) {
  await writeRouteManifest({ root: routesRoot });

  const chunkedRouteFiles = await collectRouteSourceFiles(
    join(routesRoot, "gallery", "chunked"),
  );
  const browserManifest = await buildRouteManifest({
    filePaths: chunkedRouteFiles,
    outFile: chunkedBrowserRoutesManifestPath,
    root: routesRoot,
  });
  await writeFile(
    chunkedBrowserRoutesManifestPath,
    browserManifest.code,
    "utf8",
  );

  const outdir = await mkdtemp(join(tmpdir(), "van-stack-showcase-"));

  try {
    await execFileAsync("bun", [
      "build",
      entrypoint,
      `--outdir=${outdir}`,
      "--target=browser",
      "--format=esm",
      "--splitting",
      "--entry-naming=showcase-chunked.js",
      "--chunk-naming=chunk-[name]-[hash].js",
    ]);

    const assets = new Map<string, string>();
    for (const file of await collectFiles(outdir)) {
      assets.set(`/assets/${basename(file)}`, await readFile(file, "utf8"));
    }

    return assets;
  } finally {
    await rm(outdir, { force: true, recursive: true });
  }
}

async function buildShowcaseAssets() {
  const assets = new Map<ShowcaseAssetPath, string>();

  for (const [pathname, entrypoint] of Object.entries(
    assetEntrypoints,
  ) as Array<[ShowcaseAssetPath, string]>) {
    if (pathname === "/assets/showcase-chunked.js") {
      const chunkedAssets = await buildChunkedAsset(entrypoint);
      for (const [chunkPath, chunkSource] of chunkedAssets) {
        assets.set(chunkPath as ShowcaseAssetPath, chunkSource);
      }
      continue;
    }

    assets.set(pathname, await buildAsset(entrypoint));
  }

  return assets;
}

export function warmShowcaseAssets() {
  if (!assetsPromise) {
    assetsPromise = buildShowcaseAssets();
  }

  return assetsPromise;
}

export async function getShowcaseAsset(pathname: string) {
  const assets = await warmShowcaseAssets();
  return assets.get(pathname as ShowcaseAssetPath) ?? null;
}

export async function createShowcaseAssetResponse(pathname: string) {
  const asset = await getShowcaseAsset(pathname);
  if (!asset) {
    return null;
  }

  return new Response(asset, {
    status: 200,
    headers: {
      "content-type": "text/javascript; charset=utf-8",
    },
  });
}
