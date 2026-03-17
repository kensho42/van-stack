import { fileURLToPath } from "node:url";

import { loadRoutes } from "../../../../packages/compiler/src/index";
import { buildStaticRoutes } from "../../../../packages/ssg/src/index";

const routesRoot = fileURLToPath(new URL("../routes", import.meta.url));
let pagesPromise: Promise<Map<string, string>> | null = null;
type ShowcaseStaticRoutes = Parameters<typeof buildStaticRoutes>[0]["routes"];

function normalizePath(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

async function buildShowcaseSsgPages() {
  const routes = await loadRoutes({ root: routesRoot });

  const ssgRoutes = routes
    .filter((route) => route.id.startsWith("gallery/ssg/"))
    .map((route) => ({
      ...route,
      hydrationPolicy: "document-only" as const,
    })) as ShowcaseStaticRoutes;

  const pages = await buildStaticRoutes({
    routes: ssgRoutes,
  });

  return new Map(
    pages
      .filter((page) => page.kind === "page")
      .map((page) => [normalizePath(page.path), page.html] as const),
  );
}

export function warmShowcaseSsgCache() {
  if (!pagesPromise) {
    pagesPromise = buildShowcaseSsgPages();
  }

  return pagesPromise;
}

export async function getShowcaseSsgPage(path: string) {
  const pages = await warmShowcaseSsgCache();
  const html = pages.get(normalizePath(path));

  return html
    ? {
        path: normalizePath(path),
        html,
      }
    : null;
}
