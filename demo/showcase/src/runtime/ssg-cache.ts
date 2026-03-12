import { fileURLToPath } from "node:url";

import { loadRoutes } from "../../../../packages/compiler/src/index";
import { buildStaticRoutes } from "../../../../packages/ssg/src/index";

type StaticPage = {
  path: string;
  html: string;
};

const routesRoot = fileURLToPath(new URL("../routes", import.meta.url));
let pagesPromise: Promise<StaticPage[]> | null = null;
type ShowcaseStaticRoutes = Parameters<typeof buildStaticRoutes>[0]["routes"];

async function buildShowcaseSsgPages() {
  const routes = await loadRoutes({ root: routesRoot });

  const ssgRoutes = routes
    .filter((route) => route.id.startsWith("gallery/ssg/"))
    .map((route) => ({
      ...route,
      hydrationPolicy: "document-only" as const,
    })) as ShowcaseStaticRoutes;

  return buildStaticRoutes({
    routes: ssgRoutes,
  });
}

export function getShowcaseSsgPages() {
  if (!pagesPromise) {
    pagesPromise = buildShowcaseSsgPages();
  }

  return pagesPromise;
}

export async function getShowcaseSsgPage(path: string) {
  const pages = await getShowcaseSsgPages();
  return pages.find((page) => page.path === path);
}
