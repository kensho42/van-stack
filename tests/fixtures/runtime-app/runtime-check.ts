import { fileURLToPath } from "node:url";

import { loadRoutes } from "van-stack/compiler";
import { buildStaticRoutes } from "van-stack/ssg";
import { renderRequest } from "van-stack/ssr";

const routesRoot = fileURLToPath(
  new URL("../../../demo/third-party-compat/src/routes", import.meta.url),
);
const routes = await loadRoutes({ root: routesRoot });
const renderRoutes = routes as Parameters<typeof renderRequest>[0]["routes"];
const staticRoutes = routes
  .filter((route) => route.id === "ssg")
  .map((route) => ({
    ...route,
    hydrationPolicy: "document-only" as const,
  })) as Parameters<typeof buildStaticRoutes>[0]["routes"];

const ssrResponse = await renderRequest({
  request: new Request("https://van-stack.local/ssr"),
  routes: renderRoutes,
});
const ssgPages = await buildStaticRoutes({
  routes: staticRoutes,
});

console.log(
  JSON.stringify({
    routeIds: routes.map((route) => route.id).sort(),
    ssr: await ssrResponse.text(),
    ssg: ssgPages[0]?.html ?? null,
  }),
);
