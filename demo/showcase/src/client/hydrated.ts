import { matchPath } from "van-stack";
import { hydrateApp } from "van-stack/csr";

import type { GalleryPageData } from "../runtime/data";
import {
  getClientRoot,
  hydratedClientRoutes,
  renderClientPage,
} from "./routes";

async function hydrateMatchedRoute(path: string, root: Element, data: unknown) {
  const pathname = new URL(path, window.location.origin).pathname;
  const route = hydratedClientRoutes.find((candidate) =>
    Boolean(matchPath(candidate.path, pathname)),
  );
  const hydrateFactory = route?.files?.hydrate;
  if (!hydrateFactory) {
    return;
  }

  const module = await hydrateFactory();
  await module.default({
    root,
    data,
    params: {},
    path,
  });
}

const app = hydrateApp({
  routes: [...hydratedClientRoutes],
});

await app.ready;

const root = getClientRoot(document);
let isInitialEntry = true;

app.router.subscribe(async (entry) => {
  if (isInitialEntry) {
    isInitialEntry = false;
    return;
  }

  renderClientPage(root, entry.data as GalleryPageData);
  await hydrateMatchedRoute(entry.path, root, entry.data);
});
