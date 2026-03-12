import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import { isRouteFileKind } from "./fs-routes";

type DiscoverRoutesOptions = {
  root: string;
};

function toRouteFileKind(fileName: string): string | null {
  const match = /^(.*)\.(ts|tsx)$/.exec(fileName);
  if (!match) return null;

  return match[1];
}

async function walkDirectory(currentDir: string, result: string[]) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const sortedEntries = [...entries].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of sortedEntries) {
    if (entry.name.startsWith("_")) continue;

    const entryPath = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(entryPath, result);
      continue;
    }

    const routeFileKind = toRouteFileKind(entry.name);
    if (!routeFileKind || !isRouteFileKind(routeFileKind)) continue;

    result.push(entryPath);
  }
}

export async function discoverRoutes(options: DiscoverRoutesOptions) {
  const root = resolve(options.root);
  const result: string[] = [];

  await walkDirectory(root, result);

  return result.sort((a, b) => {
    const depthDifference = a.split("/").length - b.split("/").length;
    return depthDifference !== 0 ? depthDifference : a.localeCompare(b);
  });
}
