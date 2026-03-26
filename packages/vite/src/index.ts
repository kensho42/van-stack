import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Alias, Plugin } from "vite";

export const vitePackageName = "van-stack/vite";

function resolveCompatPath(relativePath: string) {
  const basePath = fileURLToPath(new URL(relativePath, import.meta.url));

  for (const extension of [".js", ".ts", ".tsx", ".mjs"]) {
    const candidate = `${basePath}${extension}`;
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return basePath;
}

export function getVanStackCompatAliases(): Alias[] {
  return [
    {
      find: "vanjs-core",
      replacement: resolveCompatPath("../../core/src/compat/vanjs-core"),
    },
    {
      find: "vanjs-ext",
      replacement: resolveCompatPath("../../core/src/compat/vanjs-ext"),
    },
  ];
}

export function vanStackVite(): Plugin {
  return {
    name: "van-stack:compat-aliases",
    config() {
      return {
        resolve: {
          alias: getVanStackCompatAliases(),
        },
      };
    },
  };
}
