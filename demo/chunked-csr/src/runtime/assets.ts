import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { writeRouteManifest } from "van-stack/compiler";

const execFileAsync = promisify(execFile);

type ChunkedCsrAssetPath =
  | "/assets/chunked-csr-hydrated.js"
  | "/assets/chunked-csr-shell.js"
  | "/assets/chunked-csr-custom.js"
  | `/assets/${string}`;

const assetEntrypoints = {
  "/assets/chunked-csr-hydrated.js": fileURLToPath(
    new URL("../client/chunked-csr-hydrated.ts", import.meta.url),
  ),
  "/assets/chunked-csr-shell.js": fileURLToPath(
    new URL("../client/chunked-csr-shell.ts", import.meta.url),
  ),
  "/assets/chunked-csr-custom.js": fileURLToPath(
    new URL("../client/chunked-csr-custom.ts", import.meta.url),
  ),
} satisfies Record<
  | "/assets/chunked-csr-hydrated.js"
  | "/assets/chunked-csr-shell.js"
  | "/assets/chunked-csr-custom.js",
  string
>;

const routesRoot = fileURLToPath(new URL("../routes", import.meta.url));

let assetsPromise: Promise<Map<ChunkedCsrAssetPath, string>> | null = null;

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

async function buildChunkedCsrAssets() {
  await writeRouteManifest({
    root: routesRoot,
    chunkedRoutes: true,
  });
  const outdir = await mkdtemp(join(tmpdir(), "van-stack-chunked-csr-"));

  try {
    await execFileAsync("bun", [
      "build",
      ...Object.values(assetEntrypoints),
      `--outdir=${outdir}`,
      "--target=browser",
      "--format=esm",
      "--splitting",
      "--entry-naming=[name].js",
      "--chunk-naming=chunk-[name]-[hash].js",
    ]);

    const assets = new Map<ChunkedCsrAssetPath, string>();

    for (const file of await collectFiles(outdir)) {
      assets.set(`/assets/${basename(file)}`, await readFile(file, "utf8"));
    }

    return assets;
  } finally {
    await rm(outdir, { force: true, recursive: true });
  }
}

export function warmChunkedCsrAssets() {
  if (!assetsPromise) {
    assetsPromise = buildChunkedCsrAssets();
  }

  return assetsPromise;
}

export async function getChunkedCsrAsset(pathname: string) {
  const assets = await warmChunkedCsrAssets();
  return assets.get(pathname as ChunkedCsrAssetPath) ?? null;
}

export async function createChunkedCsrAssetResponse(pathname: string) {
  const asset = await getChunkedCsrAsset(pathname);

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
