import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function getCompatUrl(relativePath: string) {
  const basePath = fileURLToPath(new URL(relativePath, import.meta.url));

  for (const extension of [".js", ".ts", ".tsx", ".mjs"]) {
    const candidate = `${basePath}${extension}`;
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  if (existsSync(basePath)) {
    return pathToFileURL(basePath).href;
  }

  return pathToFileURL(basePath).href;
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
          url: getCompatUrl("./vanjs-core"),
        };
      }

      if (specifier === "vanjs-ext") {
        return {
          shortCircuit: true,
          url: getCompatUrl("./vanjs-ext"),
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
