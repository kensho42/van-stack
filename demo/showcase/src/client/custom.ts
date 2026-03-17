import { applyRouteHead, createRouter } from "van-stack/csr";

import type { GalleryPageData } from "../runtime/data";
import { fetchCustomPageData } from "./custom-data";
import { mountShowcasePostInteractions } from "./post-interactions";
import {
  customClientRoutes,
  getClientRoot,
  renderClientLoading,
  renderClientPage,
  wireClientNavigation,
} from "./routes";

const root = getClientRoot(document);
const router = createRouter({
  mode: "custom",
  routes: [...customClientRoutes],
  history: window.history,
});

wireClientNavigation(router, {
  document,
  routes: customClientRoutes,
  window,
});

router.subscribe(async (entry) => {
  renderClientLoading(
    root,
    "Loading custom route",
    "Northstar Journal is fetching JSON directly from the demo API.",
  );

  try {
    const data = await fetchCustomPageData(entry.path);
    await applyRouteHead({
      routes: customClientRoutes,
      path: entry.path,
      data,
      document: document as never,
    });
    renderClientPage(root, data);
    await mountShowcasePostInteractions(root, data as GalleryPageData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Custom showcase API failed.";
    renderClientLoading(root, "Custom route unavailable", message);
  }
});

await router.load(`${window.location.pathname}${window.location.search}`);
