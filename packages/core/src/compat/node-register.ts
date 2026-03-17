import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function getCompatUrl(relativePath: string) {
  return pathToFileURL(fileURLToPath(new URL(relativePath, import.meta.url)))
    .href;
}

function resolveTypeScriptSpecifier(
  specifier: string,
  parentUrl: string | undefined,
) {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    return null;
  }
  if (extname(specifier)) {
    return null;
  }
  if (!parentUrl?.startsWith("file:")) {
    return null;
  }

  const basePath = dirname(fileURLToPath(parentUrl));
  const resolvedBase = resolve(basePath, specifier);
  for (const extension of [".ts", ".tsx", ".js", ".mjs"]) {
    const candidate = `${resolvedBase}${extension}`;
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  return null;
}

export function registerVanStackNodeCompat() {
  return registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "vanjs-core") {
        return {
          shortCircuit: true,
          url: getCompatUrl("./vanjs-core.ts"),
        };
      }

      if (specifier === "vanjs-ext") {
        return {
          shortCircuit: true,
          url: getCompatUrl("./vanjs-ext.ts"),
        };
      }

      const resolvedSpecifier = resolveTypeScriptSpecifier(
        specifier,
        context.parentURL,
      );
      if (resolvedSpecifier) {
        return {
          shortCircuit: true,
          url: resolvedSpecifier,
        };
      }

      return nextResolve(specifier, context);
    },
  });
}

registerVanStackNodeCompat();
