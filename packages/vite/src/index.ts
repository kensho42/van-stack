import { fileURLToPath } from "node:url";

import type { Alias, Plugin } from "vite";

export const vitePackageName = "van-stack/vite";

function resolveCompatPath(relativePath: string) {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}

export function getVanStackCompatAliases(): Alias[] {
  return [
    {
      find: "vanjs-core",
      replacement: resolveCompatPath("../../core/src/compat/vanjs-core.ts"),
    },
    {
      find: "vanjs-ext",
      replacement: resolveCompatPath("../../core/src/compat/vanjs-ext.ts"),
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
