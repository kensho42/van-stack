import { createRouter } from "van-stack/csr";

import type { GalleryPageData } from "../runtime/data";
import { mountShowcasePostInteractions } from "./post-interactions";
import {
  getClientRoot,
  renderClientLoading,
  renderClientPage,
  shellClientRoutes,
  wireClientNavigation,
} from "./routes";

const root = getClientRoot(document);
const router = createRouter({
  mode: "shell",
  routes: [...shellClientRoutes],
  history: window.history,
});

wireClientNavigation(router, { document, routes: shellClientRoutes, window });
router.subscribe((entry) => {
  renderClientPage(root, entry.data as GalleryPageData);
  mountShowcasePostInteractions(root, entry.data as GalleryPageData);
});

renderClientLoading(
  root,
  "Loading shell route",
  "Northstar Journal is fetching page data through the internal VanStack transport surface.",
);

await router.load(`${window.location.pathname}${window.location.search}`);
